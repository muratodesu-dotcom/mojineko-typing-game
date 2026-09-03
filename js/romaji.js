// Romaji input engine for Japanese.
// Converts a kana reading into a sequence of "units"; each unit accepts one or
// more romaji spellings (e.g. し -> shi / si / ci, きゃ -> kya / kixya / kilya).
const Romaji = (() => {
  const TABLE = {
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
    'ん': ['nn', 'xn'],
    'が': ['ga'], 'ぎ': ['gi'], 'ぐ': ['gu'], 'げ': ['ge'], 'ご': ['go'],
    'ざ': ['za'], 'じ': ['ji', 'zi'], 'ず': ['zu'], 'ぜ': ['ze'], 'ぞ': ['zo'],
    'だ': ['da'], 'ぢ': ['di'], 'づ': ['du'], 'で': ['de'], 'ど': ['do'],
    'ば': ['ba'], 'び': ['bi'], 'ぶ': ['bu'], 'べ': ['be'], 'ぼ': ['bo'],
    'ぱ': ['pa'], 'ぴ': ['pi'], 'ぷ': ['pu'], 'ぺ': ['pe'], 'ぽ': ['po'],
    'ゔ': ['vu'],
    'ぁ': ['xa', 'la'], 'ぃ': ['xi', 'li'], 'ぅ': ['xu', 'lu'], 'ぇ': ['xe', 'le'], 'ぉ': ['xo', 'lo'],
    'ゃ': ['xya', 'lya'], 'ゅ': ['xyu', 'lyu'], 'ょ': ['xyo', 'lyo'],
    'ゎ': ['xwa', 'lwa'],
    'っ': ['xtu', 'ltu', 'xtsu', 'ltsu'],
    'ー': ['-'], '、': [','], '。': ['.'], '！': ['!'], '？': ['?'],
    '　': [' '], ' ': [' '], '・': ['/'], '「': ['['], '」': [']'], '～': ['~'],
  };

  const COMBO = {
    'きゃ': ['kya'], 'きゅ': ['kyu'], 'きょ': ['kyo'], 'きぃ': ['kyi'], 'きぇ': ['kye'],
    'しゃ': ['sha', 'sya'], 'しゅ': ['shu', 'syu'], 'しょ': ['sho', 'syo'], 'しぇ': ['she', 'sye'],
    'ちゃ': ['cha', 'tya', 'cya'], 'ちゅ': ['chu', 'tyu', 'cyu'], 'ちょ': ['cho', 'tyo', 'cyo'], 'ちぇ': ['che', 'tye', 'cye'],
    'にゃ': ['nya'], 'にゅ': ['nyu'], 'にょ': ['nyo'],
    'ひゃ': ['hya'], 'ひゅ': ['hyu'], 'ひょ': ['hyo'],
    'みゃ': ['mya'], 'みゅ': ['myu'], 'みょ': ['myo'],
    'りゃ': ['rya'], 'りゅ': ['ryu'], 'りょ': ['ryo'],
    'ぎゃ': ['gya'], 'ぎゅ': ['gyu'], 'ぎょ': ['gyo'],
    'じゃ': ['ja', 'jya', 'zya'], 'じゅ': ['ju', 'jyu', 'zyu'], 'じょ': ['jo', 'jyo', 'zyo'], 'じぇ': ['je', 'jye', 'zye'],
    'ぢゃ': ['dya'], 'ぢゅ': ['dyu'], 'ぢょ': ['dyo'],
    'びゃ': ['bya'], 'びゅ': ['byu'], 'びょ': ['byo'],
    'ぴゃ': ['pya'], 'ぴゅ': ['pyu'], 'ぴょ': ['pyo'],
    'てぃ': ['thi'], 'でぃ': ['dhi'], 'てゅ': ['thu'], 'でゅ': ['dhu'],
    'とぅ': ['twu'], 'どぅ': ['dwu'],
    'ふぁ': ['fa'], 'ふぃ': ['fi'], 'ふぇ': ['fe'], 'ふぉ': ['fo'],
    'うぃ': ['wi'], 'うぇ': ['we'], 'うぉ': ['who'],
    'ゔぁ': ['va'], 'ゔぃ': ['vi'], 'ゔぇ': ['ve'], 'ゔぉ': ['vo'],
    'くぁ': ['qa', 'kwa'], 'くぃ': ['qi'], 'くぇ': ['qe'], 'くぉ': ['qo'],
    'ぐぁ': ['gwa'],
    'つぁ': ['tsa'], 'つぃ': ['tsi'], 'つぇ': ['tse'], 'つぉ': ['tso'],
    'いぇ': ['ye'],
  };

  const SMALLS = 'ぁぃぅぇぉゃゅょゎ';
  const VOWELS = 'aiueo';

  function kataToHira(s) {
    return s.replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
  }

  // Returns { kana, alts, len } for the unit starting at index i (no sokuon handling).
  function baseUnitAt(hira, i) {
    const ch = hira[i];
    const next = hira[i + 1];
    if (next && SMALLS.includes(next) && TABLE[ch]) {
      const pair = ch + next;
      let alts = COMBO[pair] ? [...COMBO[pair]] : [];
      // Always allow base + small kana spelling (e.g. ki + xya).
      for (const a of TABLE[ch]) for (const b of TABLE[next]) alts.push(a + b);
      alts = [...new Set(alts)];
      return { kana: pair, alts, len: 2 };
    }
    if (TABLE[ch]) return { kana: ch, alts: [...TABLE[ch]], len: 1 };
    // Unknown character (ASCII letters, digits, symbols): accept it verbatim.
    return { kana: ch, alts: [ch], len: 1 };
  }

  function unitAt(hira, i) {
    const ch = hira[i];
    if (ch === 'っ' && i + 1 < hira.length && hira[i + 1] !== 'っ') {
      const nxt = baseUnitAt(hira, i + 1);
      const alts = [];
      for (const s of nxt.alts) {
        const c = s[0];
        if (!VOWELS.includes(c) && c !== 'n' && /[a-z]/.test(c)) alts.push(c + s);
      }
      for (const p of TABLE['っ']) for (const s of nxt.alts) alts.push(p + s);
      return { kana: 'っ' + nxt.kana, alts, len: 1 + nxt.len };
    }
    return baseUnitAt(hira, i);
  }

  function buildUnits(reading) {
    const hira = kataToHira(reading);
    const units = [];
    let i = 0;
    while (i < hira.length) {
      const u = unitAt(hira, i);
      units.push({ text: u.kana, alts: u.alts, isN: u.kana === 'ん', typed: '' });
      i += u.len;
    }
    // Canonical spelling shown in the guide.
    units.forEach((u, idx) => {
      if (u.isN) {
        const next = units[idx + 1];
        const nc = next ? next.alts[0][0] : '';
        u.canon = next && !'aiueony'.includes(nc) && /[a-z]/.test(nc) ? 'n' : 'nn';
      } else {
        u.canon = u.alts[0];
      }
    });
    return units;
  }

  return { buildUnits, kataToHira };
})();
