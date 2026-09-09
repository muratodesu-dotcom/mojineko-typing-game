// All persistence lives in localStorage under a single key.
const Store = (() => {
  const KEY = 'kotoba-type:v2';

  // Each language has its own entry page (/ ja, /ko/, /en/); a first visit starts in that page's language.
  const siteLang = () => document.documentElement.dataset.siteLang || 'ja';

  const DEFAULTS = () => ({
    settings: {
      lang: siteLang(),   // practice language
      uiLang: siteLang(), // menu / settings language, independent of the practice language
      theme: 'light',    // 'light' | 'dark' (light is the default; anything else is treated as light)
      font: 'clean',     // 'clean' | 'round' | 'serif' | 'pixel' | 'system'
      textSize: 'm',     // sentence size: 's' | 'm' | 'l'
      sideTab: 'overview',
      pet: 'cat',        // 'cat' | 'dog' | 'rabbit' | 'bear' | 'chick'
      input: { ja: 'romaji', ko: 'jamo', en: 'keys', tr: 'keys' },  // ja: 'romaji' (plain keyboard) | 'mixed' (IME); ko: 'jamo' | 'direct'
      mode: 'time',      // 'time' | 'sprint' | 'daily' | 'drill'
      duration: 60,      // seconds, for time mode
      sprintCount: 10,   // sentences, for sprint mode
      level: 'mixed',    // 'mixed' | 1 | 2 | 3
      pack: 'all',       // 'all' | 'daily' | 'travel' | 'work' | 'food' | 'weak' | 'custom'
      sound: true,
      volume: 60,        // 0..100
      guide: true,
      keyLetters: false, // Korean key guide: also show the QWERTY letters under the jamo
      keyboard: true,
      translation: true,
      furigana: true,    // furigana above kanji (Japanese 混合)
      hideInput: false,  // inline IME composition, input box visually hidden
      strict: false,     // 2-set mode: wrong keys must be erased with Backspace
    },
    stats: {
      games: 0, chars: 0, keys: 0, seconds: 0, bestCombo: 0, xp: 0, pets: 0,
      langs: { ja: 0, ko: 0, en: 0, tr: 0 },
      // Per-difficulty progress (mixed games credit each sentence to its own level).
      levels: {
        1: { games: 0, sentences: 0, bestRank: '', bestScore: 0 },
        2: { games: 0, sentences: 0, bestRank: '', bestScore: 0 },
        3: { games: 0, sentences: 0, bestRank: '', bestScore: 0 },
      },
    },
    boards: {},        // boardKey -> [{score, speed, acc, combo, rank, date}]
    ghosts: {},        // boardKey -> score sampled each second of the best run
    daily: {},         // "YYYY-MM-DD:lang:input" -> best entry that day
    history: [],       // recent rounds: {t, lang, input, mode, level, score, speed, acc, rank}
    weak: { ja: {}, ko: {}, en: {}, tr: {} },  // character -> miss count
    custom: { ja: [], ko: [], en: [], tr: [] }, // user sentences: {text, reading, en}
    achievements: {},  // id -> ISO date unlocked
    streak: { last: '', count: 0, best: 0, freezeUsed: '' },
    egg: { last: false, day: '', count: 0 },  // easter-egg sentence: shown last round? how many times today?
  });

  let state = null;

  function load() {
    if (state) return state;
    state = DEFAULTS();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) state = deepMerge(state, JSON.parse(raw));
    } catch (e) { /* corrupted or unavailable storage: start fresh */ }
    return state;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore quota errors */ }
  }

  function reset() {
    state = DEFAULTS();
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  }

  // Replace the whole state with an imported backup (validated by the caller).
  function replace(obj) {
    state = deepMerge(DEFAULTS(), obj);
    save();
  }

  function exportJson() {
    return JSON.stringify({ app: 'mojineko', version: 2, exportedAt: new Date().toISOString(), data: state }, null, 2);
  }

  function deepMerge(base, extra) {
    if (Array.isArray(base) || Array.isArray(extra)) return extra;
    if (typeof base !== 'object' || base === null) return extra === undefined ? base : extra;
    const out = { ...base };
    for (const k of Object.keys(extra || {})) {
      out[k] = (k in base && typeof base[k] === 'object' && base[k] !== null && !Array.isArray(base[k]))
        ? deepMerge(base[k], extra[k])
        : extra[k];
    }
    return out;
  }

  return { load, save, reset, replace, exportJson, KEY };
})();
