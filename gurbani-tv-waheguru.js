/* Built-in Android TV Waheguru animation. Text and animation are rendered locally. */
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
  '#rainbowScreen.tv-waheguru{background:#090613}',
  '.tv-waheguru .tv-waheguru-title{position:absolute;left:0;right:0;top:39%;text-align:center;color:#ffe5a9;font-size:10vw;font-weight:800;line-height:1.3}',
  '.tv-waheguru .tv-waheguru-word{position:absolute;left:0;white-space:nowrap;font-weight:700;font-size:3.5vw;line-height:1.3;will-change:transform;animation:tvWaheguruTravel 28s linear infinite;transform:translate3d(-30vw,0,0)}',
  '@keyframes tvWaheguruTravel{from{transform:translate3d(-30vw,0,0)}to{transform:translate3d(105vw,0,0)}}',
  '@media(prefers-reduced-motion:reduce){.tv-waheguru .tv-waheguru-word{display:none}}'
 ].join('');
 root.appendChild(style);
 const title = document.createElement('div');
 title.className = 'tv-waheguru-title';
 title.textContent = 'ਵਾਹਿਗੁਰੂ';
 root.appendChild(title);
 const words = ['ਵਾਹਿਗੁਰੂ', 'वाहेगुरु', 'Waheguru', 'ਵਾਹਿਗੁਰੂ'];
 const colors = ['#f8c66a', '#aabfff', '#9ce0c0', '#eca8ca'];
 const rows = [13, 27, 67, 82];
 for (let i = 0; i < words.length; i++) {
  const word = document.createElement('span');
  word.className = 'tv-waheguru-word';
  word.textContent = words[i];
  word.style.top = rows[i] + '%';
  word.style.color = colors[i];
  word.style.animationDelay = (-4 - i * 6) + 's';
  root.appendChild(word);
 }
};
