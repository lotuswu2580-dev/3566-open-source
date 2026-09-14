/* Painting presentation only: no network, model calls or content storage. */
(function () {
  'use strict';
  var body=document.body,header=document.querySelector('.app-shell > header');
  var source='assets/themes/van-gogh-irises-1889.jpg';
  // One shared control for both museum themes, using the existing backed-up UI preferences.
  var pureToggle=document.createElement('button');pureToggle.type='button';pureToggle.className='museum-pure-toggle';header.appendChild(pureToggle);
  function syncPure(){var pure=body.classList.contains('museum-pure');pureToggle.textContent=pure?'图文':'纯画';pureToggle.setAttribute('aria-pressed',String(pure));pureToggle.setAttribute('aria-label',pure?'恢复上方文字':'隐藏上方文字，仅显示画作');}
  pureToggle.addEventListener('click',function(){window.applyAppearance({museumPure:!body.classList.contains('museum-pure')});});
  document.addEventListener('appearance-after',syncPure);syncPure();
  document.querySelector('.iris-style-option span').textContent='梵高全幅 · 深色展墙、聚焦灯与烫金字。';
  // The browser build embeds this source once; the preview and artwork share it.
  document.getElementById('settings-open').addEventListener('click',function(){document.querySelector('.iris-style-preview').style.backgroundImage='url("'+source+'")';});
  var scene=document.createElement('figure');scene.className='iris-scene';
  scene.innerHTML='<button class="iris-window" type="button" aria-label="查看梵高《鸢尾花》完整原画" title="查看完整原画"><span class="iris-window-viewport"><img class="iris-window-image" alt="梵高《鸢尾花》完整画作，白色鸢尾花与蓝花、绿叶相映" decoding="async"></span></button>';
  header.appendChild(scene);
  var credit=document.createElement('div');credit.className='iris-credit';credit.innerHTML='VINCENT VAN GOGH · IRISES · 1889<small>J. PAUL GETTY MUSEUM · 90.PA.20</small>';header.appendChild(credit);
  // Short verified excerpts, translated here, are decorative wall inscriptions.
  var notes=[
    ['note-color','色彩是一种直接影响灵魂的力量。','瓦西里·康定斯基','《论艺术的精神》· V'],
    ['note-mirror','艺术真正映照的，是观者，而非生活。','奥斯卡·王尔德','《道林·格雷的画像》· 序言'],
    ['note-praise','一切伟大的艺术都是赞颂。','约翰·罗斯金','《费索莱法则》· I']
  ];
  var notesWrap=document.createElement('div');notesWrap.className='iris-wall-notes';header.appendChild(notesWrap);
  notes.forEach(function(n){var note=document.createElement('blockquote');note.className='iris-wall-note '+n[0];note.setAttribute('aria-hidden','true');var text=document.createElement('p');text.textContent=n[1];var cite=document.createElement('cite');cite.textContent='— '+n[2]+' · '+n[3];note.append(text,cite);notesWrap.appendChild(note);});
  // Private user poem is not included until its author grants public distribution permission.
  var dialog=document.createElement('dialog');dialog.className='iris-art-dialog';dialog.setAttribute('aria-labelledby','iris-art-title');
  dialog.innerHTML='<div class="iris-art-dialog-top"><div><h2 id="iris-art-title">鸢尾花 · Irises</h2><p>Vincent van Gogh · 1889 · 布面油画 · J. Paul Getty Museum</p></div><button class="iris-art-dialog-close" type="button" autofocus>关闭</button></div><img alt="梵高《鸢尾花》完整原画"><a href="https://www.getty.edu/art/collection/object/103JNH" target="_blank" rel="noopener noreferrer">Getty 馆藏来源 ↗</a>';
  body.appendChild(dialog);
  var windowButton=scene.querySelector('button'),img=scene.querySelector('img'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
  windowButton.addEventListener('click',function(){dialog.querySelector('img').src=source;dialog.showModal();});
  dialog.querySelector('button').addEventListener('click',function(){dialog.close();});
  dialog.addEventListener('close',function(){if(body.dataset.visualStyle==='irises'&&!body.classList.contains('notebook-focus'))windowButton.focus({preventScroll:true});});
  dialog.addEventListener('click',function(e){if(e.target===dialog){var r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  var reveal=null;
  function stop(){if(reveal){reveal.cancel();reveal=null;}}
  function appear(){
    stop();if(body.dataset.visualStyle!=='irises'){if(dialog.open)dialog.close();return;}
    if(!img.getAttribute('src'))img.src=source;
    if(!reduce.matches)reveal=scene.animate([{opacity:0,transform:'translate(-50%,-48%)'},{opacity:1,transform:'translate(-50%,-50%)'}],{duration:700,easing:'cubic-bezier(.16,.7,.2,1)'});
  }
  document.addEventListener('appearance-after',appear);
  document.addEventListener('visibilitychange',function(){if(document.hidden)stop();});
  reduce.addEventListener('change',stop);appear();
  window.irisesTheme={source:source,dialog:dialog};
})();
