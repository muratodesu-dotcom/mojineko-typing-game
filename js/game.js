(() => {
  'use strict';

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = n => Math.round(n).toLocaleString('en-US');
  const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const kataToHira = s => s.replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
  const isPunct = ch => /[\s、。！？!?.,「」・～\-]/.test(ch);
  const isKanji = ch => /[一-龯々〆]/.test(ch);

  // Align kanji runs to their readings by anchoring on the kana between them.
  // Returns [{ t, r? }] segments, or null when the reading cannot be aligned.
  function alignFurigana(text, reading) {
    if (!reading || reading === text) return null;
    const hira = kataToHira(reading);
    const segs = [];
    for (const ch of text) {
      const k = isKanji(ch);
      const last = segs[segs.length - 1];
      if (last && last.kanji === k) last.t += ch; else segs.push({ t: ch, kanji: k });
    }
    if (!segs.some(s => s.kanji)) return null;
    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let m = null;
    try { m = hira.match(new RegExp('^' + segs.map(s => s.kanji ? '(.+?)' : esc(kataToHira(s.t))).join('') + '$')); } catch (e) { m = null; }
    if (!m) return null;
    let gi = 1;
    return segs.map(s => s.kanji ? { t: s.t, r: m[gi++] } : { t: s.t });
  }

  // ---------------------------------------------------------------------
  // Static config
  // ---------------------------------------------------------------------
  const LANGS = {
    ja: { sentences: () => JA_SENTENCES, drills: () => JA_DRILLS, paragraphs: () => JA_PARAGRAPHS, inputs: ['hiragana', 'mixed'] },   // both typed through the IME
    ko: { sentences: () => KO_SENTENCES, drills: () => KO_DRILLS, paragraphs: () => KO_PARAGRAPHS, inputs: ['jamo', 'direct'] },
    en: { sentences: () => EN_SENTENCES, drills: () => EN_DRILLS, paragraphs: () => EN_PARAGRAPHS, inputs: ['keys'] },
  };
  const plainUnits = text => [...text].map(ch => ({ text: ch, alts: [ch], canon: ch, typed: '', partial: p => p }));
  const speedUnitFor = (lang, direct) => (direct ? 'cpm' : lang === 'en' ? 'wpm' : 'kpm');
  const isDirectInput = (lang, input) => lang === 'ja' || input === 'direct';
  const PACKS = ['all', 'daily', 'travel', 'work', 'food', 'weak', 'custom'];
  const FONTS = ['clean', 'round', 'serif', 'pixel', 'system'];
  const PETS = ['cat', 'dog', 'rabbit', 'bear', 'chick'];
  const SIZES = ['s', 'm', 'l'];
  const COUNT_MODES = { sprint: null, daily: 10, drill: 15, paragraph: 3 }; // null = user-selected
  const PARAGRAPH_SENTENCES = 4;
  const EGG_RATE = 1 / 12; // chance per round that the easter-egg sentence appears (Japanese and Korean)
  const EGG_MAX_PER_DAY = 2;
  const EGGS = { ja: () => JA_EGG, ko: () => KO_EGG };

  const RANKS = [
    { r: 'S', min: 8000 }, { r: 'A', min: 5500 }, { r: 'B', min: 3500 },
    { r: 'C', min: 2000 }, { r: 'D', min: 900 }, { r: 'E', min: 0 },
  ];
  const RANK_ORDER = ['', 'E', 'D', 'C', 'B', 'A', 'S'];
  const XP_MULT = { 1: 1, 2: 1.25, 3: 1.5, mixed: 1.2 };

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
    { id: 'trilingual', ico: '🌐', test: (r, s) => s.stats.langs.ja > 0 && s.stats.langs.ko > 0 && (s.stats.langs.en || 0) > 0 },
    { id: 'lucky', ico: '🍀', test: r => r.lucky },
    { id: 'streak3', ico: '📅', test: (r, s) => s.streak.count >= 3 },
    { id: 'streak7', ico: '🗓️', test: (r, s) => s.streak.count >= 7 },
    { id: 'chars10k', ico: '📚', test: (r, s) => s.stats.chars >= 10000 },
    { id: 'sprint', ico: '🏁', test: r => r.mode === 'sprint' && r.count === 20 },
    { id: 'night', ico: '🌙', test: r => r.hour >= 0 && r.hour < 4 },
    { id: 'catLover', ico: '🐱', test: (r, s) => s.stats.pets >= 100 },
    { id: 'dailyOne', ico: '📆', test: r => r.mode === 'daily' && r.sentences >= 10 },
    { id: 'drillOne', ico: '🧘', test: r => r.mode === 'drill' && r.sentences >= 15 },
    { id: 'revenge', ico: '⚔️', test: r => r.pack === 'weak' && r.sentences >= 3 },
    { id: 'paragraph', ico: '📜', test: r => r.mode === 'paragraph' && r.sentences >= 3 },
    // Difficulty-based
    { id: 'easyClear', ico: '🌱', test: r => r.level === '1' && r.sentences >= 3 },
    { id: 'normalClear', ico: '🌿', test: r => r.level === '2' && r.sentences >= 3 },
    { id: 'hardClear', ico: '🌳', test: r => r.level === '3' && r.sentences >= 3 },
    { id: 'easyS', ico: '🍬', test: r => r.level === '1' && r.rank === 'S' },
    { id: 'normalS', ico: '🍡', test: r => r.level === '2' && r.rank === 'S' },
    { id: 'hardS', ico: '🎂', test: r => r.level === '3' && r.rank === 'S' },
    { id: 'hardPerfect', ico: '🏔️', test: r => r.level === '3' && r.misses === 0 && r.sentences >= 3 },
    { id: 'hardSprint', ico: '🦾', test: r => r.level === '3' && r.mode === 'sprint' && r.count === 20 },
  ];

  const GOALS = [
    { id: 'games', tiers: [3, 10, 30] },
    { id: 'sentences', tiers: [10, 50, 200] },
    { id: 'rank', tiers: ['B', 'A', 'S'] },
  ];

  const ICONS = {
    sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    soundOn: '<svg viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5.5a9 9 0 0 1 0 13"/></svg>',
    soundOff: '<svg viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6"/></svg>',
    help: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.8.5-1.1 1-1.1 1.8M12 17h.01"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  };

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------
  const S = Store.load();
  const set = S.settings;
  const t = key => I18N[set.lang][key];

  const G = {
    active: false, phase: 'idle', // idle | countdown | play | done
    lang: 'ja', input: 'hiragana', direct: true, mode: 'time', duration: 60, count: 10, level: 'mixed', pack: 'all',
    pool: [], poolIdx: 0, sentence: null, target: '', units: [], uIdx: 0, buf: '', err: '', furi: null,
    startAt: 0, elapsed: 0, raf: 0, timer: 0, timeline: [], ghost: null,
    score: 0, combo: 0, maxCombo: 0, hits: 0, misses: 0, keys: 0, chars: 0,
    sentences: 0, perfect: 0, sentenceMisses: 0, levelSentences: { 1: 0, 2: 0, 3: 0 }, roundMisses: {},
    ime: { scored: 0, flagged: false, composing: false },
  };

  const el = {
    root: document.documentElement,
    screens: { home: $('#screen-home'), play: $('#screen-play'), result: $('#screen-result') },
    inputLabel: $('#input-label'), inputChips: $('#input-chips'), inputHint: $('#input-hint'), modeHint: $('#mode-hint'),
    fieldDuration: $('#field-duration'), fieldSprint: $('#field-sprint'), fieldPack: $('#field-pack'), fieldLevel: $('#field-level'),
    fontChips: $('#font-chips'), sizeChips: $('#size-chips'), petChips: $('#pet-chips'),
    cheerHome: $('#cheer-home-text'), cheerResult: $('#cheer-result-text'),
    packChips: $('#pack-chips'), packHint: $('#pack-hint'), customEditor: $('#custom-editor'), customText: $('#custom-text'), customHelp: $('#custom-help'), btnCustomSave: $('#btn-custom-save'),
    toggleGuide: $('#toggle-guide'), toggleKeyboard: $('#toggle-keyboard'), toggleStrict: $('#toggle-strict'), toggleFurigana: $('#toggle-furigana'), toggleHideInput: $('#toggle-hide-input'),
    optGuide: $('#opt-guide'), optKeyboard: $('#opt-keyboard'), optStrict: $('#opt-strict'), optFurigana: $('#opt-furigana'), optHideInput: $('#opt-hide-input'), optTranslation: $('#opt-translation'), optVolume: $('#opt-volume'),
    btnStart: $('#btn-start'), btnRetry: $('#btn-retry'), btnHome: $('#btn-home'), btnReset: $('#btn-reset'), btnShare: $('#btn-share'),
    btnExport: $('#btn-export'), btnImport: $('#btn-import'), importFile: $('#import-file'),
    btnSound: $('#btn-sound'), btnTheme: $('#btn-theme'), btnSettings: $('#btn-settings'), btnSettingsClose: $('#btn-settings-close'), settingsModal: $('#settings-modal'),
    btnHelp: $('#btn-help'), btnAboutClose: $('#btn-about-close'), aboutModal: $('#about-modal'), aboutBody: $('#about-body'), brandMark: $('#brand-mark'),
    sideTabs: $('#side-tabs'),
    goals: $('#goals'), mascotHome: $('#mascot-home'), mascotPlay: $('#mascot-play'), mascotPreview: $('#mascot-preview'), mascotNext: $('#mascot-next'),
    homeStats: $('#home-stats'), homeBoard: $('#home-board'), boardLabel: $('#board-label'), achGrid: $('#ach-grid'), achCount: $('#ach-count'),
    historyChart: $('#history-chart'), historyList: $('#history-list'), historyLabel: $('#history-label'), dailyList: $('#daily-list'), dailyLabel: $('#daily-label'),
    streak: $('#streak-count'), streakLabel: $('#streak-label'), levelNum: $('#level-num'), levelTitle: $('#level-title'), xpFill: $('#xp-fill'),
    hudTime: $('#hud-time'), hudTimeLabel: $('#hud-time-label'), hudScore: $('#hud-score'), hudCombo: $('#hud-combo'),
    hudComboBox: $('.hud-item.combo'), hudSpeed: $('#hud-speed'), hudSpeedLabel: $('#hud-speed-label'), hudAcc: $('#hud-acc'),
    hudGhostBox: $('#hud-ghost-box'), hudGhost: $('#hud-ghost'), ghostMarker: $('#ghost-marker'),
    timebar: $('#timebar-fill'), countdown: $('#countdown'), card: $('#sentence-card'), dots: $('#progress-dots'),
    main: $('#sentence-main'), reading: $('#sentence-reading'), guide: $('#sentence-guide'), en: $('#sentence-en'),
    directInput: $('#direct-input'), floatLayer: $('#float-layer'), keyboard: $('#keyboard'), playHint: $('#play-hint'),
    resultRank: $('#result-rank'), resultRankLabel: $('#result-rank-label'), resultScore: $('#result-score'), newRecord: $('#new-record'),
    resultStats: $('#result-stats'), resultAch: $('#result-ach'), resultBoard: $('#result-board'), resultBoardLabel: $('#result-board-label'),
    resultWeak: $('#result-weak'), weakChips: $('#weak-chips'), shareCanvas: $('#share-canvas'),
    confetti: $('#confetti'), toastLayer: $('#toast-layer'),
  };

  let lastResult = null;

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
  function applyDisplay() {
    el.root.dataset.font = set.font;
    el.root.dataset.size = set.textSize;
  }
  function applyI18n() {
    el.root.dataset.lang = set.lang;
    el.root.lang = set.lang;
    document.title = t('pageTitle');
    applyDisplay();
    $$('[data-t]').forEach(n => { n.textContent = t(n.dataset.t); });
    el.playHint.innerHTML = t('quitHint').replace('Esc', '<kbd>Esc</kbd>');
    el.newRecord.textContent = t('newRecord');
    el.btnSound.innerHTML = set.sound ? ICONS.soundOn : ICONS.soundOff;
    el.btnSound.title = t('sound');
    el.customHelp.textContent = t('customHelp');
    el.btnSettings.innerHTML = ICONS.gear;
    el.btnSettings.title = t('settingsTitle');
    el.btnHelp.innerHTML = ICONS.help;
    el.btnHelp.title = t('aboutTitle');
    el.brandMark.innerHTML = Sprite.cat('idle', 2);
    applyTheme();
  }

  // About / how-to dialog: built from the i18n text of the current language.
  function renderAbout() {
    const a = t('about');
    const esc = x => String(x).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const rich = x => esc(x).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    const list = (tag, items) => `<${tag}>${items.map(i => `<li>${rich(i)}</li>`).join('')}</${tag}>`;
    el.aboutBody.innerHTML = `
      <section><h3>${Sprite.cat('happy', 2)}${esc(a.whatTitle)}</h3>${a.what.map(x => `<p>${rich(x)}</p>`).join('')}</section>
      <section><h3>${Sprite.star(2)}${esc(a.howTitle)}</h3>${list('ol', a.how)}</section>
      <section><h3>${Sprite.heart(2)}${esc(a.tipsTitle)}</h3>${list('ul', a.tips)}</section>
      <p class="about-foot">${esc(a.foot)}</p>`;
  }

  // ---------------------------------------------------------------------
  // Helpers: level, streak, boards, dates, seeded random
  // ---------------------------------------------------------------------
  const levelFromXp = xp => Math.floor(Math.sqrt(xp / 400)) + 1;
  const xpForLevel = lv => (lv - 1) * (lv - 1) * 400;
  const levelTitle = lv => t('titles')[clamp(Math.floor((lv - 1) / 3), 0, t('titles').length - 1)];

  const dateStr = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayStr = () => dateStr(new Date());
  function daysBetween(a, b) {
    const [y1, m1, d1] = a.split('-').map(Number);
    const [y2, m2, d2] = b.split('-').map(Number);
    return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
  }
  const freezeAvailable = today => !S.streak.freezeUsed || daysBetween(S.streak.freezeUsed, today) >= 7;
  function currentStreak() {
    if (!S.streak.last) return 0;
    const gap = daysBetween(S.streak.last, todayStr());
    if (gap <= 1) return S.streak.count;
    if (gap === 2 && freezeAvailable(todayStr())) return S.streak.count; // protected until played today
    return 0;
  }
  // Returns true when a streak freeze was consumed.
  function touchStreak() {
    const today = todayStr();
    if (S.streak.last === today) return false;
    const gap = S.streak.last ? daysBetween(S.streak.last, today) : Infinity;
    let frozen = false;
    if (gap === 1) S.streak.count++;
    else if (gap === 2 && freezeAvailable(today)) { S.streak.count++; S.streak.freezeUsed = today; frozen = true; }
    else S.streak.count = 1;
    S.streak.last = today;
    S.streak.best = Math.max(S.streak.best, S.streak.count);
    return frozen;
  }

  function seededRandom(seedStr) {
    let h = 1779033703 ^ seedStr.length;
    for (let i = 0; i < seedStr.length; i++) { h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  }
  function shuffle(arr, rnd = Math.random) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function boardKeyFor(lang, input, mode, duration, count) {
    const len = mode === 'time' ? duration + 's' : mode === 'daily' ? todayStr() : count + 'x';
    return `${lang}:${input}:${mode}:${len}`;
  }
  const currentBoardKey = () => boardKeyFor(set.lang, set.input[set.lang], set.mode, set.duration, countFor(set.mode, set.sprintCount));
  const countFor = (mode, sprintCount) => COUNT_MODES[mode] === null ? sprintCount : COUNT_MODES[mode];
  function labelFromKey(key) {
    const [lang, input, mode, len] = key.split(':');
    const inputName = t('inputs')[lang][input].name;
    const lenLabel = t('boardLen')[mode](mode === 'daily' ? len : parseInt(len, 10));
    return `${t('langNames')[lang]} · ${inputName} · ${lenLabel}`;
  }

  // ---------------------------------------------------------------------
  // Sentence pools
  // ---------------------------------------------------------------------
  function weakScore(lang, s) {
    const w = S.weak[lang] || {};
    let score = 0;
    for (const ch of s.text) score += w[ch] || 0;
    if (s.reading) for (const ch of kataToHira(s.reading)) score += w[ch] || 0;
    return score;
  }
  function buildPool(lang, input, mode, level, pack, rnd, count) {
    const pool = buildPoolInner(lang, input, mode, level, pack, rnd);
    // Easter egg: never two rounds in a row, at most twice a day, and always within the part of the round that gets played.
    const eggState = S.egg;
    if (eggState.day !== todayStr()) { eggState.day = todayStr(); eggState.count = 0; }
    let hasEgg = false;
    if (EGGS[lang] && !eggState.last && eggState.count < EGG_MAX_PER_DAY && rnd() < EGG_RATE) {
      const egg = { ...EGGS[lang](), parts: [1] };
      const reach = Math.min(pool.length, mode === 'time' ? 8 : Math.max(1, count || pool.length));
      pool.splice(Math.floor(rnd() * reach), 0, egg);
      hasEgg = true;
      eggState.count++;
    }
    eggState.last = hasEgg;
    Store.save();
    return pool;
  }
  function buildPoolInner(lang, input, mode, level, pack, rnd) {
    const all = LANGS[lang].sentences();
    if (mode === 'drill') return shuffle(LANGS[lang].drills().map(d => ({ ...d, level: 1, tag: 'drill' })), rnd).slice(0, COUNT_MODES.drill);
    if (mode === 'daily') return shuffle(all, rnd).slice(0, COUNT_MODES.daily);
    let list = all;
    if (pack === 'custom') {
      list = (S.custom[lang] || []).filter(c => c.text && (lang === 'ko' || input === 'mixed' || c.reading));
      if (!list.length) list = all;
    } else if (pack === 'weak') {
      const scored = all.map(s => ({ s, w: weakScore(lang, s) })).filter(x => x.w > 0).sort((a, b) => b.w - a.w);
      list = scored.length >= 5 ? scored.slice(0, Math.max(10, Math.ceil(scored.length / 2))).map(x => x.s) : all;
    } else if (pack !== 'all') {
      list = all.filter(s => s.tag === pack);
    }
    if (level !== 'mixed' && pack !== 'custom') {
      const f = list.filter(s => s.level === +level);
      if (f.length >= 5) list = f;
    }
    const pool = shuffle(list.length ? list : all, rnd);
    if (mode !== 'paragraph') return pool;
    // Paragraph mode: curated passages first (matching theme and difficulty), then joined sentences to fill up.
    const paras = [];
    if (pack !== 'custom' && pack !== 'weak') {
      let curated = LANGS[lang].paragraphs().filter(p => pack === 'all' || p.tag === pack);
      if (level !== 'mixed') curated = curated.filter(p => p.level === +level);
      paras.push(...shuffle(curated, rnd).slice(0, COUNT_MODES.paragraph).map(p => ({ ...p, parts: [p.level, p.level, p.level] })));
    }
    const joiner = lang === 'ja' ? '' : ' ';
    for (let i = 0; i + 1 < pool.length && paras.length < COUNT_MODES.paragraph; i += PARAGRAPH_SENTENCES) {
      const group = pool.slice(i, i + PARAGRAPH_SENTENCES);
      paras.push({
        text: group.map(s => s.text).join(joiner),
        reading: lang === 'ja' ? group.map(s => s.reading || s.text).join(joiner) : undefined,
        en: group.map(s => s.en).join(' '),
        level: 'para', parts: group.map(s => s.level), tag: 'paragraph',
      });
    }
    return paras;
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
    el.inputChips.parentElement.hidden = set.lang === 'en';
    el.inputChips.innerHTML = inputs.map(id =>
      `<button class="chip${id === set.input[set.lang] ? ' active' : ''}" data-input="${id}">${names[id].name}</button>`).join('');
    el.inputHint.textContent = names[set.input[set.lang]].hint;

    $$('#mode-chips .chip').forEach(b => b.classList.toggle('active', b.dataset.mode === set.mode));
    el.modeHint.textContent = t({ time: 'modeHintTime', sprint: 'modeHintSprint', daily: 'modeHintDaily', drill: 'modeHintDrill', paragraph: 'modeHintParagraph' }[set.mode]);
    $$('#duration-chips .chip').forEach(b => b.classList.toggle('active', +b.dataset.duration === set.duration));
    $$('#sprint-chips .chip').forEach(b => b.classList.toggle('active', +b.dataset.sprint === set.sprintCount));
    $$('#level-chips .chip').forEach(b => b.classList.toggle('active', b.dataset.level === String(set.level)));
    el.fieldDuration.hidden = set.mode !== 'time';
    el.fieldSprint.hidden = set.mode !== 'sprint';
    const freeMode = set.mode === 'time' || set.mode === 'sprint' || set.mode === 'paragraph';
    el.fieldPack.hidden = !freeMode;
    el.fieldLevel.hidden = !freeMode || set.pack === 'custom';

    el.packChips.innerHTML = PACKS.map(p => `<button class="chip${p === set.pack ? ' active' : ''}" data-pack="${p}">${t('packs')[p]}</button>`).join('');
    const weakCount = Object.keys(S.weak[set.lang] || {}).length;
    el.packHint.textContent = set.pack === 'weak' ? (weakCount ? t('packWeakHint') : t('packWeakEmpty')) : set.pack === 'custom' ? t('packCustomHint') : '';
    el.customEditor.hidden = set.pack !== 'custom';
    if (set.pack === 'custom') {
      el.customText.value = (S.custom[set.lang] || []).map(c => c.reading ? `${c.text}｜${c.reading}` : c.text).join('\n');
      el.customText.placeholder = set.lang === 'ja' ? '今日はいい天気ですね。｜きょうはいいてんきですね。' : set.lang === 'ko' ? '오늘 날씨가 좋네요.' : 'The weather is nice today.';
    }

    const previewFonts = {
      clean: "'Noto Sans JP', 'Noto Sans KR', sans-serif", round: "'Zen Maru Gothic', 'Gowun Dodum', sans-serif", serif: "'Noto Serif JP', 'Noto Serif KR', serif",
      pixel: "'Galmuri11', 'DotGothic16', monospace", system: 'system-ui, sans-serif',
    };
    el.petChips.innerHTML = PETS.map(p => `<button class="chip${p === set.pet ? ' active' : ''}" data-pet="${p}">${Sprite.pet(p, 'idle', 2, currentLook())}${t('pets')[p]}</button>`).join('');
    el.fontChips.innerHTML = FONTS.map(f => `<button class="chip${f === set.font ? ' active' : ''}" data-font="${f}" style="font-family:${previewFonts[f]}">${t('fonts')[f]}</button>`).join('');
    el.sizeChips.innerHTML = SIZES.map(z => `<button class="chip${z === set.textSize ? ' active' : ''}" data-size="${z}">${t('sizes')[z]}</button>`).join('');

    const builtin = !isDirectInput(set.lang, set.input[set.lang]);
    el.toggleGuide.hidden = !builtin || set.lang === 'en';
    el.toggleKeyboard.hidden = !builtin;
    el.toggleStrict.hidden = !builtin;
    el.toggleFurigana.hidden = !(set.lang === 'ja' && set.input[set.lang] === 'mixed');
    el.toggleHideInput.hidden = builtin;
    el.optGuide.checked = set.guide;
    el.optKeyboard.checked = set.keyboard;
    el.optStrict.checked = set.strict;
    el.optFurigana.checked = set.furigana;
    el.optHideInput.checked = set.hideInput;
    el.optTranslation.checked = set.translation;
    el.optVolume.value = set.volume;
    Sfx.setEnabled(set.sound);
    Sfx.setVolume(set.volume / 100);

    $$('#side-tabs .chip').forEach(b => b.classList.toggle('active', b.dataset.tab === set.sideTab));
    $$('.side-panel').forEach(p => { p.hidden = p.dataset.panel !== set.sideTab; });

    renderTopbar();
    renderStats();
    renderHistory();
    renderDaily();
    renderGoals();
    renderBoard(el.homeBoard, el.boardLabel, currentBoardKey(), null);
    renderAchievements();
    renderMascotPanel();
    setMascot(el.mascotHome, 'idle');
    scheduleCheer();
  }

  // Encouragement from ムラト: random line, rank-aware on the result screen.
  function timeOfDay() {
    const h = new Date().getHours();
    if (h >= 5 && h < 11) return 'morning';
    if (h >= 18 && h < 23) return 'evening';
    if (h >= 23 || h < 4) return 'night';
    return null;
  }
  function showCheer(node, rank) {
    const lines = t('cheers');
    let text = lines[Math.floor(Math.random() * lines.length)];
    const tod = timeOfDay();
    if (tod && Math.random() < 0.5) { const tl = t('cheerTime')[tod]; text = tl[Math.floor(Math.random() * tl.length)]; }
    if (rank) {
      const byRank = t('cheerRank');
      text = 'SA'.includes(rank) ? byRank.high : 'BC'.includes(rank) ? byRank.mid : byRank.low;
      if (Math.random() < 0.5) text = lines[Math.floor(Math.random() * lines.length)];
    }
    node.textContent = text;
    node.style.animation = 'none';
    void node.offsetWidth;
    node.style.animation = '';
  }
  // Menu balloon: nothing at first, then occasionally. First after ~45 s, visible 8 s, then every 2-3 minutes.
  const CHEER_FIRST_MS = 45000, CHEER_SHOW_MS = 8000, CHEER_GAP_MIN = 120000, CHEER_GAP_MAX = 180000;
  let cheerTimer = 0, cheerHideTimer = 0, cheerArmed = false;
  const cheerBox = () => el.cheerHome.closest('.cheer');
  function hideCheer() { cheerBox().classList.remove('show'); }
  function scheduleCheer(delay) {
    if (cheerArmed && delay === undefined) return; // already scheduled; a re-render should not reset it
    clearTimeout(cheerTimer);
    cheerArmed = true;
    cheerTimer = setTimeout(() => {
      cheerArmed = false;
      if (!el.screens.home.classList.contains('active') || el.settingsModal.open) { scheduleCheer(CHEER_FIRST_MS); return; }
      showCheer(el.cheerHome);
      cheerBox().classList.add('show');
      clearTimeout(cheerHideTimer);
      cheerHideTimer = setTimeout(hideCheer, CHEER_SHOW_MS);
      scheduleCheer(CHEER_GAP_MIN + Math.random() * (CHEER_GAP_MAX - CHEER_GAP_MIN));
    }, delay === undefined ? CHEER_FIRST_MS : delay);
  }
  function cancelCheer() { clearTimeout(cheerTimer); clearTimeout(cheerHideTimer); cheerArmed = false; hideCheer(); }

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
      statCard(t('petsStat'), fmt(st.pets || 0)),
    ].join('');
  }

  // Recent rounds for the current language + input: a single-series bar chart of speed, plus a short table.
  function renderHistory() {
    const input = set.input[set.lang];
    const rows = S.history.filter(h => h.lang === set.lang && h.input === input).slice(-20);
    el.historyLabel.textContent = `${t('inputs')[set.lang][input].name} · ${t('historySpeed')}`;
    if (!rows.length) {
      el.historyChart.innerHTML = `<div class="empty">${t('historyEmpty')}</div>`;
      el.historyList.innerHTML = '';
      return;
    }
    const W = 300, H = 90, padL = 28, padB = 14, padT = 6;
    const max = Math.max(...rows.map(r => r.speed), 1);
    const slot = (W - padL) / 20, bw = Math.max(4, slot - 2);
    const unit = t(rows[0].speedUnit || speedUnitFor(set.lang, isDirectInput(set.lang, input)));
    const bars = rows.map((r, i) => {
      const h = Math.max(2, ((H - padB - padT) * r.speed) / max);
      const x = padL + i * slot, y = H - padB - h;
      const d = new Date(r.t);
      return `<rect class="bar" x="${x}" y="${y}" width="${bw}" height="${h}"><title>${dateStr(d)} · ${r.speed} ${unit} · ${r.acc}% · ${fmt(r.score)}</title></rect>`;
    }).join('');
    el.historyChart.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('history')}">
      <line class="axis" x1="${padL}" y1="${H - padB}" x2="${W}" y2="${H - padB}"/>
      <text class="lbl" x="0" y="${padT + 8}">${max}</text>
      <text class="lbl" x="0" y="${H - padB}">0</text>
      ${bars}
    </svg>`;
    el.historyList.innerHTML = rows.slice(-5).reverse().map(r =>
      `<li><span class="meta">${dateStr(new Date(r.t))} · ${r.speed} ${unit} · ${r.acc}%</span><span class="sc">${fmt(r.score)}</span></li>`).join('');
  }

  function renderDaily() {
    const input = set.input[set.lang];
    el.dailyLabel.textContent = t('inputs')[set.lang][input].name;
    const items = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = dateStr(d);
      const e = S.daily[`${ds}:${set.lang}:${input}`];
      items.push(`<li><span class="pos">${i === 0 ? '★' : ''}</span><span class="meta">${i === 0 ? t('dailyToday') : ds}${e ? ` · <span class="rank-badge">${e.rank}</span>${e.speed} ${t(e.speedUnit)} · ${e.acc}%` : ` · ${t('dailyNotYet')}`}</span><span class="sc">${e ? fmt(e.score) : '—'}</span></li>`);
    }
    el.dailyList.innerHTML = items.join('');
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

  function renderBoard(listEl, labelEl, key, highlightIdx) {
    const board = S.boards[key] || [];
    if (labelEl) labelEl.textContent = labelFromKey(key);
    if (!board.length) { listEl.innerHTML = `<li class="empty">${t('noScores')}</li>`; return; }
    listEl.innerHTML = board.map((e, i) => `
      <li${i === highlightIdx ? ' class="me"' : ''}>
        <span class="pos">${i + 1}</span>
        <span><span class="rank-badge">${e.rank}</span><span class="meta">${e.speed} ${t(e.speedUnit)} · ${e.acc}% · ${e.combo}x · ${e.date}</span></span>
        <span class="sc">${fmt(e.score)}</span>
      </li>`).join('');
  }

  function renderAchievements() {
    const unlocked = Object.keys(S.achievements).filter(id => ACHIEVEMENTS.some(a => a.id === id)).length;
    el.achCount.textContent = `${unlocked} / ${ACHIEVEMENTS.length}`;
    el.achGrid.innerHTML = ACHIEVEMENTS.map(a => {
      const when = S.achievements[a.id];
      const [name, desc] = t('ach')[a.id];
      return `<div class="ach${when ? ' unlocked' : ''}" title="${name} — ${desc}${when ? ' (' + when + ')' : ''}">${a.ico}</div>`;
    }).join('');
  }

  // ---------------------------------------------------------------------
  // Mascot (grows with your level; pettable)
  // ---------------------------------------------------------------------
  const currentLook = () => Sprite.lookFor(levelFromXp(S.stats.xp));
  function setMascot(node, frame) {
    if (!node) return;
    const zzz = node.querySelector('.zzz');
    node.innerHTML = Sprite.pet(set.pet, frame, node === el.mascotPlay ? 4 : 5, currentLook());
    if (zzz && frame === 'sleep') node.appendChild(zzz);
  }
  function renderMascotPanel() {
    setMascot(el.mascotPreview, 'idle');
    const look = currentLook();
    el.mascotNext.textContent = look.nextLevel ? t('mascotNext')(look.nextLevel) : t('mascotMax');
  }
  let mascotTimer = 0;
  function mascotReact(frame, ms) {
    clearTimeout(mascotTimer);
    const node = el.mascotPlay;
    setMascot(node, frame);
    node.classList.remove('happy', 'sad', 'pet');
    void node.offsetWidth;
    node.classList.add(frame);
    mascotTimer = setTimeout(() => { setMascot(node, 'idle'); node.classList.remove('happy', 'sad'); }, ms);
  }
  // Sleepy pet: doze off after a minute without input on the menu, wake with a stretch.
  const IDLE_MS = 60000;
  let idleTimer = 0, asleep = false;
  function sleepPet() {
    if (!el.screens.home.classList.contains('active') || el.settingsModal.open || asleep) return;
    asleep = true;
    setMascot(el.mascotHome, 'sleep');
    el.mascotHome.classList.remove('wake', 'pet', 'happy', 'sad');
    el.mascotHome.classList.add('sleep');
    const z = document.createElement('div');
    z.className = 'zzz';
    z.innerHTML = Sprite.zzz(2);
    el.mascotHome.appendChild(z);
  }
  function wakePet() {
    if (!asleep) return;
    asleep = false;
    el.mascotHome.classList.remove('sleep');
    setMascot(el.mascotHome, 'idle');
    el.mascotHome.classList.add('wake');
    setTimeout(() => el.mascotHome.classList.remove('wake'), 650);
  }
  function resetIdle() {
    wakePet();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(sleepPet, IDLE_MS);
  }
  ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel'].forEach(ev => document.addEventListener(ev, resetIdle, { passive: true }));
  resetIdle();

  const petTimers = new Map();
  function petCat(node) {
    Sfx.unlock();
    Sfx.purr();
    S.stats.pets = (S.stats.pets || 0) + 1;
    Store.save();
    clearTimeout(petTimers.get(node));
    if (node === el.mascotPlay) clearTimeout(mascotTimer);
    setMascot(node, 'happy');
    node.classList.remove('pet', 'happy', 'sad');
    void node.offsetWidth;
    node.classList.add('pet');
    const heart = document.createElement('div');
    heart.className = 'pet-heart';
    heart.innerHTML = Sprite.heart(2);
    heart.style.left = `${35 + Math.random() * 30}%`;
    node.appendChild(heart);
    setTimeout(() => heart.remove(), 900);
    petTimers.set(node, setTimeout(() => { node.classList.remove('pet'); setMascot(node, 'idle'); }, 900));
    if (S.stats.pets === 100 && !S.achievements.catLover) {
      const a = ACHIEVEMENTS.find(x => x.id === 'catLover');
      S.achievements.catLover = todayStr();
      Store.save();
      const [name, desc] = t('ach').catLover;
      toast(a.ico, `${t('achUnlocked')}: ${name}`, desc);
      if (el.screens.home.classList.contains('active')) renderAchievements();
    }
    if (el.screens.home.classList.contains('active')) renderStats();
  }
  [el.mascotHome, el.mascotPlay, el.mascotPreview].forEach(n => {
    n.addEventListener('mousedown', e => e.preventDefault()); // keep the IME input focused during play
    n.addEventListener('click', () => petCat(n));
    n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); petCat(n); } });
  });

  // ---------------------------------------------------------------------
  // Game lifecycle
  // ---------------------------------------------------------------------
  function showScreen(name) {
    Object.entries(el.screens).forEach(([k, s]) => s.classList.toggle('active', k === name));
    window.scrollTo({ top: 0 });
  }

  function startGame() {
    Sfx.unlock();
    const input = set.input[set.lang];
    const mode = set.mode;
    const count = countFor(mode, set.sprintCount);
    const free = mode === 'time' || mode === 'sprint' || mode === 'paragraph';
    Object.assign(G, {
      active: true, phase: 'countdown',
      lang: set.lang, input, direct: isDirectInput(set.lang, input),
      mode, duration: set.duration, count, level: free ? String(set.level) : 'mixed', pack: free ? set.pack : 'all',
      poolIdx: 0, sentence: null, target: '', units: [], uIdx: 0, buf: '', err: '',
      startAt: 0, elapsed: 0, timeline: [0],
      score: 0, combo: 0, maxCombo: 0, hits: 0, misses: 0, keys: 0, chars: 0,
      sentences: 0, perfect: 0, sentenceMisses: 0, levelSentences: { 1: 0, 2: 0, 3: 0 }, roundMisses: {},
      ime: { scored: 0, flagged: false, composing: false },
    });
    if (G.pack === 'custom') G.level = 'mixed';
    const rnd = mode === 'daily' ? seededRandom(`${todayStr()}:${G.lang}`) : Math.random;
    G.pool = buildPool(G.lang, G.input, mode, G.level, G.pack, rnd, count);
    G.ghost = S.ghosts[boardKeyFor(G.lang, G.input, G.mode, G.duration, G.count)] || null;

    el.hudSpeedLabel.textContent = t(speedUnitFor(G.lang, G.direct));
    el.hudTimeLabel.textContent = G.mode === 'time' ? t('hudTime') : G.mode === 'drill' ? t('hudItems') : G.mode === 'paragraph' ? t('hudParagraphs') : t('hudSentences');
    el.hudGhostBox.hidden = !G.ghost;
    el.hudGhost.textContent = '±0';
    el.hudGhost.className = 'hud-value';
    el.ghostMarker.hidden = true;
    el.timebar.classList.remove('low');
    el.timebar.style.width = '100%';
    el.directInput.hidden = !G.direct;
    el.directInput.classList.toggle('inline', set.hideInput);
    el.directInput.value = '';
    el.directInput.classList.remove('bad');
    el.floatLayer.innerHTML = '';
    buildKeyboard();
    updateHud();
    setMascot(el.mascotPlay, 'idle');
    cancelCheer();
    showScreen('play');

    loadSentence();
    el.card.classList.add('blur');
    runCountdown(3);
  }

  function runCountdown(n) {
    el.countdown.hidden = false;
    el.countdown.textContent = n;
    el.countdown.style.animation = 'none';
    void el.countdown.offsetWidth;
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
    const sec = Math.floor(G.elapsed);
    while (G.timeline.length <= sec) G.timeline.push(Math.round(G.score));
    if (G.mode === 'time') {
      const left = Math.max(0, G.duration - G.elapsed);
      el.hudTime.textContent = Math.ceil(left);
      el.timebar.style.width = `${(left / G.duration) * 100}%`;
      el.timebar.classList.toggle('low', left <= 10);
      if (left <= 0) return finishGame();
    } else {
      el.hudTime.textContent = `${G.sentences}/${G.count}`;
      el.timebar.style.width = `${(G.sentences / G.count) * 100}%`;
    }
    if (G.ghost) {
      const gs = G.ghost[Math.min(sec, G.ghost.length - 1)] || 0;
      const diff = Math.round(G.score - gs);
      el.hudGhost.textContent = (diff >= 0 ? '+' : '') + fmt(diff);
      el.hudGhost.className = 'hud-value ' + (diff > 0 ? 'up' : diff < 0 ? 'down' : '');
      if (G.mode === 'time') {
        // Marker: where the best run's score sat at this moment, as a share of its final score.
        const finalBest = G.ghost[G.ghost.length - 1] || 1;
        el.ghostMarker.hidden = false;
        el.ghostMarker.style.left = `${clamp((gs / finalBest) * 100, 0, 100)}%`;
      }
    }
    el.hudSpeed.textContent = speedNow();
    G.raf = requestAnimationFrame(tick);
  }

  function speedNow() {
    const mins = Math.max(G.elapsed, 1) / 60;
    if (G.direct) return Math.round(G.chars / mins);
    if (G.lang === 'en') return Math.round(G.keys / 5 / mins);
    return Math.round(G.keys / mins);
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
    G.err = '';
    G.sentenceMisses = 0;
    G.ime = { scored: 0, flagged: false, composing: false };
    el.directInput.value = '';
    el.directInput.classList.remove('bad');

    if (G.lang === 'ja') G.target = G.input === 'hiragana' ? kataToHira(G.sentence.reading || G.sentence.text) : G.sentence.text;
    else G.target = G.sentence.text;
    G.units = G.direct ? [] : G.lang === 'en' ? plainUnits(G.target) : Hangul.buildUnits(G.target);

    G.furi = (G.lang === 'ja' && G.input === 'mixed' && set.furigana) ? alignFurigana(G.sentence.text, G.sentence.reading) : null;
    el.reading.textContent = '';
    el.en.textContent = set.translation && G.mode !== 'paragraph' ? (G.sentence.en || '') : '';
    el.main.classList.remove('swap');
    void el.main.offsetWidth;
    el.main.classList.add('swap');
    el.main.classList.toggle('long', G.target.length > 60);
    el.main.classList.toggle('furi', !!G.furi);
    renderSentence();
    renderDots();
  }

  function renderDots() {
    if (G.mode === 'time') { el.dots.innerHTML = ''; return; }
    el.dots.innerHTML = Array.from({ length: G.count }, (_, i) => Sprite.star(2, i < G.sentences)).join('');
  }

  function unitSpan(cls, text) {
    const ws = text === ' ' || text === '　' ? ' ws' : '';
    return `<span class="u ${cls}${ws}">${ws ? ' ' : escapeHtml(text)}</span>`;
  }

  function renderSentence() {
    if (G.direct) return renderDirect();
    const cur = G.uIdx;
    el.main.innerHTML = G.units.map((u, i) => {
      if (i === cur && G.err) return unitSpan('bad', G.buf ? u.partial(G.buf) : u.text);
      if (i === cur && G.buf) return unitSpan('cur', u.partial(G.buf));
      return unitSpan(i < cur ? 'done' : i === cur ? 'cur' : 'pend', u.text);
    }).join('');

    if (set.guide && G.lang !== 'en') {
      el.guide.innerHTML = G.units.map((u, i) => {
        if (u.text === ' ') return '<span class="g sp"></span>';
        if (i < cur) return `<span class="g done">${escapeHtml(u.typed)}</span>`;
        if (i === cur) return `<span class="g cur"><span class="typed">${escapeHtml(G.buf)}</span><span class="err">${escapeHtml(G.err)}</span><span class="rest">${escapeHtml(u.canon.slice(G.buf.length))}</span></span>`;
        return `<span class="g pend">${escapeHtml(u.canon)}</span>`;
      }).join('');
    } else {
      el.guide.innerHTML = '';
    }
    highlightNextKey();
  }

  function nextKey() {
    if (G.err) return 'Backspace';
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
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (G.err) { G.err = G.err.slice(0, -1); renderSentence(); }
      return;
    }
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
    const u = G.units[G.uIdx];
    if (set.strict && G.err) {
      // Wrong keys pile up until erased with Backspace.
      if (G.err.length < 4) G.err += key;
      onMiss(u && u.text);
    } else if (pressKey(key)) {
      onHit();
    } else {
      if (set.strict) G.err = key;
      onMiss(u && u.text);
    }
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
    const charSpan = i => {
      const ch = target[i];
      if (i < typed.length) {
        if (!mismatch && typed[i] === ch) return unitSpan('done', ch);
        mismatch = true;
        return unitSpan(composing ? 'comp' : 'bad', ch);
      }
      return unitSpan(i === typed.length ? 'cur' : 'pend', ch);
    };
    if (G.furi) {
      let i = 0;
      for (const seg of G.furi) {
        let inner = '';
        for (let k = 0; k < seg.t.length; k++) inner += charSpan(i++);
        html += seg.r ? `<ruby>${inner}<rt>${escapeHtml(seg.r)}</rt></ruby>` : inner;
      }
    } else {
      for (let i = 0; i < target.length; i++) html += charSpan(i);
    }
    el.main.innerHTML = html;
    el.guide.innerHTML = '';
    el.directInput.classList.toggle('bad', mismatch && !composing);
    if (composing) {
      // Provisional score and combo while the IME composition is still open, so the HUD moves as you type.
      let correct = 0;
      while (correct < typed.length && correct < target.length && typed[correct] === target[correct]) correct++;
      const prov = Math.max(0, correct - G.ime.scored);
      el.hudScore.textContent = fmt(G.score + prov * unitValue() * multiplier());
      el.hudCombo.textContent = G.combo + prov;
      el.hudComboBox.classList.toggle('hot', G.combo + prov >= 25);
    }
  }

  function evaluateDirect() {
    if (G.phase !== 'play' || !G.direct) return;
    const target = G.target;
    let typed = el.directInput.value;
    if (!target.endsWith(' ') && typed.length > target.length) typed = typed.replace(/\s+$/, '');
    let correct = 0;
    while (correct < typed.length && correct < target.length && typed[correct] === target[correct]) correct++;

    if (G.ime.scored < correct) Sfx.hit(G.combo);
    while (G.ime.scored < correct) { G.ime.scored++; G.chars++; onHit(false); }
    const mismatch = typed.length > correct;
    if (mismatch && !G.ime.flagged) { G.ime.flagged = true; onMiss(target[correct]); }
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
    if (G.combo === 77) floatText('77 🍀', 'ok');
    if (G.combo === 25 || (G.combo >= 50 && G.combo % 50 === 0)) {
      floatText(`${G.combo} ${t('comboHit')}`, 'big');
      Sfx.milestone();
    }
  }

  function noteMiss(ch) {
    if (!ch || isPunct(ch)) return;
    G.roundMisses[ch] = (G.roundMisses[ch] || 0) + 1;
    const w = S.weak[G.lang] || (S.weak[G.lang] = {});
    w[ch] = Math.min(99, (w[ch] || 0) + 1);
  }

  function onMiss(targetChar) {
    G.misses++;
    G.sentenceMisses++;
    noteMiss(targetChar);
    if (G.combo >= 10) floatText(t('comboLost'), 'lost');
    G.combo = 0;
    Sfx.miss();
    mascotReact('sad', 700);
    el.card.classList.remove('shake');
    void el.card.offsetWidth;
    el.card.classList.add('shake');
  }

  function completeSentence() {
    G.sentences++;
    if (G.sentence.parts) G.sentence.parts.forEach(lv => { if (G.levelSentences[lv] !== undefined) G.levelSentences[lv]++; });
    else if (G.levelSentences[G.sentence.level] !== undefined && G.mode !== 'drill') G.levelSentences[G.sentence.level]++;
    let bonus = 100;
    if (G.sentenceMisses === 0) { bonus += 100; G.perfect++; floatText(t('perfectFloat'), 'ok'); mascotReact('happy', 1000); }
    else floatText(t('bonusFloat'), 'ok');
    G.score += bonus;
    Sfx.sentence();
    el.card.classList.remove('flash');
    void el.card.offsetWidth;
    el.card.classList.add('flash');
    updateHud();
    if (G.mode !== 'time' && G.sentences >= G.count) return finishGame();
    loadSentence();
  }

  function updateHud() {
    const scoreText = fmt(G.score);
    if (el.hudScore.textContent !== scoreText) {
      el.hudScore.textContent = scoreText;
      el.hudScore.classList.remove('bump');
      void el.hudScore.offsetWidth;
      el.hudScore.classList.add('bump');
    }
    el.hudCombo.textContent = G.combo;
    el.hudComboBox.classList.toggle('hot', G.combo >= 25);
    const total = G.hits + G.misses;
    el.hudAcc.textContent = `${total ? Math.round((G.hits / total) * 100) : 100}%`;
    if (G.mode !== 'time') el.hudTime.textContent = `${G.sentences}/${G.count}`;
  }

  function floatText(text, cls) {
    const d = document.createElement('div');
    d.className = `floater ${cls}`;
    d.textContent = text;
    d.style.left = `${42 + Math.random() * 16}%`;
    d.style.top = `${-34 - el.floatLayer.children.length * 22}px`; // in the gap above the card; stack if several are on screen
    el.floatLayer.appendChild(d);
    setTimeout(() => d.remove(), 650);
  }

  // ---------------------------------------------------------------------
  // On-screen keyboard (Korean 2-set mode only)
  // ---------------------------------------------------------------------
  const KEY_ROWS = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', 'backspace'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', "'"],
    ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
    [' '],
  ];
  const SHIFT_MAP = { '?': '/', '!': '1', '~': '`', '_': '-', '"': "'", ':': ';', '<': ',', '>': '.' };

  function buildKeyboard() {
    if (!set.keyboard || G.direct) { el.keyboard.innerHTML = ''; return; }
    el.keyboard.innerHTML = KEY_ROWS.map(row => `<div class="krow">${row.map(k => {
      if (k === 'shift') return '<div class="key wide" data-key="shift">⇧</div>';
      if (k === 'backspace') return '<div class="key wide" data-key="Backspace">⌫</div>';
      if (k === ' ') return '<div class="key space" data-key=" ">space</div>';
      if (G.lang === 'ko' && Hangul.KEY_LABELS[k]) {
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
    if (nk === 'Backspace') { el.keyboard.querySelector('.key[data-key="Backspace"]').classList.add('next'); return; }
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
    G.timeline.push(Math.round(G.score));

    const minutes = Math.max(G.elapsed, 1) / 60;
    const total = G.hits + G.misses;
    const r = {
      lang: G.lang, input: G.input, mode: G.mode, duration: G.duration, count: G.count, level: G.level, pack: G.pack,
      score: Math.round(G.score),
      speed: speedNow(),
      speedUnit: speedUnitFor(G.lang, G.direct),
      acc: total ? Math.round((G.hits / total) * 100) : 100,
      maxCombo: G.maxCombo, misses: G.misses, sentences: G.sentences, perfect: G.perfect,
      chars: G.chars, seconds: Math.round(G.elapsed), hour: new Date().getHours(), date: todayStr(),
    };
    r.rank = RANKS.find(x => r.score / minutes >= x.min).r;
    r.lucky = r.score % 1000 === 777 || r.maxCombo === 77;

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
    const frozen = touchStreak();

    const key = boardKeyFor(r.lang, r.input, r.mode, r.duration, r.count);
    const board = S.boards[key] || [];
    const prevBest = board.length ? board[0].score : 0;
    const entry = { score: r.score, speed: r.speed, speedUnit: r.speedUnit, acc: r.acc, combo: r.maxCombo, rank: r.rank, date: r.date, ts: Date.now() };
    board.push(entry);
    board.sort((a, b) => b.score - a.score || b.ts - a.ts);
    S.boards[key] = board.slice(0, 10);
    const myIdx = S.boards[key].indexOf(entry);
    const isRecord = r.score > prevBest && r.score > 0;
    if (isRecord) S.ghosts[key] = G.timeline.slice();
    if (r.mode === 'daily') {
      const dk = `${r.date}:${r.lang}:${r.input}`;
      if (!S.daily[dk] || S.daily[dk].score < r.score) S.daily[dk] = entry;
    }
    S.history.push({ t: entry.ts, lang: r.lang, input: r.input, mode: r.mode, level: r.level, score: r.score, speed: r.speed, speedUnit: r.speedUnit, acc: r.acc, rank: r.rank });
    if (S.history.length > 300) S.history = S.history.slice(-300);

    const unlocked = [];
    for (const a of ACHIEVEMENTS) {
      if (S.achievements[a.id]) continue;
      let ok = false;
      try { ok = a.test(r, S); } catch (e) { ok = false; }
      if (ok) { S.achievements[a.id] = r.date; unlocked.push(a); }
    }
    Store.save();
    lastResult = r;

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
    const weak = Object.entries(G.roundMisses).sort((a, b) => b[1] - a[1]).slice(0, 8);
    el.resultWeak.hidden = !weak.length;
    el.weakChips.innerHTML = weak.map(([ch, n]) => `<span class="weak-chip">${escapeHtml(ch)}<small>×${n}</small></span>`).join('');
    el.resultAch.hidden = !unlocked.length;
    el.resultAch.innerHTML = unlocked.map((a, i) => {
      const [name, desc] = t('ach')[a.id];
      return `<div class="unlock" style="animation-delay:${0.15 + i * 0.1}s"><span class="ico">${a.ico}</span><div><b>${t('achUnlocked')}: ${name}</b><span>${desc}</span></div></div>`;
    }).join('');
    renderBoard(el.resultBoard, el.resultBoardLabel, key, myIdx);
    renderTopbar();
    showCheer(el.cheerResult, r.rank);
    el.cheerResult.closest('.cheer').classList.add('show');
    showScreen('result');

    Sfx.finish();
    if (isRecord) { Sfx.record(); confetti(); }
    const newLevel = levelFromXp(st.xp);
    if (newLevel > prevLevel) setTimeout(() => { Sfx.levelUp(); toast('⬆', `${t('levelUp')} ${t('lv')}${newLevel}`, levelTitle(newLevel)); }, 600);
    if (frozen) setTimeout(() => toast('🧊', t('streakFreeze'), ''), 1200);
    if (r.lucky) setTimeout(() => { Sfx.milestone(); toast('🍀', t('lucky'), `${fmt(r.score)} · ${r.maxCombo}x`); }, 900);
  }

  function toast(ico, title, desc) {
    const d = document.createElement('div');
    d.className = 'toast';
    d.innerHTML = `<span class="ico">${ico}</span><div><b>${escapeHtml(title)}</b>${desc ? `<span>${escapeHtml(desc)}</span>` : ''}</div>`;
    el.toastLayer.appendChild(d);
    setTimeout(() => { d.style.opacity = '0'; d.style.transition = 'opacity 0.4s'; setTimeout(() => d.remove(), 400); }, 3500);
  }

  // ---------------------------------------------------------------------
  // Share card (PNG rendered on a canvas, downloaded locally)
  // ---------------------------------------------------------------------
  function shareCard() {
    const r = lastResult;
    if (!r) return;
    const cs = getComputedStyle(el.root);
    const col = v => cs.getPropertyValue(v).trim();
    const c = el.shareCanvas, ctx = c.getContext('2d');
    const W = c.width, H = c.height;
    ctx.fillStyle = col('--bg'); ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = col('--surface'); ctx.fillRect(20, 20, W - 40, H - 40);
    ctx.strokeStyle = col('--ink'); ctx.lineWidth = 4; ctx.strokeRect(20, 20, W - 40, H - 40);
    ctx.fillStyle = col('--ink'); ctx.fillRect(28, H - 20, W - 40, 6); ctx.fillRect(W - 20, 28, 6, H - 40);
    const pixel = col('--font-num') || 'sans-serif';
    const text = col('--font-ui') || 'sans-serif';
    ctx.fillStyle = col('--text');
    ctx.font = `bold 20px ${text}`; ctx.fillText('もじねこ！', 44, 60);
    ctx.font = `14px ${text}`; ctx.fillStyle = col('--muted');
    ctx.fillText(`${t('langNames')[r.lang]} · ${t('inputs')[r.lang][r.input].name} · ${t('boardLen')[r.mode](r.mode === 'time' ? r.duration : r.mode === 'daily' ? r.date : r.count)}`, 44, 84);
    ctx.fillStyle = col('--accent'); ctx.font = `72px ${pixel}`; ctx.fillText(r.rank, 44, 180);
    ctx.fillStyle = col('--text'); ctx.font = `26px ${pixel}`; ctx.fillText(fmt(r.score), 150, 150);
    ctx.font = `13px ${text}`; ctx.fillStyle = col('--muted'); ctx.fillText(t('score'), 150, 122);
    const rows = [[t('speed'), `${r.speed} ${t(r.speedUnit)}`], [t('accuracy'), `${r.acc}%`], [t('maxCombo'), `${r.maxCombo}x`], [t('sentencesDone'), `${r.sentences}`]];
    rows.forEach(([k, v], i) => {
      const y = 230 + i * 26;
      ctx.fillStyle = col('--muted'); ctx.font = `13px ${text}`; ctx.fillText(k, 44, y);
      ctx.fillStyle = col('--text'); ctx.font = `14px ${pixel}`; ctx.fillText(v, 200, y);
    });
    ctx.fillStyle = col('--muted'); ctx.font = `12px ${text}`; ctx.fillText(r.date, 44, H - 40);
    const look = currentLook();
    Sprite.drawPet(ctx, set.pet, r.rank === 'S' || r.rank === 'A' ? 'happy' : 'idle', W - 210, 90, 11, { k: col('--ink'), w: col('--sprite-body'), p: col('--accent'), b: col('--accent'), y: col('--warn'), r: col('--bad') }, look);
    c.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `mojineko-${r.date}-${r.rank}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }, 'image/png');
  }

  // ---------------------------------------------------------------------
  // Data export / import
  // ---------------------------------------------------------------------
  function exportData() {
    const blob = new Blob([Store.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `mojineko-backup-${todayStr()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result);
        const data = obj && (obj.app === 'mojineko' || obj.app === 'kotoba-type') && obj.data ? obj.data : obj;
        if (!data || typeof data !== 'object' || !data.settings || !data.stats) throw new Error('bad');
        Store.replace(data);
        toast('📥', t('importOk'), '');
        setTimeout(() => location.reload(), 600);
      } catch (e) {
        toast('⚠', t('importBad'), '');
      }
    };
    reader.readAsText(file);
  }

  // ---------------------------------------------------------------------
  // Confetti
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
  const chipHandler = (sel, attr, apply) => $(sel).addEventListener('click', e => { const b = e.target.closest(`[data-${attr}]`); if (b) { apply(b.dataset[attr]); persist(); } });

  $$('.lang-card').forEach(b => b.addEventListener('click', () => { set.lang = b.dataset.lang; persist(); }));
  chipHandler('#input-chips', 'input', v => { set.input[set.lang] = v; });
  chipHandler('#mode-chips', 'mode', v => { set.mode = v; });
  chipHandler('#duration-chips', 'duration', v => { set.duration = +v; });
  chipHandler('#sprint-chips', 'sprint', v => { set.sprintCount = +v; });
  chipHandler('#level-chips', 'level', v => { set.level = v === 'mixed' ? 'mixed' : +v; });
  chipHandler('#pack-chips', 'pack', v => { set.pack = v; });
  chipHandler('#font-chips', 'font', v => { set.font = v; });
  chipHandler('#pet-chips', 'pet', v => { set.pet = v; });
  chipHandler('#side-tabs', 'tab', v => { set.sideTab = v; });
  el.btnSettings.addEventListener('click', () => { renderHome(); el.settingsModal.showModal(); });
  el.btnSettingsClose.addEventListener('click', () => el.settingsModal.close());
  el.btnHelp.addEventListener('click', () => { renderAbout(); el.aboutModal.showModal(); });
  el.btnAboutClose.addEventListener('click', () => el.aboutModal.close());
  el.aboutModal.addEventListener('click', e => { if (e.target === el.aboutModal) el.aboutModal.close(); });
  el.settingsModal.addEventListener('click', e => { if (e.target === el.settingsModal) el.settingsModal.close(); });
  chipHandler('#size-chips', 'size', v => { set.textSize = v; });
  el.btnCustomSave.addEventListener('click', () => {
    const lines = el.customText.value.split('\n').map(l => l.trim()).filter(Boolean);
    S.custom[set.lang] = lines.map(l => {
      const [text, reading] = l.split(/[｜|]/).map(x => x.trim());
      return { text, reading: reading || (set.lang === 'ja' ? '' : undefined), en: '' };
    });
    Store.save();
    toast('📝', t('customSaved'), '');
    renderHome();
  });
  [['optGuide', 'guide'], ['optKeyboard', 'keyboard'], ['optStrict', 'strict'], ['optFurigana', 'furigana'], ['optHideInput', 'hideInput'], ['optTranslation', 'translation']]
    .forEach(([id, k]) => el[id].addEventListener('change', () => { set[k] = el[id].checked; persist(); }));
  el.optVolume.addEventListener('input', () => { set.volume = +el.optVolume.value; Sfx.setVolume(set.volume / 100); Store.save(); });
  el.optVolume.addEventListener('change', () => { Sfx.unlock(); Sfx.hit(0); });
  el.btnSound.addEventListener('click', () => {
    set.sound = !set.sound; Sfx.setEnabled(set.sound); Store.save();
    el.btnSound.innerHTML = set.sound ? ICONS.soundOn : ICONS.soundOff;
  });
  el.btnTheme.addEventListener('click', () => { set.theme = resolvedTheme() === 'dark' ? 'light' : 'dark'; Store.save(); applyTheme(); });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (set.theme === 'system') applyTheme(); });

  el.btnStart.addEventListener('click', startGame);
  el.btnRetry.addEventListener('click', startGame);
  el.btnShare.addEventListener('click', shareCard);
  el.btnHome.addEventListener('click', () => { renderHome(); showScreen('home'); });
  $('#brand-home').addEventListener('click', () => { if (G.active) quitGame(); else { renderHome(); showScreen('home'); } });
  el.btnExport.addEventListener('click', exportData);
  el.btnImport.addEventListener('click', () => el.importFile.click());
  el.importFile.addEventListener('change', () => { if (el.importFile.files[0]) importData(el.importFile.files[0]); el.importFile.value = ''; });
  el.btnReset.addEventListener('click', () => { if (confirm(t('resetConfirm'))) { Store.reset(); location.reload(); } });

  // Keyboard navigation on the menu: arrow keys move within a chip group and select.
  document.addEventListener('keydown', e => {
    if (G.active) return onKeyDown(e);
    const home = el.screens.home.classList.contains('active');
    if (home && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      const group = document.activeElement && document.activeElement.closest('[data-nav]');
      if (!group) return;
      const items = [...group.querySelectorAll('button')];
      const i = items.indexOf(document.activeElement);
      if (i === -1) return;
      e.preventDefault();
      const next = items[(i + (e.key === 'ArrowRight' ? 1 : items.length - 1)) % items.length];
      next.click();
      // Re-render replaces some chip groups; re-find the button by its data attributes.
      const sel = [...next.attributes].filter(a => a.name.startsWith('data-') && a.name !== 'data-t').map(a => `[${a.name}="${a.value}"]`).join('');
      const again = sel ? document.querySelector(`[data-nav] ${sel}`) : null;
      (again || next).focus();
    }
    if (e.key === 'Enter' && !e.repeat && (home || el.screens.result.classList.contains('active'))) {
      if (el.settingsModal.open) return;
      const a = document.activeElement;
      if (a && (a.tagName === 'BUTTON' || a.tagName === 'TEXTAREA' || a.classList.contains('mascot')) && a !== el.btnStart && a !== el.btnRetry) return;
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

  if (location.hash === '#debug') window.__kotoba = { buildPool };

  // Boot.
  $('.brand-heart').innerHTML = Sprite.heart(2);
  renderHome();
  showScreen('home');
})();
