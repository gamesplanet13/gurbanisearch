/* Wide-screen Waheguru. A fixed set of words is animated locally by WebView. */
window.GurbaniTvWaheguru = function (root, enabled) {
 if (!enabled) {
  if (root.classList.contains('tv-waheguru')) root.textContent = '';
  root.classList.remove('tv-waheguru');
  return;
 }
 if (root.classList.contains('tv-waheguru')) return;
 root.classList.add('tv-waheguru');
 const style = document.createElement('style');
 style.textContent = [
  '.tv-waheguru{overflow:hidden;background:radial-gradient(ellipse at 50% 48%,#25133e 0%,#10091e 37%,#040309 76%)}',
  '.tv-waheguru .tv-waheguru-title,.tv-waheguru .tv-waheguru-word{position:absolute;top:50%;left:50%;font-family:system-ui,"Noto Sans Gurmukhi","Noto Sans Devanagari",sans-serif;font-weight:800;line-height:1.3;white-space:nowrap;transform-origin:center;isolation:isolate}',
  '.tv-waheguru .tv-waheguru-ink{display:block}.tv-waheguru .tv-waheguru-title{font-size:10vw;font-size:clamp(42px,10vw,26vh);color:#ffe7ae;text-shadow:0 0 .18em #ffc477,0 0 .42em #b274ff;transform:translate3d(-50%,-50%,0);animation:tvWaheguruPulse 7s ease-in-out infinite}',
  '.tv-waheguru .tv-waheguru-word{opacity:0;font-size:var(--size);color:var(--color);text-shadow:0 0 .28em var(--color);isolation:isolate;will-change:transform,opacity;animation:tvWaheguruDrift var(--duration) ease-in-out infinite}',
  '@supports ((-webkit-background-clip:text) or (background-clip:text)){.tv-waheguru .tv-waheguru-ink{background:var(--ink);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none}.tv-waheguru .tv-waheguru-halo{position:absolute;inset:0;color:var(--color);opacity:.62;z-index:-1}}',
  '@keyframes tvWaheguruPulse{0%,100%{transform:translate3d(-50%,-50%,0) scale(.89)}50%{transform:translate3d(-50%,-50%,0) scale(1.12)}}',
  '@keyframes tvWaheguruDrift{0%{opacity:0;transform:translate3d(calc(-50% + var(--from-x)),calc(-50% + var(--from-y)),0) scale(.42)}22%{opacity:.9}52%{opacity:.86;transform:translate3d(calc(-50% + var(--mid-x)),calc(-50% + var(--mid-y)),0) scale(1.15)}77%{opacity:.72}100%{opacity:0;transform:translate3d(calc(-50% + var(--to-x)),calc(-50% + var(--to-y)),0) scale(.63)}}',
  '@media(prefers-reduced-motion:reduce){.tv-waheguru .tv-waheguru-title{animation:none}.tv-waheguru .tv-waheguru-word{display:none}}'
 ].join('');
 root.appendChild(style);
 function ink(element, text, color, gradient) {
  element.style.setProperty('--color', color);
  element.style.setProperty('--ink', gradient);
  const halo = document.createElement('span');
  halo.className = 'tv-waheguru-halo';
  halo.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none';
  halo.setAttribute('aria-hidden', 'true');
  halo.textContent = text;
  const face = document.createElement('span');
  face.className = 'tv-waheguru-ink';
  face.textContent = text;
  element.append(halo, face);
 }
 const title = document.createElement('div');
 title.className = 'tv-waheguru-title';
 ink(title, 'ਵਾਹਿਗੁਰੂ', '#ba83ff', 'linear-gradient(105deg,#ffbc68,#fff1a8 36%,#e9b2ff 72%,#8b9cff)');
 root.appendChild(title);

 const words = ['ਵਾਹਿਗੁਰੂ', 'वाहेगुरु', 'Waheguru'];
 const colors = ['#ffc36b','#8e9bff','#75dfbd','#ff96cb','#ba8cff','#72d7ff'];
 const gradients = [
  '#ff965b,#ffe470,#9ced95', '#71f5eb,#7aa6ff,#ad75f8', '#6befb8,#76ccff,#ab7bff',
  '#ffa2cb,#ffe48a,#ff8765', '#9ae6ff,#aa8afa,#ffb7e1', '#6de6ff,#9fa8ff,#d88eff'
 ];
 const paths = [
  {from:[-64,-32],mid:[-13,-8],to:[12,-58],size:3.8,duration:19,delay:-5},
  {from:[61,-30],mid:[16,-10],to:[-15,-59],size:3.2,duration:22,delay:-8},
  {from:[-12,-63],mid:[-19,-16],to:[-61,14],size:3.4,duration:25,delay:-16},
  {from:[16,64],mid:[15,12],to:[63,-9],size:3.5,duration:23,delay:-10},
  {from:[-65,31],mid:[-18,14],to:[11,62],size:3.2,duration:24,delay:-17},
  {from:[60,29],mid:[21,8],to:[-13,64],size:3.8,duration:21,delay:-4}
 ];
 paths.forEach((path, index) => {
  const word = document.createElement('span');
  word.className = 'tv-waheguru-word';
  ink(word, words[index % words.length], colors[index], 'linear-gradient(110deg,' + gradients[index] + ')');
  word.style.setProperty('--size', (path.size * 1.3) + 'vw');
  word.style.setProperty('--duration', path.duration + 's');
  word.style.animationDelay = path.delay + 's';
  for (const key of ['from','mid','to']) {
   word.style.setProperty('--' + key + '-x', path[key][0] + 'vw');
   word.style.setProperty('--' + key + '-y', path[key][1] + 'vh');
  }
  root.appendChild(word);
 });
};
