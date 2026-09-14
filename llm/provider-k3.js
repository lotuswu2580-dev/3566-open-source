'use strict';

/* 3566 日知录 · K3 API 唯一网络适配层
 * 协议：OpenAI 兼容 chat completions
 * 端点：POST https://api.kimi.com/coding/v1/chat/completions
 * 鉴权：Authorization: Bearer <API Key>
 * 模型：k3
 *
 * 此文件只在主进程/命令行运行，密钥绝不进入渲染进程。
 * 命令行自测（从环境变量 K3_API_KEY 读取密钥）：
 *   node llm/provider-k3.js --selftest
 */

var promptBuilder = require('./prompt');

var BASE_URL = 'https://api.kimi.com/coding/v1/chat/completions';
var MODEL = 'k3';
var DEFAULT_TIMEOUT_MS = 60000;

function K3Error(code, message, status) {
  var err = new Error(message);
  err.name = 'K3Error';
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

/* payload: { apiKey, task, question?, material?, prompt?, draft?, history?, timeoutMs?, signal? } */
async function ask(payload) {
  if (!payload || typeof payload !== 'object') {
    throw K3Error('BAD_REQUEST', '请求参数无效');
  }
  var apiKey = typeof payload.apiKey === 'string' ? payload.apiKey.trim() : '';
  if (!apiKey) {
    throw K3Error('UNCONFIGURED', '尚未配置 K3 API 密钥，请先在设置页填写。');
  }
  var task = TASKS[payload.task];
  if (!task) {
    throw K3Error('BAD_REQUEST', '未知的任务类型：' + String(payload.task));
  }

  var messages = task.buildMessages(payload);
  var controller = new AbortController();
  var timeoutMs = payload.timeoutMs || DEFAULT_TIMEOUT_MS;
  var timedOut = false;
  var timer = setTimeout(function() {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  var externalSignal = payload.signal;
  var onExternalAbort = function() { controller.abort(); };
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', onExternalAbort);
  }

  var response;
  try {
    response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages
      }),
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timer);
    if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
    if (timedOut) throw K3Error('TIMEOUT', '请求超时，请稍后重试。');
    if (err && err.name === 'AbortError') throw K3Error('ABORTED', '已取消本次请求。');
    throw K3Error('NETWORK', '网络连接失败，请检查网络或代理后重试。');
  }
  clearTimeout(timer);
  if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);

  var rawText = await response.text().catch(function() { return ''; });
  if (!response.ok) {
    var serverMsg = '';
    try {
      var errBody = JSON.parse(rawText);
      serverMsg = errBody && errBody.error && typeof errBody.error.message === 'string'
        ? errBody.error.message.slice(0, 200) : '';
    } catch (e) { /* 非 JSON 错误体，忽略 */ }
    if (response.status === 401 || response.status === 403) {
      throw K3Error('AUTH', '密钥无效或权限不足（HTTP ' + response.status + '），请检查 K3 API 密钥。', response.status);
    }
    if (response.status === 429) {
      throw K3Error('RATE_LIMIT', '请求过于频繁（HTTP 429），请稍后再试。', response.status);
    }
    throw K3Error('HTTP_' + response.status,
      'K3 API 返回错误（HTTP ' + response.status + '）' + (serverMsg ? '：' + serverMsg : '。'),
      response.status);
  }

  var data;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    throw K3Error('BAD_RESPONSE', '模型返回无法解析。');
  }
  var content = data && data.choices && data.choices[0] &&
    data.choices[0].message && typeof data.choices[0].message.content === 'string'
    ? data.choices[0].message.content.trim() : '';
  if (!content) throw K3Error('BAD_RESPONSE', '模型返回无法解析。');

  if (task.parse) {
    var parsed = task.parse(content);
    if (!parsed) throw K3Error('BAD_RESPONSE', '模型返回无法解析。');
    return parsed;
  }
  return content;
}

/* 命令行自测：node llm/provider-k3.js --selftest */
async function selftest() {
  var apiKey = (process.env.K3_API_KEY || '').trim();
  if (!apiKey) {
    console.error('[selftest] 未找到环境变量 K3_API_KEY，请先设置后再运行。');
    process.exit(2);
  }
  console.log('[selftest] 端点：' + BASE_URL);
  console.log('[selftest] 模型：' + MODEL + '，正在发起非流式最小调用…');
  var started = Date.now();
  try {
    var result = await ask({
      apiKey: apiKey,
      task: 'aesthetic_advisor',
      material: {
        kind: '绘画', title: '红黄蓝的构成', credit: '皮特·蒙德里安 · 1930',
        creator: 'Piet Mondrian', designNote: '三原色与直线网格的平衡练习。',
        sourcePage: 'https://commons.wikimedia.org/', license: 'Public Domain'
      },
      question: '请用一句话确认你已收到这份素材信息。',
      timeoutMs: 60000
    });
    console.log('[selftest] 成功，耗时 ' + (Date.now() - started) + 'ms');
    console.log('[selftest] 返回内容：');
    console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('[selftest] 失败 [' + (err.code || err.name) + '] ' + err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  if (process.argv.indexOf('--selftest') >= 0) {
    selftest();
  } else {
    console.log('用法：node llm/provider-k3.js --selftest （从环境变量 K3_API_KEY 读取密钥）');
  }
}

module.exports = { ask: ask, K3Error: K3Error, BASE_URL: BASE_URL, MODEL: MODEL };
