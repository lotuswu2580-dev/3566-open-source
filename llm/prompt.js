'use strict';

/* 3566 日知录 · K3 提示词与上下文拼装
 * 只在主进程使用，不进入渲染进程。 */

var ADVISOR_SYSTEM_PROMPT = [
  '你是 3566 日知录中的审美顾问。用户是一名 UI/动效设计师。',
  '请只围绕给定的、已核验来源的当前素材回答。',
  '',
  '要求：',
  '1. 将可核验事实与审美分析明确区分。',
  '2. 不确定的年代、作者、馆藏或创作意图必须说明不确定，不得编造。',
  '3. 根据素材类型调整分析维度：',
  '   - 绘画：构图、色彩、笔触、观看路径；',
  '   - 建筑：空间、结构、材料、光线、动线；',
  '   - 雕塑：体量、姿态、材质、观看角度；',
  '   - 动态影像：节奏、缓急、循环、镜头、运动规律。',
  '4. 语言克制、清楚，避免空泛赞美。',
  '5. 最后给出一个能在 10—20 分钟完成的设计观察或临摹练习。',
  '6. 若问题超出已知材料，说明边界，并建议用户查看来源页。'
].join('\n');

var LITERARY_SYSTEM_PROMPT = [
  '你是 3566 日知录中的文学赏析者。用户每天写下一段文字：可能参照当日题面，也可能是完全自由的写作。',
  '请始终把用户文本当作一篇独立作品来赏析，题面只作为背景信息。',
  '',
  '要求：',
  '1. 优点要具体：引用原文句子，说明它好在哪里（意象、节奏、措辞、结构）。',
  '2. 不足同样具体：指出真正的问题出在哪一句或哪一处，不空泛赞美，也不空泛批评。',
  '3. 不评价用户文本与题面或任何原文的相似度、还原度、契合度。若文本明显呼应了题面，可以顺带一句指出呼应得好在哪里，但这不是必答项。',
  '4. 建议最多三条，每条可直接执行。',
  '5. 参考修改稿基于用户自己的文本修改，保留其气质、视角与意象，不强拉回题面，不擅自重写主题；明确它只是可选写法。',
  '6. 不给总分，不套用文学腔。',
  '7. 严格输出 JSON 对象，不要输出任何其他文字、解释或代码围栏。JSON 结构：',
  '{"assessment": "总体赏析（字符串）", "suggestions": ["建议一", "建议二"], "revision": "参考修改稿（字符串）"}'
].join('\n');

function clip(value, max) {
  if (typeof value !== 'string') return '';
  value = value.trim();
  return value.length > max ? value.slice(0, max) : value;
}

/* 把核验后的素材上下文整理成给模型看的 JSON 文本 */
function describeMaterial(material) {
  if (!material || typeof material !== 'object') return '{}';
  var safe = {
    类型: clip(material.kind, 20),
    标题: clip(material.title, 80),
    署名信息: clip(material.credit, 120),
    核验作者: clip(material.creator, 120),
    页面设计说明: clip(material.designNote, 500),
    来源页: clip(material.sourcePage, 300),
    授权: clip(material.license, 60)
  };
  return JSON.stringify(safe, null, 2);
}

function buildAdvisorMessages(payload) {
  var material = payload && payload.material;
  var question = clip(payload && payload.question, 500);
  var messages = [{ role: 'system', content: ADVISOR_SYSTEM_PROMPT }];
  messages.push({
    role: 'user',
    content: '当前已核验素材（来源与授权已通过 Wikimedia Commons 实时核验）：\n' +
      describeMaterial(material) +
      '\n\n请先熟悉这份素材，后续问题都围绕它回答。'
  });
  messages.push({ role: 'assistant', content: '好的，我已了解当前素材的来源与基本信息，请提出你的问题。' });
  var history = payload && Array.isArray(payload.history) ? payload.history.slice(-4) : [];
  history.forEach(function(item) {
    if (!item || typeof item.q !== 'string' || typeof item.a !== 'string') return;
    messages.push({ role: 'user', content: clip(item.q, 500) });
    messages.push({ role: 'assistant', content: clip(item.a, 4000) });
  });
  messages.push({ role: 'user', content: question });
  return messages;
}

function buildLiteraryMessages(payload) {
  var prompt = (payload && payload.prompt) || {};
  var draft = clip(payload && payload.draft, 30000);
  var mode = payload && payload.feedbackMode;
  var modeInstructions = {
    questions: '只提问题：assessment 留空；suggestions 给出最多三个针对用户文本具体句子、意象或节奏的开放问题；revision 必须为空字符串。不要代写答案或顺带给修改稿。',
    weaknesses: '只指出薄弱处：assessment 简短指出最值得保留的手法；suggestions 给出最多三个具体薄弱处，引用最少必要的原文文字解释原因；revision 必须为空字符串。不要直接重写。',
    alternative: '另一种写法：assessment 说明文本应当保留的个人声音；suggestions 给出最多三条修改说明；revision 基于用户自己的文本修改，保留其主题、视角和核心意象，不宣称优于原文。'
  };
  if (!Object.prototype.hasOwnProperty.call(modeInstructions, mode)) mode = 'alternative';
  var user = [
    '【本次反馈模式】' + modeInstructions[mode],
    '【当日题面（仅供参考，用户未必按此写作，不要评价与题面的相似度）】',
    '类型：' + clip(prompt.kind, 20),
    '题目：' + clip(prompt.title, 80),
    '意象/背景：' + clip(prompt.seed, 500),
    '写作提示：' + clip(prompt.guide, 300),
    '',
    '【用户文本（独立作品，按此赏析）】',
    draft
  ].join('\n');
  return [
    { role: 'system', content: LITERARY_SYSTEM_PROMPT },
    { role: 'user', content: user }
  ];
}


/* 把模型返回解析为 {assessment, suggestions, revision}；解析失败返回 null，由上层决定 */function parseLiteraryResponse(content) {
  if (typeof content !== 'string' || !content.trim()) return null;
  var text = content.trim();
  var fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) text = fenced[1].trim();
  var start = text.indexOf('{');
  var end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  var parsed;
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch (e) {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  var result = {
    assessment: typeof parsed.assessment === 'string' ? parsed.assessment : '',
    suggestions: Array.isArray(parsed.suggestions)
      ? parsed.suggestions.filter(function(s) { return typeof s === 'string'; })
      : (typeof parsed.suggestions === 'string' ? parsed.suggestions : ''),
    revision: typeof parsed.revision === 'string' ? parsed.revision : ''
  };
  if (!result.assessment && !result.revision && !result.suggestions.length) return null;
  return result;
}

module.exports = {
  ADVISOR_SYSTEM_PROMPT: ADVISOR_SYSTEM_PROMPT,
  LITERARY_SYSTEM_PROMPT: LITERARY_SYSTEM_PROMPT,
  buildAdvisorMessages: buildAdvisorMessages,
  buildLiteraryMessages: buildLiteraryMessages,
  parseLiteraryResponse: parseLiteraryResponse
};
