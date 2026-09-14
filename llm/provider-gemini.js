'use strict';

/* 3566 日知录 · Google Gemini API 网络适配层（第二个模型来源）
 * 协议：generateContent
 * 端点：POST https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent
 * 鉴权：x-goog-api-key 头
 * 默认模型：gemini-3.8-flash（模型 ID 可在设置页改）
 * 支持多模态：审美顾问场景可把已核验素材图片作为 inlineData 随请求发出。
 *
 * 此文件只在主进程/命令行运行，密钥绝不进入渲染进程。
 * 命令行自测（从环境变量 GEMINI_API_KEY 读取密钥）：
 *   node llm/provider-gemini.js --selftest
 */

var https = require('https');
var promptBuilder = require('./prompt');

var API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';
var DEFAULT_MODEL = 'gemini-3.8-flash';
var DEFAULT_TIMEOUT_MS = 60000;
var IMAGE_MAX_BYTES = 20 * 1024 * 1024;
var IMAGE_TIMEOUT_MS = 15000;

function GeminiError(code, message, status) {
  var err = new Error(message);
  err.name = 'GeminiError';
  err.code = code;
  err.status = status || 0;
  return err;
}

var TASKS = {
  aesthetic_advisor: {
    buildMessages: promptBuilder.buildAdvisorMessages
  },
  literary_imitation_review: {
    buildMessages: promptBuilder.buildLiteraryMessages,
    parse: promptBuilder.parseLiteraryResponse
  }
};

function mimeFromUrl(url, contentType) {
  if (contentType && /^image\/[a-z0-9.+-]+$/i.test(contentType)) return contentType.toLowerCase();
  var m = String(url).toLowerCase().match(/\.(png|jpe?g|webp|gif)(\?|$)/);
  if (!m) return 'image/jpeg';
  return { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' }[m[1]];
}

/* 下载素材图片（20MB 上限，15 秒超时），失败返回 null 由上层降级 */
function downloadImage(url, redirects) {
  redirects = redirects || 0;
  // Media sent to Google must remain on the trusted Commons image host.
  try {
    var source = new URL(url);
    if (source.protocol !== 'https:' || source.hostname !== 'upload.wikimedia.org' || source.username || source.password || source.port || redirects > 3) return Promise.resolve(null);
  } catch (_) { return Promise.resolve(null); }
  return new Promise(function(resolve) {
    var settled = false;
    function done(v) { if (!settled) { settled = true; resolve(v); } }
    var req;
    try {
      req = https.get(url, { timeout: IMAGE_TIMEOUT_MS, headers: { 'Accept': 'image/*', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' } }, function(res) {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          downloadImage(new URL(res.headers.location, url).href, redirects + 1).then(done);
          return;
        }
        if (res.statusCode !== 200) { res.resume(); done(null); return; }
        var chunks = [];
        var total = 0;
        res.on('data', function(c) {
          total += c.length;
          if (total > IMAGE_MAX_BYTES) { req.destroy(); done(null); return; }
          chunks.push(c);
        });
        res.on('end', function() {
          if (!chunks.length) { done(null); return; }
          done({
            mimeType: mimeFromUrl(url, res.headers['content-type'] && res.headers['content-type'].split(';')[0].trim()),
            base64: Buffer.concat(chunks).toString('base64')
          });
        });
        res.on('error', function() { done(null); });
      });
      req.on('timeout', function() { req.destroy(); done(null); });
      req.on('error', function() { done(null); });
    } catch (e) {
      done(null);
    }
  });
}

/* OpenAI 风格 messages → Gemini contents / systemInstruction */
function convertMessages(messages, imagePart) {
  var system = '';
  var contents = [];
  messages.forEach(function(msg, idx) {
    if (msg.role === 'system') {
      system += (system ? '\n\n' : '') + msg.content;
      return;
    }
    var parts = [];
    var isLastUser = msg.role === 'user' && idx === messages.length - 1;
    if (isLastUser && imagePart) parts.push(imagePart);
    parts.push({ text: msg.content });
    contents.push({ role: msg.role === 'assistant' ? 'model' : 'user', parts: parts });
  });
  return { system: system, contents: contents };
}

/* payload: { apiKey, model?, task, question?, material?, prompt?, draft?, history?, sendImage?, timeoutMs?, signal? } */
async function ask(payload) {
  if (!payload || typeof payload !== 'object') {
    throw GeminiError('BAD_REQUEST', '请求参数无效');
  }
  var apiKey = typeof payload.apiKey === 'string' ? payload.apiKey.trim() : '';
  if (!apiKey) {
    throw GeminiError('UNCONFIGURED', '尚未配置 Gemini API 密钥，请先在设置页填写。');
  }
  var task = TASKS[payload.task];
  if (!task) {
    throw GeminiError('BAD_REQUEST', '未知的任务类型：' + String(payload.task));
  }
  var model = typeof payload.model === 'string' && /^[a-z0-9][a-z0-9.-]{1,60}$/i.test(payload.model.trim())
    ? payload.model.trim() : DEFAULT_MODEL;

  var messages = task.buildMessages(payload);

  /* 多模态：审美顾问 + 用户开启发送图片 + 存在已核验媒体地址 */
  var imagePart = null;
  var imageFailed = false;
  if (payload.task === 'aesthetic_advisor' && payload.sendImage &&
      payload.material && typeof payload.material.mediaUrl === 'string' &&
      /^https:\/\//.test(payload.material.mediaUrl)) {
    var image = await downloadImage(payload.material.mediaUrl);
    if (image) {
      imagePart = { inlineData: { mimeType: image.mimeType, data: image.base64 } };
    } else {
      imageFailed = true;
    }
  }

  var converted = convertMessages(messages, imagePart);
  var body = { contents: converted.contents, generationConfig: { temperature: 0.6 } };
  if (converted.system) body.systemInstruction = { parts: [{ text: converted.system }] };

  var controller = new AbortController();
  var timeoutMs = payload.timeoutMs || DEFAULT_TIMEOUT_MS;
  var timedOut = false;
  var timer = setTimeout(function() { timedOut = true; controller.abort(); }, timeoutMs);
  var externalSignal = payload.signal;
  var onExternalAbort = function() { controller.abort(); };
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', onExternalAbort);
  }

  var response;
  var rawText = '';
  var MAX_ATTEMPTS = 2;
  for (var attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await new Promise(function(r) { setTimeout(r, 4000); });
      if (externalSignal && externalSignal.aborted) throw GeminiError('ABORTED', '已取消本次请求。');
    }
    try {
      response = await fetch(API_BASE + encodeURIComponent(model) + ':generateContent', {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
    } catch (err) {
      clearTimeout(timer);
      if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
      if (timedOut) throw GeminiError('TIMEOUT', '请求超时，请稍后重试。');
      if (err && err.name === 'AbortError') throw GeminiError('ABORTED', '已取消本次请求。');
      throw GeminiError('NETWORK', '网络连接失败，请检查网络或代理后重试。');
    }

    rawText = await response.text().catch(function() { return ''; });
    if (response.ok) break;
    if (response.status === 503 && attempt < MAX_ATTEMPTS - 1) continue;

    clearTimeout(timer);
    if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
    var serverMsg = '';
    var keyInvalid = false;
    try {
      var errBody = JSON.parse(rawText);
      var e = errBody && errBody.error;
      serverMsg = e && typeof e.message === 'string' ? e.message.slice(0, 200) : '';
      if (/API key not valid|API_KEY_INVALID|invalid api key/i.test(serverMsg)) keyInvalid = true;
      if (e && Array.isArray(e.details)) {
        keyInvalid = keyInvalid || e.details.some(function(d) {
          return d && (d.reason === 'API_KEY_INVALID' || d.errorType === 'API_KEY_INVALID');
        });
      }
    } catch (e2) { /* 非 JSON 错误体，忽略 */ }
    if (response.status === 401 || response.status === 403 || (response.status === 400 && keyInvalid)) {
      throw GeminiError('AUTH', 'Gemini 密钥无效或权限不足（HTTP ' + response.status + '），请检查设置页的 Gemini API Key。', response.status);
    }
    if (response.status === 429) {
      throw GeminiError('RATE_LIMIT', '请求过于频繁（HTTP 429），请稍后再试。', response.status);
    }
    if (response.status === 503) {
      throw GeminiError('HTTP_503', 'Gemini 当前负载过高（HTTP 503），已自动重试一次仍失败，请稍后再试。', response.status);
    }
    throw GeminiError('HTTP_' + response.status,
      'Gemini API 返回错误（HTTP ' + response.status + '）' + (serverMsg ? '：' + serverMsg : '。'),
      response.status);
  }
  clearTimeout(timer);
  if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);

  var data;
  try {
    data = JSON.parse(rawText);
  } catch (e3) {
    throw GeminiError('BAD_RESPONSE', '模型返回无法解析。');
  }
  var parts = data && data.candidates && data.candidates[0] &&
    data.candidates[0].content && Array.isArray(data.candidates[0].content.parts)
    ? data.candidates[0].content.parts : [];
  var content = parts.map(function(p) { return typeof p.text === 'string' ? p.text : ''; })
    .join('').trim();
  if (!content) {
    var blocked = data && data.promptFeedback && data.promptFeedback.blockReason;
    if (blocked) throw GeminiError('BAD_RESPONSE', '模型拒绝回答（' + blocked + '），请换个问法。');
    throw GeminiError('BAD_RESPONSE', '模型返回无法解析。');
  }
  if (imageFailed) content = '（图片未能附加，以下为纯文本回答）\n\n' + content;

  if (task.parse) {
    var parsed = task.parse(content);
    if (!parsed) throw GeminiError('BAD_RESPONSE', '模型返回无法解析。');
    return parsed;
  }
  return content;
}

