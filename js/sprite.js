// Tiny pixel-art sprites rendered as inline SVG (one <rect> per pixel).
const Sprite = (() => {
  // Legend: . transparent, k ink, w body, p inner ear / blush, y cheek highlight
  const CAT = {
    idle: [
      '.kk........kk.',
      'kppk......kppk',
      'kpppk....kpppk',
      'kwwwkkkkkkwwwk',
      'kwwwwwwwwwwwwk',
      'kwwkkwwwwkkwwk',
      'kwwkkwwwwkkwwk',
      'kwwwwwwkwwwwwk',
      'kpwwwwkwkwwwpk',
      'kwwwwwwwwwwwwk',
      '.kkkkkkkkkkkk.',
    ],
    blink: [
      '.kk........kk.',
      'kppk......kppk',
      'kpppk....kpppk',
      'kwwwkkkkkkwwwk',
      'kwwwwwwwwwwwwk',
      'kwwwwwwwwwwwwk',
      'kwwkkwwwwkkwwk',
      'kwwwwwwkwwwwwk',
      'kpwwwwkwkwwwpk',
      'kwwwwwwwwwwwwk',
      '.kkkkkkkkkkkk.',
    ],
    happy: [
      '.kk........kk.',
      'kppk......kppk',
      'kpppk....kpppk',
      'kwwwkkkkkkwwwk',
      'kwwwwwwwwwwwwk',
      'kwkwwkwwwwkwwk',
      'kwwkkwwwwkkwwk',
      'kwwwwwwkwwwwwk',
      'kpwwwkwwwkwwpk',
      'kwwwwwkkkwwwwk',
      '.kkkkkkkkkkkk.',
    ],
    sad: [
      '.kk........kk.',
      'kppk......kppk',
      'kpppk....kpppk',
      'kwwwkkkkkkwwwk',
      'kwwwwwwwwwwwwk',
      'kwkwkwwwwkwkwk',
      'kwwkwwwwwwkwwk',
      'kwkwkwwwwkwkwk',
      'kwwwwwkkkwwwwk',
      'kwwwwkwwwkwwwk',
      '.kkkkkkkkkkkk.',
    ],
  };

  const HEART = [
    '.kk.kk.',
    'kppkppk',
    'kpppppk',
    '.kpppk.',
    '..kpk..',
    '...k...',
  ];

  const STAR = [
    '...k...',
    '..kyk..',
    'kkkykkk',
    '.kyyyk.',
    '.kyyyk.',
    'kk...kk',
  ];

  function render(map, scale = 4, colors = {}) {
    const pal = Object.assign({ k: 'var(--ink)', w: 'var(--sprite-body)', p: 'var(--accent)', y: 'var(--warn)' }, colors);
    const h = map.length, w = map[0].length;
    let rects = '';
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = map[y][x];
        if (c === '.') continue;
        rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${pal[c]}"/>`;
      }
    }
    return `<svg class="px" viewBox="0 0 ${w} ${h}" width="${w * scale}" height="${h * scale}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
  }

  return {
    cat: (frame = 'idle', scale = 4) => render(CAT[frame] || CAT.idle, scale),
    heart: (scale = 3) => render(HEART, scale),
    star: (scale = 3, on = true) => render(STAR, scale, on ? {} : { y: 'var(--surface-2)' }),
  };
})();
