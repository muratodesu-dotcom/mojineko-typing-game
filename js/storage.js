// All persistence lives in localStorage under a single key.
const Store = (() => {
  const KEY = 'kotoba-type:v2';

  const DEFAULTS = () => ({
    settings: {
      lang: 'ja',
      theme: 'system',   // 'system' | 'light' | 'dark'
      input: { ja: 'hiragana', ko: 'jamo' },  // ja: script to type (via IME); ko: input method
      mode: 'time',      // 'time' | 'sprint'
      duration: 60,      // seconds, for time mode
      sprintCount: 10,   // sentences, for sprint mode
      level: 'mixed',    // 'mixed' | 1 | 2 | 3
      sound: true,
      guide: true,
      keyboard: true,
      translation: true,
    },
    stats: {
      games: 0, chars: 0, keys: 0, seconds: 0, bestCombo: 0, xp: 0, pets: 0,
      langs: { ja: 0, ko: 0 },
      // Per-difficulty progress (mixed games credit each sentence to its own level).
      levels: {
        1: { games: 0, sentences: 0, bestRank: '', bestScore: 0 },
        2: { games: 0, sentences: 0, bestRank: '', bestScore: 0 },
        3: { games: 0, sentences: 0, bestRank: '', bestScore: 0 },
      },
    },
    boards: {},        // boardKey -> [{score, speed, acc, combo, rank, date}]
    achievements: {},  // id -> ISO date unlocked
    streak: { last: '', count: 0, best: 0 },
  });

  let state = null;

  function load() {
    if (state) return state;
    state = DEFAULTS();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        state = deepMerge(state, saved);
      }
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

  return { load, save, reset };
})();
