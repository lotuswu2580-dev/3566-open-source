/* 日知录 · 文学内容与版本工作台。只追加素材，旧数组索引永久保留。 */
(function () {
  'use strict';
  var source = 'https://www.gutenberg.org/cache/epub/6524/pg6524-images.html';
  var credit = '中文对照：应用参考译文（AI 辅助整理，非出版译本）';
  var legacyIds = ['tagore-stray-birds-6'];
  var legacyAuthors = ['tagore'];
  LITERATURE.forEach(function (item, index) {
    item.id = item.id || legacyIds[index] || ('legacy-literature-' + index);
    item.authorId = item.authorId || legacyAuthors[index] || item.by;
    if (item.translation) item.translationCredit = item.translationCredit || '中文对照：应用内参考译文，非指定出版译本';
  });
  /* 英文逐篇核对 Project Gutenberg #6524，1916 Macmillan 版；保留诗号。
     英文为泰戈尔自译。大小写统一句首，段落照原文；读法为本应用编辑性分析。 */
  var birds = [
    [1, 'Stray birds of summer come to my window to sing and fly away.\nAnd yellow leaves of autumn, which have no songs, flutter and fall there with a sigh.',
      '夏日的飞鸟来到我的窗前，歌唱，又飞去。\n秋日的黄叶没有歌声，飘落在那里，带着一声叹息。',
      '同一扇窗接住两种来访：有声的飞鸟与无歌的落叶。两句动作相似，声音和季节却改变了情绪。读时留意 sing 与 sigh：少了一个轻微的音节，欢快就变成了余韵。'],
    [2, 'O troupe of little vagrants of the world, leave your footprints in my words.',
      '世界上这一群小小的流浪者啊，请把你们的足迹留在我的文字里。',
      '诗人没有把事物留住，而是邀请它们在语言里留下痕迹。“足迹”让文字成为可走过的地面，写作也因此带有接待与告别的意味。'],
    [3, 'The world puts off its mask of vastness to its lover.\nIt becomes small as one song, as one kiss of the eternal.',
      '世界向爱它的人卸下浩瀚的面具。\n它变得小如一首歌，小如永恒的一吻。',
      '浩大在这里是一张面具，亲近才让世界显出可以感受的尺度。歌与吻都短暂，却被放在“永恒”旁边，形成时间与体量上的双重张力。'],
    [4, 'It is the tears of the earth that keep her smiles in bloom.',
      '正是大地的泪水，让她的微笑始终开着花。',
      '泪水、微笑和开花被安放在同一句因果关系里。可以把它读作雨水滋养花朵的具体画面，再考虑悲伤与生长的关系；不必急着把诗压成一句人生道理。'],
    [5, 'The mighty desert is burning for the love of a blade of grass who shakes her head and laughs and flies away.',
      '广大的沙漠为一茎小草的爱燃烧着；小草却摇摇头，笑着，飞走了。',
      '沙漠的体量与小草的轻盈构成悬殊对照。末尾三个连续动作迅速带走了视线，把前半句的沉重愿望留在原地。'],
    [7, 'The sands in your way beg for your song and your movement, dancing water. Will you carry the burden of their lameness?',
      '舞动的流水啊，路上的沙粒求取你的歌声和流动。你要背起它们不能行走的重担吗？',
      '诗先赞美流动，又用问句打断它。把流水当作有选择的主体，便能读出给予、牵绊与自身节奏之间没有被直接回答的关系。'],
    [8, 'Her wistful face haunts my dreams like the rain at night.',
      '她惆怅的面容萦绕我的梦，像夜间的雨。',
      '脸是视觉形象，夜雨却更多通过声音被感知。比喻把一个看得见的人，转成持续在场却难以握住的氛围。'],
    [9, 'Once we dreamt that we were strangers.\nWe wake up to find that we were dear to each other.',
      '曾经，我们梦见彼此是陌生人。\n醒来却发现，彼此原来这样亲近。',
      '两句话在梦与醒、陌生与亲近之间对调。这里的转折没有叙述相识的过程，亲近仿佛不是新获得的，而是被重新发现的。'],
    [10, 'Sorrow is hushed into peace in my heart like the evening among the silent trees.',
      '悲伤在我心里渐渐静成安宁，如暮色落在寂静的树间。',
      'hushed 写的是声音渐低，而不是悲伤被抹去。暮色没有消灭树木，只改变了它们被看见的方式；情绪的变化因而显得缓慢而可信。'],
    [11, 'Some unseen fingers, like idle breeze, are playing upon my heart the music of the ripples.',
      '一些看不见的手指，如闲散的微风，在我心上弹着涟漪的乐曲。',
      '手指、微风与涟漪把触觉、运动和声音连起来。主体始终不可见，留下的只是感受如何发生；这是一种用结果描写隐形事物的方法。'],
    [12, '"What language is thine, O sea?"\n"The language of eternal question."\n"What language is thy answer, O sky?\n"The language of eternal silence."',
      '“大海啊，你说的是什么语言？”\n“永恒追问的语言。”\n“天空啊，你用什么语言回答？”\n“永恒沉默的语言。”',
      '海的运动与天空的沉默构成对话，却没有给问题一个封闭的答案。原版第三句的引号形式照录；阅读时可把两种尺度与两种声音交替想象。'],
    [13, 'Listen, my heart, to the whispers of the world with which it makes love to you.',
      '我的心啊，听听世界的低语吧，它正用这些低语向你表达爱意。',
      '诗的动作只有“听”。世界没有高声说明意义，亲近需要读者主动调低自己的声音，这让感受成为一种注意力练习。'],
    [15, 'Do not seat your love upon a precipice because it is high.',
      '不要只因悬崖高，就把你的爱安置在那里。',
      '高处通常代表崇高，这里却同时意味着险境。句子把一个常见价值判断还原成空间：向往高度时，也要看它能否承托具体的生活。'],
    [16, 'I sit at my window this morning where the world like a passer-by stops for a moment, nods to me and goes.',
      '今晨我坐在窗边，世界像一个过路人，停了一会儿，向我点头，又走了。',
      '世界被缩成一个短暂照面的行人。停下、点头、离开的节奏极轻，既有亲近，也保留了无法占有的距离。'],
    [17, 'These little thoughts are the rustle of leaves; they have their whisper of joy in my mind.',
      '这些细小的念头是叶子的沙沙声；它们在我心里低声说着喜悦。',
      '念头没有被描述为完整观点，而是断续、轻微的声响。叶声这个比喻允许思绪暂时不成体系，只拥有自己的节奏。'],
    [18, 'What you are you do not see, what you see is your shadow.',
      '你看不见你自身的样子；你所看见的，是你的影子。',
      '对称句式制造了一个认识上的错位：可见之物未必等于自身。影子既与主体相连，又受到光线和位置影响，保留了判断需要条件的意味。'],
    [21, 'They throw their shadows before them who carry their lantern on their back.',
      '把灯笼背在身后的人，会把自己的影子投向前方。',
      '这是一句可以实际画出来的诗。先理解光源、身体与影子的空间关系，再去想它的隐喻；画面本身承担了大部分论证。'],
    [22, 'That I exist is a perpetual surprise which is life.',
      '我的存在，是一场持续不断的惊讶；那就是生命。',
      '惊讶通常短暂，perpetual 却把它延长为持续状态。诗把最容易习以为常的“存在”重新放到值得惊奇的位置。'],
    [23, '"We, the rustling leaves, have a voice that answers the storms, but who are you so silent?"\n"I am a mere flower."',
      '“我们沙沙作响的叶子，有回应风暴的声音；你如此沉默，你是谁？”\n“我只是一朵花。”',
      '长问句与极短回答在音量上并不对等。花没有证明自己同样响亮，只陈述自身，留下了另一种存在方式。'],
    [24, 'Rest belongs to the work as the eyelids to the eyes.',
      '休息属于工作，正如眼睑属于眼睛。',
      '眼睑通过闭合保护观看。这个身体性的比喻，让休息成为活动自身的组成部分，而不是需要额外辩护的空白。'],
    [35, 'The bird wishes it were a cloud. The cloud wishes it were a bird.',
      '鸟儿希望自己是一朵云。云希望自己是一只鸟。',
      '句子只交换两个名词，愿望便形成闭环。读者同时看见双方拥有的自由，也看见身处其中的人为什么仍会羡慕别处。'],
    [48, 'The stars are not afraid to appear like fireflies.',
      '群星不怕看起来像萤火虫。',
      '宏大的星辰以微小的亮点被看见。诗让尺度与价值脱钩：事物无需在每次出现时，都证明自己的全部体量。'],
    [82, 'Let life be beautiful like summer flowers and death like autumn leaves.',
      '让生命美如夏花，让死亡美如秋叶。',
      '两个季节意象让盛放与凋落处在同一条自然时间里。句式没有用转折对立它们，and 的连接保留了各自的姿态与节奏。']
  ];
  birds.forEach(function (row) {
    var id = 'tagore-stray-birds-' + row[0];
    if (LITERATURE.some(function (item) { return item.id === id; })) return;
    LITERATURE.push({ id: id, authorId: 'tagore', language: '外文 · 双语 · 泰戈尔优先',
      title: 'Stray Birds · ' + row[0], by: 'Rabindranath Tagore · 1916', original: row[1],
      translation: row[2], translationCredit: credit, analysis: row[3], source: source,
      edition: '1916 年 Macmillan 版 · 英文由泰戈尔自译 · 第 ' + row[0] + ' 则', verifiedAt: '2026-09-13' });
  });
  LITERATURE[4].edition = '1916 年 Macmillan 版 · 英文由泰戈尔自译 · 第 6 则';
  var modes = { questions: '只提问题', weaknesses: '指出薄弱处', alternative: '另一种写法' };
  var bagKey = 'literature-selection-v1';
  var bagCache = null;
  var activeRequest = null;
  var pendingSaves = [];
  var versionSelection = '';
  var selectedText = '';
  var finalRange = { start: 0, end: 0 };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function getBag() {
    if (bagCache) return bagCache;
    var stored = load(bagKey, null);
    if (stored && stored.version === 1 && stored.cycles && Array.isArray(stored.recent)) return (bagCache = stored);
    var bag = { version: 1, cycles: {}, recent: [] };
    var keys = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (/^w-\d{4}-\d{1,2}-\d{1,2}$/.test(key)) keys.push(key);
      }
      keys.sort(function (a, b) { return parseYmd(a.slice(2)) - parseYmd(b.slice(2)); }).forEach(function (key) {
        var daily = load(key, {});
        var item = LITERATURE.find(function (entry) { return entry.id === daily.literaryAppreciationId; }) ||
          LITERATURE[Number(daily.literaryAppreciationIdx)];
        if (item) {
          var seen = bag.cycles[item.authorId] || (bag.cycles[item.authorId] = []);
          if (seen.indexOf(item.id) < 0) seen.push(item.id);
          bag.recent.push(item.id);
        }
      });
    } catch (error) { /* 日记录仍是来源，不让坏的历史记录阻断写作。 */ }
    bag.recent = bag.recent.slice(-80);
    return (bagCache = bag);
  }
  function randomUnit() {
    if (window.crypto && window.crypto.getRandomValues) {
      var values = new Uint32Array(1); window.crypto.getRandomValues(values); return values[0] / 4294967296;
    }
    return Math.random();
  }
  function chooseIndex() {
    var authors = [];
    LITERATURE.forEach(function (item) { if (authors.indexOf(item.authorId) < 0) authors.push(item.authorId); });
    var total = authors.reduce(function (sum, author) { return sum + (author === 'tagore' ? 14 : 1); }, 0);
    var point = randomUnit() * total;
    var author = authors[authors.length - 1];
    authors.some(function (candidate) {
      point -= candidate === 'tagore' ? 14 : 1;
      if (point < 0) { author = candidate; return true; }
      return false;
    });
    var bag = getBag();
    var pool = LITERATURE.filter(function (item) { return item.authorId === author; });
    var seen = bag.cycles[author] || [];
    var available = pool.filter(function (item) { return seen.indexOf(item.id) < 0; });
    if (!available.length) {
      seen = [];
      var last = bag.recent[bag.recent.length - 1];
      available = pool.filter(function (item) { return pool.length === 1 || item.id !== last; });
    }
    var chosen = available[Math.floor(randomUnit() * available.length)];
    bag.cycles[author] = seen.concat(chosen.id);
    bag.recent.push(chosen.id); bag.recent = bag.recent.slice(-80);
    save(bagKey, bag);
    return LITERATURE.indexOf(chosen);
  }
  weightedLiteratureIndex = chooseIndex;

  ensureLiteraryState = function () {
    var changed = false;
    if (state.literaryPromptIdx === undefined) {
      var seed = String(ymd).split('').reduce(function (sum, char) { return sum + char.charCodeAt(0); }, 0);
      state.literaryPromptIdx = (seed + (Number(state.rewardIdx) || 0) * 5) % WRITING_PROMPTS.length;
      changed = true;
    }
    if (state.rewardIdx !== undefined && state.literaryAppreciationIdx === undefined && !state.literaryAppreciationId) {
      state.literaryAppreciationIdx = chooseIndex(); changed = true;
    }
    var item = LITERATURE.find(function (entry) { return entry.id === state.literaryAppreciationId; });
    if (!item && state.literaryAppreciationIdx !== undefined) item = LITERATURE[Number(state.literaryAppreciationIdx)];
    if (item && !state.literaryAppreciationId) { state.literaryAppreciationId = item.id; changed = true; }
    if (changed) save('w-' + ymd, state);
  };

  renderLiteraryAppreciation = function () {
    ensureLiteraryState();
    var item = LITERATURE.find(function (entry) { return entry.id === state.literaryAppreciationId; }) ||
      LITERATURE[Number(state.literaryAppreciationIdx)];
    if (!item) return;
    document.getElementById('reading-language').textContent = item.language;
    document.getElementById('reading-title').textContent = '《' + item.title + '》';
    document.getElementById('reading-by').textContent = item.by;
    document.getElementById('reading-original').textContent = item.original;
    var translated = document.getElementById('reading-translation');
    translated.textContent = item.translation || ''; translated.style.display = item.translation ? 'block' : 'none';
    document.getElementById('reading-analysis').textContent = item.analysis;
    var box = document.getElementById('reading-source'); box.replaceChildren();
    if (item.translation) {
      var note = document.createElement('p'); note.className = 'literature-credit';
      note.textContent = item.translationCredit; box.appendChild(note);
    }
    if (item.edition) {
      var edition = document.createElement('p'); edition.className = 'literature-credit';
      edition.textContent = item.edition; box.appendChild(edition);
    }
    var link = document.createElement('a'); link.href = item.source; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.textContent = '原文来源 · 核对版本与诗号 ↗'; box.appendChild(link);
    var policy = document.createElement('p'); policy.className = 'literature-credit';
    policy.textContent = '泰戈尔作者权重约 58%；作者内读完一轮再重复。今日篇目固定，旧阅读保持原样。';
    box.appendChild(policy);
  };

  function replaceControl(id) {
    var old = document.getElementById(id);
    var fresh = old.cloneNode(true); fresh.value = old.value; old.replaceWith(fresh); return fresh;
  }
  var draftInput = replaceControl('literary-draft');
  var saveButton = replaceControl('literary-save');
  var evaluateButton = replaceControl('literary-evaluate');
  evaluateButton.textContent = '请 K3 阅读';
  document.getElementById('literary-feedback').hidden = true;
  var toolbar = document.createElement('div'); toolbar.className = 'literature-mode-row';
  toolbar.innerHTML = '<label for="literary-feedback-mode">本次反馈</label><select id="literary-feedback-mode">' +
    '<option value="questions">只提问题</option><option value="weaknesses">指出薄弱处</option>' +
    '<option value="alternative">另一种写法</option></select><span>保留你的声音；参考文字不会覆盖原稿。</span>';
  draftInput.before(toolbar);
  var modeSelect = document.getElementById('literary-feedback-mode');
  var workspace = document.createElement('details'); workspace.id = 'literary-workbench'; workspace.className = 'literary-card literary-workbench';
  workspace.innerHTML = '<summary><span>原稿 · 建议 · 定稿</span><span class="literature-summary-hint">版本对照与手动采纳</span></summary>' +
    '<div class="literature-workbench-body"><div class="literature-version-row"><label for="literary-version-list">查看版本</label>' +
    '<select id="literary-version-list"><option value="">当前工作稿</option></select>' +
    '<button type="button" class="literary-button" id="literary-version-save">保存一个版本</button></div>' +
    '<p class="literature-version-note" id="literary-version-note"></p><div class="literature-compare">' +
    '<section><h4 id="literary-original-title">原稿快照</h4><pre id="literary-original-snapshot" tabindex="0"></pre></section>' +
    '<section><h4>模型建议（可选择文字）</h4><div id="literary-model-copy" tabindex="0">' +
    '<p id="literary-model-assessment"></p><p id="literary-model-suggestions"></p><pre id="literary-model-revision"></pre></div>' +
    '<details id="literary-feedback-origin" class="literature-feedback-origin" hidden><summary>这份反馈提交时的原稿</summary><pre id="literary-feedback-origin-text"></pre></details>' +
    '<button type="button" class="literary-button" id="literary-adopt-selection" disabled>将选中文字插入定稿</button></section>' +
    '<section class="literature-final-column"><label for="literary-final-draft">我的定稿 · 可自由编辑</label>' +
    '<textarea id="literary-final-draft" placeholder="在这里保留你认可的表达。可从原稿或建议中选中文字，手动采纳；不会自动替你改写。"></textarea>' +
    '<div class="literature-final-actions"><button type="button" class="literary-button" id="literary-copy-original">原稿复制到定稿</button>' +
    '<button type="button" class="literary-button" id="literary-restore-final">载入所选版本定稿</button></div></section></div>' +
    '<p class="literature-version-note" id="literary-version-status" role="status" aria-live="polite"></p></div>';
  document.getElementById('literary-write').appendChild(workspace);
  var versionSelect = document.getElementById('literary-version-list');
  var finalInput = document.getElementById('literary-final-draft');
  var evalStatus = document.getElementById('literary-eval-status');
  evalStatus.setAttribute('role', 'status'); evalStatus.setAttribute('aria-live', 'polite');
  var retryButton = document.createElement('button'); retryButton.type = 'button'; retryButton.className = 'literary-button';
  retryButton.textContent = '重试保存返回的反馈'; retryButton.hidden = true; evalStatus.after(retryButton);
  var hint = document.getElementById('literary-save-hint');
  hint.setAttribute('role', 'status');
  function status(message) { document.getElementById('literary-version-status').textContent = message; }
  function persist(message) {
    var ok = save('w-' + ymd, state) === true;
    hint.textContent = ok ? (message || '已自动保存到本机') : '保存失败，请立即复制文字或导出备份';
    hint.classList.toggle('save-failed', !ok);
    return ok;
  }
  function id() { return 'lv-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8); }
  function versionsFor(daily) {
    if (!Array.isArray(daily.literaryVersions)) daily.literaryVersions = [];
    return daily.literaryVersions;
  }
  function migrateLegacy() {
    if (Array.isArray(state.literaryVersions) || !state.literaryFeedback) return;
    state.literaryVersions = [{ id: id(), kind: 'legacy', savedAt: state.literaryFeedback.savedAt || '',
      original: typeof state.literaryFeedback.originalSnapshot === 'string' ? state.literaryFeedback.originalSnapshot : null,
      final: typeof state.literaryFinalDraft === 'string' ? state.literaryFinalDraft : '',
      feedback: clone(state.literaryFeedback), feedbackMode: 'alternative', promptIdx: state.literaryPromptIdx }];
    persist('旧反馈已保留；旧版未记录的原稿不做推断');
  }
  function feedbackFor(daily) { return daily.literaryFeedback && typeof daily.literaryFeedback === 'object' ? daily.literaryFeedback : null; }
  function selectedVersion() {
    return versionsFor(state).find(function (entry) { return entry.id === versionSelection; }) || null;
  }
  function renderComparison() {
    var entries = versionsFor(state);
    versionSelect.replaceChildren();
    var current = document.createElement('option'); current.value = ''; current.textContent = '当前工作稿'; versionSelect.appendChild(current);
    entries.slice().reverse().forEach(function (entry, reverseIndex) {
      var option = document.createElement('option'); option.value = entry.id;
      var date = new Date(entry.savedAt);
      option.textContent = '版本 ' + (entries.length - reverseIndex) + ' · ' +
        (entry.kind === 'evaluation' ? (modes[entry.feedbackMode] || '模型反馈') : entry.kind === 'legacy' ? '旧版反馈' : '手动保存') +
        (isNaN(date.getTime()) ? '' : ' · ' + date.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
      versionSelect.appendChild(option);
    });
    if (!entries.some(function (entry) { return entry.id === versionSelection; })) versionSelection = '';
    versionSelect.value = versionSelection;
    var selected = selectedVersion();
    var feedback = selected ? selected.feedback : feedbackFor(state);
    var original = selected ? selected.original : state.literaryDraft || '';
    document.getElementById('literary-original-title').textContent = selected ? '这个版本的原稿快照' : '当前原稿';
    document.getElementById('literary-original-snapshot').textContent = original === null ? '旧版没有保存这次反馈对应的原稿快照，无法可靠还原。当前原稿仍在上方。' : original || '还没有文字。';
    document.getElementById('literary-model-assessment').textContent = feedback && feedback.assessment || '';
    document.getElementById('literary-model-suggestions').textContent = feedback ? (Array.isArray(feedback.suggestions) ? feedback.suggestions.map(function (text, index) { return (index + 1) + '. ' + text; }).join('\n\n') : feedback.suggestions || '') : '完成一段文字后，选择模型介入的方式。';
    document.getElementById('literary-model-revision').textContent = feedback && feedback.revision || '';
    var differentOriginal = feedback && typeof feedback.originalSnapshot === 'string' && feedback.originalSnapshot !== original;
    document.getElementById('literary-feedback-origin').hidden = !differentOriginal;
    document.getElementById('literary-feedback-origin-text').textContent = differentOriginal ? feedback.originalSnapshot : '';
    if (document.activeElement !== finalInput) finalInput.value = state.literaryFinalDraft || '';
    document.getElementById('literary-restore-final').disabled = !selected || typeof selected.final !== 'string';
    document.getElementById('literary-version-note').textContent = selected ?
      '正在只读查看历史；右侧始终是你的当前定稿。载入历史定稿需另行确认，不会覆盖原稿。' +
        (differentOriginal ? '这份反馈对应更早的原稿，可在建议下方展开核对。' : '') :
      feedback && feedback.originalSnapshot !== state.literaryDraft ? '当前原稿已变化，下方反馈仍对应它提交时的快照。' :
      '原稿和定稿各自保存。先在定稿中定位光标或选中要替换的文字，再选择建议片段进行采纳。';
    selectedText = ''; document.getElementById('literary-adopt-selection').disabled = true;
  }
  renderLiteraryFeedback = renderComparison;
  renderLiteraryWriting = function () {
    ensureLiteraryState(); migrateLegacy();
    var prompt = WRITING_PROMPTS[Number(state.literaryPromptIdx) % WRITING_PROMPTS.length];
    if (!prompt) return;
    document.getElementById('writing-kind').textContent = 'LITERARY IMAGINATION · ' + prompt.kind;
    document.getElementById('writing-title').textContent = prompt.title;
    document.getElementById('writing-seed').textContent = prompt.seed;
    document.getElementById('writing-guide').textContent = prompt.guide;
    if (document.activeElement !== draftInput) draftInput.value = state.literaryDraft || '';
    modeSelect.value = modes[state.literaryFeedbackMode] ? state.literaryFeedbackMode : 'questions';
    renderComparison();
  };
  modeSelect.addEventListener('change', function () {
    state.literaryFeedbackMode = modeSelect.value; persist('反馈方式已保存');
  });
  draftInput.addEventListener('input', function () {
    state.literaryDraft = draftInput.value; persist();
    if (feedbackFor(state)) evalStatus.textContent = activeRequest ? '模型正在阅读提交时的快照；你可以继续写，返回内容不会覆盖原稿。' : '原稿已修改。已有反馈保留原快照，需要时可再次请求。';
  });
  finalInput.addEventListener('input', function () { state.literaryFinalDraft = finalInput.value; persist('定稿已自动保存'); });
  ['select', 'keyup', 'click', 'blur'].forEach(function (event) {
    finalInput.addEventListener(event, function () { finalRange = { start: finalInput.selectionStart, end: finalInput.selectionEnd }; });
  });
  saveButton.addEventListener('click', function () {
    state.literaryDraft = draftInput.value; state.literaryFinalDraft = finalInput.value;
    persist('原稿与定稿已保存');
  });
  retryButton.addEventListener('click', function () {
    pendingSaves = pendingSaves.filter(function (pending) {
      /* 合并尚未持久化的版本，不用旧日对象覆盖后来新增的文字。 */
      var current = pending.key === 'w-' + ymd ? state : load(pending.key, pending.value);
      var entries = versionsFor(current);
      versionsFor(pending.value).forEach(function (entry) {
        if (!entries.some(function (existing) { return existing.id === entry.id; })) entries.push(entry);
      });
      if (!current.literaryFeedback && pending.value.literaryFeedback) current.literaryFeedback = pending.value.literaryFeedback;
      return save(pending.key, current) !== true;
    });
    retryButton.hidden = !pendingSaves.length;
    evalStatus.textContent = pendingSaves.length ? '仍未保存成功。反馈保留在本次会话中，请先复制或导出备份。' : '返回的反馈已保存，可以在对应日期的版本历史回看。';
  });
  versionSelect.addEventListener('change', function () { versionSelection = versionSelect.value; renderComparison(); });
  function recordManualVersion(message) {
    var feedback = feedbackFor(state);
    var entry = { id: id(), kind: 'manual', savedAt: new Date().toISOString(), promptIdx: state.literaryPromptIdx,
      original: state.literaryDraft || '', final: state.literaryFinalDraft || '',
      feedback: feedback ? clone(feedback) : null, feedbackOriginal: feedback && feedback.originalSnapshot || null,
      feedbackMode: state.literaryFeedbackMode || 'questions' };
    versionsFor(state).push(entry);
    if (!persist()) { status('版本仍在本次会话内，但尚未写入磁盘。请先导出或复制文字，再点击保存重试。'); return false; }
    versionSelection = entry.id; status(message || '已保存独立版本；之后的编辑不会改动这个快照。'); renderComparison(); return true;
  }
  document.getElementById('literary-version-save').addEventListener('click', function () {
    state.literaryDraft = draftInput.value; state.literaryFinalDraft = finalInput.value;
    if (!state.literaryDraft.trim() && !state.literaryFinalDraft.trim()) { status('先写下一些文字，再保存版本。'); return; }
    recordManualVersion();
  });
  document.addEventListener('selectionchange', function () {
    var selection = window.getSelection(); var modelBox = document.getElementById('literary-model-copy');
    var originalBox = document.getElementById('literary-original-snapshot');
    if (!selection || selection.isCollapsed) return;
    var sameBox = [modelBox, originalBox].some(function (box) { return box.contains(selection.anchorNode) && box.contains(selection.focusNode); });
    if (!sameBox) return;
    selectedText = selection.toString();
    document.getElementById('literary-adopt-selection').disabled = !selectedText;
  });
  document.getElementById('literary-adopt-selection').addEventListener('click', function () {
    if (!selectedText) return;
    var start = Math.min(finalRange.start, finalInput.value.length); var end = Math.min(finalRange.end, finalInput.value.length);
    finalInput.setRangeText(selectedText, start, end, 'end'); state.literaryFinalDraft = finalInput.value;
    finalRange = { start: finalInput.selectionStart, end: finalInput.selectionEnd };
    if (persist('选中文字已写入定稿并保存')) status('只采纳了你选中的片段。原稿保持不变。');
    finalInput.focus();
  });
  function replaceFinal(text, action) {
    if (state.literaryFinalDraft && state.literaryFinalDraft !== text) {
      if (!window.confirm(action + '将替换当前定稿；会先保存当前版本。继续吗？')) return;
      if (!recordManualVersion('替换前的定稿已保存为版本。')) return;
    }
    finalInput.value = text; state.literaryFinalDraft = text;
    if (persist('定稿已保存')) status(action + '完成，原稿未改动。');
    finalRange = { start: text.length, end: text.length };
  }
  document.getElementById('literary-copy-original').addEventListener('click', function () { replaceFinal(draftInput.value, '复制原稿'); });
  document.getElementById('literary-restore-final').addEventListener('click', function () {
    var selected = selectedVersion(); if (selected) replaceFinal(selected.final || '', '载入历史定稿');
  });
  evaluateButton.addEventListener('click', async function () {
    if (activeRequest) return;
    var original = draftInput.value;
    if (!original.trim()) { evalStatus.textContent = '先写下一段文字，再请模型阅读。'; return; }
    if (original.length > 30000) { evalStatus.textContent = '本次最多提交 30,000 字符；原稿仍会完整保存。请另选一个较短片段练习。'; return; }
    state.literaryDraft = original; state.literaryFinalDraft = finalInput.value; state.literaryFeedbackMode = modeSelect.value;
    if (!persist()) { evalStatus.textContent = '本机保存失败，尚未向模型发送。请先备份文字并处理存储问题。'; return; }
    if (!window.advisor || typeof window.advisor.ask !== 'function') {
      evalStatus.textContent = '原稿已保存。桌面版配置 K3 API 后即可请求反馈；离线时仍可写作和保存版本。'; return;
    }
    var prompt = WRITING_PROMPTS[Number(state.literaryPromptIdx) % WRITING_PROMPTS.length];
    var request = { day: ymd, promptIdx: state.literaryPromptIdx, original: original,
      mode: modeSelect.value, final: state.literaryFinalDraft || '' };
    activeRequest = request; evaluateButton.disabled = true; modeSelect.disabled = true;
    evalStatus.textContent = 'K3 正在阅读提交时的快照。你可以继续写，返回内容不会覆盖原稿。';
    try {
      var result = await window.advisor.ask({ task: 'literary_imitation_review',
        prompt: { kind: prompt.kind, title: prompt.title, seed: prompt.seed, guide: prompt.guide },
        draft: request.original, feedbackMode: request.mode,
        responseFormat: { assessment: 'string', suggestions: 'string[] | string', revision: 'string' } });
      if (typeof result === 'string') result = { assessment: result, suggestions: [], revision: '' };
      if (!result || typeof result !== 'object') throw new Error('模型返回格式无法识别');
      var feedback = { assessment: typeof result.assessment === 'string' ? result.assessment : (result.analysis || result.text || ''),
        suggestions: Array.isArray(result.suggestions) ? result.suggestions.filter(function (text) { return typeof text === 'string'; }) :
          (typeof result.suggestions === 'string' ? result.suggestions : ''),
        revision: request.mode === 'alternative' ? (typeof result.revision === 'string' ? result.revision : result.rewritten || '') : '',
        savedAt: new Date().toISOString(), originalSnapshot: request.original, feedbackMode: request.mode };
      if (!feedback.assessment && !feedback.suggestions.length && !feedback.revision) throw new Error('模型返回了空反馈，请重试');
      /* 日切或切换后读回提交当天记录，绝不把旧请求结果塞入新一天。 */
      var target = ymd === request.day ? state : load('w-' + request.day, null);
      if (!target || typeof target !== 'object') throw new Error('提交当天的记录已不存在，未覆盖当前内容');
      var entry = { id: id(), kind: 'evaluation', savedAt: feedback.savedAt, promptIdx: request.promptIdx,
        original: request.original, final: request.final, feedback: feedback, feedbackMode: request.mode,
        promptSnapshot: clone(prompt) };
      versionsFor(target).push(entry);
      if (target.literaryPromptIdx === request.promptIdx) target.literaryFeedback = feedback;
      var ok = save('w-' + request.day, target) === true;
      if (ymd === request.day) { versionSelection = entry.id; renderComparison(); workspace.open = true; }
      evalStatus.textContent = ok ? ('反馈已保存到 ' + request.day + ' 的版本历史。' +
        (target.literaryDraft !== request.original ? '你后续写下的原稿保持不变。' : '你可以只采纳其中某一句。')) :
        '反馈已返回，但写入本机失败。请复制反馈或导出备份，勿关闭窗口；点击保存可重试。';
      if (!ok) {
        pendingSaves.push({ key: 'w-' + request.day, value: target }); retryButton.hidden = false;
        evalStatus.textContent += '也可使用下方按钮重试保存。';
      }
    } catch (error) {
      evalStatus.textContent = '本次反馈未完成：' + (error && error.message ? error.message : '请稍后重试') + '。原稿和之前的版本保持不变，可再次请求。';
    } finally {
      activeRequest = null; evaluateButton.disabled = false; modeSelect.disabled = false;
    }
  });
  window.literatureUpgrade = { chooseIndex: chooseIndex, ensureState: ensureLiteraryState,
    renderWriting: renderLiteraryWriting, renderReading: renderLiteraryAppreciation, modes: modes,
    resetSelectionCache: function () { bagCache = null; } };
  renderLiteraryWriting();
  if (document.getElementById('literary-reading').classList.contains('active')) renderLiteraryAppreciation();
}());
