// Romaji input engine for Japanese (ローマ字入力), Sushida-style.
// Splits a kana reading into typing units (きゃ, っし, ん, punctuation…), lists every
// romanization an IME would accept for each, and lets the displayed spelling follow
// what the player actually types (si vs shi, tu vs tsu, n vs nn, kka vs xtuka…).
const Romaji = (() => {
  // Single kana: the spelling shown first is the Hepburn-style one learners know from textbooks.
  const KANA = {
    'あ': ['a'], 'い': ['i', 'yi'], 'う': ['u', 'wu', 'whu'], 'え': ['e'], 'お': ['o'],
    'か': ['ka', 'ca'], 'き': ['ki'], 'く': ['ku', 'cu', 'qu'], 'け': ['ke'], 'こ': ['ko', 'co'],
    'さ': ['sa'], 'し': ['shi', 'si', 'ci'], 'す': ['su'], 'せ': ['se', 'ce'], 'そ': ['so'],
    'た': ['ta'], 'ち': ['chi', 'ti'], 'つ': ['tsu', 'tu'], 'て': ['te'], 'と': ['to'],
    'な': ['na'], 'に': ['ni'], 'ぬ': ['nu'], 'ね': ['ne'], 'の': ['no'],
    'は': ['ha'], 'ひ': ['hi'], 'ふ': ['fu', 'hu'], 'へ': ['he'], 'ほ': ['ho'],
    'ま': ['ma'], 'み': ['mi'], 'む': ['mu'], 'め': ['me'], 'も': ['mo'],
    'や': ['ya'], 'ゆ': ['yu'], 'よ': ['yo'],
    'ら': ['ra'], 'り': ['ri'], 'る': ['ru'], 'れ': ['re'], 'ろ': ['ro'],
    'わ': ['wa'], 'ゐ': ['wi'], 'ゑ': ['we'], 'を': ['wo'],
    'が': ['ga'], 'ぎ': ['gi'], 'ぐ': ['gu'], 'げ': ['ge'], 'ご': ['go'],
    'ざ': ['za'], 'じ': ['ji', 'zi'], 'ず': ['zu'], 'ぜ': ['ze'], 'ぞ': ['zo'],
    'だ': ['da'], 'ぢ': ['di'], 'づ': ['du'], 'で': ['de'], 'ど': ['do'],
    'ば': ['ba'], 'び': ['bi'], 'ぶ': ['bu'], 'べ': ['be'], 'ぼ': ['bo'],
    'ぱ': ['pa'], 'ぴ': ['pi'], 'ぷ': ['pu'], 'ぺ': ['pe'], 'ぽ': ['po'],
    'ゔ': ['vu'],
    'ぁ': ['xa', 'la'], 'ぃ': ['xi', 'li'], 'ぅ': ['xu', 'lu'], 'ぇ': ['xe', 'le'], 'ぉ': ['xo', 'lo'],
    'ゃ': ['xya', 'lya'], 'ゅ': ['xyu', 'lyu'], 'ょ': ['xyo', 'lyo'], 'ゎ': ['xwa', 'lwa'],
    'ゕ': ['xka', 'lka'], 'ゖ': ['xke', 'lke'],
  };
  // Two-kana combinations. Typing the two kana separately (ki + xya) is accepted as well.
  const COMBO = {
    'きゃ': ['kya'], 'きぃ': ['kyi'], 'きゅ': ['kyu'], 'きぇ': ['kye'], 'きょ': ['kyo'],
    'ぎゃ': ['gya'], 'ぎぃ': ['gyi'], 'ぎゅ': ['gyu'], 'ぎぇ': ['gye'], 'ぎょ': ['gyo'],
    'しゃ': ['sha', 'sya'], 'しぃ': ['syi'], 'しゅ': ['shu', 'syu'], 'しぇ': ['she', 'sye'], 'しょ': ['sho', 'syo'],
    'じゃ': ['ja', 'jya', 'zya'], 'じぃ': ['jyi', 'zyi'], 'じゅ': ['ju', 'jyu', 'zyu'], 'じぇ': ['je', 'jye', 'zye'], 'じょ': ['jo', 'jyo', 'zyo'],
    'ちゃ': ['cha', 'tya', 'cya'], 'ちぃ': ['tyi', 'cyi'], 'ちゅ': ['chu', 'tyu', 'cyu'], 'ちぇ': ['che', 'tye', 'cye'], 'ちょ': ['cho', 'tyo', 'cyo'],
    'ぢゃ': ['dya'], 'ぢぃ': ['dyi'], 'ぢゅ': ['dyu'], 'ぢぇ': ['dye'], 'ぢょ': ['dyo'],
    'にゃ': ['nya'], 'にぃ': ['nyi'], 'にゅ': ['nyu'], 'にぇ': ['nye'], 'にょ': ['nyo'],
    'ひゃ': ['hya'], 'ひぃ': ['hyi'], 'ひゅ': ['hyu'], 'ひぇ': ['hye'], 'ひょ': ['hyo'],
    'びゃ': ['bya'], 'びぃ': ['byi'], 'びゅ': ['byu'], 'びぇ': ['bye'], 'びょ': ['byo'],
    'ぴゃ': ['pya'], 'ぴぃ': ['pyi'], 'ぴゅ': ['pyu'], 'ぴぇ': ['pye'], 'ぴょ': ['pyo'],
    'みゃ': ['mya'], 'みぃ': ['myi'], 'みゅ': ['myu'], 'みぇ': ['mye'], 'みょ': ['myo'],
    'りゃ': ['rya'], 'りぃ': ['ryi'], 'りゅ': ['ryu'], 'りぇ': ['rye'], 'りょ': ['ryo'],
    'ふぁ': ['fa'], 'ふぃ': ['fi'], 'ふぇ': ['fe'], 'ふぉ': ['fo'], 'ふゅ': ['fyu'],
    'てぃ': ['thi'], 'てゅ': ['thu'], 'でぃ': ['dhi'], 'でゅ': ['dhu'],
    'とぅ': ['twu'], 'どぅ': ['dwu'],
    'うぃ': ['wi', 'whi'], 'うぇ': ['we', 'whe'], 'うぉ': ['who'],
    'ゔぁ': ['va'], 'ゔぃ': ['vi'], 'ゔぇ': ['ve'], 'ゔぉ': ['vo'],
    'つぁ': ['tsa'], 'つぃ': ['tsi'], 'つぇ': ['tse'], 'つぉ': ['tso'],
    'くぁ': ['qa', 'kwa'], 'くぃ': ['qi'], 'くぇ': ['qe'], 'くぉ': ['qo'], 'ぐぁ': ['gwa'],
    'いぇ': ['ye'],
  };
  const PUNCT = {
    '。': ['.'], '、': [','], '？': ['?'], '！': ['!'], 'ー': ['-'], '「': ['['], '」': [']'],
    '・': ['/'], '～': ['~'], '〜': ['~'], '　': [' '], ' ': [' '], '（': ['('], '）': [')'],
    '：': [':'], '；': [';'], '…': ['...'], '‥': ['..'],
  };
  const SMALL = 'ぁぃぅぇぉゃゅょゎ';
  const SOKUON = ['xtu', 'ltu', 'xtsu', 'ltsu'];
  const CONSONANT = /^[bcdfghjkmpqrstvwz]/;       // can be doubled for っ
  const AFTER_N = /^[bcdfghjkmpqrstvwxzl]/;       // ん may be a single "n" before these letters

  const kataToHira = s => s.replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
  // Anything else (digits, latin letters, full-width ASCII) is typed as itself.
  const fallback = ch => {
    const c = ch.charCodeAt(0);
    if (c >= 0xff01 && c <= 0xff5e) return String.fromCharCode(c - 0xfee0).toLowerCase();
    return ch.toLowerCase();
  };

  function altsFor(chunk) {
    if (chunk.length === 2) {
      const a = KANA[chunk[0]], b = KANA[chunk[1]];
      const split = [];
      if (a && b) for (const x of a) for (const y of b) split.push(x + y);
      return [...(COMBO[chunk] || []), ...split];
    }
    return KANA[chunk] || PUNCT[chunk] || [fallback(chunk)];
  }

  function withSokuon(alts, n) {
    const out = [];
    for (const a of alts) if (CONSONANT.test(a)) out.push(a[0].repeat(n) + a);
    for (const p of SOKUON) for (const a of alts) out.push(p.repeat(n) + a);
    return out;
  }

  // Split a kana reading into units: [{ text, alts, canon, typed, partial }].
  function buildUnits(reading) {
    const s = kataToHira(reading);
    const units = [];
    let i = 0;
    while (i < s.length) {
      let sok = 0;
      while (s[i] === 'っ') { sok++; i++; }
      if (i >= s.length) { while (sok--) units.push(unit('っ', SOKUON.slice())); break; }
      let chunk = s[i];
      if (i + 1 < s.length && SMALL.includes(s[i + 1]) && (COMBO[s.slice(i, i + 2)] || KANA[s[i]])) chunk = s.slice(i, i + 2);
      i += chunk.length;
      let alts = chunk === 'ん' ? null : altsFor(chunk);
      if (sok && alts && alts.some(a => CONSONANT.test(a))) {
        units.push(unit('っ'.repeat(sok) + chunk, withSokuon(alts, sok)));
      } else {
        while (sok--) units.push(unit('っ', SOKUON.slice()));
        units.push(unit(chunk, alts));
      }
    }
    // ん: a single "n" is enough when the next unit starts with a consonant (other than n / y);
    // before a vowel, y, n, punctuation or at the end it must be "nn" (or "xn").
    units.forEach((u, idx) => {
      if (u.text !== 'ん') return;
      const next = units[idx + 1];
      const single = !!next && next.alts.every(a => AFTER_N.test(a));
      u.alts = single ? ['n', 'nn', 'xn'] : ['nn', 'xn'];
      u.canon = u.alts[0];
    });
    return units;
  }

  function unit(text, alts) {
    return { text, alts, canon: alts ? alts[0] : '', typed: '', partial: p => p };
  }

  // Display string for a whole reading (first spelling of every unit).
  const toRomaji = reading => buildUnits(reading).map(u => u.canon).join('');

  return { buildUnits, toRomaji, kataToHira };
})();
