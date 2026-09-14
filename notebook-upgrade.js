/* 日知录：长期积累、开放书桌与个人偏好。旧存储键保持兼容。 */
(function () {
  'use strict';
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function button(text, action, cls) {
    var node = el('button', cls || 'literary-button', text);
    node.type = 'button'; node.addEventListener('click', action); return node;
  }
  function dateKey(date) { return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(); }
  function safeLink(url, label) {
    try {
      var parsed = new URL(url);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
      var link = el('a', '', label); link.href = parsed.href; link.target = '_blank'; link.rel = 'noopener noreferrer'; return link;
    } catch (_) { return null; }
  }
  var defaults = BASE.slice();
  var prefs = Object.assign({ accessMode: 'ritual' }, load('notebook-prefs', {}));
  function taskList(value) { return Array.isArray(value) && value.length && value.every(function (x) { return typeof x === 'string' && x.trim(); }); }
  function configureDay() {
    if (!state.done || typeof state.done !== 'object') state.done = {};
    if (!Array.isArray(state.extra)) state.extra = [];
    if (!Array.isArray(state.hiddenBase)) state.hiddenBase = [];
    if (!taskList(state.baseTemplate)) {
      var template = load('task-template', defaults);
      state.baseTemplate = taskList(template) ? template.slice() : defaults.slice();
      save('w-' + ymd, state);
    }
    BASE = state.baseTemplate.slice();
  }
  configureDay();

  // 分配新作品仍遵循解锁偏好；写作题面和草稿始终可达。
  var originalRewardMode = switchRewardMode;
  switchRewardMode = function (mode, persist) {
    originalRewardMode(mode, persist);
    var unlocked = state.rewardIdx !== undefined;
    document.getElementById('reward-mode-switch').style.display = 'flex';
    document.getElementById('reward-lock').style.display = !unlocked && rewardView !== 'writing' ? 'flex' : 'none';
    if (rewardView === 'writing') {
      document.getElementById('literary-write').classList.add('active');
      renderLiteraryWriting();
    }
  };
  var originalUpdateReward = updateReward;
  updateReward = function () {
    originalUpdateReward();
    document.getElementById('reward-mode-switch').style.display = 'flex';
    if (state.rewardIdx === undefined) switchRewardMode(rewardView, false);
  };
  document.querySelector('#reward-sect .page-note').textContent = '新作品保留每日仪式；写作与历史随时可达。';
  document.querySelector('#page-review .page-note').textContent = '复习只处理到期内容；写入区会随窗口宽度调整，长文本可以从容核对。';
  document.querySelector('#reward-lock p').textContent = '完成固定待办即可解锁新作品。文学想象和历史归档始终开放，也可在设置中改为自由浏览。';

  // 每个历史素材生成稳定快照；以后库扩充不会改变已经归档的标题与文本。
  var originalCollect = collectArchiveEntries;
  collectArchiveEntries = function () {
    var entries = originalCollect();
    entries.forEach(function (item) {
      var daily = load('w-' + item.date, {});
      var type = (item.id || '').split(':')[0];
      var snapshot;
      if (type === 'visual') {
        snapshot = daily.artSnapshot;
        if (!snapshot) {
          snapshot = { title: item.title, by: item.by, kind: item.kind, source: item.source };
          daily.artSnapshot = snapshot; save('w-' + item.date, daily);
        }
        Object.assign(item, snapshot);
      } else if (type === 'reading') {
        var reading = LITERATURE.find(function (r) { return r.id === daily.literaryAppreciationId; }) || LITERATURE[daily.literaryAppreciationIdx];
        snapshot = daily.readingSnapshot;
        if (!snapshot && reading) {
          snapshot = { title: reading.title, by: reading.by, source: reading.source,
            body: reading.original + (reading.translation ? '\n\n' + (reading.translationCredit || '应用参考译文') + '\n' + reading.translation : '') + '\n\n读法\n' + reading.analysis };
          daily.readingSnapshot = snapshot; save('w-' + item.date, daily);
        }
        if (snapshot) Object.assign(item, snapshot);
      } else if (type === 'writing') {
        item.versions = Array.isArray(daily.literaryVersions) ? daily.literaryVersions : [];
        item.finalDraft = daily.literaryFinalDraft || '';
      }
      // 不能让同一天全局状态在下一次保存时把刚建立的快照抹掉。
      if (item.date === ymd) {
        if (daily.artSnapshot) state.artSnapshot = daily.artSnapshot;
        if (daily.readingSnapshot) state.readingSnapshot = daily.readingSnapshot;
      }
    });

    return entries.sort(function (a, b) { return (b.timestamp || parseYmd(b.date).getTime()) - (a.timestamp || parseYmd(a.date).getTime()); });
  };

  var archivePage = document.getElementById('page-archive');
  archivePage.querySelector('.page-title').textContent = '积累与回访';
  archivePage.querySelector('.page-note').textContent = '保存当时的看法，也给后来改变的理解留一个位置。文学鉴赏只阅读，不加评论。';
  var toolbar = el('div', 'notebook-search');
  var search = el('input'); search.type = 'search'; search.placeholder = '搜索作品、作者、文字或标签'; search.setAttribute('aria-label', search.placeholder);
  toolbar.appendChild(search);
  archivePage.insertBefore(toolbar, document.getElementById('archive-filters'));
  var revisitBox = el('section', 'notebook-revisit');
  archivePage.insertBefore(revisitBox, toolbar);
  var expanded = new Set();
  var revisitIndex = 0;
  var searchTimer;
  search.addEventListener('input', function () { clearTimeout(searchTimer); searchTimer = setTimeout(renderArtArchive, 120); });
  function contentSection(parent, title, value) {
    if (!value) return;
    parent.appendChild(el('h4', 'notebook-label', title));
    parent.appendChild(el('div', 'notebook-prose', value));
  }
  function archiveCard(item, labels, followups) {
    var card = el('details', 'archive-card notebook-archive'); card.dataset.archiveId = item.id;
    card.open = expanded.has(item.id);
    card.addEventListener('toggle', function () { if (card.open) expanded.add(item.id); else expanded.delete(item.id); });
    var summary = el('summary', 'notebook-archive-summary');
    summary.appendChild(el('span', 'archive-kind', item.kind));
    summary.appendChild(el('strong', '', item.title));
    summary.appendChild(el('span', 'archive-date', archiveDateLabel(item.date)));
    card.appendChild(summary);
    var body = el('div', 'notebook-archive-body');
    body.appendChild(el('div', 'archive-by', item.by));
    contentSection(body, item.bodyLabel || '记录', item.body);
    contentSection(body, item.feedbackLabel || '模型建议', item.feedback);
    contentSection(body, '我接受的定稿', item.finalDraft);
    if (item.versions && item.versions.length) {
      var versions = el('details', 'notebook-versions'); versions.appendChild(el('summary', '', '写作版本 · ' + item.versions.length));
      item.versions.slice().reverse().forEach(function (v) {
        var section = el('details'); section.appendChild(el('summary', '', v.label || new Date(v.savedAt || v.createdAt || 0).toLocaleString('zh-CN')));
        contentSection(section, '原稿快照', v.draft || v.original || v.sourceDraft);
        var f = v.feedback || {};
        contentSection(section, '评估', f.assessment);
        contentSection(section, '建议', Array.isArray(f.suggestions) ? f.suggestions.join('\n') : f.suggestions);
        contentSection(section, '参考改写', f.revision);
        contentSection(section, '定稿快照', v.final || v.finalDraft);
        versions.appendChild(section);
      }); body.appendChild(versions);
    }
    if (item.modelVersions && item.modelVersions.length > 1) {
      var modelHistory = el('details', 'notebook-versions'); modelHistory.appendChild(el('summary', '', '历次 K3 分析 · ' + item.modelVersions.length));
      item.modelVersions.slice().reverse().forEach(function (v) { contentSection(modelHistory, new Date(v.savedAt).toLocaleString('zh-CN'), v.text); });
      body.appendChild(modelHistory);
    }
    var link = safeLink(item.source, '查看作品 / 文本来源 ↗'); if (link) body.appendChild(link);
    var tagLabel = el('label', 'notebook-tag-field', '标签（逗号分隔）');
    var tags = el('input'); tags.value = (labels[item.id] || []).join('，'); tags.maxLength = 160;
    tags.placeholder = '例如：光线，节奏，待重看'; tagLabel.appendChild(tags);
    var tagStatus = el('span', 'notebook-muted'); tagStatus.setAttribute('role', 'status');
    tags.addEventListener('change', function () {
      var next = load('archive-labels', {});
      next[item.id] = Array.from(new Set(tags.value.split(/[,，]/).map(function (s) { return s.trim(); }).filter(Boolean))).slice(0, 12);
      tagStatus.textContent = save('archive-labels', next) ? '标签已保存' : '标签未保存，请重试';
    }); body.appendChild(tagLabel); body.appendChild(tagStatus);
    // 文学模块不添加评论：仅视觉与游戏可追加回访。
    if (!/^文学/.test(item.kind)) {
      var list = el('div', 'notebook-followups');
      (followups[item.id] || []).forEach(function (f) { contentSection(list, '回访 · ' + new Date(f.createdAt).toLocaleString('zh-CN'), f.text); });
      body.appendChild(list);
      var field = el('label', 'notebook-followup-label', '现在再看，我的判断有变化吗？');
      var input = el('textarea'); input.rows = 4; input.maxLength = 20000;
      input.placeholder = '写下新的理解，或下一次要验证的一个动作。原记录会完整保留。';
      input.value = load('archive-followup-drafts', {})[item.id] || '';
      input.addEventListener('input', function () { var drafts = load('archive-followup-drafts', {}); drafts[item.id] = input.value; save('archive-followup-drafts', drafts); });
      field.appendChild(input); body.appendChild(field);
      var status = el('span', 'notebook-muted'); status.setAttribute('role', 'status');
      body.appendChild(button('保存回访', function () {
        var value = input.value.trim(); if (!value) { status.textContent = '先写下一点新的想法。'; return; }
        var next = load('archive-followups', {}); next[item.id] = (next[item.id] || []).concat([{ id: 'visit-' + Date.now(), text: value, createdAt: Date.now() }]);
        if (!save('archive-followups', next)) { status.textContent = '没有保存成功，请重试。'; return; }
        var drafts = load('archive-followup-drafts', {}); delete drafts[item.id]; save('archive-followup-drafts', drafts);
        expanded.add(item.id); renderArtArchive();
      })); body.appendChild(status);
    }
    body.appendChild(button('收起记录 ↑', function () { card.open = false; summary.focus(); card.scrollIntoView({ block: 'nearest' }); }));
    card.appendChild(body); return card;
  }
  renderArtArchive = function () {
    var entries = collectArchiveEntries();
    var labels = load('archive-labels', {}); var followups = load('archive-followups', {});
    var filterBox = document.getElementById('archive-filters'); var grid = document.getElementById('archive-grid');
    document.getElementById('archive-summary').textContent = entries.length + ' 条积累';
    filterBox.replaceChildren();
    ['全部', '绘画', '建筑', '雕塑', '动态影像', '文学仿写', '文学鉴赏'].forEach(function (kind) {
      var count = entries.filter(function (item) { return kind === '全部' || kind === item.kind; }).length;
      var btn = button((kind === '动态影像' ? '动效' : kind) + ' ' + count, function () { archiveFilter = kind; renderArtArchive(); }, 'archive-filter' + (archiveFilter === kind ? ' active' : ''));
      btn.setAttribute('aria-pressed', String(archiveFilter === kind)); filterBox.appendChild(btn);
    });
    var query = search.value.trim().toLocaleLowerCase();
    var visible = entries.filter(function (item) {
      var text = [item.title, item.by, item.body, item.feedback, item.finalDraft, (labels[item.id] || []).join(' '), (followups[item.id] || []).map(function (f) { return f.text; }).join(' ')].join('\n').toLocaleLowerCase();
      return (archiveFilter === '全部' || archiveFilter === item.kind) && (!query || text.includes(query));
    });
    grid.replaceChildren(); visible.forEach(function (item) { grid.appendChild(archiveCard(item, labels, followups)); });
    if (!visible.length) grid.appendChild(el('div', 'archive-empty', entries.length ? '没有匹配的记录，试试其他关键词或分类。' : '写下第一段文字，或保存一次艺术观察，它们会从这里开始积累。'));
    revisitBox.replaceChildren();
    var aged = entries.filter(function (item) { return daysBetween(parseYmd(item.date), parseYmd(ymd)) >= 14; });
    if (aged.length) {
      var revisit = aged[revisitIndex % aged.length];
      revisitBox.appendChild(el('span', 'page-kicker', 'REVISIT · 重逢旧日'));
      revisitBox.appendChild(el('strong', '', revisit.title));
      revisitBox.appendChild(el('span', 'notebook-muted', /^文学/.test(revisit.kind) ? '重读当时的文字，看看今天会注意到什么。' : '这是至少两周前的判断。今天再看，你还同意吗？'));
      revisitBox.appendChild(button('打开这条积累', function () {
        archiveFilter = '全部'; search.value = ''; expanded.add(revisit.id); renderArtArchive();
        Array.from(grid.children).find(function (c) { return c.dataset.archiveId === revisit.id; }).scrollIntoView({ block: 'start' });
      }));
      revisitBox.appendChild(button('换一条', function () { revisitIndex++; renderArtArchive(); }));
    } else {
      revisitBox.appendChild(el('span', 'notebook-muted', '积累满两周后，这里会邀请你重读过去。没有连续打卡要求。'));
    }
  };

  // 设置只改变模板及可见性，不删除任何历史和已有个人任务。
  var group = el('section', 'settings-group notebook-preferences');
  group.appendChild(el('div', 'settings-label', '我的书桌'));

  var accessLabel = el('label', 'notebook-tag-field', '新作品的打开方式'); var access = el('select');
  [['ritual', '每日仪式 · 完成固定待办后解锁'], ['open', '自由浏览 · 随时打开今日作品']].forEach(function (pair) { var option = el('option', '', pair[1]); option.value = pair[0]; access.appendChild(option); });
  access.value = prefs.accessMode; accessLabel.appendChild(access); group.appendChild(accessLabel);
  access.addEventListener('change', function () { prefs.accessMode = access.value; if (save('notebook-prefs', prefs)) updateReward(); });
  var templateLabel = el('label', 'notebook-tag-field', '每日固定任务 · 每行一项'); var templateInput = el('textarea'); templateInput.rows = 6;
  templateInput.value = load('task-template', defaults).join('\n'); templateLabel.appendChild(templateInput); group.appendChild(templateLabel);
  var templateStatus = el('p', 'notebook-muted', '修改从下一天开始使用，今天的任务与打卡保持不变。'); templateStatus.setAttribute('role', 'status');
  group.appendChild(button('保存明日起的模板', function () {
    var tasks = templateInput.value.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    if (!tasks.length || tasks.length > 20 || tasks.some(function (s) { return s.length > 160; })) { templateStatus.textContent = '请填写 1–20 项，每项不超过 160 字。'; return; }
    templateStatus.textContent = save('task-template', tasks) ? '模板已保存，下一天开始使用。' : '保存失败，请保留输入后重试。';
  })); group.appendChild(templateStatus);
  document.querySelector('.settings-panel').appendChild(group);

  var focus = button('专注阅读', function () {
    var on = document.body.classList.toggle('notebook-focus'); focus.textContent = on ? '退出专注 · Esc' : '专注阅读'; focus.setAttribute('aria-pressed', String(on));
    if (on) document.body.appendChild(focus);
    else document.querySelector('.page-tabs').insertBefore(focus, document.getElementById('nav-utilities'));
  }, 'literary-button notebook-focus-toggle');
  focus.setAttribute('aria-pressed', 'false'); document.querySelector('.page-tabs').insertBefore(focus, document.getElementById('nav-utilities'));
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && document.body.classList.contains('notebook-focus')) focus.click(); });
  var previousShowPage = showPage; var scrollPositions = {};
  showPage = function (name) {

    var current = document.querySelector('.page.active'); if (current) scrollPositions[current.id] = current.scrollTop;
    previousShowPage(name);
    if (name === 'reward') switchRewardMode(rewardView, false);
    document.querySelectorAll('.page').forEach(function (page) { page.inert = !page.classList.contains('active'); });
    var next = document.getElementById('page-' + name); if (next) next.scrollTop = scrollPositions[next.id] || 0;
    focus.hidden = name === 'today';
  };
  // 长文本未提交时也保留草稿。跨日先保存旧日，再切换日期，不重启番茄钟。
  var learnInput = document.getElementById('newlearn'); learnInput.value = load('learn-compose-draft', '');
  learnInput.addEventListener('input', function () { save('learn-compose-draft', learnInput.value); });
  var originalRecordLearn = recordLearn;
  recordLearn = function () { originalRecordLearn(); if (!learnInput.value) save('learn-compose-draft', ''); };
  function rollover(date) {
    date = date || new Date(); var next = dateKey(date); if (next === ymd) return true;
    if (!save('w-' + ymd, state) || !save('learn-compose-draft', learnInput.value)) return false;
    now = date; day = now.getDay(); ymd = next; doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    state = load('w-' + ymd, { done: {}, extra: [], hiddenBase: [] }); pomo = load('p-' + ymd, { count: 0 });
    configureDay();
    document.getElementById('date').textContent = (now.getMonth() + 1) + '月' + now.getDate() + '日 · 星期' + names[day];
    document.getElementById('lock').textContent = plan[day]; document.getElementById('pomo-count').textContent = pomo.count;
    document.getElementById('art-think').value = state.thought || '';
    document.getElementById('literary-draft').value = state.literaryDraft || '';
    if (liveArtController) liveArtController.abort(); liveArtIndex = null; liveArtReady = false;
    if (advisorRequestId && window.advisor && window.advisor.cancel) window.advisor.cancel(advisorRequestId);
    advisorRequestId = null;
    currentMaterialContext = null; advisorHistory = []; document.getElementById('advisor-thread').replaceChildren();
    var quote = load('quote-' + ymd, null); if (quote && quote.text) setQuote(quote.text, quote.by); else localQuote();
    render(); updateStreak(); renderLearn(); renderArtArchive(); paint(); return true;
  }
  setInterval(function () { rollover(); }, 15000);
  window.addEventListener('focus', function () { rollover(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) rollover(); });
  window.notebookUpgrade = { rollover: rollover, dateKey: dateKey, preferences: prefs };
  render(); updateStreak(); renderLearn(); renderArtArchive(); paint(); showPage('today');
})();
