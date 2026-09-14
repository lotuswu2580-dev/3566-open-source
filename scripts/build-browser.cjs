// 机械内联资源，让桌面备用入口不依赖旁边散落的 JS/CSS。
const fs = require('fs'); const path = require('path');
const root = path.resolve(__dirname, '..');
// Embed local theme paintings so the single-file browser entry remains truly offline.
function inlineThemeImages(css) {
  return css.replace(/url\(["']?(assets\/themes\/[\w.-]+\.(?:jpg|png|webp))["']?\)/g, (_, file) => {
    const data = fs.readFileSync(path.join(root, file));
    if (data.length > 8 * 1024 * 1024) throw new Error('Theme image exceeds 8MB: ' + file);
    const mime = file.endsWith('.jpg') ? 'image/jpeg' : file.endsWith('.png') ? 'image/png' : 'image/webp';
    return 'url("data:' + mime + ';base64,' + data.toString('base64') + '")';
  });
}
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<link([^>]*?)rel="stylesheet"([^>]*?)>/g, (tag, before, after) => {
  const attrs = before + after; const file = attrs.match(/href="([\w.-]+\.css)"/); if (!file) throw new Error('Unsupported stylesheet');
  const id = attrs.match(/id="([\w-]+)"/);
  return '<style' + (id ? ' id="' + id[1] + '"' : '') + '>\n' + inlineThemeImages(fs.readFileSync(path.join(root, file[1]), 'utf8')) + '\n</style>';
});
html = html.replace(/<script src="([\w.-]+\.js)"><\/script>/g, (_, file) => {
  let script = fs.readFileSync(path.join(root, file), 'utf8');
  if (file === 'irises-theme.js') {
    const painting = fs.readFileSync(path.join(root, 'assets/themes/van-gogh-irises-1889.jpg'));
    if (painting.length > 8 * 1024 * 1024) throw new Error('Irises theme image exceeds 8MB');
    script = script.replace("'assets/themes/van-gogh-irises-1889.jpg'", "'data:image/jpeg;base64," + painting.toString('base64') + "'");
  }
  if (file === 'breeze-theme.js') {
    const painting = fs.readFileSync(path.join(root, 'assets/themes/henry-moore-a-breezy-day-1887.jpg'));
    if (painting.length > 8 * 1024 * 1024) throw new Error('Breeze theme image exceeds 8MB');
    script = script.replace("'assets/themes/henry-moore-a-breezy-day-1887.jpg'", "'data:image/jpeg;base64," + painting.toString('base64') + "'");
  }
  return '<script>\n' + script.replace(/<\/script/gi, '<\\/script') + '\n</script>';
});
const out = path.join(root, 'browser-build'); fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, '3566.html'), html, 'utf8'); console.log(path.join(out, '3566.html'));
