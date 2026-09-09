// Hangul 2-set (두벌식) keyboard engine for Korean.
// Decomposes each syllable into the QWERTY key sequence a Korean typist presses,
// and composes partial syllables back for live display.
const Hangul = (() => {
  const INI = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  const MED = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
  const FIN = ' ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ';
  const INI_KEYS = ['r', 'R', 's', 'e', 'E', 'f', 'a', 'q', 'Q', 't', 'T', 'd', 'w', 'W', 'c', 'z', 'x', 'v', 'g'];
  const MED_KEYS = ['k', 'o', 'i', 'O', 'j', 'p', 'u', 'P', 'h', 'hk', 'ho', 'hl', 'y', 'n', 'nj', 'np', 'nl', 'b', 'm', 'ml', 'l'];
  const FIN_KEYS = ['', 'r', 'R', 'rt', 's', 'sw', 'sg', 'e', 'f', 'fr', 'fa', 'fq', 'ft', 'fx', 'fv', 'fg', 'a', 'q', 'qt', 't', 'T', 'd', 'w', 'c', 'z', 'x', 'v', 'g'];

  // Key -> jamo label for the on-screen keyboard.
  const KEY_LABELS = {
    q: 'ㅂ', w: 'ㅈ', e: 'ㄷ', r: 'ㄱ', t: 'ㅅ', y: 'ㅛ', u: 'ㅕ', i: 'ㅑ', o: 'ㅐ', p: 'ㅔ',
    a: 'ㅁ', s: 'ㄴ', d: 'ㅇ', f: 'ㄹ', g: 'ㅎ', h: 'ㅗ', j: 'ㅓ', k: 'ㅏ', l: 'ㅣ',
    z: 'ㅋ', x: 'ㅌ', c: 'ㅊ', v: 'ㅍ', b: 'ㅠ', n: 'ㅜ', m: 'ㅡ',
  };
  const SHIFT_LABELS = { q: 'ㅃ', w: 'ㅉ', e: 'ㄸ', r: 'ㄲ', t: 'ㅆ', o: 'ㅒ', p: 'ㅖ' };

  function isSyllable(ch) {
    const c = ch.charCodeAt(0);
    return c >= 0xac00 && c <= 0xd7a3;
  }

  function decompose(ch) {
    const c = ch.charCodeAt(0) - 0xac00;
    return { ini: Math.floor(c / 588), med: Math.floor((c % 588) / 28), fin: c % 28 };
  }

  function compose(ini, med, fin) {
    return String.fromCharCode(0xac00 + (ini * 21 + med) * 28 + fin);
  }

  function keysFor(ch) {
    if (!isSyllable(ch)) return ch;
    const d = decompose(ch);
    return INI_KEYS[d.ini] + MED_KEYS[d.med] + FIN_KEYS[d.fin];
  }

  // Display the partially typed syllable given the key prefix typed so far.
  function partial(ch, prefix) {
    if (!prefix) return '';
    if (!isSyllable(ch)) return prefix;
    const d = decompose(ch);
    const medLen = MED_KEYS[d.med].length;
    const medK = prefix.slice(1, 1 + medLen);
    const finK = prefix.slice(1 + medLen);
    if (!medK) return INI[d.ini];
    const medIdx = MED_KEYS.indexOf(medK);
    const finIdx = finK ? FIN_KEYS.indexOf(finK) : 0;
    return compose(d.ini, medIdx < 0 ? d.med : medIdx, finIdx < 0 ? 0 : finIdx);
  }

  function buildUnits(text) {
    return [...text].map(ch => {
      const keys = keysFor(ch);
      return { text: ch, alts: [keys], canon: keys, typed: '', partial: p => partial(ch, p) };
    });
  }

  // Jamo a key produces on the 2-set layout (d → ㅇ, R → ㄲ); keys without a jamo label themselves.
  const keyLabel = k => KEY_LABELS[k] || SHIFT_LABELS[k.toLowerCase()] || k;
  // Guide labels for (part of) a unit's key sequence: jamo for a syllable ("dhk" → "ㅇㅗㅏ"), the characters themselves otherwise ("?" → "?").
  const labelsFor = (ch, keys) => isSyllable(ch) ? [...keys].map(keyLabel).join('') : keys;

  return { buildUnits, keysFor, keyLabel, labelsFor, isSyllable, KEY_LABELS, SHIFT_LABELS };
})();