/* 命令行自测：node llm/provider-gemini.js --selftest [model] */
async function selftest() {
  var apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    console.error('[gemini-selftest] 未找到环境变量 GEMINI_API_KEY，请先设置后再运行。');
    process.exitCode = 2;
    return;
  }
  var model = process.argv.slice(2).filter(function(a) { return a !== '--selftest'; })[0] || DEFAULT_MODEL;
  console.log('[gemini-selftest] 模型：' + model + '，正在发起最小调用…');
  var started = Date.now();
  try {
    var result = await ask({
      apiKey: apiKey,
      model: model,
      task: 'aesthetic_advisor',
      material: {
        kind: '绘画', title: '红黄蓝的构成', credit: '皮特·蒙德里安 · 1930',
        creator: 'Piet Mondrian', designNote: '三原色与直线网格的平衡练习。',
        sourcePage: 'https://commons.wikimedia.org/', license: 'Public Domain'
      },
      question: '请用一句话确认你已收到这份素材信息。',
      timeoutMs: 60000
    });
    console.log('[gemini-selftest] 成功，耗时 ' + (Date.now() - started) + 'ms');
    console.log('[gemini-selftest] 返回内容：');
    console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('[gemini-selftest] 失败 [' + (err.code || err.name) + '] ' + err.message);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  if (process.argv.indexOf('--selftest') >= 0) {
    selftest();
  } else {
    console.log('用法：node llm/provider-gemini.js --selftest [模型ID] （从环境变量 GEMINI_API_KEY 读取密钥）');
  }
}

module.exports = { ask: ask, GeminiError: GeminiError, DEFAULT_MODEL: DEFAULT_MODEL };
