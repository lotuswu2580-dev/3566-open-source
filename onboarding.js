/* Public edition: local, replayable onboarding and contextual settings guide. */
(function () {
  'use strict';
  function initialize() {
  var panel = document.querySelector('.settings-panel');
  if (!panel) return;
  var catalog = [
    ['油画系列', '两间油画展室', '鸢尾花和微风徐徐使用随应用附带的完整原画复制图，深色展墙和聚焦灯只改变展示。点击画框可看大图及馆藏来源。右下角“纯画／图文”隐藏或恢复上方文字，两间展室共用这个偏好。它不是开屏图片，也不会每天联网换主题。'],
    ['美术馆系列', '三种色彩秩序', '色场偏鲜明色块，柔幕偏低饱和曲面，构成偏平面网格。点击立即预览并自动保存；不改变任务、文字或归档。它们是应用设计主题，不是其他艺术家的原画。'],
    ['经典设计风格', '七种日常界面', '柔光圆润明亮；书页像编辑式书页；跃纸有轻快反馈；静域适合长文；轨道偏几何秩序；格序强调黑白网格；序白强调留白。选择会即时生效，可随时换回。动画尊重系统“减少动态效果”，不保证所有设备固定 60 帧。'],
    ['光线模式', '白天与黑夜', '这是手动选择，不会随时间自动切换。白天提高纸张亮度，黑夜压低环境亮度。与全部风格独立组合；油画主题仍保留深色展墙以聚焦画作。'],
    ['字号', '阅读密度', '小、标准、大、特大调整界面文字与阅读密度，不改变保存文本。较大字号会需要更多滚动；复盘长文可拖动输入框右下角调整高度。'],
    ['开屏图', '启动图片，不是主题画作', '开启：下次启动展示你选的图片，可点击跳过。关闭：直接进今日页。使用下面的“选择图片”支持 PNG、JPG、JPEG、WebP，最多 16 MB、2400 万像素。推荐横图约 16:9，图片会按窗口适配，边缘可能裁切。图片复制到本机用户数据目录，原文件不变；没有选择图片时不显示开屏。重置保留上一次图片供人工找回。更换主题展墙不是这个选项，主题自动抓取暂未实现。'],
    ['审美顾问模型', '选择真正处理提问的服务商', 'Kimi K3 处理文字问答与文学反馈；Gemini 可同时接收当前素材图片。两家密钥分别配置，切换模型不会替你申请账户或充值。仅保存密钥不会发起模型请求；在彩蛋里点击发送或文学评估才调用。基础待办、番茄钟、复盘和归档不需要 API。'],
    ['顾问发送当前图片', '图片隐私与能力边界', '只有 Gemini 生效，默认关闭。开启后，审美提问会下载已核验的当前 Commons 素材，并把图片和问题发送给 Google；图片失败会降级文字并提示。不上传你的开屏图，也不自动上传整个归档。K3 只收到作品信息，不会看图。模型可能误判，史实应回到馆藏来源核对。'],
    ['K3 API', 'Kimi Code 密钥与接入步骤', '① 在 Kimi Code 官方账户确认 API 权限并创建自己的 Key（不是把普通 Moonshot 平台 Key 当作同一种密钥）。② 粘贴到密码框，点击保存，输入框清空且状态变为已配置。③ 上方选择 Kimi K3。④ 彩蛋→视觉作品→顾问发送一个问题，或在文学仿写点击评估。当前程序固定请求 https://api.kimi.com/coding/v1/chat/completions，model=k3，Bearer 鉴权，未开放自定义代理或 OpenAI 接口。可开发使用 K3_API_KEY 环境变量；清除按钮只删本机保存的 Key，环境变量必须自己移除。'],
    ['Gemini API', 'Google 密钥与模型 ID', '① 到 Google AI Studio 创建你有权使用的 API Key，确认地区、项目及配额／计费条件。② 粘贴并保存。③ 选择 Google Gemini。④ 模型 ID 默认 gemini-3.8-flash；以 Google 官方模型列表和你的账户可用性为准，更换 ID 后需点击该行保存。程序请求官方 generateContent 接口，不支持自定义 Base URL。⑤ 如需图片，单独开启“发送当前图片”。保存 Key 不会验证网络连通性，发送一个低成本问题才是实际测试。GEMINI_API_KEY 可作开发回退；清除本机 Key 不删除环境变量。'],
    ['我的书桌', '解锁方式与每日任务模板', '每日仪式：完成所有未隐藏的固定待办后打开今天的新作品；新增临时待办不增加解锁门槛。自由浏览：随时打开今日作品，不影响历史打卡。文学想象和旧归档始终可用。固定模板每行一项，1–20 项、每项不超过 160 字，点“保存明日起的模板”才保存；从下一天起使用，不重写今天或旧日任务。'],
    ['记录与备份', '每个备份按钮的含义', '导出完整 JSON：下载可恢复的记录和设置，不含 API Key 或开屏图。选择恢复文件：先预览数量和冲突，再选“仅补充缺失”或“替换同名整条记录”；恢复前先备份，确认后重新载入。重试未保存内容：重试本机写入失败。导出故障副本：保存原始证据，不能直接导入。立即独立备份：写入本机用户目录；查看本机备份：选择旧快照进入预览。桌面保留最近 12 份自动、6 份手动、6 份恢复前备份，无云同步。公开版不接受包含已移除模块字段的私人版备份，不要直接覆盖数据目录。']
  ];
  function el(tag, text, cls) { var n = document.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; }
  function button(text, fn) { var n = el('button', text, 'k3-button'); n.type = 'button'; n.addEventListener('click', fn); return n; }
  function settingsOpen() { document.getElementById('settings-open').click(); }
  function settingsClose() { document.getElementById('settings-close').click(); }
  function makeDialog(title) {
    var d = el('dialog', '', 'guide-dialog'), head = el('div', '', 'guide-top'), h = el('h2', title);
    h.id = 'guide-heading-' + title.length; d.setAttribute('aria-labelledby', h.id);
    head.append(h, button('关闭', function () { d.close(); })); d.appendChild(head); document.body.appendChild(d); return d;
  }
  // A compact explanation lives beside each actual settings group.
  var targets = {};
  panel.querySelectorAll('.settings-group').forEach(function (group) {
    var label = group.querySelector('.settings-label'); if (!label) return;
    var item = catalog.find(function (row) { return label.textContent.indexOf(row[0]) >= 0; }); if (!item) return;
    var details = el('details', '', 'setting-help'); details.dataset.helpFor = item[0];
    details.append(el('summary', '使用说明 · ' + item[1]), el('p', item[2])); group.appendChild(details); targets[item[0]] = group;
  });
  // Choose a local splash through a narrow desktop bridge, never through arbitrary renderer paths.
  var splashGroup = targets['开屏图'], splashStatus = el('p', '', 'k3-note'), actions = el('div', '', 'guide-actions');
  var choose = button('选择图片', async function () {
    choose.disabled = true;
    try { var r = await window.app.chooseSplash(); if (!r.canceled) { window.applyAppearance({ splash: true }); await refreshSplash(); splashStatus.textContent += ' 下次启动生效。'; } }
    catch (e) { splashStatus.textContent = e.message; } finally { choose.disabled = false; }
  }); choose.id = 'splash-choose';
  var reset = button('重置开屏图', async function () {
    try { await window.app.resetSplash(); await refreshSplash(); splashStatus.textContent += ' 上一次图片保留为 custom-splash.previous.png。'; } catch (e) { splashStatus.textContent = e.message; }
  }); reset.id = 'splash-reset'; actions.append(choose, reset); splashGroup.append(actions, splashStatus);
  async function refreshSplash() {
    if (!window.app || !window.app.getSplashInfo) { choose.disabled = reset.disabled = true; splashStatus.textContent = '浏览器预览不支持本机开屏图片选择，请在桌面版使用。'; return; }
    try { var info = await window.app.getSplashInfo(); splashStatus.textContent = (info.configured ? '已选择本机开屏图。' : '尚未选择开屏图。') + ' 保存目录：' + info.directory; }
    catch (e) { splashStatus.textContent = e.message; }
  }
  refreshSplash();
  // Searchable guide mirrors the controls, including backup strategies and API failure cases.
  var help = makeDialog('设置使用手册'), search = el('input'), list = el('div', '', 'guide-manual-list');
  help.id = 'settings-guide'; search.type = 'search'; search.placeholder = '搜索：API、开屏、备份、字号…'; search.setAttribute('aria-label', '搜索设置说明');
  var cards = catalog.map(function (row) { var card = el('section', '', 'guide-card'); card.dataset.search = row.join(' ').toLowerCase(); card.append(el('h3', row[0] + ' · ' + row[1]), el('p', row[2]), button('前往这个设置', function () { help.close(); settingsOpen(); var target = targets[row[0]]; if (target) { target.querySelector('.setting-help').open = true; target.scrollIntoView({ block: 'start' }); } })); list.appendChild(card); return card; });
  var errors = el('section', '', 'guide-card'); errors.append(el('h3', 'API 常见问题与隐私'), el('p', '未配置：先保存对应服务商的 Key。401／403：检查密钥来源、权限和是否过期。404：模型 ID 或账户模型权限不匹配。429：额度／速率限制，稍后重试或检查服务商控制台。超时：检查网络，程序不会自动收费重试。Linux 等系统若不能安全加密，程序拒绝落盘，不会降级明文。Key 不进入源码、localStorage 或 JSON 备份；手动发送的问题、作品信息、最近对话或文学原稿会交给所选服务商，遵守其隐私和计费规则。免费开源不等于 API 免费。'));
  list.appendChild(errors);
  var sources = el('section', '', 'guide-card'); sources.appendChild(el('h3', '官方入口'));
  [['Kimi Code 接入文档', 'https://www.kimi.com/code/docs/'], ['Gemini 申请 API Key', 'https://ai.google.dev/gemini-api/docs/api-key'], ['Gemini 模型列表', 'https://ai.google.dev/gemini-api/docs/models']].forEach(function (item) { var a = el('a', item[0] + ' ↗'); a.href = item[1]; a.target = '_blank'; a.rel = 'noopener noreferrer'; sources.appendChild(a); }); list.appendChild(sources);
  var empty = el('p', '没有匹配的设置，试试“模型”或“背景”。', 'k3-note'); empty.hidden = true;
  search.addEventListener('input', function () { var query = search.value.trim().toLowerCase(); cards.forEach(function (card) { card.hidden = !card.dataset.search.includes(query); }); errors.hidden = !!query && !errors.textContent.toLowerCase().includes(query); sources.hidden = !!query && !sources.textContent.toLowerCase().includes(query); empty.hidden = cards.some(function (card) { return !card.hidden; }) || !errors.hidden || !sources.hidden; });
  help.append(search, list, empty);
  // Native dialog provides keyboard focus containment and Esc dismissal.
  var guide = makeDialog('先给今天留一个位置'), step = 0, content = el('div', '', 'guide-stage'), progress = el('p', '', 'guide-progress'), footer = el('div', '', 'guide-actions');
  guide.id = 'newcomer-guide'; progress.setAttribute('aria-live', 'polite');
  var steps = [
    ['3566 · 日知录', '四个页面，一条积累的路径。记录留在本机；先完成一件事，再慢慢训练观看和表达。无需登录，也不必先配 API。'],
    ['今日：小任务与番茄钟', '勾选固定任务，或添加临时待办。开始／暂停控制 25 分钟专注计时；重置回到当前阶段起点，跳过切换阶段。固定任务完成记一次打卡，休息不需要被惩罚。你可以在设置里改明天的任务模板。'],
    ['复盘：让知识再次出现', '把今天学到的内容写进宽文本栏，Ctrl + Enter 记录并排期。系统按第 1、2、4、7、15、30 天提醒回顾；勾选表示本次已复习，不是科学保证记牢。长文可拖动输入框右下角调整高度核对。'],
    ['归档：重新看见过去', '视觉评论、文学仿写的原稿／定稿和看过的文学文本在这里回看。按绘画、建筑、雕塑、动效和文学分类，支持搜索和标签。视觉记录可写后续想法；文学模块不增加评论。复习笔记仍在复盘页。'],
    ['彩蛋：观看、想象与鉴赏', '视觉作品实时请求精确的 Commons 文件页，显示来源；校验失败不拿仿画顶替。无网络时新作品可能不可用，今日和旧记录仍可使用。文学仿写不限定体裁，模型建议不会覆盖你的原稿；鉴赏保留外文双语。首版文学精选为 24 则泰戈尔《飞鸟集》。'],
    ['最后，布置你的书桌', '设置里有 12 种风格、白天／黑夜、字号、开屏图片和任务模板。每组都有“使用说明”，完整手册可搜索。API 是可选项，需要你自己的密钥，费用由服务商决定。记录请定期导出备份，开源代码不该包含你的个人数据。']
  ];
  var prev = button('上一步', function () { step--; paint(); }), next = button('下一步', function () { if (step === steps.length - 1) guide.close(); else { step++; paint(); } }); next.classList.add('primary');
  footer.append(button('跳过，先试用', function () { guide.close(); }), prev, next); guide.append(progress, content, footer);
  function paint() { progress.textContent = String(step + 1).padStart(2, '0') + ' / ' + String(steps.length).padStart(2, '0'); content.replaceChildren(el('h3', steps[step][0]), el('p', steps[step][1])); prev.disabled = step === 0; next.textContent = step === steps.length - 1 ? '开始我的今天' : '下一步'; if (!matchMedia('(prefers-reduced-motion: reduce)').matches) content.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.16,.7,.2,1)' }); }
  guide.addEventListener('close', function () { window.applyAppearance({ onboardingVersion: 1 }); });
  function openGuide() { settingsClose(); step = 0; paint(); guide.showModal(); next.focus(); }
  var group = el('section', '', 'settings-group guide-entry'); group.append(el('div', '第一次使用 / 帮助', 'settings-label'), el('p', '不要求一次记住全部设置。需要时随时回来。', 'k3-note'), button('重新观看新人引导', openGuide), button('打开完整设置手册', function () { search.value = ''; search.dispatchEvent(new Event('input')); help.showModal(); search.focus(); }));
  group.id = 'guide-entry'; panel.insertBefore(group, panel.querySelector('.settings-group'));
  // Wait for splash to finish; never stack onboarding on top of the launch image.
  var prefs = load('ui-prefs', {});
  if (prefs.onboardingVersion !== 1) { var attempts = 0; var timer = setInterval(function () { if (document.getElementById('splash-overlay') && attempts++ < 80) return; clearInterval(timer); openGuide(); }, 150); }
  // Improve the existing div-based settings dialog's keyboard behavior.
  document.getElementById('settings-open').addEventListener('click', function () { document.getElementById('settings-close').focus(); });
  document.getElementById('settings-close').addEventListener('click', function () { document.getElementById('settings-open').focus(); });
  panel.addEventListener('keydown', function (e) { if (e.key !== 'Tab' || guide.open || help.open) return; var nodes = Array.from(panel.querySelectorAll('button,input,select,textarea,summary,a')).filter(function (n) { return !n.disabled && n.getClientRects().length; }); var first = nodes[0], last = nodes[nodes.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } });
  window.publicGuide = { catalog: catalog, open: openGuide, manual: help, onboarding: guide };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
