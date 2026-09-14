'use strict';

/* 3566 日知录 · preload
 * 只暴露窄接口，密钥与网络细节不进入渲染进程。 */

const { contextBridge, ipcRenderer } = require('electron');

function unwrap(res) {
  if (res && res.ok) return res.result;
  const err = new Error((res && res.error && res.error.message) || '请求失败，请稍后重试。');
  if (res && res.error && res.error.code) err.code = res.error.code;
  throw err;
}

contextBridge.exposeInMainWorld('advisor', {
  ask: async (payload) => unwrap(await ipcRenderer.invoke('advisor:ask', payload)),
  cancel: (requestId) => ipcRenderer.invoke('advisor:cancel', requestId),
  getStatus: () => ipcRenderer.invoke('advisor:getStatus'),
  setApiKey: (key) => ipcRenderer.invoke('advisor:setApiKey', key),
  clearApiKey: () => ipcRenderer.invoke('advisor:clearApiKey'),
  setGeminiApiKey: (key) => ipcRenderer.invoke('gemini:setApiKey', key),
  clearGeminiApiKey: () => ipcRenderer.invoke('gemini:clearApiKey')
});


contextBridge.exposeInMainWorld('notebookBackups', {
  write: async (payload) => unwrap(await ipcRenderer.invoke('notebook:backupWrite', payload)),
  list: async () => unwrap(await ipcRenderer.invoke('notebook:backupList')),
  read: async (id) => unwrap(await ipcRenderer.invoke('notebook:backupRead', id))
});

contextBridge.exposeInMainWorld('app', {
  getSplash: async () => unwrap(await ipcRenderer.invoke('app:getSplash')),
  getSplashInfo: async () => unwrap(await ipcRenderer.invoke('app:getSplashInfo')),
  chooseSplash: async () => unwrap(await ipcRenderer.invoke('app:chooseSplash')),
  resetSplash: async () => unwrap(await ipcRenderer.invoke('app:resetSplash'))
});
