(() => {
  'use strict';

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = n => Math.round(n).toLocaleString('en-US');
  const escapeHtml = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const kataToHira = s => s.replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));

  // ---------------------------------------------------------------------
  // Static config
  // ---------------------------------------------------------------------
  const LANGS = {
    ja: { sentences: () => JA_SENTENCES, inputs: ['hiragana', 'mixed'] },   // both typed through the IME
    ko: { sentences: () => KO_SENTENCES, inputs: ['jamo', 'direct'] },
  };
  const isDirectInput = (lang, input) => lang === 'ja' || input === 'direct';

  const RANKS = [
    { r: 'S', min: 8000 }, { r: 'A', min: 5500 }, { r: 'B', min: 3500 },
    { r: 'C', min: 2000 }, { r: 'D', min: 900 }, { r: 'E', min: 0 },
  ];

  const ACHIEVEMENTS = [
    { id: 'first', ico: '🎉', test: (r, s) => s.stats.games >= 1 },
    { id: 'combo50', ico: '🔥', test: r => r.maxCombo >= 50 },
    { id: 'combo100', ico: '💥', test: r => r.maxCombo >= 100 },
    { id: 'perfect', ico: '💎', test: r => r.misses === 0 && r.sentences >= 3 },
    { id: 'rankS', ico: '👑', test: r => r.rank === 'S' },
    { id: 'rankA', ico: '⭐', test: r => r.rank === 'A' || r.rank === 'S' },
    { id: 'ten', ico: '🔟', test: r => r.sentences >= 10 },
    { id: 'games10', ico: '🎮', test: (r, s) => s.stats.games >= 10 },
    { id: 'games50', ico: '🏅', test: (r, s) => s.stats.games >= 50 },
    { id: 'bilingual', ico: '🌏', test: (r, s) => s.stats.langs.ja > 0 && s.stats.langs.ko > 0 },
    { id: 'streak3', ico: '📅', test: (r, s) => s.streak.count >= 3 },
    { id: 'streak7', ico: '🗓️', test: (r, s) => s.streak.count >= 7 },
    { id: 'chars10k', ico: '📚', test: (r, s) => s.stats.chars >= 10000 },
    { id: 'sprint', ico: '🏁', test: r => r.mode === 'sprint' && r.sprintCount === 20 },
    { id: 'night', ico: '🌙', test: r => r.hour >= 0 && r.hour < 4 },
    // Difficulty-based
    { id: 'easyClear', ico: '🌱', test: r => r.level === '1' && r.sentences >= 3 },
    { id: 'normalClear', ico: '🌿', test: r => r.level === '2' && r.sentences >= 3 },
    { id: 'hardClear', ico: '🌳', test: r => r.level === '3' && r.sentences >= 3 },
    { id: 'easyS', ico: '🍬', test: r => r.level === '1' && r.rank === 'S' },
    { id: 'normalS', ico: '🍡', test: r => r.level === '2' && r.rank === 'S' },
    { id: 'hardS', ico: '🎂', test: r => r.level === '3' && r.rank === 'S' },
    { id: 'hardPerfect', ico: '🏔️', test: r => r.level === '3' && r.misses === 0 && r.sentences >= 3 },
    { id: 'hardSprint', ico: '🦾', test: r => r.level === '3' && r.mode === 'sprint' && r.sprintCount === 20 },
  ];

  // Goals per difficulty: [tier values]; rank tiers compare by RANK_ORDER.
  const GOALS = [
    { id: 'games', tiers: [3, 10, 30] },
    { id: 'sentences', tiers: [10, 50, 200] },
    { id: 'rank', tiers: ['B', 'A', 'S'] },
  ];
  const RANK_ORDER = ['', 'E', 'D', 'C', 'B', 'A', 'S'];
  const XP_MULT = { 1: 1, 2: 1.25, 3: 1.5, mixed: 1.2 };

  const ICONS = {
    sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    soundOn: '<svg viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5.5a9 9 0 0 1 0 13"/></svg>',
    soundOff: '<svg viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6"/></svg>',
  };

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------
  const S = Store.load();
  const set = S.settings;
  const t = key => I18N[set.lang][key];

  const G = {
    active: false, phase: 'idle', // idle | countdown | play | done
    lang: 'ja', input: 'hiragana', direct: true, mode: 'time', duration: 60, sprintCount: 10, level: 'mixed',
    pool: [], poolIdx: 0, sentence: null, target: '', units: [], uIdx: 0, buf: '',
    startAt: 0, elapsed: 0, raf: 0, timer: 0,
    score: 0, combo: 0, maxCombo: 0, hits: 0, misses: 0, keys: 0, chars: 0,
    sentences: 0, perfect: 0, sentenceMisses: 0, levelSentences: { 1: 0, 2: 0, 3: 0 },
    ime: { scored: 0, flagged: false, composing: false },
  };

  const el = {
    root: document.documentElement,
    screens: { home: $('#screen-home'), play: $('#screen-play'), result: $('#screen-result') },
    inputLabel: $('#input-label'), inputChips: $('#input-chips'), inputHint: $('#input-hint'),
    fieldDuration: $('#field-duration'), fieldSprint: $('#field-sprint'),
    toggleGuide: $('#toggle-guide'), toggleKeyboard: $('#toggle-keyboard'),
    optGuide: $('#opt-guide'), optKeyboard: $('#opt-keyboard'), optTranslation: $('#opt-translation'),
    btnStart: $('#btn-start'), btnRetry: $('#btn-retry'), btnHome: $('#btn-home'), btnReset: $('#btn-reset'),
    btnSound: $('#btn-sound'), btnTheme: $('#btn-theme'),
    goals: $('#goals'), mascotHome: $('#mascot-home'), mascotPlay: $('#mascot-play'), mascotBubble: $('#mascot-bubble'),
    homeStats: $('#home-stats'), homeBoard: $('#home-board'), boardLabel: $('#board-label'), achGrid: $('#ach-grid'), achCount: $('#ach-count'),
    streak: $('#streak-count'), streakLabel: $('#streak-label'), levelNum: $('#level-num'), levelTitle: $('#level-title'), xpFill: $('#xp-fill'),
    hudTime: $('#hud-time'), hudTimeLabel: $('#hud-time-label'), hudScore: $('#hud-score'), hudCombo: $('#hud-combo'),
    hudComboBox: $('.hud-item.combo'), hudSpeed: $('#hud-speed'), hudSpeedLabel: $('#hud-speed-label'), hudAcc: $('#hud-acc'),
    timebar: $('#timebar-fill'), countdown: $('#countdown'), card: $('#sentence-card'), dots: $('#progress-dots'),
    main: $('#sentence-main'), guide: $('#sentence-guide'), en: $('#sentence-en'),
    directInput: $('#direct-input'), floatLayer: $('#float-layer'), keyboard: $('#keyboard'), playHint: $('#play-hint'),
    resultRank: $('#result-rank'), resultRankLabel: $('#result-rank-label'), resultScore: $('#result-score'), newRecord: $('#new-record'),
    resultStats: $('#result-stats'), resultAch: $('#result-ach'), resultBoard: $('#result-board'), resultBoardLabel: $('#result-board-label'),
    confetti: $('#confetti'), toastLayer: $('#toast-layer'),
  };

  // ---------------------------------------------------------------------
  // Theme & i18n
  // ---------------------------------------------------------------------
  function resolvedTheme() {
    if (set.theme === 'light' || set.theme === 'dark') return set.theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function applyTheme() {
    const th = resolvedTheme();
    el.root.dataset.theme = th;
    el.btnTheme.innerHTML = th === 'dark' ? ICONS.sun : ICONS.moon;
    el.btnTheme.title = t('theme');
  }
  function applyI18n() {
    el.root.dataset.lang = set.lang;
    el.root.lang = set.lang;
    $$('[data-t]').forEach(n => { n.textContent = t(n.dataset.t); });
    el.directInput.placeholder = t('imePlaceholder');
    el.playHint.innerHTML = t('quitHint').replace('Esc', '<kbd>Esc</kbd>');
    el.newRecord.textContent = t('newRecord');
    el.btnSound.innerHTML = set.sound ? ICONS.soundOn : ICONS.soundOff;
    el.btnSound.title = t('sound');
    applyTheme();
  }

  // ---------------------------------------------------------------------
  // Helpers: level, streak, boards
  // ---------------------------------------------------------------------
  const levelFromXp = xp => Math.floor(Math.sqrt(xp / 400)) + 1;
  const xpForLevel = lv => (lv - 1) * (lv - 1) * 400;
  const levelTitle = lv => t('titles')[clamp(Math.floor((lv - 1) / 3), 0, t('titles').length - 1)];

  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  function daysBetween(a, b) {
    const [y1, m1, d1] = a.split('-').map(Number);
    const [y2, m2, d2] = b.split('-').map(Number);
    return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
  }
  function currentStreak() {
    if (!S.streak.last) return 0;
    return daysBetween(S.streak.last, todayStr()) <= 1 ? S.streak.count : 0;
  }
  function touchStreak() {
    const today = todayStr();
    if (S.streak.last === today) return;
    const gap = S.streak.last ? daysBetween(S.streak.last, today) : Infinity;
    S.streak.count = gap === 1 ? S.streak.count + 1 : 1;
    S.streak.last = today;
    S.streak.best = Math.max(S.streak.best, S.streak.count);
  }

  const boardKey = (lang, input, mode, duration, sprintCount) =>
    `${lang}:${input}:${mode}:${mode === 'time' ? duration + 's' : sprintCount + 'x'}`;
  function labelFromKey(key) {
    const [lang, input, mode, len] = key.split(':');
    const inputName = t('inputs')[lang][input].name;
    const lenLabel = t('boardLen')[mode](parseInt(len, 10));
    return `${t('langNames')[lang]} · ${inputName} · ${lenLabel}`;
  }

  // ---------------------------------------------------------------------
  // Home screen
  // ---------------------------------------------------------------------
  function renderHome() {
    applyI18n();
    $$('.lang-card').forEach(b => b.classList.toggle('active', b.dataset.lang === set.lang));

    const inputs = LANGS[set.lang].inputs;
    if (!inputs.includes(set.input[set.lang])) set.input[set.lang] = inputs[0];
    const names = t('inputs')[set.lang];
    el.inputLabel.textContent = set.lang === 'ja' ? t('script') : t('inputMethod');
    el.inputChips.innerHTML = inputs.map(id =>
      `<button class="chip${id === set.input[set.lang] ? ' active' : ''}" data-input="${id}">${names[id].name}</button>`).join('');
    el.inputHint.textContent = names[set.input[set.lang]].hint;

    $$('#mode-chips .chip').forEach(b => b.classList.toggle('active', b.dataset.mode === set.mode));
    $$('#duration-chips .chip').forEach(b => b.classList.toggle('active', +b.dataset.duration === set.duration));
    $$('#sprint-chips .chip').forEach(b => b.classList.toggle('active', +b.dataset.sprint === set.sprintCount));
    $$('#level-chips .chip').forEach(b => b.classList.toggle('active', b.dataset.level === String(set.level)));
    el.fieldDuration.hidden = set.mode !== 'time';
    el.fieldSprint.hidden = set.mode !== 'sprint';
    const builtin = !isDirectInput(set.lang, set.input[set.lang]);
    el.toggleGuide.hidden = !builtin;
    el.toggleKeyboard.hidden = !builtin;
    el.optGuide.checked = set.guide;
    el.optKeyboard.checked = set.keyboard;
    el.optTranslation.checked = set.translation;
    Sfx.setEnabled(set.sound);

    renderTopbar();
    renderStats();
    renderGoals();
    renderBoard(el.homeBoard, el.boardLabel, boardKey(set.lang, set.input[set.lang], set.mode, set.duration, set.sprintCount), null);
    renderAchievements();
    setMascot(el.mascotHome, 'idle');
  }

  function goalProgress(lvStats, goal) {
    if (goal.id === 'rank') {
      const cur = RANK_ORDER.indexOf(lvStats.bestRank || '');
      const tierIdx = goal.tiers.findIndex(tv => cur < RANK_ORDER.indexOf(tv));
      const done = tierIdx === -1;
      const target = done ? goal.tiers[goal.tiers.length - 1] : goal.tiers[tierIdx];
      return { done, label: `${lvStats.bestRank || '-'} / ${target}`, pct: done ? 100 : (cur / RANK_ORDER.indexOf(target)) * 100 };
    }
    const cur = lvStats[goal.id] || 0;
    const target = goal.tiers.find(tv => cur < tv);
    const done = target === undefined;
    const tgt = done ? goal.tiers[goal.tiers.length - 1] : target;
    return { done, label: `${cur} / ${tgt}`, pct: done ? 100 : (cur / tgt) * 100 };
  }

  function renderGoals() {
    const names = { games: t('goalGames'), sentences: t('goalSentences'), rank: t('goalRank') };
    el.goals.innerHTML = [1, 2, 3].map(lv => {
      const ls = S.stats.levels[lv];
      const rows = GOALS.map(g => {
        const p = goalProgress(ls, g);
        return `<div class="goal${p.done ? ' done' : ''}"><span class="name">${names[g.id]}</span><span class="val">${p.label}</span><div class="bar"><span style="width:${clamp(p.pct, 0, 100)}%"></span></div></div>`;
      }).join('');
      return `<div class="goal-level"><h3><span class="tag">×${XP_MULT[lv]}</span>${t('levelNames')[lv]}</h3>${rows}</div>`;
    }).join('');
  }

  // ---------------------------------------------------------------------
  // Mascot
  // ---------------------------------------------------------------------
  let mascotTimer = 0;
  function setMascot(node, frame) {
    if (!node) return;
    const bubble = node.querySelector('.bubble');
    node.innerHTML = Sprite.cat(frame, node === el.mascotPlay ? 4 : 5);
    if (bubble) node.appendChild(bubble);
  }
  function mascotReact(frame, text, ms) {
    clearTimeout(mascotTimer);
    const node = el.mascotPlay;
    setMascot(node, frame);
    node.classList.remove('happy', 'sad');
    void node.offsetWidth;
    if (frame !== 'idle') node.classList.add(frame);
    if (text) { el.mascotBubble.textContent = text; el.mascotBubble.classList.add('show'); }
    mascotTimer = setTimeout(() => {
      setMascot(node, 'idle');
      node.classList.remove('happy', 'sad');
      el.mascotBubble.classList.remove('show');
    }, ms);
  }
  setInterval(() => {
    // Idle blink on both mascots.
    [el.mascotHome, el.mascotPlay].forEach(n => {
      if (!n || n.classList.contains('happy') || n.classList.contains('sad')) return;
      setMascot(n, 'blink');
      setTimeout(() => { if (!n.classList.contains('happy') && !n.classList.contains('sad')) setMascot(n, 'idle'); }, 160);
    });
  }, 3200);

  function renderTopbar() {
    el.streak.textContent = currentStreak();
    el.streakLabel.textContent = t('streak');
    const lv = levelFromXp(S.stats.xp);
    const lo = xpForLevel(lv), hi = xpForLevel(lv + 1);
    el.levelNum.textContent = lv;
    el.levelTitle.textContent = levelTitle(lv);
    el.xpFill.style.width = `${clamp(((S.stats.xp - lo) / (hi - lo)) * 100, 0, 100)}%`;
  }

  function statCard(k, v, unit = '') {
    return `<div class="stat"><div class="k">${k}</div><div class="v">${v}${unit ? `<small>${unit}</small>` : ''}</div></div>`;
  }

  function renderStats() {
    const st = S.stats;
    const mins = Math.round(st.seconds / 60);
    el.homeStats.innerHTML = [
      statCard(t('games'), fmt(st.games)),
      statCard(t('chars'), fmt(st.chars)),
      statCard(t('bestCombo'), fmt(st.bestCombo)),
      statCard(t('timePlayed'), mins < 60 ? fmt(mins) : (st.seconds / 3600).toFixed(1), mins < 60 ? t('min') : t('hour')),
      statCard(t('xp'), fmt(st.xp)),
      statCard(t('bestStreak'), fmt(S.streak.best), t('days')),
    ].join('');
  }

  function renderBoard(listEl, labelEl, key, highlightIdx) {
    const board = S.boards[key] || [];
    if (labelEl) labelEl.textContent = labelFromKey(key);
    if (!board.length) {
      listEl.innerHTML = `<li class="empty">${t('noScores')}</li>`;
      return;
    }
    listEl.innerHTML = board.map((e, i) => `
      <li${i === highlightIdx ? ' class="me"' : ''}>
        <span class="pos">${i + 1}</span>
        <span><span class="rank-badge">${e.rank}</span><span class="meta">${e.speed} ${t(e.speedUnit)} · ${e.acc}% · ${e.combo}x · ${e.date}</span></span>
        <span class="sc">${fmt(e.score)}</span>
      </li>`).join('');
  }

  function renderAchievements() {
    const unlocked = Object.keys(S.achievements).length;
    el.achCount.textContent = `${unlocked} / ${ACHIEVEMENTS.length}`;
    el.achGrid.innerHTML = ACHIEVEMENTS.map(a => {
      const when = S.achievements[a.id];
      const [name, desc] = t('ach')[a.id];
      return `<div class="ach${when ? ' unlocked' : ''}" title="${name} — ${desc}${when ? ' (' + when + ')' : ''}">${a.ico}</div>`;
    }).join('');
  }

  // ---------------------------------------------------------------------
  // Game lifecycle
  // ---------------------------------------------------------------------
  function showScreen(name) {
    Object.entries(el.screens).forEach(([k, s]) => s.classList.toggle('active', k === name));
    window.scrollTo({ top: 0 });
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function startGame() {
    Sfx.unlock();
    const input = set.input[set.lang];
    Object.assign(G, {
      active: true, phase: 'countdown',
      lang: set.lang, input, direct: isDirectInput(set.lang, input),
      mode: set.mode, duration: set.duration, sprintCount: set.sprintCount, level: String(set.level),
      poolIdx: 0, sentence: null, target: '', units: [], uIdx: 0, buf: '',
      startAt: 0, elapsed: 0,
      score: 0, combo: 0, maxCombo: 0, hits: 0, misses: 0, keys: 0, chars: 0,
      sentences: 0, perfect: 0, sentenceMisses: 0, levelSentences: { 1: 0, 2: 0, 3: 0 },
      ime: { scored: 0, flagged: false, composing: false },
    });
    const all = LANGS[G.lang].sentences();
    const filtered = G.level === 'mixed' ? all : all.filter(s => s.level === +G.level);
    G.pool = shuffle(filtered.length ? filtered : all);

    el.hudSpeedLabel.textContent = t(G.direct ? 'cpm' : 'kpm');
    el.hudTimeLabel.textContent = G.mode === 'time' ? t('hudTime') : t('hudSentences');
    el.timebar.classList.remove('low');
    el.timebar.style.width = '100%';
    el.directInput.hidden = !G.direct;
    el.directInput.value = '';
    el.directInput.classList.remove('bad');
    el.floatLayer.innerHTML = '';
    buildKeyboard();
    updateHud();
    setMascot(el.mascotPlay, 'idle');
    el.mascotBubble.classList.remove('show');
    showScreen('play');

    loadSentence();
    el.card.classList.add('blur');
    runCountdown(3);
  }

  function runCountdown(n) {
    el.countdown.hidden = false;
    el.countdown.textContent = n;
    el.countdown.style.animation = 'none';
    void el.countdown.offsetWidth; // restart the animation
    el.countdown.style.animation = '';
    Sfx.countdown();
    G.timer = setTimeout(() => {
      if (!G.active) return;
      if (n > 1) return runCountdown(n - 1);
      el.countdown.hidden = true;
      el.card.classList.remove('blur');
      Sfx.go();
      beginPlay();
    }, 1000);
  }

  function beginPlay() {
    G.phase = 'play';
    G.startAt = performance.now();
    if (G.direct) el.directInput.focus();
    tick();
  }

  function tick() {
    if (G.phase !== 'play') return;
    G.elapsed = (performance.now() - G.startAt) / 1000;
    if (G.mode === 'time') {
      const left = Math.max(0, G.duration - G.elapsed);
      el.hudTime.textContent = Math.ceil(left);
      el.timebar.style.width = `${(left / G.duration) * 100}%`;
      el.timebar.classList.toggle('low', left <= 10);
      if (left <= 0) return finishGame();
    } else {
      el.hudTime.textContent = `${G.sentences}/${G.sprintCount}`;
      el.timebar.style.width = `${(G.sentences / G.sprintCount) * 100}%`;
    }
    const mins = Math.max(G.elapsed, 1) / 60;
    el.hudSpeed.textContent = Math.round((G.direct ? G.chars : G.keys) / mins);
    G.raf = requestAnimationFrame(tick);
  }

  function quitGame() {
    G.active = false;
    G.phase = 'idle';
    clearTimeout(G.timer);
    cancelAnimationFrame(G.raf);
    el.countdown.hidden = true;
    el.card.classList.remove('blur');
    el.directInput.blur();
    renderHome();
    showScreen('home');
  }

  // ---------------------------------------------------------------------
  // Sentences & units
  // ---------------------------------------------------------------------
  function loadSentence() {
    if (G.poolIdx >= G.pool.length) { G.pool = shuffle(G.pool); G.poolIdx = 0; }
    G.sentence = G.pool[G.poolIdx++];
    G.uIdx = 0;
    G.buf = '';
    G.sentenceMisses = 0;
    G.ime = { scored: 0, flagged: false, composing: false };
    el.directInput.value = '';
    el.directInput.classList.remove('bad');

    if (G.lang === 'ja') G.target = G.input === 'hiragana' ? kataToHira(G.sentence.reading) : G.sentence.text;
    else G.target = G.sentence.text;
    G.units = G.direct ? [] : Hangul.buildUnits(G.target);

    el.en.textContent = set.translation ? G.sentence.en : '';
    renderSentence();
    renderDots();
  }

  function renderDots() {
    if (G.mode !== 'sprint') { el.dots.innerHTML = ''; return; }
    el.dots.innerHTML = Array.from({ length: G.sprintCount }, (_, i) => Sprite.star(2, i < G.sentences)).join('');
  }

  function unitSpan(cls, text) {
    const ws = text === ' ' || text === '　' ? ' ws' : '';
    return `<span class="u ${cls}${ws}">${ws ? ' ' : escapeHtml(text)}</span>`;
  }

  function renderSentence() {
    if (G.direct) return renderDirect();
    const cur = G.uIdx;
    el.main.innerHTML = G.units.map((u, i) => {
      if (i === cur && G.buf) return unitSpan('cur', u.partial(G.buf));
      return unitSpan(i < cur ? 'done' : i === cur ? 'cur' : 'pend', u.text);
    }).join('');

    if (set.guide) {
      el.guide.innerHTML = G.units.map((u, i) => {
        if (u.text === ' ') return '<span class="g sp"></span>';
        if (i < cur) return `<span class="g done">${escapeHtml(u.typed)}</span>`;
        if (i === cur) return `<span class="g cur"><span class="typed">${escapeHtml(G.buf)}</span><span class="rest">${escapeHtml(u.canon.slice(G.buf.length))}</span></span>`;
        return `<span class="g pend">${escapeHtml(u.canon)}</span>`;
      }).join('');
    } else {
      el.guide.innerHTML = '';
    }
    highlightNextKey();
  }

  function nextKey() {
    const u = G.units[G.uIdx];
    return u ? u.canon[G.buf.length] || '' : '';
  }

  // ---------------------------------------------------------------------
  // Built-in 2-set keyboard input (Korean)
  // ---------------------------------------------------------------------
  function pressKey(key) {
    const u = G.units[G.uIdx];
    if (!u) return false;
    const cand = G.buf + key;
    if (!u.canon.startsWith(cand)) return false;
    G.buf = cand;
    if (cand === u.canon) {
      u.typed = cand;
      G.chars += u.text.length;
      G.uIdx++;
      G.buf = '';
      if (G.uIdx >= G.units.length) completeSentence();
    }
    return true;
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') { e.preventDefault(); return quitGame(); }
    if (G.phase !== 'play' || G.direct) return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    if (e.key.length !== 1) return;
    e.preventDefault();

    let key = e.key;
    if (/^[a-zA-Z]$/.test(key)) {
      // 2-set layout: Shift picks the double consonants / ㅒ ㅖ. Ignore Caps Lock.
      const caps = typeof e.getModifierState === 'function' && e.getModifierState('CapsLock');
      if (caps) key = e.shiftKey ? key.toUpperCase() : key.toLowerCase();
      else if (e.shiftKey) key = key.toUpperCase();
    }
    flashKey(key);
    if (pressKey(key)) onHit(); else onMiss();
    renderSentence();
    updateHud();
  }

  // ---------------------------------------------------------------------
  // IME input (Japanese hiragana / mixed, Korean direct)
  // ---------------------------------------------------------------------
  function renderDirect() {
    const target = G.target;
    const typed = el.directInput.value;
    const composing = G.ime.composing;
    let html = '';
    let mismatch = false;
    for (let i = 0; i < target.length; i++) {
      const ch = target[i];
      if (i < typed.length) {
        if (!mismatch && typed[i] === ch) html += unitSpan('done', ch);
        else { mismatch = true; html += unitSpan(composing ? 'comp' : 'bad', ch); }
      } else html += unitSpan(i === typed.length ? 'cur' : 'pend', ch);
    }
    el.main.innerHTML = html;
    el.guide.innerHTML = '';
    el.directInput.classList.toggle('bad', mismatch && !composing);
  }

  function evaluateDirect() {
    if (G.phase !== 'play' || !G.direct) return;
    const target = G.target;
    let typed = el.directInput.value;
    if (!target.endsWith(' ') && typed.length > target.length) typed = typed.replace(/\s+$/, '');
    let correct = 0;
    while (correct < typed.length && correct < target.length && typed[correct] === target[correct]) correct++;

    // Newly reached correct characters count as hits (one sound per commit).
    if (G.ime.scored < correct) Sfx.hit(G.combo);
    while (G.ime.scored < correct) {
      G.ime.scored++;
      G.chars++;
      onHit(false);
    }
    const mismatch = typed.length > correct;
    if (mismatch && !G.ime.flagged) { G.ime.flagged = true; onMiss(); }
    if (!mismatch) G.ime.flagged = false;

    if (typed === target) completeSentence();
    else renderDirect();
    updateHud();
  }

  // ---------------------------------------------------------------------
  // Scoring
  // ---------------------------------------------------------------------
  const unitValue = () => (G.direct ? 25 : 10);
  const multiplier = () => 1 + Math.min(G.combo, 100) / 50;

  function onHit(playSound = true) {
    G.hits++;
    if (!G.direct) G.keys++;
    G.combo++;
    G.maxCombo = Math.max(G.maxCombo, G.combo);
    G.score += unitValue() * multiplier();
    if (playSound) Sfx.hit(G.combo);
    el.hudComboBox.classList.add('pop');
    setTimeout(() => el.hudComboBox.classList.remove('pop'), 90);
    if (G.combo === 25 || (G.combo >= 50 && G.combo % 50 === 0)) {
      floatText(`${G.combo} ${t('comboHit')}`, 'big');
      Sfx.milestone();
    }
  }

  function onMiss() {
    G.misses++;
    G.sentenceMisses++;
    if (G.combo >= 10) floatText(t('comboLost'), 'lost');
    G.combo = 0;
    Sfx.miss();
    mascotReact('sad', t('mascotSad'), 700);
    el.card.classList.remove('shake');
    void el.card.offsetWidth;
    el.card.classList.add('shake');
  }

  function completeSentence() {
    G.sentences++;
    G.levelSentences[G.sentence.level]++;
    let bonus = 100;
    if (G.sentenceMisses === 0) { bonus += 100; G.perfect++; floatText(t('perfectFloat'), 'ok'); mascotReact('happy', t('mascotHappy'), 1000); }
    else floatText(t('bonusFloat'), 'ok');
    G.score += bonus;
    Sfx.sentence();
    el.card.classList.remove('flash');
    void el.card.offsetWidth;
    el.card.classList.add('flash');
    updateHud();
    if (G.mode === 'sprint' && G.sentences >= G.sprintCount) return finishGame();
    loadSentence();
  }

  function updateHud() {
    el.hudScore.textContent = fmt(G.score);
    el.hudCombo.textContent = G.combo;
    el.hudComboBox.classList.toggle('hot', G.combo >= 25);
    const total = G.hits + G.misses;
    el.hudAcc.textContent = `${total ? Math.round((G.hits / total) * 100) : 100}%`;
    if (G.mode === 'sprint') el.hudTime.textContent = `${G.sentences}/${G.sprintCount}`;
  }

  function floatText(text, cls) {
    const d = document.createElement('div');
    d.className = `floater ${cls}`;
    d.textContent = text;
    d.style.left = `${40 + Math.random() * 20}%`;
    el.floatLayer.appendChild(d);
    setTimeout(() => d.remove(), 900);
  }

  // ---------------------------------------------------------------------
  // On-screen keyboard (Korean 2-set mode only)
  // ---------------------------------------------------------------------
  const KEY_ROWS = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
    [' '],
  ];
  const SHIFT_MAP = { '?': '/', '!': '1', '~': '`', '_': '-' };

  function buildKeyboard() {
    if (!set.keyboard || G.direct) { el.keyboard.innerHTML = ''; return; }
    el.keyboard.innerHTML = KEY_ROWS.map(row => `<div class="krow">${row.map(k => {
      if (k === 'shift') return '<div class="key wide" data-key="shift">⇧</div>';
      if (k === ' ') return '<div class="key space" data-key=" ">space</div>';
      if (Hangul.KEY_LABELS[k]) {
        const sh = Hangul.SHIFT_LABELS[k] ? `<span class="shifted">${Hangul.SHIFT_LABELS[k]}</span>` : '';
        return `<div class="key" data-key="${k}">${sh}<span class="jamo">${Hangul.KEY_LABELS[k]}</span></div>`;
      }
      return `<div class="key" data-key="${k}">${k}</div>`;
    }).join('')}</div>`).join('');
  }

  function highlightNextKey() {
    if (!el.keyboard.children.length) return;
    $$('.key.next').forEach(k => k.classList.remove('next'));
    const nk = nextKey();
    if (!nk) return;
    const upper = nk !== nk.toLowerCase();
    const base = SHIFT_MAP[nk] || nk.toLowerCase();
    const k = el.keyboard.querySelector(`.key[data-key="${CSS.escape(base)}"]`);
    if (k) k.classList.add('next');
    if (upper || SHIFT_MAP[nk]) el.keyboard.querySelector('.key[data-key="shift"]').classList.add('next');
  }

  function flashKey(key) {
    if (!el.keyboard.children.length) return;
    const base = SHIFT_MAP[key] || key.toLowerCase();
    const k = el.keyboard.querySelector(`.key[data-key="${CSS.escape(base)}"]`);
    if (!k) return;
    k.classList.add('pressed');
    setTimeout(() => k.classList.remove('pressed'), 120);
  }

  // ---------------------------------------------------------------------
  // Finish & results
  // ---------------------------------------------------------------------
  function finishGame() {
    if (G.phase !== 'play') return;
    G.phase = 'done';
    G.active = false;
    cancelAnimationFrame(G.raf);
    el.directInput.blur();
    G.elapsed = (performance.now() - G.startAt) / 1000;

    const minutes = Math.max(G.elapsed, 1) / 60;
    const total = G.hits + G.misses;
    const r = {
      lang: G.lang, input: G.input, mode: G.mode, duration: G.duration, sprintCount: G.sprintCount, level: G.level,
      score: Math.round(G.score),
      speed: Math.round((G.direct ? G.chars : G.keys) / minutes),
      speedUnit: G.direct ? 'cpm' : 'kpm',
      acc: total ? Math.round((G.hits / total) * 100) : 100,
      maxCombo: G.maxCombo, misses: G.misses, sentences: G.sentences, perfect: G.perfect,
      chars: G.chars, seconds: Math.round(G.elapsed), hour: new Date().getHours(),
    };
    r.rank = RANKS.find(x => r.score / minutes >= x.min).r;

    // Persist.
    const st = S.stats;
    st.games++; st.chars += r.chars; st.keys += G.keys; st.seconds += r.seconds;
    st.bestCombo = Math.max(st.bestCombo, r.maxCombo);
    st.langs[r.lang] = (st.langs[r.lang] || 0) + 1;
    const prevLevel = levelFromXp(st.xp);
    r.xp = Math.round((r.score / 10) * XP_MULT[r.level]);
    st.xp += r.xp;
    for (const lv of [1, 2, 3]) st.levels[lv].sentences += G.levelSentences[lv];
    if (r.level !== 'mixed') {
      const ls = st.levels[r.level];
      ls.games++;
      ls.bestScore = Math.max(ls.bestScore, r.score);
      if (RANK_ORDER.indexOf(r.rank) > RANK_ORDER.indexOf(ls.bestRank || '')) ls.bestRank = r.rank;
    }
    touchStreak();

    const key = boardKey(r.lang, r.input, r.mode, r.duration, r.sprintCount);
    const board = S.boards[key] || [];
    const prevBest = board.length ? board[0].score : 0;
    const entry = { score: r.score, speed: r.speed, speedUnit: r.speedUnit, acc: r.acc, combo: r.maxCombo, rank: r.rank, date: todayStr(), ts: Date.now() };
    board.push(entry);
    board.sort((a, b) => b.score - a.score || b.ts - a.ts);
    S.boards[key] = board.slice(0, 10);
    const myIdx = S.boards[key].indexOf(entry);
    const isRecord = r.score > prevBest && r.score > 0;

    const unlocked = [];
    for (const a of ACHIEVEMENTS) {
      if (S.achievements[a.id]) continue;
      let ok = false;
      try { ok = a.test(r, S); } catch (e) { ok = false; }
      if (ok) { S.achievements[a.id] = todayStr(); unlocked.push(a); }
    }
    Store.save();

    // Render the result screen.
    el.resultRank.textContent = r.rank;
    el.resultRankLabel.textContent = `${t('rank')} ${r.rank} · ${t('ranks')[r.rank]}`;
    el.resultScore.textContent = fmt(r.score);
    el.newRecord.hidden = !isRecord;
    el.resultStats.innerHTML = [
      statCard(t('speed'), r.speed, t(r.speedUnit)),
      statCard(t('accuracy'), r.acc, '%'),
      statCard(t('maxCombo'), r.maxCombo, 'x'),
      statCard(t('sentencesDone'), r.sentences, r.perfect ? `${t('perfect')} ${r.perfect}` : ''),
      statCard(t('misses'), r.misses),
      statCard(t('xpEarned'), `+${fmt(r.xp)}`, `×${XP_MULT[r.level]}`),
    ].join('');
    el.resultAch.hidden = !unlocked.length;
    el.resultAch.innerHTML = unlocked.map(a => {
      const [name, desc] = t('ach')[a.id];
      return `<div class="unlock"><span class="ico">${a.ico}</span><div><b>${t('achUnlocked')}: ${name}</b><span>${desc}</span></div></div>`;
    }).join('');
    renderBoard(el.resultBoard, el.resultBoardLabel, key, myIdx);
    renderTopbar();
    showScreen('result');

    Sfx.finish();
    if (isRecord) { Sfx.record(); confetti(); }
    const newLevel = levelFromXp(st.xp);
    if (newLevel > prevLevel) setTimeout(() => toast('⬆', `${t('levelUp')} ${t('lv')}${newLevel}`, levelTitle(newLevel)), 600);
  }

  function toast(ico, title, desc) {
    const d = document.createElement('div');
    d.className = 'toast';
    d.innerHTML = `<span class="ico">${ico}</span><div><b>${escapeHtml(title)}</b><span>${escapeHtml(desc)}</span></div>`;
    el.toastLayer.appendChild(d);
    setTimeout(() => { d.style.opacity = '0'; d.style.transition = 'opacity 0.4s'; setTimeout(() => d.remove(), 400); }, 3500);
  }

  // ---------------------------------------------------------------------
  // Confetti (kept small and in the accent colour)
  // ---------------------------------------------------------------------
  function confetti() {
    const c = el.confetti;
    const ctx = c.getContext('2d');
    c.width = window.innerWidth; c.height = window.innerHeight;
    const accent = getComputedStyle(el.root).getPropertyValue('--accent').trim();
    const muted = getComputedStyle(el.root).getPropertyValue('--muted').trim();
    const parts = Array.from({ length: 90 }, () => ({
      x: Math.random() * c.width, y: -20 - Math.random() * c.height * 0.4,
      w: 5 + Math.random() * 4, h: 7 + Math.random() * 6,
      vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3,
      rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.25,
      color: Math.random() < 0.7 ? accent : muted,
    }));
    const start = performance.now();
    (function frame(now) {
      const tt = (now - start) / 1000;
      ctx.clearRect(0, 0, c.width, c.height);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vy += 0.03;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color; ctx.globalAlpha = clamp(3 - tt, 0, 1);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      }
      if (tt < 3) requestAnimationFrame(frame); else ctx.clearRect(0, 0, c.width, c.height);
    })(start);
  }

  // ---------------------------------------------------------------------
  // Event wiring
  // ---------------------------------------------------------------------
  function persist() { Store.save(); renderHome(); }

  $$('.lang-card').forEach(b => b.addEventListener('click', () => { set.lang = b.dataset.lang; persist(); }));
  el.inputChips.addEventListener('click', e => {
    const b = e.target.closest('[data-input]');
    if (b) { set.input[set.lang] = b.dataset.input; persist(); }
  });
  $('#mode-chips').addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if (b) { set.mode = b.dataset.mode; persist(); } });
  $('#duration-chips').addEventListener('click', e => { const b = e.target.closest('[data-duration]'); if (b) { set.duration = +b.dataset.duration; persist(); } });
  $('#sprint-chips').addEventListener('click', e => { const b = e.target.closest('[data-sprint]'); if (b) { set.sprintCount = +b.dataset.sprint; persist(); } });
  $('#level-chips').addEventListener('click', e => { const b = e.target.closest('[data-level]'); if (b) { set.level = b.dataset.level === 'mixed' ? 'mixed' : +b.dataset.level; persist(); } });
  el.optGuide.addEventListener('change', () => { set.guide = el.optGuide.checked; persist(); });
  el.optKeyboard.addEventListener('change', () => { set.keyboard = el.optKeyboard.checked; persist(); });
  el.optTranslation.addEventListener('change', () => { set.translation = el.optTranslation.checked; persist(); });
  el.btnSound.addEventListener('click', () => {
    set.sound = !set.sound; Sfx.setEnabled(set.sound); Store.save();
    el.btnSound.innerHTML = set.sound ? ICONS.soundOn : ICONS.soundOff;
  });
  el.btnTheme.addEventListener('click', () => {
    set.theme = resolvedTheme() === 'dark' ? 'light' : 'dark';
    Store.save();
    applyTheme();
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (set.theme === 'system') applyTheme(); });

  el.btnStart.addEventListener('click', startGame);
  el.btnRetry.addEventListener('click', startGame);
  el.btnHome.addEventListener('click', () => { renderHome(); showScreen('home'); });
  $('#brand-home').addEventListener('click', () => { if (G.active) quitGame(); else { renderHome(); showScreen('home'); } });
  el.btnReset.addEventListener('click', () => {
    if (confirm(t('resetConfirm'))) {
      Store.reset();
      location.reload();
    }
  });

  document.addEventListener('keydown', e => {
    if (G.active) return onKeyDown(e);
    if (e.key === 'Enter' && !e.repeat && (el.screens.home.classList.contains('active') || el.screens.result.classList.contains('active'))) {
      const a = document.activeElement;
      if (a && a.tagName === 'BUTTON' && a !== el.btnStart && a !== el.btnRetry) return;
      e.preventDefault();
      startGame();
    }
  });

  el.directInput.addEventListener('compositionstart', () => { G.ime.composing = true; });
  el.directInput.addEventListener('compositionend', () => { G.ime.composing = false; evaluateDirect(); });
  el.directInput.addEventListener('input', e => {
    if (G.phase !== 'play') return;
    if (G.ime.composing || e.isComposing) renderDirect(); else evaluateDirect();
  });
  el.directInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); G.ime.composing = false; evaluateDirect(); }
  });
  el.directInput.addEventListener('blur', () => { if (G.phase === 'play' && G.direct) setTimeout(() => el.directInput.focus(), 50); });
  el.card.addEventListener('click', () => { if (G.phase === 'play' && G.direct) el.directInput.focus(); });

  window.addEventListener('resize', () => { el.confetti.width = window.innerWidth; el.confetti.height = window.innerHeight; });

  // Boot.
  $('.brand-heart').innerHTML = Sprite.heart(2);
  $('.pixel-heart').innerHTML = Sprite.heart(2);
  renderHome();
  showScreen('home');
})();
