/* Text presentation only: original Gurbani characters are never rewritten. */
window.GurbaniLayout = {
  sourceCode(source) {
    const raw = String(typeof source === 'string' ? source : (source?.name || source?.sourceId || source?.id || '')).trim();
    if (!raw) return '';
    const key = raw.toLocaleLowerCase();
    if (/^(g|sggs|ggs)$/.test(key) || /guru granth|ਗੁਰੂ ਗ੍ਰੰਥ|ਗੁਰੁ ਗ੍ਰੰਥ/.test(key)) return 'SGGS';
    if (/^(d|dg|sdgr)$/.test(key) || /dasam|ਦਸਮ/.test(key)) return 'DG';
    if (/^(b|bgv|vbgj|ksbg)$/.test(key) || /gurdas|ਗੁਰਦਾਸ/.test(key)) return 'BGV';
    if (/^(n|bnl|gjnl)$/.test(key) || /nand lal|ਨੰਦ ਲਾਲ/.test(key)) return 'BNL';
    if (/amrit keertan|ਅੰਮ੍ਰਿਤ ਕੀਰਤਨ/.test(key)) return 'AK';
    if (/^(a|other|oth)$/.test(key)) return 'OTH';
    // A short code for an otherwise named source, never print a long source name.
    return raw.split(/\s+/u).filter(Boolean).slice(0,3).map(word => [...word][0].toUpperCase()).join('').slice(0,4);
  },
  protectMetadata(metadata, selectors) {
    if (!metadata || metadata.hidden) return;
    const box = metadata.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const intersects = (a,b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const occupied = selectors.some(selector => [...document.querySelectorAll(selector)].some(el => {
      if (el.hidden || !el.textContent?.trim() || getComputedStyle(el).visibility === 'hidden') return false;
      const range = document.createRange();
      range.selectNodeContents(el);
      const rects = [...range.getClientRects()];
      return rects.some(rect => rect.width > 0 && rect.height > 0 && intersects(box,rect));
    }));
    metadata.style.visibility = occupied ? 'hidden' : '';
  },

  bookDetails(content) {
    const values = [((content.scripts || {}).hindi), ((content.scripts || {}).english)].concat(Object.values(content.meanings || {})).filter(Boolean);
    if (!values.length) return null;
    const details = document.createElement('div');
    details.id = 'bookLineDetails';
    details.className = 'book-line-extra';
    for (const value of values) {
      const row = document.createElement('div');
      row.textContent = value;
      details.appendChild(row);
    }
    return details;
  },
  draw(element, text, larrivaar, pauses) {
    element.textContent = '';
    text = String(text || '');
    // Highlight the word immediately before punctuation present in the source.
    // These are not independently verified traditional vishram annotations.
    const pieces = text.split(/([^\s,;।॥]+(?=\s*[,;।॥]))/u);
    for (let i = 0; i < pieces.length; i++) {
      let piece = pieces[i];
      if (larrivaar) piece = piece.replace(/\s+/gu, '');
      if (!piece) continue;
      if (pauses && i % 2 === 1) {
        const span = document.createElement('span');
        span.className = 'pause-word'; span.textContent = piece; element.append(span);
      } else element.append(document.createTextNode(piece));
    }
  }
};
