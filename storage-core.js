/* 日知录存储：纯 JSON、版本化快照、失败可见；同一模块也供主进程校验。 */
(function(root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NotebookStorage = api.create({
    get length() { return root.localStorage.length; },
    key: function(i) { return root.localStorage.key(i); },
    getItem: function(k) { return root.localStorage.getItem(k); },
    setItem: function(k, v) { root.localStorage.setItem(k, v); },
    removeItem: function(k) { root.localStorage.removeItem(k); }
  }, {
    notify: function(message) { root.dispatchEvent(new CustomEvent('notebook-storage-error', { detail: message })); },
    changed: function(key) { root.dispatchEvent(new CustomEvent('notebook-storage-change', { detail: key })); }
  });
})(typeof window !== 'undefined' ? window : this, function() {
  'use strict';
  var FORMAT = '3566-notebook-backup';
  var MAX_BYTES = 24 * 1024 * 1024;
  var STATIC_KEYS = ['ui-prefs', 'streak', 'learn-log', 'learn-compose-draft', 'reward-view', 'art-bag', 'art-library-size',
    'notebook-prefs', 'task-template',
    'archive-followups', 'archive-followup-drafts', 'archive-labels', 'literature-history', 'literature-selection-v1'];
  var own = function(o, k) { return Object.prototype.hasOwnProperty.call(o, k); };
  var object = function(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); };
  function validDate(s) {
    if (typeof s !== 'string') return false;
    var parts = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!parts) return false;
    var normalized = parts[1] + '-' + ('0' + Number(parts[2])).slice(-2) + '-' + ('0' + Number(parts[3])).slice(-2);
    var d = new Date(normalized + 'T12:00:00Z');
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === normalized;
  }
  function knownKey(key) {
    return typeof key === 'string' && (STATIC_KEYS.indexOf(key) >= 0 || (/^[wp]-/.test(key) && validDate(key.slice(2))));
  }
  function assert(ok, message) { if (!ok) throw new Error(message); }
  function safeJSON(value, depth, budget) {
    depth = depth || 0; budget = budget || { nodes: 0 };
    assert(depth <= 24 && ++budget.nodes <= 500000, '数据嵌套或条目数量过多。');
    if (value === null || typeof value === 'boolean') return;
    if (typeof value === 'number') { assert(Number.isFinite(value), '数据包含无效数字。'); return; }
    if (typeof value === 'string') { assert(value.length <= 2000000, '单段文本过大。'); return; }
    assert(typeof value === 'object', '数据必须是纯 JSON。');
    assert(Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null, '数据必须是普通对象。');
    var keys = Object.keys(value);
    assert(keys.length <= 100000, '数据条目过多。');
    keys.forEach(function(k) {
      assert(k !== '__proto__' && k !== 'prototype' && k !== 'constructor', '数据包含不安全字段。');
      safeJSON(value[k], depth + 1, budget);
    });
  }
  function strings(v) { return Array.isArray(v) && v.every(function(x) { return typeof x === 'string'; }); }
  function validateEntry(key, value) {
    assert(knownKey(key), '不允许恢复的字段：' + key);
    safeJSON(value);
    if (key.indexOf('w-') === 0) {
      assert(object(value) && object(value.done) && strings(value.extra) && (!own(value, 'hiddenBase') || (Array.isArray(value.hiddenBase) && value.hiddenBase.every(Number.isInteger))), '每日记录结构无效：' + key);
      assert(Object.keys(value.done).every(function(k) { return typeof value.done[k] === 'boolean'; }), '待办状态无效。');
      ['rewardIdx', 'literaryPromptIdx', 'literaryAppreciationIdx'].forEach(function(k) { if (own(value, k)) assert(Number.isInteger(value[k]) && value[k] >= 0, '每日索引无效。'); });
      ['thought', 'literaryDraft'].forEach(function(k) { if (own(value, k)) assert(typeof value[k] === 'string', '每日文本无效。'); });
      ['literaryFinalDraft', 'literaryAppreciationId'].forEach(function(k) { if (own(value, k)) assert(typeof value[k] === 'string', '文学文本无效。'); });
      if (own(value, 'literaryFeedbackMode')) assert(['questions', 'weaknesses', 'alternative'].indexOf(value.literaryFeedbackMode) >= 0, '文学反馈方式无效。');
      if (own(value, 'literaryVersions')) assert(Array.isArray(value.literaryVersions) && value.literaryVersions.every(object), '文学版本结构无效。');
      if (own(value, 'literaryFeedback')) assert(value.literaryFeedback === null || object(value.literaryFeedback), '文学反馈结构无效。');
      if (own(value, 'baseTemplate')) assert(strings(value.baseTemplate), '任务模板无效。');
    } else if (key.indexOf('p-') === 0) {
      assert(object(value) && Number.isInteger(value.count) && value.count >= 0, '番茄钟记录结构无效。');
    } else if (key === 'learn-log') {
      assert(Array.isArray(value) && value.every(function(v) { return object(v) && validDate(v.d) && typeof v.t === 'string' && Array.isArray(v.rv) && v.rv.every(function(b) { return typeof b === 'boolean'; }); }), '复习记录结构无效。');
    } else if (key === 'streak') {
      assert(object(value) && Array.isArray(value.dates) && value.dates.every(validDate) && Number.isFinite(value.best) && value.best >= 0, '连续记录结构无效。');

    } else if (key === 'task-template') assert(strings(value), '任务模板结构无效。');
    else if (key === 'learn-compose-draft') assert(typeof value === 'string', '复盘草稿结构无效。');
    else if (key === 'reward-view') assert(['visual', 'writing', 'reading'].indexOf(value) >= 0, '页面偏好无效。');
    else if (key === 'art-bag') assert(Array.isArray(value) && value.every(function(v) { return Number.isInteger(v) && v >= 0; }), '素材顺序无效。');
    else if (key === 'art-library-size') assert(Number.isInteger(value) && value >= 0, '素材数量无效。');
    else if (key === 'literature-history') assert(Array.isArray(value) || object(value), '文学历史无效。');
    else if (key === 'archive-labels') assert(object(value) && Object.keys(value).every(function(k) { return strings(value[k]); }), '归档标签无效。');
    else if (key === 'archive-followup-drafts') assert(object(value) && Object.keys(value).every(function(k) { return typeof value[k] === 'string'; }), '归档回访草稿无效。');
    else if (key === 'archive-followups') assert(object(value) && Object.keys(value).every(function(k) { return Array.isArray(value[k]) && value[k].every(function(v) { return object(v) && typeof v.id === 'string' && typeof v.text === 'string' && (typeof v.createdAt === 'string' || typeof v.createdAt === 'number'); }); }), '归档回访无效。');
    else assert(object(value), '设置结构无效：' + key);
    return value;
  }
  function validateSnapshot(input) {
    var raw = typeof input === 'string' ? input : JSON.stringify(input);
    assert(typeof raw === 'string' && raw.length <= MAX_BYTES && new TextEncoder().encode(raw).length <= MAX_BYTES, '备份文件超过 24 MB 限制。');
    var data = JSON.parse(raw);
    assert(object(data) && data.format === FORMAT && data.version === 1, '不是受支持的日知录 v1 备份。');
    assert(typeof data.createdAt === 'string' && Number.isFinite(Date.parse(data.createdAt)), '备份时间无效。');
    assert(object(data.entries), '备份缺少记录。');
    assert(Object.keys(data).every(function(k) { return ['format', 'version', 'createdAt', 'entries', 'unsavedKeys', 'recoveryRawEntries'].indexOf(k) >= 0; }), '备份包含未知顶层字段。');
    var keys = Object.keys(data.entries);
    assert(keys.length <= 25000, '备份记录过多。');
    keys.forEach(function(k) { validateEntry(k, data.entries[k]); });
    if (own(data, 'unsavedKeys')) assert(strings(data.unsavedKeys) && data.unsavedKeys.every(function(k) { return knownKey(k) && own(data.entries, k); }), '未保存条目声明无效。');
    if (own(data, 'recoveryRawEntries')) assert(object(data.recoveryRawEntries) && Object.keys(data.recoveryRawEntries).every(function(k) { return knownKey(k) && typeof data.recoveryRawEntries[k] === 'string'; }), '故障原始副本结构无效。');
    return data;
  }
  function create(storage, hooks) {
    hooks = hooks || {};
    var failed = Object.create(null), corrupt = Object.create(null), recovery = null, frozen = false, latestError = '';
    function notify(message) { latestError = message; if (hooks.notify) hooks.notify(message); }
    function read(key, fallback) {
      try {
        var raw = storage.getItem(key);
        if (raw === null) return fallback;
        var value = JSON.parse(raw);
        if (knownKey(key)) validateEntry(key, value);
        return value === null ? fallback : value;
      } catch (error) {
        corrupt[key] = true;
        notify('无法读取「' + key + '」。原始记录已保留，已阻止覆盖；请先导出故障副本或恢复备份。');
        return fallback;
      }
    }
    function write(key, value) {
      var raw;
      try {
        safeJSON(value); raw = JSON.stringify(value);
        if (frozen) throw new Error('恢复完成后请先重新载入页面。');
        if (corrupt[key]) throw new Error('该记录原始内容异常，已阻止覆盖。');
        storage.setItem(key, raw);
        if (storage.getItem(key) !== raw) throw new Error('写入后核对失败。');
        delete failed[key];
        if (hooks.changed) hooks.changed(key);
        return true;
      } catch (error) {
        if (raw !== undefined) failed[key] = raw;
        notify('保存未完成：' + error.message + ' 请勿关闭页面；可在设置中导出含本次未保存内容的副本。');
        return false;
      }
    }
    function snapshot(includeUnsaved, preserveCorrupt) {
      var entries = Object.create(null), recoveryRawEntries = Object.create(null);
      for (var i = 0; i < storage.length; i++) {
        var key = storage.key(i);
        if (!knownKey(key)) continue;
        var raw = storage.getItem(key);
        try { entries[key] = validateEntry(key, JSON.parse(raw)); }
        catch (error) {
          delete entries[key];
          if (preserveCorrupt) recoveryRawEntries[key] = raw;
          else throw new Error('「' + key + '」内容异常，不能生成完整备份；请导出故障副本。');
        }
      }
      var unsavedKeys = [];
      if (includeUnsaved) Object.keys(failed).forEach(function(k) {
        if (knownKey(k)) { entries[k] = validateEntry(k, JSON.parse(failed[k])); unsavedKeys.push(k); }
      });
      return validateSnapshot({ format: FORMAT, version: 1, createdAt: new Date().toISOString(), entries: entries, unsavedKeys: unsavedKeys, recoveryRawEntries: recoveryRawEntries });
    }
    function failureCopy() {
      var rawEntries = Object.create(null);
      for (var i = 0; i < storage.length; i++) { var key = storage.key(i); if (knownKey(key)) rawEntries[key] = storage.getItem(key); }
      return { format: '3566-notebook-recovery-evidence', version: 1, createdAt: new Date().toISOString(), rawEntries: rawEntries, unsavedEntries: failed, failedImport: recovery, warning: latestError };
    }
    function preview(input) {
      var data = validateSnapshot(input), keys = Object.keys(data.entries), conflicts = [];
      keys.forEach(function(k) { if (storage.getItem(k) !== null) conflicts.push(k); });
      return { data: data, total: keys.length, daily: keys.filter(function(k) { return k.indexOf('w-') === 0; }).length, conflicts: conflicts, missing: keys.length - conflicts.length };
    }
    async function restore(input, strategy, beforeBackup) {
      assert(strategy === 'missing' || strategy === 'replace', '请选择明确的冲突策略。');
      assert(!frozen, '恢复已完成，请先重新载入。');
      assert(typeof beforeBackup === 'function', '恢复前必须完成独立备份。');
      var data = validateSnapshot(input), before = snapshot(false, true);
      // 再次检查和备份必须发生在事务执行时，不能复用较早的预览。
      frozen = true;
      try { await beforeBackup(before); } catch (error) { frozen = false; throw error; }
      var previous = Object.create(null), applied = [], targets = [];
      Object.keys(data.entries).forEach(function(k) {
        var raw = storage.getItem(k);
        if (strategy === 'missing' && raw !== null) return;
        previous[k] = raw; targets.push(k);
      });
      try {
        targets.forEach(function(k) {
          var next = JSON.stringify(data.entries[k]); applied.push(k);
          storage.setItem(k, next);
          if (storage.getItem(k) !== next) throw new Error('写入后核对失败。');
        });
      } catch (error) {
        var rollbackFailed = [];
        applied.reverse().forEach(function(k) {
          try {
            if (previous[k] === null) storage.removeItem(k); else storage.setItem(k, previous[k]);
            if (storage.getItem(k) !== previous[k]) throw new Error('回滚核对失败');
          } catch (_) { rollbackFailed.push(k); }
        });
        recovery = { incoming: data, original: before, rollbackFailed: rollbackFailed };
        frozen = rollbackFailed.length > 0;
        notify('恢复失败。' + (rollbackFailed.length ? '部分记录回滚失败，已暂停写入，请导出故障副本并使用恢复前备份。' : '已回滚本次修改，原记录保留；可导出故障副本。'));
        throw new Error(latestError);
      }
      frozen = targets.length > 0;
      return { restored: targets.length, skipped: Object.keys(data.entries).length - targets.length };
    }
    return { read: read, write: write, snapshot: snapshot, preview: preview, restore: restore, failureCopy: failureCopy,
      validateSnapshot: validateSnapshot, knownKey: knownKey, notify: notify, status: function() { return { error: latestError, failedKeys: Object.keys(failed), corruptKeys: Object.keys(corrupt), frozen: frozen }; },
      retry: function() {
        Object.keys(failed).forEach(function(k) { if (!corrupt[k]) write(k, JSON.parse(failed[k])); });
        var ok = Object.keys(failed).length === 0 && Object.keys(corrupt).length === 0;
        if (ok) { latestError = ''; if (hooks.notify) hooks.notify(''); }
        return ok;
      } };
  }
  return { create: create, validateSnapshot: validateSnapshot, validateEntry: validateEntry, knownKey: knownKey, MAX_BYTES: MAX_BYTES };
});
