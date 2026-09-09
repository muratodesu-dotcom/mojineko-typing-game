// Tiny pixel-art sprites rendered as inline SVG (one <rect> per pixel) or onto a canvas.
const Sprite = (() => {
  // Legend: . transparent, k ink, w body, p inner ear / blush, y yellow, r red, b accent
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
    sleep: [
      '.kk........kk.',
      'kppk......kppk',
      'kpppk....kpppk',
      'kwwwkkkkkkwwwk',
      'kwwwwwwwwwwwwk',
      'kwwwwwwwwwwwwk',
      'kwwkkwwwwkkwwk',
      'kwwwwwwkwwwwwk',
      'kpwwwwwwwwwwpk',
      'kwwwwwwwwwwwwk',
      '.kkkkkkkkkkkk.',
    ],
  };

  // Floating "zzz" for the sleeping pet.
  const ZZZ = [
    '......kkk',
    '.......k.',
    '......kkk',
    '...kkk...',
    '....k....',
    '...kkk...',
    'kkk......',
    '.k.......',
    'kkk......',
  ];

  // Other pets share the 14x11 grid. d = dog-ear brown, o = beak orange. Happy / sad frames
  // are derived from the idle map by redrawing the 2x2 eyes.
  const PETS_IDLE = {
    dog: {
      body: null, eyes: [[5, 4], [8, 4]],
      map: [
        '..kkkkkkkkkk..',
        '.kwwwwwwwwwwk.',
        'kdkwwwwwwwwkdk',
        'kddkwwwwwwkddk',
        'kddkwkwwkwkddk',
        'kddkwkwwkwkddk',
        'kddkwwkkwwkddk',
        'kdkwwkwwkwwkdk',
        'kpwwwwwwwwwwpk',
        'kwwwwwwwwwwwwk',
        '.kkkkkkkkkkkk.',
      ],
    },
    rabbit: {
      body: null, eyes: [[3, 5], [9, 5]],
      map: [
        '..kpk....kpk..',
        '..kpk....kpk..',
        '..kpk....kpk..',
        '.kkwkkkkkkwkk.',
        'kwwwwwwwwwwwwk',
        'kwwkkwwwwkkwwk',
        'kwwkkwwwwkkwwk',
        'kwwwwwkkwwwwwk',
        'kpwwwwkwkwwwpk',
        'kwwwwwwwwwwwwk',
        '.kkkkkkkkkkkk.',
      ],
    },
    bear: {
      body: '#d9a066', eyes: [[3, 4], [9, 4]],
      map: [
        '.kkk......kkk.',
        'kwpwk....kwpwk',
        'kwwwkkkkkkwwwk',
        '.kwwwwwwwwwwk.',
        'kwwkkwwwwkkwwk',
        'kwwkkwwwwkkwwk',
        'kwwwwwkkwwwwwk',
        'kwwwwkwwwwkwwk',
        'kpwwwwwwwwwwpk',
        'kwwwwwwwwwwwwk',
        '.kkkkkkkkkkkk.',
      ],
    },
    chick: {
      body: '#ffe066', eyes: [[3, 4], [9, 4]],
      map: [
        '.....kkk......',
        '....kwwwk.....',
        '..kkkwwwkkkk..',
        '.kwwwwwwwwwwk.',
        'kwwkkwwwwkkwwk',
        'kwwkkwwwwkkwwk',
        'kwwwwwookwwwwk',
        'kpwwwwoowwwwpk',
        'kwwwwwwwwwwwwk',
        '.kwwwwwwwwwwk.',
        '.kkkkkkkkkkkk.',
      ],
    },
  };

  function eyeFrame(pet, frame) {
    const grid = pet.map.map(r => r.split(''));
    const set = (x, y, c) => { if (grid[y] && x >= 0 && x < grid[y].length) grid[y][x] = c; };
    for (const [ex, ey] of pet.eyes) {
      // clear the 3x3 around the eye's top-left
      for (let y = ey - 0; y <= ey + 1; y++) for (let x = ex; x <= ex + 1; x++) set(x, y, 'w');
      if (frame === 'happy') {
        set(ex - 1, ey, 'k'); set(ex + 2, ey, 'k'); set(ex, ey + 1, 'k'); set(ex + 1, ey + 1, 'k');
      } else if (frame === 'sleep') {
        set(ex, ey + 1, 'k'); set(ex + 1, ey + 1, 'k');
      } else if (frame === 'sad') {
        const cx = ex, cy = ey + 1;
        set(cx - 1, cy - 1, 'k'); set(cx + 1, cy - 1, 'k'); set(cx, cy, 'k'); set(cx - 1, cy + 1, 'k'); set(cx + 1, cy + 1, 'k');
        set(cx, cy - 1, 'w'); set(cx - 1, cy, 'w'); set(cx + 1, cy, 'w'); set(cx, cy + 1, 'w');
      } else {
        set(ex, ey, 'k'); set(ex + 1, ey, 'k'); set(ex, ey + 1, 'k'); set(ex + 1, ey + 1, 'k');
      }
    }
    return grid.map(r => r.join(''));
  }

  const PET_NAMES = ['cat', 'dog', 'rabbit', 'bear', 'chick'];
  function petMap(name, frame) {
    if (name === 'cat' || !PETS_IDLE[name]) return CAT[frame] || CAT.idle;
    return eyeFrame(PETS_IDLE[name], frame);
  }
  const petBody = name => (PETS_IDLE[name] && PETS_IDLE[name].body) || null;

  // Accessories drawn over the base map: [x, y, colour key]
  const ACCESSORIES = {
    // Maid headdress: an accent band across the top of the head with a scalloped lace edge above it.
    headdress: [[4, 2, 'k'], [6, 2, 'k'], [8, 2, 'k'], [3, 3, 'k'], [4, 3, 'b'], [5, 3, 'b'], [6, 3, 'b'], [7, 3, 'b'], [8, 3, 'b'], [9, 3, 'b'], [10, 3, 'k']],
    bow: [[0, 0, 'b'], [2, 0, 'b'], [1, 1, 'b'], [0, 2, 'b'], [2, 2, 'b'], [1, 0, 'k'], [1, 2, 'k']],
    scarf: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(x => [x, 9, 'r']).concat([[3, 10, 'r'], [4, 10, 'r']]),
    crown: [[5, 1, 'y'], [7, 1, 'y'], [9, 1, 'y'], [5, 2, 'y'], [6, 2, 'y'], [7, 2, 'y'], [8, 2, 'y'], [9, 2, 'y']],
    // Secret: a little red heart on the right ear, mirroring the bow, for petting the mascot 1000 times.
    heart: [[11, 0, 'r'], [12, 0, 'k'], [13, 0, 'r'], [11, 1, 'r'], [12, 1, 'r'], [13, 1, 'r'], [12, 2, 'r']],
  };

  // One look per player level (five levels: 見習い → 正メイド → プレミアム → スーパープレミアム → レジェンド).
  // Accessories accumulate from level to level; `drop` removes one that the new piece replaces; `body` recolours the coat.
  const LOOKS = [
    { lv: 1 },
    { lv: 2, acc: 'headdress' },
    { lv: 3, acc: 'bow', body: '#ffe9c4' },
    { lv: 4, acc: 'scarf' },
    { lv: 5, acc: 'crown', drop: 'headdress', body: '#ffd88a' },
  ];

  // `extras` are accessories earned outside the level ladder (see game.js secretAccs); they stay on at every level.
  function lookFor(level, extras = []) {
    let body = null;
    let accs = [];
    for (const l of LOOKS) {
      if (l.lv > level) break;
      if (l.body !== undefined) body = l.body;
      if (l.drop) accs = accs.filter(a => a !== l.drop);
      if (l.acc) accs.push(l.acc);
    }
    const next = LOOKS.find(l => l.lv > level);
    return { body, accs: accs.concat(extras), nextLevel: next ? next.lv : null };
  }

  const HEART = ['.kk.kk.', 'kppkppk', 'kpppppk', '.kpppk.', '..kpk..', '...k...'];
  const STAR = ['...k...', '..kyk..', 'kkkykkk', '.kyyyk.', '.kyyyk.', 'kk...kk'];

  const DEFAULT_PAL = { k: 'var(--ink)', w: 'var(--sprite-body)', p: 'var(--accent)', b: 'var(--accent)', y: 'var(--warn)', r: 'var(--bad)', d: '#c69c6d', o: '#ff9f43' };

  function pixels(map, look) {
    const grid = map.map(row => row.split(''));
    for (const acc of (look && look.accs) || []) {
      for (const [x, y, c] of ACCESSORIES[acc] || []) if (grid[y] && grid[y][x] !== undefined) grid[y][x] = c;
    }
    return grid;
  }

  function render(map, scale = 4, colors = {}, look = null, baseBody = null) {
    const pal = Object.assign({}, DEFAULT_PAL, colors);
    if (baseBody) pal.w = baseBody;
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
  function drawPet(ctx, name, frame, x, y, scale, colors, look) {
    const pal = Object.assign({ k: '#3b2f45', w: '#ffffff', p: '#ff85a1', b: '#ff85a1', y: '#ffcf4a', r: '#ff6b6b', d: '#c69c6d', o: '#ff9f43' }, colors);
    if (petBody(name)) pal.w = petBody(name);
    if (look && look.body) pal.w = look.body;
    const grid = pixels(petMap(name, frame), look);
    for (let gy = 0; gy < grid.length; gy++) for (let gx = 0; gx < grid[gy].length; gx++) {
      const c = grid[gy][gx];
      if (c === '.') continue;
      ctx.fillStyle = pal[c];
      ctx.fillRect(x + gx * scale, y + gy * scale, scale, scale);
    }
  }

  return {
    cat: (frame = 'idle', scale = 4, look = null) => render(CAT[frame] || CAT.idle, scale, {}, look),
    pet: (name = 'cat', frame = 'idle', scale = 4, look = null) => render(petMap(name, frame), scale, {}, look, petBody(name)),
    PET_NAMES,
    heart: (scale = 3) => render(HEART, scale),
    zzz: (scale = 2) => render(ZZZ, scale, { k: 'var(--muted)' }),
    star: (scale = 3, on = true) => render(STAR, scale, on ? {} : { y: 'var(--surface-2)' }),
    lookFor, drawPet, LOOKS,
  };
})();
