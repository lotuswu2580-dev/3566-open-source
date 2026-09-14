'use strict';

const { app, BrowserWindow, ipcMain, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');
const { fileURLToPath, pathToFileURL } = require('url');
const { createBackupStore } = require('./backup-store');
const k3 = require('./llm/provider-k3');
const gemini = require('./llm/provider-gemini');




// Separate lock and data directory: the private edition is never read or migrated.
app.setName('3566-open-source');
app.setPath('userData', path.join(app.getPath('appData'), '3566-open-source'));
const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (process.platform === 'win32') app.setAppUserModelId('com.fu.rizhi3566.public');
let mainWindow = null;

// 所有桥接都只接受本窗口的本地主框架，拒绝嵌入页、外部导航及其他窗口。
function registerIPC(channel, handler) {
  ipcMain.handle(channel, (event, ...args) => {
    try {
      if (!mainWindow || event.sender !== mainWindow.webContents || event.senderFrame !== event.sender.mainFrame) throw new Error('不可信的调用窗口。');
      const url = new URL(event.senderFrame.url);
      if (url.protocol !== 'file:' || url.search || url.hash || path.resolve(fileURLToPath(url)).toLowerCase() !== path.resolve(__dirname, 'index.html').toLowerCase()) throw new Error('不可信的调用页面。');
    } catch (_) {
      return { ok: false, error: { code: 'UNTRUSTED_SENDER', message: '此页面不允许访问本机接口。' } };
    }
    return handler(event, ...args);
  });
}

let backups;
function backupStore() {
  if (!backups) backups = createBackupStore(path.join(app.getPath('userData'), 'notebook-backups'));
  return backups;
}

/* Splash selection IPC is registered by the local-only helper. */
require('./splash-settings').register({ app, dialog: require('electron').dialog, nativeImage: require('electron').nativeImage, registerIPC, getWindow: () => mainWindow });function backupError(error) {
  return { ok: false, error: { code: 'BACKUP_FAILED', message: error.message || '本机独立备份失败。' } };
}
registerIPC('notebook:backupWrite', (event, payload) => {
  try { return { ok: true, result: backupStore().write(payload) }; } catch (error) { return backupError(error); }
});
registerIPC('notebook:backupList', () => {
  try { return { ok: true, result: backupStore().list() }; } catch (error) { return backupError(error); }
});
registerIPC('notebook:backupRead', (event, id) => {
  try { return { ok: true, result: backupStore().read(id) }; } catch (error) { return backupError(error); }
});

/* ── K3 API 密钥：safeStorage 加密存本机文件，环境变量 K3_API_KEY 作开发回退 ── */
const KEY_FILE = () => path.join(app.getPath('userData'), 'k3-key.enc');

const GEMINI_KEY_FILE = () => path.join(app.getPath('userData'), 'gemini-key.enc');

function readEncryptedKey(file) {
  try {
    if (!safeStorage.isEncryptionAvailable()) return null;
    if (!fs.existsSync(file)) return null;
    const key = safeStorage.decryptString(fs.readFileSync(file)).trim();
    return key || null;
  } catch (e) {
    return null;
  }
}

function readSavedKey() {
  return readEncryptedKey(KEY_FILE());
}

function resolveApiKey() {
  const saved = readSavedKey();
  if (saved) return { key: saved, source: 'safeStorage' };
  const envKey = (process.env.K3_API_KEY || '').trim();
  if (envKey) return { key: envKey, source: 'env' };
  return { key: null, source: null };
}

function advisorStatus() {
  const resolved = resolveApiKey();
  const geminiResolved = resolveGeminiKey();
  return {
    configured: !!resolved.key,
    source: resolved.source,
    model: k3.MODEL,
    encryptionAvailable: safeStorage.isEncryptionAvailable(),
    gemini: {
      configured: !!geminiResolved.key,
      source: geminiResolved.source,
      model: gemini.DEFAULT_MODEL
    }
  };
}

/* ── Gemini API 密钥：同一套 safeStorage 模式，环境变量 GEMINI_API_KEY 作开发回退 ── */
function resolveGeminiKey() {
  const saved = readEncryptedKey(GEMINI_KEY_FILE());
  if (saved) return { key: saved, source: 'safeStorage' };
  const envKey = (process.env.GEMINI_API_KEY || '').trim();
  if (envKey) return { key: envKey, source: 'env' };
  return { key: null, source: null };
}


/* ── 参数校验：渲染进程不可信 ── */
function clipString(value, max) {
  if (typeof value !== 'string') return '';
  value = value.trim();
  return value.length > max ? value.slice(0, max) : value;
}

function validateAskPayload(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('请求参数无效');
  const task = clipString(payload.task, 60);
  if (task !== 'aesthetic_advisor' && task !== 'literary_imitation_review') {
    throw new Error('未知的任务类型');
  }
  const clean = { task };
  if (payload.provider !== undefined) {
    if (!['k3', 'gemini'].includes(payload.provider)) throw new Error('未知的模型来源。');
    clean.provider = payload.provider;
  }
  if (payload.geminiModel !== undefined) {
    const m = clipString(payload.geminiModel, 60);
    if (!/^[a-z0-9][a-z0-9.-]*$/i.test(m)) throw new Error('Gemini 模型 ID 格式不正确。');
    clean.geminiModel = m;
  }
  clean.sendImage = payload.sendImage === true;
  if (payload.feedbackMode !== undefined) {
    if (!['questions', 'weaknesses', 'alternative'].includes(payload.feedbackMode)) throw new Error('未知的文学反馈方式。');
    clean.feedbackMode = payload.feedbackMode;
  }
  if (typeof payload.question === 'string') clean.question = clipString(payload.question, 500);
  if (typeof payload.draft === 'string') clean.draft = clipString(payload.draft, 30000);
  if (payload.prompt && typeof payload.prompt === 'object') {
    clean.prompt = {
      kind: clipString(payload.prompt.kind, 20),
      title: clipString(payload.prompt.title, 80),
      seed: clipString(payload.prompt.seed, 500),
      guide: clipString(payload.prompt.guide, 300)
    };
  }
  if (payload.material && typeof payload.material === 'object') {
    const m = payload.material;
    clean.material = {
      index: Number.isFinite(m.index) ? m.index : 0,
      kind: clipString(m.kind, 20),
      title: clipString(m.title, 80),
      credit: clipString(m.credit, 120),
      creator: clipString(m.creator, 120),
      designNote: clipString(m.designNote, 500),
      sourcePage: clipString(m.sourcePage, 300),
      mediaUrl: /^https:\/\//.test(m.mediaUrl || '') ? clipString(m.mediaUrl, 500) : '',
      license: clipString(m.license, 60)
    };
  }
  if (Array.isArray(payload.history)) {
    clean.history = payload.history.slice(-4).map((item) => ({
      q: clipString(item && item.q, 500),
      a: clipString(item && item.a, 4000)
    })).filter((item) => item.q && item.a);
  }
  return clean;
}

/* ── IPC：advisor.ask / cancel / getStatus / setApiKey / clearApiKey ── */
const pendingRequests = new Map();

registerIPC('advisor:ask', async (event, payload) => {
  let clean;
  try {
    clean = validateAskPayload(payload);
  } catch (e) {
    return { ok: false, error: { code: 'BAD_REQUEST', message: e.message } };
  }
  const provider = clean.provider === 'gemini' ? 'gemini' : 'k3';
  const resolved = provider === 'gemini' ? resolveGeminiKey() : resolveApiKey();
  if (!resolved.key) {
    return { ok: false, error: { code: 'UNCONFIGURED', message: provider === 'gemini' ? '尚未配置 Gemini API 密钥，请先在设置页填写。' : '尚未配置 K3 API 密钥，请先在设置页填写。' } };
  }
  const requestId = clipString(payload.requestId, 60) || ('req-' + Date.now());
  const controller = new AbortController();
  pendingRequests.set(requestId, controller);
  const started = Date.now();
  try {
    const invoke = provider === 'gemini' ? gemini.ask : k3.ask;
    const result = await invoke(Object.assign({}, clean, {
      apiKey: resolved.key,
      model: provider === 'gemini' ? (clean.geminiModel || gemini.DEFAULT_MODEL) : undefined,
      signal: controller.signal,
      timeoutMs: clean.task === 'literary_imitation_review' ? 90000 : 60000
    }));
    console.log('[advisor] %s %s(%s) 完成，耗时 %dms', requestId, clean.task, provider, Date.now() - started);
    return { ok: true, result };
  } catch (err) {
    const code = err && err.code ? err.code : 'UNKNOWN';
    console.log('[advisor] %s %s(%s) 失败 [%s]，耗时 %dms', requestId, clean.task, provider, code, Date.now() - started);
    return { ok: false, error: { code, message: (err && err.message) || '请求失败，请稍后重试。' } };
  } finally {
    pendingRequests.delete(requestId);
  }
});

registerIPC('advisor:cancel', (event, requestId) => {
  const controller = pendingRequests.get(clipString(requestId, 60));
  if (controller) controller.abort();
  return { ok: true };
});

registerIPC('advisor:getStatus', () => advisorStatus());

registerIPC('advisor:setApiKey', (event, key) => {
  if (typeof key !== 'string' || key.trim().length < 8 || key.length > 200) {
    return { ok: false, error: { code: 'BAD_REQUEST', message: '密钥格式不正确，请检查后重新粘贴。' } };
  }
  if (!safeStorage.isEncryptionAvailable()) {
    return { ok: false, error: { code: 'NO_ENCRYPTION', message: '当前系统不支持安全加密存储，请改用环境变量 K3_API_KEY。' } };
  }
  try {
    fs.mkdirSync(app.getPath('userData'), { recursive: true });
    fs.writeFileSync(KEY_FILE(), safeStorage.encryptString(key.trim()));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: { code: 'SAVE_FAILED', message: '密钥保存失败，请重试。' } };
  }
});

