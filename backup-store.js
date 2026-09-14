'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { validateSnapshot, MAX_BYTES } = require('./storage-core');
const FILE = /^(auto|manual|before-restore)-\d{13}-[a-f0-9]{12}\.json$/;

// 只接收已校验快照，不接受 renderer 提供路径；文件保存在独立用户数据目录。
function createBackupStore(directory) {
  const root = path.resolve(directory);
  function read(id) {
    if (typeof id !== 'string' || !FILE.test(id)) throw new Error('无效的备份编号。');
    const target = path.join(root, id);
    const stat = fs.lstatSync(target);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_BYTES) throw new Error('备份文件无效或过大。');
    return validateSnapshot(fs.readFileSync(target, 'utf8'));
  }
  function list() {
    if (!fs.existsSync(root)) return [];
    return fs.readdirSync(root).filter(id => FILE.test(id)).map(id => {
      try {
        const stat = fs.lstatSync(path.join(root, id));
        if (!stat.isFile() || stat.isSymbolicLink()) return null;
        return { id, kind: id.match(/^(auto|manual|before-restore)-/)[1], createdAt: new Date(Number(id.match(/-(\d{13})-/)[1])).toISOString(), bytes: stat.size };
      } catch (_) { return null; }
    }).filter(Boolean).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  function write(payload) {
    if (!payload || !['auto', 'manual', 'before-restore'].includes(payload.kind)) throw new Error('无效备份类型。');
    const snapshot = validateSnapshot(payload.snapshot);
    if (payload.kind === 'auto' && !Object.keys(snapshot.entries).length) return { skipped: true };
    fs.mkdirSync(root, { recursive: true });
    if (fs.lstatSync(root).isSymbolicLink()) throw new Error('备份目录不应为符号链接。');
    const id = payload.kind + '-' + Date.now() + '-' + crypto.randomBytes(6).toString('hex') + '.json';
    const temporary = path.join(root, id + '.tmp');
    let fd;
    try {
      fd = fs.openSync(temporary, 'wx', 0o600);
      fs.writeFileSync(fd, JSON.stringify(snapshot), 'utf8');
      fs.fsyncSync(fd); fs.closeSync(fd); fd = undefined;
      fs.renameSync(temporary, path.join(root, id));
    } catch (error) {
      if (fd !== undefined) fs.closeSync(fd);
      try { fs.unlinkSync(temporary); } catch (_) { /* 保持原备份不动 */ }
      throw error;
    }
    // 每类独立轮转；自动备份不会挤掉手动备份及恢复前备份。
    const keep = payload.kind === 'auto' ? 12 : 6;
    let cleanupWarning = false;
    list().filter(item => item.id.startsWith(payload.kind + '-')).slice(keep).forEach(item => {
      try { fs.unlinkSync(path.join(root, item.id)); } catch (_) { cleanupWarning = true; }
    });
    return { id, createdAt: snapshot.createdAt, cleanupWarning };
  }
  return { read, list, write };
}
module.exports = { createBackupStore };
