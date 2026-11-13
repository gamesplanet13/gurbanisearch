/* Text presentation only: original Gurbani characters are never rewritten. */
window.GurbaniLayout = {
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
