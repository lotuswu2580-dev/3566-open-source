(function() {
  'use strict';
  var store = window.NotebookStorage, bridge = window.notebookBackups;
  if (!store) return;
  function start() {
    var panel = document.querySelector('.settings-panel');
    if (!panel) return;
    var banner = document.createElement('aside');
    banner.className = 'storage-alert'; banner.setAttribute('role', 'alert'); banner.hidden = true;
    var warning = document.createElement('span');
    var open = document.createElement('button'); open.type = 'button'; open.textContent = '备份与恢复';
    open.addEventListener('click', function() {
      document.getElementById('settings-overlay').classList.add('open');
      section.scrollIntoView({ block: 'start' });
    });
    banner.appendChild(warning); banner.appendChild(open); document.body.appendChild(banner);
    function showError(message) {
      warning.textContent = message || ''; banner.hidden = !message;
      document.documentElement.classList.toggle('storage-error-active', !!message);
    }
    window.addEventListener('notebook-storage-error', function(event) { showError(event.detail); });
    showError(store.status().error);
    var section = document.createElement('section'); section.className = 'settings-group storage-settings'; section.id = 'storage-settings';
    section.innerHTML = '<div class="settings-label">记录与备份</div>' +
      '<p class="k3-note">备份包含你的文字、历史及设置，不含 API 密钥、图片和可重新抓取的网络缓存。请妥善保管，不要随开源代码上传。</p>' +
      '<p class="storage-status" id="storage-backup-status" role="status"></p>' +
      '<div class="storage-actions"><button type="button" class="k3-button" id="storage-export">导出完整 JSON</button>' +
      '<button type="button" class="k3-button" id="storage-import">选择恢复文件</button>' +
      '<button type="button" class="k3-button" id="storage-retry">重试未保存内容</button>' +
      '<button type="button" class="k3-button" id="storage-evidence">导出故障副本</button>' +
      '<input type="file" id="storage-file" accept="application/json,.json" hidden></div>' +
      '<div class="storage-disk" id="storage-disk"><div class="storage-actions"><button type="button" class="k3-button" id="storage-manual">立即独立备份</button>' +
      '<button type="button" class="k3-button" id="storage-list">查看本机备份</button></div><div id="storage-backups"></div></div>' +
      '<div class="storage-preview" id="storage-preview" hidden><p id="storage-preview-text"></p>' +
      '<label><input type="radio" name="storage-strategy" value="missing" checked> 仅补充缺失记录（默认；同名记录保留本机版本）</label>' +
      '<label><input type="radio" name="storage-strategy" value="replace"> 用文件替换同名记录（整条替换，不删除文件中没有的记录）</label>' +
      '<p class="k3-note">恢复前先保留当前数据的独立副本；恢复完成后需重新载入。浏览器版会要求先下载当前副本。</p>' +
      '<button type="button" class="k3-button primary" id="storage-restore">确认策略并恢复</button></div>' +
      '<button type="button" class="k3-button primary" id="storage-reload" hidden>重新载入已恢复的记录</button>';
    panel.appendChild(section);
    var status = document.getElementById('storage-backup-status'), selected = null, busy = false, timer, dirty = false;
    status.textContent = bridge ? '桌面版：改动后自动写入用户数据目录的独立文件；保留最近 12 份自动备份、6 份手动备份及 6 份恢复前备份。未上传云端。' : '浏览器版：自动保存在此浏览器，暂不提供独立自动备份。请定期导出 JSON；浏览器与桌面版记录互不共享。';
    document.getElementById('storage-disk').hidden = !bridge;
    function report(error) { store.notify(error && error.message ? error.message : '操作未完成。'); status.textContent = store.status().error; }
    function download(data, prefix) {
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = prefix + '-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function() { URL.revokeObjectURL(url); }, 30000);
    }
    document.getElementById('storage-export').onclick = function() {
      try {
        var data = store.snapshot(true, true); download(data, '日知录备份');
        status.textContent = '已发起下载，请确认文件已保存。' + (data.unsavedKeys.length ? '文件包含 ' + data.unsavedKeys.length + ' 条尚未成功写入本机的最新内容。' : '') + (Object.keys(data.recoveryRawEntries).length ? '另含损坏记录原始证据；不会自动恢复这部分内容。' : '');
      } catch (error) { report(error); }
    };
    document.getElementById('storage-evidence').onclick = function() {
      try { download(store.failureCopy(), '日知录故障副本'); status.textContent = '已发起故障副本下载：含原始记录及本次未保存内容，供人工恢复使用，不能直接导入。'; } catch (error) { report(error); }
    };
    document.getElementById('storage-retry').onclick = function() {
      status.textContent = store.retry() ? '没有待重试的写入错误；已成功写入的内容保持不变。' : '仍有内容未能保存，请先导出副本，不要关闭页面。';
    };
    async function writeBackup(kind) {
      if (!bridge) return;
      var result = await bridge.write({ kind: kind, snapshot: store.snapshot(false) });
      if (!result.skipped) status.textContent = '独立备份完成 · ' + new Date().toLocaleString('zh-CN') + (result.cleanupWarning ? '；旧备份清理未完成，已保留。' : '');
      return result;
    }
    function scheduleBackup() {
      if (!bridge || busy || store.status().frozen) return;
      dirty = true; clearTimeout(timer);
      timer = setTimeout(function() { flushBackup(); }, 5000);
    }
    async function flushBackup() {
      if (!dirty || busy || store.status().frozen) return;
      dirty = false;
      try { await writeBackup('auto'); } catch (error) { dirty = true; report(error); }
    }
    window.addEventListener('notebook-storage-change', function(event) { if (store.knownKey(event.detail)) scheduleBackup(); });
    setInterval(function() { if (bridge) flushBackup(); }, 60000);
    // 首次打开只在已有内容时创建独立快照，不用空数据覆盖恢复机会。
    scheduleBackup();
    document.getElementById('storage-manual').onclick = async function() {
      try { await writeBackup('manual'); } catch (error) { report(error); }
    };
    function preview(data) {
      var plan = store.preview(data); selected = plan.data;
      document.querySelector('input[name="storage-strategy"][value="missing"]').checked = true;
      document.getElementById('storage-preview').hidden = false;
      var damaged = Object.keys(plan.data.recoveryRawEntries || {}).length;
      document.getElementById('storage-preview-text').textContent = '文件时间：' + new Date(plan.data.createdAt).toLocaleString('zh-CN') + '。共 ' + plan.total + ' 条存储记录，其中每日记录 ' + plan.daily + ' 条；' + plan.conflicts.length + ' 条与本机同名，' + plan.missing + ' 条可新增。' + (damaged ? '另有 ' + damaged + ' 条损坏记录原始证据，仅保留供人工恢复，不会导入。' : '');
    }
    document.getElementById('storage-list').onclick = async function() {
      try {
        var items = await bridge.list(), list = document.getElementById('storage-backups'); list.textContent = '';
        if (!items.length) list.textContent = '暂无独立备份。';
        items.forEach(function(item) {
          var button = document.createElement('button'); button.type = 'button'; button.className = 'storage-backup-item';
          button.textContent = ({ auto: '自动', manual: '手动', 'before-restore': '恢复前' }[item.kind] || '备份') + ' · ' + new Date(item.createdAt).toLocaleString('zh-CN') + ' · ' + Math.ceil(item.bytes / 1024) + ' KB';
          button.onclick = async function() { try { preview(await bridge.read(item.id)); } catch (error) { report(error); } };
          list.appendChild(button);
        });
      } catch (error) { report(error); }
    };
    var fileInput = document.getElementById('storage-file');
    document.getElementById('storage-import').onclick = function() { fileInput.value = ''; fileInput.click(); };
    fileInput.onchange = async function() {
      selected = null; document.getElementById('storage-preview').hidden = true;
      try {
        var file = fileInput.files[0]; if (!file) return;
        if (file.size > 24 * 1024 * 1024) throw new Error('备份超过 24 MB 限制。');
        preview(await file.text());
      } catch (error) { report(error); }
    };
    document.getElementById('storage-restore').onclick = async function() {
      if (!selected || busy) return;
      var strategy = document.querySelector('input[name="storage-strategy"]:checked').value;
      if (store.status().failedKeys.length) { report(new Error('有尚未保存的内容。请先导出完整 JSON 并重试保存，再恢复其他备份。')); return; }
      if (!confirm(strategy === 'replace' ? '确认用所选文件整条替换同名记录？将先保留当前数据的独立副本；文件中没有的记录不删除。' : '确认仅补充本机缺失的记录？同名记录不会修改。')) return;
      busy = true; this.disabled = true; clearTimeout(timer);
      try {
        var result = await store.restore(selected, strategy, async function(before) {
          if (bridge) await bridge.write({ kind: 'before-restore', snapshot: before });
          else {
            download(before, '日知录恢复前备份');
            if (!confirm('当前数据备份已发起下载。请确认下载完成并妥善保留后，继续恢复。')) throw new Error('已取消恢复，原记录没有改变。');
          }
        });
        status.textContent = '恢复 ' + result.restored + ' 条，跳过 ' + result.skipped + ' 条。' + (result.restored ? '已暂停旧页面写入，请立即重新载入。' : '本机记录未改变。');
        document.getElementById('storage-reload').hidden = !result.restored;
        if (result.restored) store.notify('恢复已完成。旧页面已暂停写入，请在「备份与恢复」点击重新载入。');
        selected = null; document.getElementById('storage-preview').hidden = true;
      } catch (error) { report(error); }
      finally { busy = false; this.disabled = false; }
    };
    document.getElementById('storage-reload').onclick = function() { window.location.reload(); };
    window.addEventListener('beforeunload', function(event) {
      if (store.status().failedKeys.length) { event.preventDefault(); event.returnValue = ''; }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
