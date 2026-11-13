/* Windows Gurbani display presentation: runs only inside desktop launcher pages.
   Prevent-idle is also enforced by windows/Window.ps1 while Edge child is alive. */
(()=>{
  'use strict';
  if(new URLSearchParams(location.search).get('desktop')!=='windows')return;
  let wakeLock=null;
  const key='gb-win-display-dim-'+location.pathname.split('/').pop();
  const style=document.createElement('style');
  style.textContent=`
  #gbScreenDim{position:fixed;inset:0;z-index:2147483000;background:#000;pointer-events:none;display:none}
  #gbDisplayButton{position:fixed;left:8px;top:8px;z-index:2147483002;border:1px solid #87724e;background:#192437e8;color:#f7dea2;border-radius:7px;padding:5px 9px;font-size:13px;min-height:28px;cursor:pointer}
  #gbDisplayPanel{position:fixed;left:8px;top:41px;z-index:2147483002;width:min(245px,calc(100vw - 16px));background:#122036f6;border:1px solid #80724f;border-radius:9px;color:#eee;padding:9px;font:12px system-ui;box-shadow:0 8px 25px #000b}
  #gbDisplayPanel[hidden]{display:none!important}
  #gbDisplayPanel label{display:block;color:#e9d499;margin:7px 0}
  #gbDisplayPanel button{font-size:11px;color:white;background:#2e4058;border:1px solid #72839d;border-radius:6px;padding:5px 8px;margin:3px}
  #gbDisplayPanel input[type=range]{width:100%}
  `;
  document.head.append(style);
  const dim=document.createElement('div');dim.id='gbScreenDim';dim.setAttribute('aria-hidden','true');
  const toggle=document.createElement('button');toggle.id='gbDisplayButton';toggle.textContent='☀ Display';toggle.setAttribute('aria-label','Screen dimming options');
  const panel=document.createElement('div');panel.id='gbDisplayPanel';panel.hidden=true;
  const title=document.createElement('strong');title.textContent='Windows Display · Keep Awake';
  const info=document.createElement('div');info.textContent='Idle dimming and screen-off are blocked while this desktop app is running.';
  const label=document.createElement('label');label.textContent='Manual Screen Dim: ';
  const displayValue=document.createElement('strong');label.append(displayValue);
  const slider=document.createElement('input');slider.type='range';slider.min='0';slider.max='80';slider.step='5';slider.setAttribute('aria-label','Manual screen dim percent');
  const presets=document.createElement('div');
  for(const [amount,name] of [[0,'Normal'],[25,'Mild'],[50,'Medium'],[75,'Dark']]){
    const btn=document.createElement('button');btn.textContent=name;btn.onclick=()=>apply(amount);presets.append(btn)
  }
  function apply(amount){
    const value=Math.max(0,Math.min(80,Number(amount)||0));
    slider.value=String(value);displayValue.textContent=value+'%';
    dim.style.display=value?'block':'none';dim.style.opacity=String(value/100);
    try{localStorage.setItem(key,String(value))}catch(_){}
  }
  slider.oninput=()=>apply(slider.value);
  toggle.onclick=()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden))};
  panel.append(title,info,label,slider,presets);
  document.body.append(dim,toggle,panel);
  apply(localStorage.getItem(key)||0);
  async function keepAwake(){
    if(document.visibilityState!=='visible'||!navigator.wakeLock?.request)return;
    try{wakeLock=await navigator.wakeLock.request('screen')}catch(_){}
  }
  document.addEventListener('visibilitychange',keepAwake);
  keepAwake();
})();