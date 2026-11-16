/* Text presentation only: original Gurbani characters are never rewritten. */
window.GurbaniLayout = {
  compareSelections(a, b) {
    if (!a || !Number.isSafeInteger(a.time) || a.time < 0 || !/^[0-9a-f]{24}$/.test(a.id)) return -1;
    if (!b) return 1;
    return a.time - b.time || a.id.localeCompare(b.id);
  },
  relaySelection(authorization, source, selection, content) {
    for (const [link, recipient] of authorization) {
      if (link !== source && link.open) {
        try { link.send({type:'control-selection', token:recipient, selection, content}); }
        catch (_) {}
      }
    }
  },
  languageOptions: [
    ['sg','Gurmukhi Shabad','gurmukhi','gurmukhiCheck'],
    ['sh','Hindi Shabad','hindi','hindiShabadCheck'],
    ['se','Roman Shabad','english','englishShabadCheck'],
    ['mp','Punjabi Arth','punjabi','paCheck'],
    ['mh','Hindi Arth','hindi','hiCheck'],
    ['me','English Arth','english','enCheck']
  ],
  languagePatch(value) {
    return Object.fromEntries(this.languageOptions
      .filter(([key]) => typeof value?.[key] === 'boolean')
      .map(([key]) => [key, value[key]]));
  },
  languageContent(content, choices) {
    if (!content?.obsData) return content;
    const scripts = {}, meanings = {};
    for (const [key,,lang] of this.languageOptions) {
      const fields = key.startsWith('s') ? scripts : meanings;
      const previous = key.startsWith('s') ? content.scripts : content.meanings;
      fields[lang] = choices?.[key] === true ? content.obsData[key] || ''
        : choices?.[key] === false ? '' : previous?.[lang] || '';
    }
    const verse = Object.values(scripts).concat(Object.values(meanings)).find(Boolean) || '';
    return {...content, scripts, meanings, meaning:meanings.english, verse, bookLineDetails:true};
  },
  languageMenu(root, change) {
    const inputs = new Map();
    for (const [key, text,,] of this.languageOptions) {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.onchange = () => change({[key]:input.checked});
      label.append(input, document.createTextNode(' '+text));
      root.append(label, document.createElement('br'));
      inputs.set(key,input);
    }
    return (choices, content) => {
      for (const [key,,lang] of this.languageOptions) {
        const fields = key.startsWith('s') ? content?.scripts : content?.meanings;
        inputs.get(key).checked = choices?.[key] ?? (key === 'sg' || !!fields?.[lang]);
      }
    };
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
