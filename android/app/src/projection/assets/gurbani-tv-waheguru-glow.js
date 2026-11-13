/* Android TV Waheguru. A fixed set of words is animated locally by WebView. */
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
  '#rainbowScreen.tv-waheguru{background:radial-gradient(ellipse at center,#241335 0%,#10081b 46%,#030207 85%)}',
  '.tv-waheguru .tv-waheguru-title,.tv-waheguru .tv-waheguru-word{position:absolute;top:50%;left:50%;font-family:system-ui,"Noto Sans Gurmukhi","Noto Sans Devanagari",sans-serif;font-weight:800;line-height:1.3;white-space:nowrap;transform-origin:center}',
  '.tv-waheguru .tv-waheguru-title{font-size:10vw;font-size:clamp(42px,10vw,26vh);color:#ffe7ae;text-shadow:0 0 .18em #ffc477,0 0 .42em #b274ff;transform:translate3d(-50%,-50%,0);animation:tvWaheguruPulse 7s ease-in-out infinite}',
  '.tv-waheguru .tv-waheguru-word{opacity:0;font-size:var(--size);color:var(--color);text-shadow:0 0 .28em var(--color);will-change:transform,opacity;animation:tvWaheguruDrift var(--duration) ease-in-out infinite}',
  '@keyframes tvWaheguruPulse{0%,100%{transform:translate3d(-50%,-50%,0) scale(.89)}50%{transform:translate3d(-50%,-50%,0) scale(1.12)}}',
  '@keyframes tvWaheguruDrift{0%{opacity:0;transform:translate3d(calc(-50% + var(--from-x)),calc(-50% + var(--from-y)),0) scale(.42)}22%{opacity:.9}52%{opacity:.86;transform:translate3d(calc(-50% + var(--mid-x)),calc(-50% + var(--mid-y)),0) scale(1.15)}77%{opacity:.72}100%{opacity:0;transform:translate3d(calc(-50% + var(--to-x)),calc(-50% + var(--to-y)),0) scale(.63)}}',
  '@media(prefers-reduced-motion:reduce){.tv-waheguru .tv-waheguru-title{animation:none}.tv-waheguru .tv-waheguru-word{display:none}}'
 ].join('');
 root.appendChild(style);
 const title = document.createElement('div');
 title.className = 'tv-waheguru-title';
 title.textContent = 'ਵਾਹਿਗੁਰੂ';
 root.appendChild(title);

 const words = ['ਵਾਹਿਗੁਰੂ', 'वाहेगुरु', 'Waheguru'];
 const colors = ['#f8c66a', '#b7c5ff', '#a9efd2', '#ffc1df', '#c9a4ff', '#a9ddff'];
 const paths = [
  {from:[-64,-32],mid:[-31,-25],to:[12,-58],size:3.8,duration:19,delay:-5},
  {from:[61,-30],mid:[29,-22],to:[-15,-59],size:3.2,duration:22,delay:-8},
  {from:[-12,-63],mid:[-23,-30],to:[-61,14],size:3.4,duration:25,delay:-16},
  {from:[16,64],mid:[26,28],to:[63,-9],size:3.5,duration:23,delay:-10},
  {from:[-65,31],mid:[-28,26],to:[11,62],size:3.2,duration:24,delay:-17},
  {from:[60,29],mid:[33,20],to:[-13,64],size:3.8,duration:21,delay:-4}
 ];
 paths.forEach((path, index) => {
  const word = document.createElement('span');
  word.className = 'tv-waheguru-word';
  word.textContent = words[index % words.length];
  word.style.setProperty('--size', path.size + 'vw');
  word.style.setProperty('--color', colors[index]);
  word.style.setProperty('--duration', path.duration + 's');
  word.style.animationDelay = path.delay + 's';
  for (const key of ['from','mid','to']) {
   word.style.setProperty('--' + key + '-x', path[key][0] + 'vw');
   word.style.setProperty('--' + key + '-y', path[key][1] + 'vh');
  }
  root.appendChild(word);
 });
};
