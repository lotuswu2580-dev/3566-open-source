const {app,BrowserWindow,session}=require('electron'),path=require('path'),fs=require('fs'),os=require('os'),assert=require('node:assert/strict');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'3566-public-ui-'));app.setPath('userData',temp);app.disableHardwareAcceleration();
const root=path.resolve(__dirname,'..'),shots=path.join(__dirname,'artifacts');fs.mkdirSync(shots,{recursive:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms||300));let checks=0,errors=[];
app.whenReady().then(async()=>{
 session.defaultSession.webRequest.onBeforeRequest((d,cb)=>cb({cancel:/^https?:/.test(d.url)}));session.defaultSession.setPermissionRequestHandler((a,b,cb)=>cb(false));
 const win=new BrowserWindow({width:1080,height:760,show:false,webPreferences:{preload:path.join(__dirname,'ui-preload.cjs'),contextIsolation:true,nodeIntegration:false,offscreen:true,backgroundThrottling:false}});
 const run=code=>win.webContents.executeJavaScript(code,true);
 win.webContents.on('console-message',e=>{if(e.level==='error'&&!/ERR_BLOCKED_BY_CLIENT|Failed to load resource/.test(e.message))errors.push(e.message);});
 const check=async(label,code)=>{assert.equal(await run(code),true,label);checks++;console.log('PASS',label);};
 const shot=async(name)=>{await pause(350);fs.writeFileSync(path.join(shots,name+'.png'),(await win.webContents.capturePage()).toPNG());};
 try {
  await win.loadFile(path.join(root,'index.html'));await pause(550);
  await check('四页和升级脚本初始化',"document.querySelectorAll('.page').length===4&&!!window.notebookUpgrade&&!!window.literatureUpgrade&&!!window.publicGuide");
  await check('首次引导自动打开',"publicGuide.onboarding.open");await shot('onboarding');
  await run("publicGuide.onboarding.querySelector('.guide-actions button').click()");
  await check('跳过记忆写入备份偏好',"load('ui-prefs',{}).onboardingVersion===1");
  await run("document.querySelector('[data-style=irises]').click()");await pause(550);await shot('irises-today');
  await check('无游戏桥接和页面',"typeof window.riot==='undefined'&&typeof window.lcu==='undefined'&&!document.getElementById('page-lol')");
  await check('每组设置有就地说明',"document.querySelectorAll('.setting-help').length===12");
  await check('文学精选24则飞鸟集',"LITERATURE.length===24&&LITERATURE.every(x=>x.authorId==='tagore')");
  await run("document.getElementById('settings-open').click();document.getElementById('splash-choose').click()");await pause(200);
  await check('更换开屏按钮生效',"load('ui-prefs',{}).splash===true&&document.getElementById('splash-choose').parentNode.nextSibling.textContent.includes('已选择')");
  await run("document.getElementById('splash-reset').click()");await pause(150);
  await check('重置开屏可恢复提示',"document.getElementById('splash-reset').parentNode.nextSibling.textContent.includes('previous')");
  await run("document.querySelector('#guide-entry button:last-child').click();document.querySelector('#settings-guide input').value='API';document.querySelector('#settings-guide input').dispatchEvent(new Event('input'))");
  await check('设置手册可搜索API',"Array.from(document.querySelectorAll('#settings-guide .guide-card')).filter(x=>!x.hidden).some(x=>x.textContent.includes('Kimi Code'))");await shot('settings-manual');
  await check('手册搜索文字与背景有可见对比',"getComputedStyle(document.querySelector('#settings-guide input')).color!==getComputedStyle(document.querySelector('#settings-guide input')).backgroundColor");
  await run("publicGuide.manual.close();document.getElementById('settings-close').click();showPage('reward');switchRewardMode('writing');document.getElementById('literary-draft').value='风走过雨后的站台。';document.getElementById('literary-draft').dispatchEvent(new Event('input',{bubbles:true}));save('w-'+ymd,state)");
  await check('未完成任务也可仿写且保存',"document.getElementById('literary-write').classList.contains('active')&&load('w-'+ymd,{}).literaryDraft.includes('风')");
  await run("showPage('archive')");await pause(450);
  await check('文学进入归档且无评论',"collectArchiveEntries().some(e=>e.kind==='文学仿写')&&Array.from(document.querySelectorAll('[data-archive-id^=\"writing:\"]')).every(c=>!c.querySelector('.notebook-followup-label'))");
  for(const style of ['kimi','codex','paper','quiet','orbit','swiss','gallery','colorfield','veil','atelier','irises','breeze'])for(const mode of ['light','dark']) {
   await run(`applyAppearance({style:'${style}',mode:'${mode}',scale:'standard'});showPage('review')`);await pause(500);
   await check(style+' '+mode+' 复盘无横向溢出',"document.getElementById('page-review').scrollWidth<=document.getElementById('page-review').clientWidth+2&&document.querySelectorAll('.page.active').length===1");
  }
  await run("applyAppearance({style:'breeze',mode:'dark',scale:'xlarge'});showPage('review')");await pause(550);
  await check('特大字体复盘可用',"document.getElementById('page-review').scrollWidth<=document.getElementById('page-review').clientWidth+2");await shot('breeze-review');
  await run("applyAppearance({scale:'standard'});publicGuide.open();publicGuide.onboarding.close()");
  await win.reload();await pause(600);await check('重新启动不重复新人导览',"!publicGuide.onboarding.open&&load('ui-prefs',{}).onboardingVersion===1");
  await run("showPage('lol')");await pause(500);await check('未知旧页面回到今日',"document.getElementById('page-today').classList.contains('active')");
  await check('数据可通过公开版备份校验',"!!NotebookStorage.snapshot(true,true).entries['ui-prefs']&&!NotebookStorage.status().error");
  assert.deepEqual(errors,[],'无未捕获渲染错误');console.log(JSON.stringify({passed:checks,screenshots:shots,data:temp}));win.destroy();app.exit(0);
 }catch(e){console.error(e.stack,errors);await shot('failure');win.destroy();app.exit(1);}
});
