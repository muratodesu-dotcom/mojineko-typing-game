// Tiny pixel-art sprites rendered as inline SVG (one <rect> per pixel) or onto a canvas.
const Sprite = (() => {
  // Legend: . transparent, k ink, w body, p inner ear / blush, y yellow, r red, b accent
  // 20x18 chibi cat, front view. Legend: . transparent, k ink, w body, p pink (ears, blush, nose),
  // h eye highlight, y yellow, r red, b accent (accessories).
  const CAT = {
    idle: [
      '...kk..........kk...',
      '..kppk........kppk..',
      '..kpppk......kpppk..',
      '..kwwwwkkkkkkwwwwk..',
      '.kwwwwwwwwwwwwwwwwk.',
      'kwwwwwwwwwwwwwwwwwwk',
      'kwwwkhwwwwwwwwkhwwwk',
      'kwwwkkwwwwwwwwkkwwwk',
      'kwwwkkwwwwwwwwkkwwwk',
      'kpwwwwwwwppwwwwwwwpk',
      'kppwwwwwkwwkwwwwwppk',
      'kwwwwwwwwkkwwwwwwwwk',
      'kwwwwwwwwwwwwwwwwwwk',
      '.kwwwwwwwwwwwwwwwwk.',
      '..kkwwwwwwwwwwwwkk..',
      '.kwwwwwwwwwwwwwwwwkk',
      '.kwwkwwwwwwwwkwwwkwk',
      '..kkkkkkkkkkkkkkkkk.',
    ],
    happy: [
      '...kk..........kk...',
      '..kppk........kppk..',
      '..kpppk......kpppk..',
      '..kwwwwkkkkkkwwwwk..',
      '.kwwwwwwwwwwwwwwwwk.',
      'kwwwwwwwwwwwwwwwwwwk',
      'kwwkwwkwwwwwwkwwkwwk',
      'kwwwkkwwwwwwwwkkwwwk',
      'kwwwwwwwwwwwwwwwwwwk',
      'kpwwwwwwwppwwwwwwwpk',
      'kppwwwwwkwwkwwwwwppk',
      'kwwwwwwwwkkwwwwwwwwk',
      'kwwwwwwwwppwwwwwwwwk',
      '.kwwwwwwwwwwwwwwwwk.',
      '..kkwwwwwwwwwwwwkk..',
      '.kwwwwwwwwwwwwwwwwkk',
      '.kwwkwwwwwwwwkwwwkwk',
      '..kkkkkkkkkkkkkkkkk.',
    ],
    sad: [
      '...kk..........kk...',
      '..kppk........kppk..',
      '..kpppk......kpppk..',
      '..kwwwwkkkkkkwwwwk..',
      '.kwwwwwwwwwwwwwwwwk.',
      'kwwwwwwwwwwwwwwwwwwk',
      'kwwkwkwwwwwwwwkwkwwk',
      'kwwwkwwwwwwwwwwkwwwk',
      'kwwkwkwwwwwwwwkwkwwk',
      'kpwwwwwwwppwwwwwwwpk',
      'kppwwwwwwkkwwwwwwppk',
      'kwwwwwwwkwwkwwwwwwwk',
      'kwwwwwwwwwwwwwwwwwwk',
      '.kwwwwwwwwwwwwwwwwk.',
      '..kkwwwwwwwwwwwwkk..',
      '.kwwwwwwwwwwwwwwwwkk',
      '.kwwkwwwwwwwwkwwwkwk',
      '..kkkkkkkkkkkkkkkkk.',
    ],
  };

  // Accessories drawn over the base map: [x, y, colour key]
  const ACCESSORIES = {
    bow: [[8, 1, 'b'], [11, 1, 'b'], [8, 2, 'b'], [9, 2, 'p'], [10, 2, 'p'], [11, 2, 'b'], [8, 3, 'b'], [11, 3, 'b']],
    scarf: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map(x => [x, 13, 'r']).concat([4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(x => [x, 14, 'r'])).concat([[3, 15, 'r'], [3, 16, 'r']]),
    crown: [[9, 0, 'y'], [7, 1, 'y'], [9, 1, 'y'], [11, 1, 'y'], [7, 2, 'y'], [8, 2, 'y'], [9, 2, 'y'], [10, 2, 'y'], [11, 2, 'y']],
  };

  // Looks unlocked by player level. Body colours and accessories accumulate.
  const LOOKS = [
    { lv: 1, body: null },
    { lv: 3, acc: 'bow' },
    { lv: 5, body: '#ffe9c4' },
    { lv: 8, acc: 'scarf' },
    { lv: 11, body: '#d8d3e6' },
    { lv: 15, acc: 'crown' },
    { lv: 20, body: '#ffc48a' },
  ];

  function lookFor(level) {
    let body = null, acc = null;
    for (const l of LOOKS) {
      if (l.lv > level) break;
      if (l.body !== undefined) body = l.body;
      if (l.acc !== undefined) acc = l.acc;
    }
    const next = LOOKS.find(l => l.lv > level);
    return { body, acc, nextLevel: next ? next.lv : null };
  }

  const HEART = ['.kk.kk.', 'kppkppk', 'kpppppk', '.kpppk.', '..kpk..', '...k...'];
  const STAR = ['...k...', '..kyk..', 'kkkykkk', '.kyyyk.', '.kyyyk.', 'kk...kk'];

  const DEFAULT_PAL = { k: 'var(--ink)', w: 'var(--sprite-body)', p: 'var(--accent)', b: 'var(--accent)', y: 'var(--warn)', r: 'var(--bad)', h: '#ffffff' };

  function pixels(map, look) {
    const grid = map.map(row => row.split(''));
    if (look && look.acc && ACCESSORIES[look.acc]) {
      for (const [x, y, c] of ACCESSORIES[look.acc]) if (grid[y] && grid[y][x] !== undefined) grid[y][x] = c;
    }
    return grid;
  }

  function render(map, scale = 4, colors = {}, look = null) {
    const pal = Object.assign({}, DEFAULT_PAL, colors);
    if (look && look.body) pal.w = look.body;
    const grid = pixels(map, look);
    const h = grid.length, w = grid[0].length;
    let rects = '';
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = grid[y][x];
      if (c === '.') continue;
      rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${pal[c]}"/>`;
    }
    return `<svg class="px" viewBox="0 0 ${w} ${h}" width="${w * scale}" height="${h * scale}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
  }

  // Draw the cat onto a 2D canvas with concrete colours (no CSS variables).
  function drawCat(ctx, frame, x, y, scale, colors, look) {
    const pal = Object.assign({ k: '#3b2f45', w: '#ffffff', p: '#ff85a1', b: '#ff85a1', y: '#ffcf4a', r: '#ff6b6b', h: '#ffffff' }, colors);
    if (look && look.body) pal.w = look.body;
    const grid = pixels(CAT[frame] || CAT.idle, look);
    for (let gy = 0; gy < grid.length; gy++) for (let gx = 0; gx < grid[gy].length; gx++) {
      const c = grid[gy][gx];
      if (c === '.') continue;
      ctx.fillStyle = pal[c];
      ctx.fillRect(x + gx * scale, y + gy * scale, scale, scale);
    }
  }

  return {
    cat: (frame = 'idle', scale = 4, look = null) => render(CAT[frame] || CAT.idle, scale, {}, look),
    heart: (scale = 3) => render(HEART, scale),
    star: (scale = 3, on = true) => render(STAR, scale, on ? {} : { y: 'var(--surface-2)' }),
    lookFor, drawCat, LOOKS,
  };
})();
