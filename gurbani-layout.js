/* Text presentation only: original Gurbani characters are never rewritten. */
window.GurbaniLayout = {
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
