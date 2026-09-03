(() => {
  'use strict';

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = n => Math.round(n).toLocaleString('en-US');
  const escapeHtml = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------------------------------------------------------------------
  // Static config
  // ---------------------------------------------------------------------
  const LANGS = {
    ja: {
      name: '日本語', label: 'Japanese', sentences: () => JA_SENTENCES,
      inputs: [
        { id: 'romaji', name: '⌨️ Romaji keys', hint: 'Type romaji on a regular keyboard (kya / sha / nn…). No IME needed — turn your IME off.' },
        { id: 'direct', name: '🈶 Japanese IME', hint: 'Type with your Japanese IME and match the sentence exactly, kanji included.' },
      ],
    },
    ko: {
      name: '한국어', label: 'Korean', sentences: () => KO_SENTENCES,
      inputs: [
        { id: 'jamo', name: '⌨️ 2-set keys (두벌식)', hint: 'Type on a regular keyboard using the Korean 2-set layout. No IME needed — turn your IME off.' },
        { id: 'direct', name: '🈷 Korean IME', hint: 'Type with your Korean IME and match the sentence exactly.' },
      ],
    },
  };

  const RANKS = [
    { r: 'S', min: 8000 }, { r: 'A', min: 5500 }, { r: 'B', min: 3500 },
    { r: 'C', min: 2000 }, { r: 'D', min: 900 }, { r: 'E', min: 0 },
  ];
  const RANK_LABELS = { S: 'Legendary!', A: 'Excellent', B: 'Great', C: 'Good', D: 'Keep going', E: 'Warming up' };

  const LEVEL_TITLES = ['Novice', 'Apprentice', 'Typist', 'Speedster', 'Expert', 'Master', 'Grandmaster', 'Legend'];

  const ACHIEVEMENTS = [
    { id: 'first', ico: '🎉', name: 'First steps', desc: 'Finish your first game.', test: (r, s) => s.stats.games >= 1 },
    { id: 'combo50', ico: '🔥', name: 'On fire', desc: 'Reach a 50 combo.', test: r => r.maxCombo >= 50 },
    { id: 'combo100', ico: '💥', name: 'Unstoppable', desc: 'Reach a 100 combo.', test: r => r.maxCombo >= 100 },
    { id: 'perfect', ico: '💎', name: 'Flawless', desc: 'Finish a game with 100% accuracy and 3+ sentences.', test: r => r.misses === 0 && r.sentences >= 3 },
    { id: 'rankS', ico: '👑', name: 'S rank', desc: 'Earn an S rank.', test: r => r.rank === 'S' },
    { id: 'rankA', ico: '⭐', name: 'A rank', desc: 'Earn an A rank or better.', test: r => r.rank === 'A' || r.rank === 'S' },
    { id: 'ten', ico: '🔟', name: 'Ten in one', desc: 'Complete 10 sentences in one game.', test: r => r.sentences >= 10 },
    { id: 'games10', ico: '🎮', name: 'Regular', desc: 'Play 10 games.', test: (r, s) => s.stats.games >= 10 },
    { id: 'games50', ico: '🏅', name: 'Devoted', desc: 'Play 50 games.', test: (r, s) => s.stats.games >= 50 },
    { id: 'bilingual', ico: '🌏', name: 'Bilingual', desc: 'Play both Japanese and Korean.', test: (r, s) => s.stats.langs.ja > 0 && s.stats.langs.ko > 0 },
    { id: 'streak3', ico: '📅', name: 'Three-day streak', desc: 'Play three days in a row.', test: (r, s) => s.streak.count >= 3 },
    { id: 'streak7', ico: '🗓️', name: 'Week warrior', desc: 'Play seven days in a row.', test: (r, s) => s.streak.count >= 7 },
    { id: 'chars10k', ico: '📚', name: 'Ten thousand', desc: 'Type 10,000 characters in total.', test: (r, s) => s.stats.chars >= 10000 },
    { id: 'hard', ico: '🌳', name: 'Tree climber', desc: 'Finish a Hard-difficulty game with B rank or better.', test: r => r.level === '3' && 'SAB'.includes(r.rank) },
    { id: 'sprint', ico: '🏁', name: 'Sprinter', desc: 'Finish a 20-sentence sprint.', test: r => r.mode === 'sprint' && r.sprintCount === 20 },
    { id: 'night', ico: '🌙', name: 'Night owl', desc: 'Play a game between midnight and 4 a.m.', test: r => r.hour >= 0 && r.hour < 4 },
  ];

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------
  const S = Store.load();
  const set = S.settings;

  const G = {
    active: false, phase: 'idle', // idle | countdown | play | done
    lang: 'ja', input: 'romaji', mode: 'time', duration: 60, sprintCount: 10, level: 'mixed',
    pool: [], poolIdx: 0, sentence: null, units: [], uIdx: 0, buf: '',
    startAt: 0, endAt: 0, elapsed: 0, raf: 0, timer: 0,
    score: 0, combo: 0, maxCombo: 0, hits: 0, misses: 0, keys: 0, chars: 0,
    sentences: 0, perfect: 0, sentenceMisses: 0,
    direct: { scored: 0, flagged: false, composing: false },
  };

  const el = {
    root: document.documentElement,
    screens: { home: $('#screen-home'), play: $('#screen-play'), result: $('#screen-result') },
    heroLang: $('#hero-lang'), inputChips: $('#input-chips'), inputHint: $('#input-hint'),
    fieldDuration: $('#field-duration'), fieldSprint: $('#field-sprint'),
    optGuide: $('#opt-guide'), optKeyboard: $('#opt-keyboard'), optTranslation: $('#opt-translation'),
    btnStart: $('#btn-start'), btnRetry: $('#btn-retry'), btnHome: $('#btn-home'), btnReset: $('#btn-reset'), btnSound: $('#btn-sound'),
    homeStats: $('#home-stats'), homeBoard: $('#home-board'), boardLabel: $('#board-label'), achGrid: $('#ach-grid'), achCount: $('#ach-count'),
    streak: $('#streak-count'), levelNum: $('#level-num'), levelTitle: $('#level-title'), xpFill: $('#xp-fill'),
    hudTime: $('#hud-time'), hudTimeLabel: $('#hud-time-label'), hudScore: $('#hud-score'), hudCombo: $('#hud-combo'),
    hudComboBox: $('.hud-item.combo'), hudSpeed: $('#hud-speed'), hudSpeedLabel: $('#hud-speed-label'), hudAcc: $('#hud-acc'),
    timebar: $('#timebar-fill'), countdown: $('#countdown'), card: $('#sentence-card'), dots: $('#progress-dots'),
    main: $('#sentence-main'), reading: $('#sentence-reading'), guide: $('#sentence-guide'), en: $('#sentence-en'),
    directInput: $('#direct-input'), floatLayer: $('#float-layer'), keyboard: $('#keyboard'),
    resultRank: $('#result-rank'), resultRankLabel: $('#result-rank-label'), resultScore: $('#result-score'), newRecord: $('#new-record'),
    resultStats: $('#result-stats'), resultAch: $('#result-ach'), resultBoard: $('#result-board'), resultBoardLabel: $('#result-board-label'),
    confetti: $('#confetti'), toastLayer: $('#toast-layer'),
  };

  // ---------------------------------------------------------------------
  // Helpers: level, streak, boards
  // ---------------------------------------------------------------------
  const levelFromXp = xp => Math.floor(Math.sqrt(xp / 400)) + 1;
  const xpForLevel = lv => (lv - 1) * (lv - 1) * 400;
  const levelTitle = lv => LEVEL_TITLES[clamp(Math.floor((lv - 1) / 3), 0, LEVEL_TITLES.length - 1)];

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
    const gap = daysBetween(S.streak.last, todayStr());
    return gap <= 1 ? S.streak.count : 0;
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
    const inp = LANGS[lang].inputs.find(i => i.id === input);
    const inpName = inp ? inp.name.replace(/^\S+\s/, '') : input;
    return `${LANGS[lang].label} · ${inpName} · ${mode === 'time' ? len : len.replace('x', ' sentences')}`;
  }

  // ---------------------------------------------------------------------
  // Home screen
  // ---------------------------------------------------------------------
  function renderHome() {
    el.root.dataset.lang = set.lang;
    el.heroLang.textContent = LANGS[set.lang].name;
    $$('.lang-card').forEach(b => b.classList.toggle('active', b.dataset.lang === set.lang));

    const inputs = LANGS[set.lang].inputs;
    if (!inputs.some(i => i.id === set.input[set.lang])) set.input[set.lang] = inputs[0].id;
    el.inputChips.innerHTML = inputs.map(i =>
      `<button class="chip${i.id === set.input[set.lang] ? ' active' : ''}" data-input="${i.id}">${i.name}</button>`).join('');
    el.inputHint.textContent = inputs.find(i => i.id === set.input[set.lang]).hint;

    $$('#mode-chips .chip').forEach(b => b.classList.toggle('active', b.dataset.mode === set.mode));
    $$('#duration-chips .chip').forEach(b => b.classList.toggle('active', +b.dataset.duration === set.duration));
    $$('#sprint-chips .chip').forEach(b => b.classList.toggle('active', +b.dataset.sprint === set.sprintCount));
    $$('#level-chips .chip').forEach(b => b.classList.toggle('active', b.dataset.level === String(set.level)));
    el.fieldDuration.hidden = set.mode !== 'time';
    el.fieldSprint.hidden = set.mode !== 'sprint';
    el.optGuide.checked = set.guide;
    el.optKeyboard.checked = set.keyboard;
    el.optTranslation.checked = set.translation;
    el.btnSound.textContent = set.sound ? '🔊' : '🔇';
    Sfx.setEnabled(set.sound);

    renderTopbar();
    renderStats();
    renderBoard(el.homeBoard, el.boardLabel, boardKey(set.lang, set.input[set.lang], set.mode, set.duration, set.sprintCount), null);
    renderAchievements();
  }

  function renderTopbar() {
    el.streak.textContent = currentStreak();
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
      statCard('Games', fmt(st.games)),
      statCard('Characters', fmt(st.chars)),
      statCard('Best combo', fmt(st.bestCombo)),
      statCard('Time played', mins < 60 ? fmt(mins) : (st.seconds / 3600).toFixed(1), mins < 60 ? 'min' : 'h'),
      statCard('Total XP', fmt(st.xp)),
      statCard('Best streak', fmt(S.streak.best), 'days'),
    ].join('');
  }

  function renderBoard(listEl, labelEl, key, highlightIdx) {
    const board = S.boards[key] || [];
    if (labelEl) labelEl.textContent = labelFromKey(key);
    if (!board.length) {
      listEl.innerHTML = '<li class="empty">No scores yet — be the first!</li>';
      return;
    }
    listEl.innerHTML = board.map((e, i) => `
      <li${i === highlightIdx ? ' class="me"' : ''}>
        <span class="pos">${i + 1}</span>
        <span><span class="rank-badge">${e.rank}</span><span class="meta">${e.speed} ${e.speedUnit || ''} · ${e.acc}% · ${e.combo}x · ${e.date}</span></span>
        <span class="sc">${fmt(e.score)}</span>
      </li>`).join('');
  }

  function renderAchievements() {
    const unlocked = Object.keys(S.achievements).length;
    el.achCount.textContent = `${unlocked} / ${ACHIEVEMENTS.length}`;
    el.achGrid.innerHTML = ACHIEVEMENTS.map(a => {
      const when = S.achievements[a.id];
      return `<div class="ach${when ? ' unlocked' : ''}" title="${a.name} — ${a.desc}${when ? ' (unlocked ' + when + ')' : ''}">${a.ico}</div>`;
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
    Object.assign(G, {
      active: true, phase: 'countdown',
      lang: set.lang, input: set.input[set.lang], mode: set.mode, duration: set.duration, sprintCount: set.sprintCount, level: String(set.level),
      poolIdx: 0, sentence: null, units: [], uIdx: 0, buf: '',
      startAt: 0, endAt: 0, elapsed: 0,
      score: 0, combo: 0, maxCombo: 0, hits: 0, misses: 0, keys: 0, chars: 0,
      sentences: 0, perfect: 0, sentenceMisses: 0,
      direct: { scored: 0, flagged: false, composing: false },
    });
    const all = LANGS[G.lang].sentences();
    const filtered = G.level === 'mixed' ? all : all.filter(s => s.level === +G.level);
    G.pool = shuffle(filtered.length ? filtered : all);

    el.root.dataset.lang = G.lang;
    el.hudSpeedLabel.textContent = G.input === 'direct' ? 'CPM' : 'KPM';
    el.hudTimeLabel.textContent = G.mode === 'time' ? 'Time' : 'Sentences';
    el.timebar.classList.remove('low');
    el.timebar.style.width = '100%';
    el.directInput.hidden = G.input !== 'direct';
    el.directInput.value = '';
    el.directInput.classList.remove('bad');
    el.floatLayer.innerHTML = '';
    buildKeyboard();
    updateHud();
    showScreen('play');

    loadSentence();
    el.card.classList.add('blur');
    runCountdown(3);
  }

  function runCountdown(n) {
    el.countdown.hidden = false;
    el.countdown.textContent = n;
    el.countdown.style.animation = 'none';
    void el.countdown.offsetWidth; // restart animation
    el.countdown.style.animation = '';
    Sfx.countdown();
    G.timer = setTimeout(() => {
      if (!G.active) return;
      if (n > 1) return runCountdown(n - 1);
      el.countdown.hidden = true;
      el.card.classList.remove('blur');
      Sfx.go();
      beginPlay();
    }, 800);
  }

  function beginPlay() {
    G.phase = 'play';
    G.startAt = performance.now();
    if (G.input === 'direct') el.directInput.focus();
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
    el.hudSpeed.textContent = Math.round((G.input === 'direct' ? G.chars : G.keys) / mins);
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
    G.direct = { scored: 0, flagged: false, composing: false };
    el.directInput.value = '';
    el.directInput.classList.remove('bad');

    if (G.input === 'romaji') G.units = Romaji.buildUnits(G.sentence.reading);
    else if (G.input === 'jamo') G.units = Hangul.buildUnits(G.sentence.text);
    else G.units = [...G.sentence.text].map(ch => ({ text: ch, alts: [ch], canon: ch, typed: '' }));

    el.en.textContent = set.translation ? G.sentence.en : '';
    renderSentence();
    renderDots();
  }

  function renderDots() {
    if (G.mode !== 'sprint') { el.dots.innerHTML = ''; return; }
    el.dots.innerHTML = Array.from({ length: G.sprintCount }, (_, i) =>
      `<span class="${i < G.sentences ? 'done' : i === G.sentences ? 'cur' : ''}"></span>`).join('');
  }

  function unitSpan(cls, text) {
    const ws = text === ' ' || text === '　' ? ' ws' : '';
    return `<span class="u ${cls}${ws}">${escapeHtml(text === ' ' ? ' ' : text)}</span>`;
  }

  function renderSentence() {
    if (G.input === 'direct') return renderDirect();

    const cur = G.uIdx;
    const mainHtml = G.units.map((u, i) => {
      if (G.input === 'jamo' && i === cur && G.buf) return unitSpan('cur', u.partial(G.buf));
      return unitSpan(i < cur ? 'done' : i === cur ? 'cur' : 'pend', u.text);
    }).join('');

    if (G.input === 'romaji') {
      el.main.className = 'sentence-main static';
      el.main.textContent = G.sentence.text;
      el.reading.innerHTML = mainHtml;
    } else {
      el.main.className = 'sentence-main';
      el.main.innerHTML = mainHtml;
      el.reading.innerHTML = '';
    }

    if (set.guide) {
      el.guide.innerHTML = G.units.map((u, i) => {
        if (u.text === ' ' || u.text === '　') return '<span class="g sp"></span>';
        if (i < cur) return `<span class="g done">${escapeHtml(u.typed)}</span>`;
        if (i === cur) {
          const rest = guideRemainder(u, G.buf);
          return `<span class="g cur"><span class="typed">${escapeHtml(G.buf)}</span><span class="rest">${escapeHtml(rest)}</span></span>`;
        }
        return `<span class="g pend">${escapeHtml(u.canon)}</span>`;
      }).join('');
    } else {
      el.guide.innerHTML = '';
    }
    highlightNextKey();
  }

  // Remaining canonical spelling for the current unit given what is typed so far.
  function guideRemainder(u, buf) {
    if (!buf) return u.canon;
    if (u.canon.startsWith(buf)) return u.canon.slice(buf.length);
    const alt = u.alts.find(a => a.startsWith(buf));
    return alt ? alt.slice(buf.length) : '';
  }

  function nextKey() {
    const u = G.units[G.uIdx];
    if (!u) return '';
    if (u.isN && G.buf === 'n') return u.canon === 'n' ? (G.units[G.uIdx + 1] ? G.units[G.uIdx + 1].canon[0] : 'n') : 'n';
    return guideRemainder(u, G.buf)[0] || '';
  }

  // ---------------------------------------------------------------------
  // Built-in keyboard input (romaji / jamo)
  // ---------------------------------------------------------------------
  function pressKey(key) {
    const u = G.units[G.uIdx];
    if (!u) return false;

    // Single "n" for ん followed by a consonant: complete ん and pass the key on.
    if (u.isN && G.buf === 'n' && !'aiueony'.includes(key)) {
      const nxt = G.units[G.uIdx + 1];
      if (nxt && nxt.alts.some(a => a[0] === key)) {
        u.typed = 'n';
        advanceUnit();
        return pressKey(key);
      }
    }

    const cand = G.buf + key;
    const matches = u.alts.filter(a => a.startsWith(cand));
    if (!matches.length) return false;
    G.buf = cand;
    if (matches.includes(cand)) {
      u.typed = cand;
      advanceUnit();
    }
    return true;
  }

  function advanceUnit() {
    G.chars += G.units[G.uIdx].text.length;
    G.uIdx++;
    G.buf = '';
    if (G.uIdx >= G.units.length) completeSentence();
  }

  function onKeyDown(e) {
    if (G.phase === 'countdown' && e.key === 'Escape') { e.preventDefault(); return quitGame(); }
    if (G.phase !== 'play') return;
    if (e.key === 'Escape') { e.preventDefault(); return quitGame(); }
    if (G.input === 'direct') return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    if (e.key.length !== 1) return;
    e.preventDefault();

    let key = e.key;
    if (G.input === 'romaji') key = key.toLowerCase();
    else if (/^[a-zA-Z]$/.test(key)) {
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
  // Direct (IME) input
  // ---------------------------------------------------------------------
  function renderDirect() {
    const target = G.sentence.text;
    const typed = el.directInput.value;
    const composing = G.direct.composing;
    let html = '';
    let mismatch = false;
    for (let i = 0; i < target.length; i++) {
      const t = target[i];
      if (i < typed.length) {
        if (!mismatch && typed[i] === t) html += unitSpan('done', t);
        else { mismatch = true; html += unitSpan(composing ? 'comp' : 'bad', t); }
      } else html += unitSpan(i === typed.length ? 'cur' : 'pend', t);
    }
    el.main.className = 'sentence-main';
    el.main.innerHTML = html;
    el.reading.innerHTML = '';
    el.guide.innerHTML = '';
    el.directInput.classList.toggle('bad', mismatch && !composing);
  }

  function evaluateDirect() {
    if (G.phase !== 'play' || G.input !== 'direct') return;
    const target = G.sentence.text;
    let typed = el.directInput.value;
    if (!target.endsWith(' ') && typed.length > target.length) typed = typed.replace(/\s+$/, '');
    let correct = 0;
    while (correct < typed.length && correct < target.length && typed[correct] === target[correct]) correct++;

    // Newly reached correct characters count as hits (one sound per commit).
    if (G.direct.scored < correct) Sfx.hit(G.combo);
    while (G.direct.scored < correct) {
      G.direct.scored++;
      G.chars++;
      onHit(false);
    }
    const mismatch = typed.length > correct;
    if (mismatch && !G.direct.flagged) { G.direct.flagged = true; onMiss(); }
    if (!mismatch) G.direct.flagged = false;

    if (typed === target) {
      completeSentence();
    } else {
      renderDirect();
    }
    updateHud();
  }

  // ---------------------------------------------------------------------
  // Scoring
  // ---------------------------------------------------------------------
  const unitValue = () => (G.input === 'direct' ? 25 : 10);
  const multiplier = () => 1 + Math.min(G.combo, 100) / 50;

  function onHit(playSound = true) {
    G.hits++;
    if (G.input !== 'direct') G.keys++;
    G.combo++;
    G.maxCombo = Math.max(G.maxCombo, G.combo);
    G.score += unitValue() * multiplier();
    if (playSound) Sfx.hit(G.combo);
    el.hudComboBox.classList.add('pop');
    setTimeout(() => el.hudComboBox.classList.remove('pop'), 90);
    if (G.combo === 25 || (G.combo >= 50 && G.combo % 50 === 0)) {
      floatText(`${G.combo} COMBO!`, 'big');
      Sfx.milestone();
    }
  }

  function onMiss() {
    G.misses++;
    G.sentenceMisses++;
    if (G.combo >= 10) floatText('Combo lost', '');
    G.combo = 0;
    Sfx.miss();
    el.card.classList.remove('shake');
    void el.card.offsetWidth;
    el.card.classList.add('shake');
  }

  function completeSentence() {
    G.sentences++;
    let bonus = 100;
    if (G.sentenceMisses === 0) { bonus += 100; G.perfect++; floatText('PERFECT +200', 'ok'); }
    else floatText('+100', 'ok');
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
    setTimeout(() => d.remove(), 1000);
  }

  // ---------------------------------------------------------------------
  // On-screen keyboard
  // ---------------------------------------------------------------------
  const KEY_ROWS = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
    [' '],
  ];
  const SHIFT_MAP = { '?': '/', '!': '1', '~': '`', '[': '[', ']': ']', '_': '-' };

  function buildKeyboard() {
    if (!set.keyboard || G.input === 'direct') { el.keyboard.innerHTML = ''; return; }
    const ko = G.input === 'jamo';
    el.keyboard.innerHTML = KEY_ROWS.map(row => `<div class="krow">${row.map(k => {
      if (k === 'shift') return `<div class="key wide" data-key="shift">⇧</div>`;
      if (k === ' ') return `<div class="key space" data-key=" ">space</div>`;
      if (ko && Hangul.KEY_LABELS[k]) {
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
      speed: Math.round((G.input === 'direct' ? G.chars : G.keys) / minutes),
      speedUnit: G.input === 'direct' ? 'cpm' : 'kpm',
      acc: total ? Math.round((G.hits / total) * 100) : 100,
      maxCombo: G.maxCombo, misses: G.misses, sentences: G.sentences, perfect: G.perfect,
      chars: G.chars, seconds: Math.round(G.elapsed), hour: new Date().getHours(),
    };
    const perMin = r.score / minutes;
    r.rank = RANKS.find(x => perMin >= x.min).r;

    // Persist.
    const st = S.stats;
    st.games++; st.chars += r.chars; st.keys += G.keys; st.seconds += r.seconds;
    st.bestCombo = Math.max(st.bestCombo, r.maxCombo);
    st.langs[r.lang] = (st.langs[r.lang] || 0) + 1;
    const prevLevel = levelFromXp(st.xp);
    st.xp += Math.round(r.score / 10);
    touchStreak();

    const key = boardKey(r.lang, r.input, r.mode, r.duration, r.sprintCount);
    const board = S.boards[key] || [];
    const prevBest = board.length ? board[0].score : 0;
    const entry = { score: r.score, speed: r.speed, speedUnit: r.speedUnit, acc: r.acc, combo: r.maxCombo, rank: r.rank, date: todayStr(), t: Date.now() };
    board.push(entry);
    board.sort((a, b) => b.score - a.score || b.t - a.t);
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

    // Render result screen.
    el.resultRank.textContent = r.rank;
    el.resultRankLabel.textContent = RANK_LABELS[r.rank];
    el.resultScore.textContent = fmt(r.score);
    el.newRecord.hidden = !isRecord;
    el.resultStats.innerHTML = [
      statCard('Speed', r.speed, r.speedUnit.toUpperCase()),
      statCard('Accuracy', r.acc, '%'),
      statCard('Max combo', r.maxCombo, 'x'),
      statCard('Sentences', r.sentences, r.perfect ? `${r.perfect} perfect` : ''),
      statCard('Misses', r.misses),
      statCard('XP earned', `+${fmt(r.score / 10)}`),
    ].join('');
    el.resultAch.hidden = !unlocked.length;
    el.resultAch.innerHTML = unlocked.map((a, i) =>
      `<div class="unlock" style="animation-delay:${0.3 + i * 0.15}s"><span class="ico">${a.ico}</span><div><b>Achievement unlocked: ${a.name}</b><span>${a.desc}</span></div></div>`).join('');
    renderBoard(el.resultBoard, el.resultBoardLabel, key, myIdx);
    renderTopbar();
    showScreen('result');

    Sfx.finish();
    if (isRecord) { Sfx.record(); confetti(); }
    const newLevel = levelFromXp(st.xp);
    if (newLevel > prevLevel) setTimeout(() => toast('⬆️', `Level up! Lv.${newLevel}`, levelTitle(newLevel)), 800);
    unlocked.forEach((a, i) => setTimeout(() => toast(a.ico, a.name, a.desc), 1200 + i * 600));
    // Reset romaji unit "typed" state so retries start clean.
    G.units = [];
  }

  function toast(ico, title, desc) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span class="ico">${ico}</span><div><b>${escapeHtml(title)}</b><span>${escapeHtml(desc)}</span></div>`;
    el.toastLayer.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.4s'; setTimeout(() => t.remove(), 400); }, 3800);
  }

  // ---------------------------------------------------------------------
  // Confetti
  // ---------------------------------------------------------------------
  function confetti() {
    const c = el.confetti;
    const ctx = c.getContext('2d');
    c.width = window.innerWidth; c.height = window.innerHeight;
    const colors = ['#ff5c8a', '#ffb86b', '#4f9dff', '#7ee8fa', '#3ddc97', '#ffd166'];
    const parts = Array.from({ length: 160 }, () => ({
      x: Math.random() * c.width, y: -20 - Math.random() * c.height * 0.5,
      w: 6 + Math.random() * 6, h: 8 + Math.random() * 8,
      vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 4,
      rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    const start = performance.now();
    (function frame(now) {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, c.width, c.height);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vy += 0.03;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color; ctx.globalAlpha = clamp(3.5 - t, 0, 1);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      }
      if (t < 3.5) requestAnimationFrame(frame); else ctx.clearRect(0, 0, c.width, c.height);
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
  el.btnSound.addEventListener('click', () => { set.sound = !set.sound; Sfx.setEnabled(set.sound); Store.save(); el.btnSound.textContent = set.sound ? '🔊' : '🔇'; });

  el.btnStart.addEventListener('click', startGame);
  el.btnRetry.addEventListener('click', startGame);
  el.btnHome.addEventListener('click', () => { renderHome(); showScreen('home'); });
  $('#brand-home').addEventListener('click', () => { if (G.active) quitGame(); else { renderHome(); showScreen('home'); } });
  el.btnReset.addEventListener('click', () => {
    if (confirm('Delete all local scores, stats and achievements? This cannot be undone.')) {
      Store.reset();
      location.reload();
    }
  });

  document.addEventListener('keydown', e => {
    if (G.active) return onKeyDown(e);
    if (e.key === 'Enter' && !e.repeat && (el.screens.home.classList.contains('active') || el.screens.result.classList.contains('active'))) {
      if (document.activeElement && document.activeElement.tagName === 'BUTTON' && document.activeElement !== el.btnStart && document.activeElement !== el.btnRetry) return;
      e.preventDefault();
      startGame();
    }
  });

  el.directInput.addEventListener('compositionstart', () => { G.direct.composing = true; });
  el.directInput.addEventListener('compositionend', () => { G.direct.composing = false; evaluateDirect(); });
  el.directInput.addEventListener('input', e => {
    if (G.phase !== 'play') return;
    if (G.direct.composing || e.isComposing) renderDirect(); else evaluateDirect();
  });
  el.directInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); G.direct.composing = false; evaluateDirect(); }
  });
  el.directInput.addEventListener('blur', () => { if (G.phase === 'play' && G.input === 'direct') setTimeout(() => el.directInput.focus(), 50); });
  el.card.addEventListener('click', () => { if (G.phase === 'play' && G.input === 'direct') el.directInput.focus(); });

  window.addEventListener('resize', () => { el.confetti.width = window.innerWidth; el.confetti.height = window.innerHeight; });

  // Boot.
  renderHome();
  showScreen('home');
})();