registerIPC('advisor:clearApiKey', () => {
  try {
    const file = KEY_FILE();
    if (fs.existsSync(file)) fs.unlinkSync(file);
  } catch (e) { return { ok: false, error: { code: 'CLEAR_FAILED', message: '本机密钥清除失败，请检查目录权限后重试。' } }; }
  return { ok: true };
});

registerIPC('gemini:setApiKey', (event, key) => {
  if (typeof key !== 'string' || key.trim().length < 8 || key.length > 200) {
    return { ok: false, error: { code: 'BAD_REQUEST', message: '密钥格式不正确，请检查后重新粘贴。' } };
  }
  if (!safeStorage.isEncryptionAvailable()) {
    return { ok: false, error: { code: 'NO_ENCRYPTION', message: '当前系统不支持安全加密存储，请改用环境变量 GEMINI_API_KEY。' } };
  }
  try {
    fs.mkdirSync(app.getPath('userData'), { recursive: true });
    fs.writeFileSync(GEMINI_KEY_FILE(), safeStorage.encryptString(key.trim()));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: { code: 'SAVE_FAILED', message: '密钥保存失败，请重试。' } };
  }
});

registerIPC('gemini:clearApiKey', () => {
  try {
    const file = GEMINI_KEY_FILE();
    if (fs.existsSync(file)) fs.unlinkSync(file);
  } catch (e) { return { ok: false, error: { code: 'CLEAR_FAILED', message: '本机密钥清除失败，请检查目录权限后重试。' } }; }
  return { ok: true };
});


function isSourceUrl(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && ['commons.wikimedia.org','www.getty.edu','artuk.org','www.gutenberg.org','en.wikisource.org','zh.wikisource.org','de.wikisource.org','www.kimi.com','ai.google.dev','aistudio.google.com','creativecommons.org'].includes(u.hostname); } catch (_) { return false; }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    icon: path.join(__dirname, 'assets', 'fu-3566-v1.ico'),
    width: 1080,
    height: 760,
    minWidth: 860,
    minHeight: 620,
    resizable: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isSourceUrl(url)) require('electron').shell.openExternal(url).catch(() => {});
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== pathToFileURL(path.join(__dirname, 'index.html')).href) {
      event.preventDefault();
      if (isSourceUrl(url)) require('electron').shell.openExternal(url).catch(() => {});
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.on('closed', () => { mainWindow = null; });
}

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', () => {
  app.quit();
});

