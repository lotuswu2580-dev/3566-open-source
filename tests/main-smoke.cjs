// Run the unmodified production entry with a hidden window and isolated appData.
// Only the file chooser is mocked; preload and IPC authorization are real.
const electron=require('electron'),{app,BrowserWindow,session}=electron;
const fs=require('fs'),path=require('path'),os=require('os'),vm=require('vm'),Module=require('module'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'3566-public-main-'));
app.setPath('appData',temp);app.disableHardwareAcceleration();
let mainWindow,checks=0;
class HiddenWindow extends BrowserWindow { constructor(options){super({...options,show:false,webPreferences:{...options.webPreferences,offscreen:true,backgroundThrottling:false}});mainWindow=this;} }
const localRequire=Module.createRequire(path.join(root,'main.js'));
function testRequire(id){if(id==='electron')return {...electron,BrowserWindow:HiddenWindow,dialog:{...electron.dialog,showOpenDialog:async()=>({canceled:false,filePaths:[path.join(root,'assets/themes/henry-moore-a-breezy-day-1887.jpg')]})}};return localRequire(id);}
app.whenReady().then(async()=>{
 session.defaultSession.webRequest.onBeforeRequest((d,cb)=>cb({cancel:/^https?:/.test(d.url)}));
 session.defaultSession.setPermissionRequestHandler((a,b,cb)=>cb(false));
 const wrapped=vm.runInThisContext(Module.wrap(fs.readFileSync(path.join(root,'main.js'),'utf8')),{filename:path.join(root,'main.js')});
 wrapped({},testRequire,{exports:{}},path.join(root,'main.js'),root);
 const pause=ms=>new Promise(r=>setTimeout(r,ms||100));
 try {
  for(let i=0;i<60&&!mainWindow;i++)await pause();assert(mainWindow,'hidden production window created');
  if(mainWindow.webContents.isLoading())await new Promise(r=>mainWindow.webContents.once('did-finish-load',r));await pause(450);
  const run=code=>mainWindow.webContents.executeJavaScript(code,true),check=async(label,code)=>{assert.equal(await run(code),true,label);checks++;console.log('PASS',label);};
  assert.equal(app.getPath('userData'),path.join(temp,'3566-open-source'));checks++;
  await check('生产 preload 不暴露游戏接口',"!!window.advisor&&!!window.notebookBackups&&!!window.app&&!window.riot&&!window.lcu&&!window.meta");
  await check('生产状态读取不含真实密钥',"window.advisor.getStatus().then(s=>!s.configured&&!s.gemini.configured&&!('key' in s))");
  await check('无效密钥被主进程拒绝',"window.advisor.setApiKey('').then(s=>!s.ok&&s.error.code==='BAD_REQUEST')");
  await check('未知任务不会调用外部模型',"window.advisor.ask({task:'unknown',requestId:'test'}).then(()=>false,e=>!!e.message)");
  await check('原生图片选择复制到独立目录',"window.app.chooseSplash().then(r=>r.configured===true)");
  assert(fs.existsSync(path.join(app.getPath('userData'),'custom-splash.png')));checks++;
  await check('生产开屏图状态和本地路径',"window.app.getSplashInfo().then(s=>s.configured&&s.directory.includes('3566-open-source'))");
  await check('重置开屏图留下恢复副本',"window.app.resetSplash().then(r=>!r.configured)");
  assert(fs.existsSync(path.join(app.getPath('userData'),'custom-splash.previous.png')));checks++;
  await check('主进程独立备份写入可读取',"window.notebookBackups.write({kind:'manual',snapshot:NotebookStorage.snapshot(true,true)}).then(()=>window.notebookBackups.list()).then(list=>list.length>0)");
  const probe=new BrowserWindow({show:false,webPreferences:{preload:path.join(root,'preload.js'),contextIsolation:true,nodeIntegration:false,offscreen:true}});
  await probe.loadURL('data:text/html,<title>Untrusted probe</title>');
  assert.equal(await probe.webContents.executeJavaScript("window.advisor.getStatus().then(r=>!r.ok&&r.error.code==='UNTRUSTED_SENDER')"),true);checks++;probe.destroy();
  console.log(JSON.stringify({passed:checks,data:app.getPath('userData'),network:'blocked'}));mainWindow.destroy();app.exit(0);
 }catch(e){console.error(e.stack);if(mainWindow&&!mainWindow.isDestroyed())mainWindow.destroy();app.exit(1);}
});
