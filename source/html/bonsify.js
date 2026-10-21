/* ============================================================
   BONSIFY — shared behavior for all pages
   ============================================================ */
(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hdr = document.getElementById('hdr');
  function hdrState(){ if(hdr) hdr.classList.toggle('scrolled', window.scrollY>40); }
  hdrState();
  window.addEventListener('scroll', hdrState, {passive:true});

  /* reveals */
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    },{threshold:0.14, rootMargin:'0px 0px -8% 0px'});
    document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); });
  }

  /* count-ups: any element with data-count="79" data-suffix="%" */
  function runCount(el){
    var to = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var start=null, dur=1300;
    function step(t){ if(!start)start=t; var p=Math.min((t-start)/dur,1);
      el.textContent = Math.round((1-Math.pow(1-p,3))*to) + suffix;
      if(p<1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if(counters.length){
    if('IntersectionObserver' in window){
      var cio = new IntersectionObserver(function(es){
        es.forEach(function(e){ if(e.isIntersecting){ runCount(e.target); cio.unobserve(e.target); } });
      },{threshold:0.4});
      counters.forEach(function(el){ cio.observe(el); });
    } else { counters.forEach(runCount); }
  }

  /* progress bar */
  var progress = document.getElementById('progress');
  if(progress){
    window.addEventListener('scroll', function(){
      var sp = window.scrollY/(document.documentElement.scrollHeight - window.innerHeight);
      progress.style.transform = 'scaleX('+(sp||0)+')';
    }, {passive:true});
  }

  if(reduce) return;

  /* ---- HOME PAGE scrub (only runs if these elements exist) ---- */
  var heroWrap = document.getElementById('heroWrap');
  var howWrap  = document.getElementById('howWrap');
  var hasHomeScrub = heroWrap || howWrap || document.getElementById('phone');
  if(!hasHomeScrub) return;

  var planeBottom=document.getElementById('planeBottom');
  var crease=document.getElementById('crease');
  var creaseGlow=document.getElementById('creaseGlow');
  var heroContent=document.getElementById('heroContent');
  var scrollCue=document.getElementById('scrollCue');
  var howTrack=document.getElementById('howTrack');
  var phone=document.getElementById('phone');
  var dockify=document.querySelector('.dockify');

  var desktop = window.matchMedia('(min-width:821px)').matches;
  window.addEventListener('resize', function(){ desktop = window.matchMedia('(min-width:821px)').matches; });

  function segProg(el){
    var r=el.getBoundingClientRect();
    var total=el.offsetHeight-window.innerHeight;
    if(total<=0) return 0;
    return Math.max(0,Math.min(1,(-r.top)/total));
  }
  function elProg(el,startVh,endVh){
    var r=el.getBoundingClientRect(), vh=window.innerHeight;
    var s=startVh*vh, e=endVh*vh;
    return Math.max(0,Math.min(1,(s-r.top)/(s-e)));
  }

  var target={hero:0,how:0,phone:0}, cur={hero:0,how:0,phone:0};
  function readTargets(){
    if(heroWrap) target.hero=segProg(heroWrap);
    if(howWrap)  target.how = desktop?segProg(howWrap):0;
    if(dockify)  target.phone=elProg(dockify,0.85,0.3);
  }
  function applyHero(p){
    if(!planeBottom) return;
    var b=60-p*18, t=30-p*20;
    planeBottom.style.clipPath='polygon(0 '+b+'%,100% '+t+'%,100% 100%,0 100%)';
    if(crease) crease.style.opacity=(0.35+p*0.6).toFixed(3);
    if(creaseGlow){ creaseGlow.style.opacity=(0.5+p*0.5).toFixed(3); creaseGlow.style.height=(60+p*70)+'px'; }
    if(heroContent){ heroContent.style.transform='translateY('+(-p*70)+'px)'; heroContent.style.opacity=(1-p*1.15).toFixed(3); }
    if(scrollCue) scrollCue.style.opacity=(0.7-p*1.2).toFixed(3);
  }
  function applyHow(p){
    if(!howTrack) return;
    if(!desktop){ howTrack.style.transform=''; return; }
    var dist=howTrack.scrollWidth-window.innerWidth; if(dist<0)dist=0;
    howTrack.style.transform='translateX('+(-p*dist)+'px)';
  }
  function applyPhone(p){
    if(!phone) return;
    var ry=22-p*26, rx=8-p*8, y=60-p*60;
    phone.style.transform='perspective(1400px) rotateY('+ry+'deg) rotateX('+rx+'deg) translateY('+y+'px)';
    var reward=document.getElementById('reward');
    if(reward){ var rp=Math.max(0,Math.min(1,(p-0.55)/0.35)); reward.style.opacity=rp.toFixed(3); reward.style.transform='translateY('+((1-rp)*40)+'px)'; }
  }
  function loop(){
    cur.hero+=(target.hero-cur.hero)*0.12;
    cur.how+=(target.how-cur.how)*0.12;
    cur.phone+=(target.phone-cur.phone)*0.12;
    applyHero(cur.hero); applyHow(cur.how); applyPhone(cur.phone);
    requestAnimationFrame(loop);
  }
  readTargets();
  window.addEventListener('scroll', readTargets, {passive:true});
  window.addEventListener('resize', readTargets);
  requestAnimationFrame(loop);

  /* hero intro */
  var hero=document.getElementById('top');
  if(hero) requestAnimationFrame(function(){ requestAnimationFrame(function(){ hero.classList.add('intro'); }); });
})();
