# Kotoba Type — Japanese & Korean typing game

A fast, arcade-style typing game for practising **Japanese** and **Korean**.
No build step, no server, no accounts: open `index.html` and play. Scores, stats,
achievements and streaks are saved in your browser's `localStorage`.

## Play

```
git clone <this repo>
open index.html        # or double-click it, or serve the folder with any static server
```

Works offline. Google Fonts are loaded opportunistically and fall back to your system CJK fonts.

## Features

- **Two languages, 60 sentences each** with English translations and three difficulty tiers.
- **Input methods that don't need an IME**
  - Japanese: type **romaji** (`kya`, `sha`/`sya`, `nn`, `xtu`… all common spellings accepted) against the kana reading, with a live romaji guide.
  - Korean: type on the **2-set (두벌식) layout** on a regular keyboard; syllables compose on screen as you type (ㄱ → 가 → 갑 → 값).
- **IME modes** for both languages if you'd rather type real Hangul / kanji with your OS input method.
- **Modes**: Time attack (30 / 60 / 120 s) or Sprint (5 / 10 / 20 sentences).
- **Engagement**: combo multiplier (up to 3×), perfect-sentence bonuses, S–E ranks, sound effects, screen shake, confetti on a new record.
- **Progression**: XP and levels, 16 achievements, daily streak, per-mode top-10 leaderboards, lifetime stats.
- **On-screen keyboard** highlighting the next key (with jamo labels in Korean mode).
- Everything is stored locally under one `localStorage` key; the menu has a reset button.

## Controls

| Key | Action |
| --- | --- |
| `Enter` | Start / play again |
| `Esc` | Quit the current round |
| Any key | Type (built-in modes) — switch your IME off first |

## Project layout

```
index.html        page structure
css/style.css     theme and animations
js/game.js        game loop, scoring, results, leaderboards, achievements
js/romaji.js      kana → romaji matching engine (multiple spellings, っ / ん rules)
js/hangul.js      Hangul ↔ 2-set key sequence engine + partial composition
js/storage.js     localStorage persistence
js/audio.js       WebAudio sound effects
js/data/ja.js     Japanese sentences (text, kana reading, translation, level)
js/data/ko.js     Korean sentences (text, translation, level)
```

## Adding sentences

Append to `js/data/ja.js` or `js/data/ko.js`. Japanese entries need a full kana
`reading` (hiragana or katakana; `ー`, `、`, `。`, `！`, `？` are supported) so romaji mode
can match them.
