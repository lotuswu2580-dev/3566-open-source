'use strict';
const fs = require('fs'), path = require('path');
const { pathToFileURL } = require('url');
const MAX_BYTES = 16 * 1024 * 1024;
function register({ app, dialog, nativeImage, registerIPC, getWindow }) {
  const file = () => path.join(app.getPath('userData'), 'custom-splash.png');
  const previous = () => path.join(app.getPath('userData'), 'custom-splash.previous.png');
  function info() { return { configured: fs.existsSync(file()), directory: app.getPath('userData'), maxMB: 16 }; }
  registerIPC('app:getSplash', () => ({ ok: true, result: info().configured ? pathToFileURL(file()).href : null }));
  registerIPC('app:getSplashInfo', () => ({ ok: true, result: info() }));
  registerIPC('app:chooseSplash', async () => {
    try {
      const picked = await dialog.showOpenDialog(getWindow(), { title: '选择自己的开屏图片', properties: ['openFile'], filters: [{ name: '图片', extensions: ['png', 'jpg', 'jpeg', 'webp'] }] });
      if (picked.canceled || !picked.filePaths.length) return { ok: true, result: { canceled: true } };
      const source = picked.filePaths[0], stat = fs.statSync(source);
      if (!stat.isFile() || stat.size > MAX_BYTES || !/\.(png|jpe?g|webp)$/i.test(source)) throw Error('请选择不超过 16 MB 的 PNG、JPG 或 WebP 图片。');
      const image = nativeImage.createFromPath(source), size = image.getSize();
      if (image.isEmpty() || size.width * size.height > 24000000) throw Error('图片无法读取或像素过大（最多 2400 万像素）。');
      const png = image.toPNG();
      if (png.length > MAX_BYTES) throw Error('转换后的图片超过 16 MB，请缩小图片后重试。');
      fs.mkdirSync(app.getPath('userData'), { recursive: true });
      if (fs.existsSync(file())) fs.copyFileSync(file(), previous());
      const temp = file() + '.tmp';
      fs.writeFileSync(temp, png);
      fs.renameSync(temp, file());
      return { ok: true, result: info() };
    } catch (error) { return { ok: false, error: { code: 'SPLASH_FAILED', message: error.message } }; }
  });
  registerIPC('app:resetSplash', () => {
    try {
      // Recoverable reset: keep the last image; never modify the selected original.
      if (fs.existsSync(file())) { fs.copyFileSync(file(), previous()); fs.unlinkSync(file()); }
      return { ok: true, result: info() };
    } catch (error) { return { ok: false, error: { code: 'SPLASH_FAILED', message: error.message } }; }
  });
}
module.exports = { register, MAX_BYTES };
