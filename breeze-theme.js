/* Museum presentation only: original artwork, original AI-authored poem, no network/model calls. */
(function () {
  'use strict';
  var body=document.body,header=document.querySelector('.app-shell > header'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
  var source='assets/themes/henry-moore-a-breezy-day-1887.jpg';
  document.querySelector('.breeze-style-option span').textContent='亨利·摩尔全幅 · 深色展墙、聚焦灯与烫金诗。';
  document.querySelector('.breeze-style-option strong').textContent='微风徐徐 · 海上展室';
  var scene=document.createElement('figure');scene.className='breeze-scene';
  scene.innerHTML='<button class="breeze-art-open" type="button" aria-label="查看亨利·摩尔《微风徐徐》完整原画" title="查看完整原画"><span class="breeze-art-open-viewport"><img class="breeze-painting" alt="亨利·摩尔《微风徐徐》完整画作，云海与波浪中的帆船" decoding="async"></span></button>';
  header.appendChild(scene);
  var credit=document.createElement('div');credit.className='breeze-credit';credit.innerHTML='HENRY MOORE · A BREEZY DAY · 1887<small>LADY LEVER ART GALLERY · LL 3626</small>';header.appendChild(credit);
  // Reuse the already-verified short art-theory excerpts; these do not claim to review this painting.
  var notes=[['note-color','色彩是一种直接影响灵魂的力量。','瓦西里·康定斯基','《论艺术的精神》· V'],['note-mirror','艺术真正映照的，是观者，而非生活。','奥斯卡·王尔德','《道林·格雷的画像》· 序言'],['note-praise','一切伟大的艺术都是赞颂。','约翰·罗斯金','《费索莱法则》· I']];
  var notesWrap=document.createElement('div');notesWrap.className='breeze-wall-notes';header.appendChild(notesWrap);
  notes.forEach(function(n){var note=document.createElement('blockquote');note.className='breeze-wall-note '+n[0];note.setAttribute('aria-hidden','true');var text=document.createElement('p');text.textContent=n[1];var cite=document.createElement('cite');cite.textContent='— '+n[2]+' · '+n[3];note.append(text,cite);notesWrap.appendChild(note);});
  // Original poem written for this interface, not a quotation from Henry Moore or an art historian.
  var poemText='云压得很低。\n\n帆却没有收起。\n\n风不在画里，\n只留下它经过的形状。\n\n船向远处去。\n\n海把来路一遍遍抹平。\n\n我们站在岸上，\n以为自己没有移动。';
  var poem=document.createElement('div');poem.className='breeze-poem';poem.setAttribute('role','region');poem.setAttribute('aria-label','微风徐徐展墙诗，AI原创');
  poemText.split('\n\n').forEach(function(line,i){if(i)poem.appendChild(document.createTextNode('\n\n'));var stanza=document.createElement('span');stanza.className='breeze-poem-line';stanza.textContent=line;poem.appendChild(stanza);});header.appendChild(poem);
  var dialog=document.createElement('dialog');dialog.className='breeze-gallery';dialog.setAttribute('aria-labelledby','breeze-gallery-title');
  dialog.innerHTML='<div class="breeze-gallery-top"><div><h2 id="breeze-gallery-title">微风徐徐 · A Breezy Day</h2><p>Henry Moore（1831–1895）· 1887 · 布面油画 · Lady Lever Art Gallery</p></div><button class="breeze-gallery-close" type="button" autofocus>关闭</button></div><img alt="亨利·摩尔《A Breezy Day》完整原画复制图"><a href="https://artuk.org/discover/artworks/a-breezy-day-102598" target="_blank" rel="noopener noreferrer">Art UK / 馆藏来源 ↗</a>';body.appendChild(dialog);
  var opener=scene.querySelector('button'),image=scene.querySelector('img'),reveal=null;
  opener.addEventListener('click',function(){dialog.querySelector('img').src=source;dialog.showModal();});
  dialog.querySelector('button').addEventListener('click',function(){dialog.close();});
  dialog.addEventListener('close',function(){if(active()&&!body.classList.contains('notebook-focus'))opener.focus({preventScroll:true});});
  dialog.addEventListener('click',function(e){if(e.target===dialog){var r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  document.getElementById('settings-open').addEventListener('click',function(){document.querySelector('.breeze-style-preview').style.backgroundImage='url("'+source+'")';});
  function active(){return body.dataset.visualStyle==='breeze';}
  function stop(){if(reveal){reveal.cancel();reveal=null;}}
  function appear(){stop();if(!active()){if(dialog.open)dialog.close();return;}if(!image.getAttribute('src'))image.src=source;if(!reduce.matches)reveal=scene.animate([{opacity:0,transform:'translate(-50%,-48%)'},{opacity:1,transform:'translate(-50%,-50%)'}],{duration:700,easing:'cubic-bezier(.16,.7,.2,1)'});}
  document.addEventListener('appearance-after',appear);document.addEventListener('visibilitychange',function(){if(document.hidden)stop();});reduce.addEventListener('change',stop);appear();
  window.breezeTheme={source:source,dialog:dialog};
})();
