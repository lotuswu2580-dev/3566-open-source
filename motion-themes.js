/* Presentation-only motion; no network, API, timers or content storage changes. */
(function () {
  'use strict';
  var body = document.body, nav = document.querySelector('.page-tabs');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');
  var newStyles = ['paper','quiet','orbit','swiss','gallery','colorfield','veil','atelier','irises','breeze'];
  var springs = new WeakMap(), animations = new WeakMap();
  var presets = { paper:[190,20], quiet:[250,32], orbit:[260,25], swiss:[340,37], gallery:[280,33], colorfield:[280,31], veil:[210,27], atelier:[310,34], irises:[240,30], breeze:[240,23] };
  function spring(node, key, from, target, apply, finish, preset) {
    var map = springs.get(node) || {}; springs.set(node,map);
    var old = map[key], x = old ? old.x : from, v = old ? old.v : 0;
    if (old) cancelAnimationFrame(old.frame);
    if (reduce.matches) { delete map[key]; apply(target); if(finish)finish();return; }
    var p = preset || presets[body.dataset.visualStyle] || [250,28];
    var record = {x:x,v:v,frame:0}, last = performance.now(), started=last; map[key]=record;
    function tick(now) {
      var dt=Math.min((now-last)/1000,.05);last=now;
      while(dt>0){var h=Math.min(dt,1/240);v+=(-p[0]*(x-target)-p[1]*v)*h;x+=v*h;dt-=h;}
      record.x=x;record.v=v;apply(x);
      if((Math.abs(x-target)<.02&&Math.abs(v)<.08)||now-started>1400){apply(target);delete map[key];if(finish)finish();return;}
      record.frame=requestAnimationFrame(tick);
    }record.frame=requestAnimationFrame(tick);
  }
  function stopSpring(node,key){var map=springs.get(node),old=map&&map[key];if(old){cancelAnimationFrame(old.frame);delete map[key];}}
  function tween(node,key,frames,options) {
    var map=animations.get(node)||{};animations.set(node,map);if(map[key])map[key].cancel();
    if(reduce.matches)return null;
    var a=node.animate(frames,Object.assign({duration:380,easing:'cubic-bezier(.2,.75,.2,1)'},options));map[key]=a;return a;
  }
  var mark=document.createElement('div');mark.className='motion-nav-indicator';mark.setAttribute('aria-hidden','true');nav.prepend(mark);
  var brand=document.createElement('div');brand.className='motion-brand';brand.append('3566.');
  var edition=document.createElement('small');edition.textContent='日知录';brand.appendChild(edition);nav.prepend(brand);
  var indicator={x:0,y:0,w:0,h:0};
  function moveIndicator(immediate) {
    var tab=nav.querySelector('.page-tab.active');if(!tab||tab.hidden||body.classList.contains('notebook-focus'))return;
    nav.querySelectorAll('.page-tab').forEach(function(t){t.setAttribute('aria-current',t===tab?'page':'false');});
    mark.hidden=!!tab.closest('.nav-utilities');
    if(mark.hidden){['x','y','w','h'].forEach(function(key){stopSpring(mark,key);});return;}
    var underline=body.dataset.visualStyle==='swiss';
    var target={x:tab.offsetLeft,y:tab.offsetTop+(underline?tab.offsetHeight+5:0),w:tab.offsetWidth,h:underline?2:tab.offsetHeight};
    function draw(){mark.style.transform='translate3d('+indicator.x+'px,'+indicator.y+'px,0)';mark.style.width=Math.max(1,indicator.w)+'px';mark.style.height=Math.max(1,indicator.h)+'px';}
    ['x','y','w','h'].forEach(function(key){if(immediate||reduce.matches){stopSpring(mark,key);indicator[key]=target[key];draw();}else spring(mark,key,indicator[key],target[key],function(x){indicator[key]=x;draw();});});
    nav.querySelectorAll('.page-tab').forEach(function(t){t.setAttribute('aria-current',t===tab?'page':'false');});
  }
  body.classList.add('motion-ready');
  function presentation(){body.classList.toggle('motion-presentation',newStyles.includes(body.dataset.visualStyle));}
  presentation();
  var pageTicket=0,originalPage=showPage;
  showPage=function(name){
    var old=document.querySelector('.page.active');
    var before=old?getComputedStyle(old):null;
    var oldOpacity=before?before.opacity:'1',oldTransform=before?before.transform:'none';
    originalPage(name);
    var next=document.querySelector('.page.active');
    if(!next)return;
    var ticket=++pageTicket;
    document.querySelectorAll('.page').forEach(function(p){p.classList.remove('motion-leaving');p.setAttribute('aria-hidden',String(p!==next));});
    moveIndicator(false);
    if(!old||old===next||reduce.matches)return;
    var order=['today','review','archive','reward'];
    var direction=order.indexOf(next.id.slice(5))>order.indexOf(old.id.slice(5))?1:-1;
    var nextStyle=getComputedStyle(next),map=animations.get(next),ongoing=map&&map.page&&map.page.playState==='running';
    var nextOpacity=ongoing?nextStyle.opacity:'0',nextTransform=ongoing?nextStyle.transform:'translate3d('+(direction*24)+'px,0,0)';
    old.classList.add('motion-leaving');old.inert=true;
    var leave=tween(old,'page',[{opacity:oldOpacity,transform:oldTransform},{opacity:0,transform:'translate3d('+(-direction*20)+'px,0,0)'}],{duration:200,fill:'forwards'});
    tween(next,'page',[{opacity:nextOpacity,transform:nextTransform},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:body.dataset.visualStyle==='swiss'?310:420});
    if(leave)leave.finished.then(function(){if(ticket===pageTicket)old.classList.remove('motion-leaving');leave.cancel();}).catch(function(){});
    if(next.id==='page-today')wake();
    document.dispatchEvent(new CustomEvent('presentation-page',{detail:{page:next.id,direction:direction}}));
  };
  var flip=[];
  document.addEventListener('appearance-before',function(){
    flip=Array.from(document.querySelectorAll('.app-shell > header,.page-tabs,.page.active .card')).filter(function(n){return n.offsetWidth&&n.offsetHeight&&!n.parentElement.closest('.card');}).map(function(n){return {node:n,rect:n.getBoundingClientRect()};});
  });
  document.addEventListener('appearance-after',function(){
    presentation();
    flip.forEach(function(item){var n=item.node;var map=animations.get(n);if(map&&map.layout)map.layout.cancel();var r=n.getBoundingClientRect(),old=item.rect;
      if(!reduce.matches&&r.width&&r.height){var zoom=Number(getComputedStyle(body).zoom)||1;tween(n,'layout',[{transform:'translate('+(old.x-r.x)/zoom+'px,'+(old.y-r.y)/zoom+'px) scale('+old.width/r.width+','+old.height/r.height+')',transformOrigin:'0 0'},{transform:'none',transformOrigin:'0 0'}],{duration:460});}
    });flip=[];moveIndicator(true);cacheColors();wake(1.1);
  });

  var pomo=document.getElementById('pomo');
  var canvas=document.createElement('canvas');canvas.className='motion-organism';canvas.width=500;canvas.height=200;canvas.setAttribute('aria-hidden','true');pomo.querySelector('.mode').after(canvas);
  var ctx=canvas.getContext('2d'),blob={x:1,v:0,target:1,energy:0,time:0},raf=0,last=0,palette={};
  function cacheColors(){var s=getComputedStyle(body);palette={accent:s.getPropertyValue('--accent').trim(),pop:s.getPropertyValue('--mt-pop').trim()||s.getPropertyValue('--accent-soft').trim(),on:s.getPropertyValue('--mt-on').trim()||'#ffffff',line:s.getPropertyValue('--line').trim()};}
  function draw(dt){
    if(!ctx)return;
    blob.time+=dt;var acc=(blob.target-blob.x)*190-blob.v*22;blob.v+=acc*dt;blob.x+=blob.v*dt;blob.energy*=Math.exp(-dt*3.8);
    ctx.clearRect(0,0,500,200);ctx.save();ctx.translate(250,100);ctx.scale(blob.x,blob.x);ctx.fillStyle=palette.accent;
    var style=body.dataset.visualStyle;
    if(style==='colorfield'){
      ctx.rotate(blob.energy*.07);ctx.fillStyle=palette.pop;ctx.fillRect(-77,-52,83,106);ctx.fillStyle=palette.accent;ctx.beginPath();ctx.arc(18,0,53,0,Math.PI*2);ctx.fill();ctx.fillStyle=palette.on;ctx.fillRect(-3,-36,5,72);
    }else if(style==='veil'){
      ctx.rotate(-.12+blob.energy*.05);ctx.fillStyle=palette.pop;ctx.beginPath();ctx.ellipse(-27,-3,38,62,-.4,0,Math.PI*2);ctx.fill();ctx.fillStyle=palette.accent;ctx.beginPath();ctx.ellipse(24,0,39,59,.35,0,Math.PI*2);ctx.fill();ctx.strokeStyle=palette.on;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-5,35);ctx.bezierCurveTo(8,15,11,-15,38,-35);ctx.stroke();
    }else if(style==='atelier'){
      ctx.rotate(blob.energy*.08);ctx.fillRect(-70,-48,68,96);ctx.fillStyle=palette.pop;ctx.beginPath();ctx.arc(35,-12,40,Math.PI,0);ctx.lineTo(75,36);ctx.lineTo(-5,36);ctx.closePath();ctx.fill();ctx.fillStyle=palette.on;ctx.beginPath();ctx.arc(-36,0,12,0,Math.PI*2);ctx.fill();
    }else if(style==='paper'){
      ctx.beginPath();for(var i=0;i<=80;i++){var a=i/80*Math.PI*2,r=62+Math.sin(a*5+blob.time*8)*blob.energy*6,x=Math.cos(a)*r*1.13,y=Math.sin(a)*r*.85;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();
      ctx.fillStyle=palette.on;[-17,17].forEach(function(x){ctx.beginPath();ctx.ellipse(x,-7,4,timer?2:5,0,0,Math.PI*2);ctx.fill();});ctx.strokeStyle=palette.on;ctx.lineWidth=2.5;ctx.lineCap='round';ctx.beginPath();ctx.arc(0,7,15,.2,Math.PI-.2);ctx.stroke();
      ctx.fillStyle=palette.pop;ctx.beginPath();ctx.ellipse(62,-46,12,21,.6+blob.energy*.12,0,Math.PI*2);ctx.fill();
    }else if(style==='quiet'||style==='gallery'){
      ctx.rotate(-.18+Math.sin(blob.time*4)*blob.energy*.06);ctx.fillStyle=palette.pop;ctx.beginPath();ctx.ellipse(-17,0,40,65,-.45,0,Math.PI*2);ctx.fill();ctx.fillStyle=palette.accent;ctx.beginPath();ctx.ellipse(18,0,33,60,.45,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=palette.on;ctx.globalAlpha=.4;ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(1,31);ctx.bezierCurveTo(0,0,21,-23,38,-45);ctx.stroke();ctx.globalAlpha=1;
    }else if(style==='swiss'){
      ctx.rotate(blob.energy*.12);ctx.fillRect(-55,-37,75,75);ctx.strokeStyle=palette.accent;ctx.lineWidth=2;ctx.strokeRect(-10,-62,75,75);ctx.fillStyle=palette.pop;ctx.fillRect(-9,-36,28,47);
    }else{
      ctx.strokeStyle=palette.line;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,0,92,44,-.32,0,Math.PI*2);ctx.stroke();ctx.fillStyle=palette.pop;ctx.beginPath();ctx.arc(0,0,53,0,Math.PI*2);ctx.fill();ctx.fillStyle=palette.accent;ctx.beginPath();ctx.arc(0,0,35+blob.energy*2,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(78+blob.energy*5,-34,7,0,Math.PI*2);ctx.fill();ctx.fillStyle=palette.on;ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.fill();
    }ctx.restore();
  }
  function wake(energy){if(energy)blob.energy=energy;blob.target=timer?.92:1;if(!ctx||raf||!body.classList.contains('motion-presentation'))return;
    if(reduce.matches){blob.x=blob.target;blob.v=0;blob.energy=0;draw(0);return;}
    last=performance.now();function frame(now){var dt=Math.min((now-last)/1000,.034);last=now;draw(dt);
      if(document.hidden||!document.getElementById('page-today').classList.contains('active')||reduce.matches){raf=0;return;}
      if(blob.energy>.005||Math.abs(blob.target-blob.x)>.002||Math.abs(blob.v)>.02)raf=requestAnimationFrame(frame);else raf=0;
    }raf=requestAnimationFrame(frame);
  }
  document.addEventListener('change',function(e){if(e.target.matches('#todos input[type=checkbox]')){var box=e.target.parentNode.querySelector('.box');if(box)tween(box,'press',[{transform:'scale(1)'},{transform:'scale(.85)'},{transform:'scale(1.08)'},{transform:'scale(1)'}],{duration:340});wake(e.target.checked?1.3:.5);}});
  pomo.addEventListener('click',function(e){var b=e.target.closest('button');if(b){tween(b,'press',[{transform:'scale(1)'},{transform:'scale(.965)'},{transform:'scale(1)'}],{duration:260});wake(1.1);}});
  pomo.addEventListener('pointerenter',function(){wake(.35);});
  var pending=0,observedWidth=-1;
  var resize=new ResizeObserver(function(entries){var width=entries[0].contentRect.width;if(Math.abs(width-observedWidth)<.5)return;observedWidth=width;cancelAnimationFrame(pending);pending=requestAnimationFrame(function(){moveIndicator(true);});});resize.observe(nav);
  var visibility=new MutationObserver(function(){cancelAnimationFrame(pending);pending=requestAnimationFrame(function(){moveIndicator(true);});});visibility.observe(nav,{subtree:true,attributes:true,attributeFilter:['hidden']});
  document.querySelector('.notebook-focus-toggle').addEventListener('click',function(){requestAnimationFrame(function(){moveIndicator(true);});});
  reduce.addEventListener('change',function(){moveIndicator(true);if(reduce.matches){document.querySelectorAll('.page').forEach(function(p){var map=animations.get(p);if(map&&map.page)map.page.cancel();p.classList.remove('motion-leaving');});}wake();});
  cacheColors();draw(0);moveIndicator(true);
  document.querySelectorAll('.page').forEach(function(p){p.setAttribute('aria-hidden',String(!p.classList.contains('active')));});
  window.motionThemes={styles:newStyles.slice(),moveIndicator:moveIndicator,presentation:presentation};
})();
