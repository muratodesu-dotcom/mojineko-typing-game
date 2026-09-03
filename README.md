# Kotoba Type — Japanese, Korean & English typing game

A cute, pixel-art typing game for practising **Japanese**, **Korean** and **English**.
No build step, no server, no accounts: open `index.html` and play. Everything
(scores, stats, achievements, streaks, custom sentences) is saved in your
browser's `localStorage`.

## Play

```
git clone <this repo>
open index.html        # or double-click it, or serve the folder with any static server
```

Works offline. The default font is Noto Sans for readability; the settings offer 丸ゴシック (Zen Maru Gothic / Gowun Dodum), 明朝 (Noto Serif), ピクセル (Galmuri / DotGothic16 / Press Start 2P) and your system font, plus three sentence sizes. Web fonts load from CDNs when available and fall back to your system CJK fonts. A GitHub Pages workflow deploys `main`
automatically once Pages is set to "GitHub Actions" in the repository settings.

## Features

**Practice**
- Japanese and Korean with 156 sentences each (with English translations) and English with 60,
  three difficulty tiers, themed packs: 日常 / 旅行 / 仕事 / 食べ物 (daily, travel, work, food),
  plus hand-written paragraphs per language for paragraph mode.
- **Japanese** is typed through your IME. Choose ひらがな (kana reading only) or 混合 (kanji,
  katakana, hiragana as written), with an optional reading hint under kanji sentences.
- **Korean**: 2-set (두벌식) keys on a regular keyboard with live syllable composition, an
  on-screen keyboard and a key guide, or your Korean IME. Optional strict mode where wrong
  keys must be erased with Backspace.
- **English**: typed directly on the keyboard with the on-screen keyboard highlighting the next
  key; speed is shown in WPM.
- **Modes**: Time attack (30 / 60 / 120 s), Sprint (5 / 10 / 20 sentences), Daily challenge
  (the same 10 sentences for everyone that day, with a per-day leaderboard), Warm-up (kana or
  syllable rows and short words), Paragraph (three passages: curated paragraphs matching the
  theme and difficulty, filled up with joined sentences when needed).
- **Weak-spot tracking**: misses are recorded per character, shown after each round, and the
  苦手 pack builds rounds from the sentences you struggle with most.
- **Custom pack**: paste your own sentences (Japanese as `文｜よみ`).

**Engagement**
- Combo multiplier up to 3×, perfect-sentence bonuses, S–E ranks, chiptune sound effects
  with a volume slider, screen shake, confetti on a new record.
- XP and levels with an XP multiplier by difficulty (×1 / ×1.25 / ×1.5, mixed ×1.2), 27
  achievements (30), a goals panel with tiered targets per difficulty, per-mode top-10 leaderboards,
  a history chart of your recent rounds, and a ghost pace marker comparing you to your best run.
- Daily streak with one automatic freeze per week.
- A pixel cat mascot that reacts to your typing, can be petted, and gains new looks as you
  level up (bow, scarf, crown, new coats).
- Result share card saved as a PNG.

**Interface**
- Menu and HUD in Japanese, Korean or English, following the selected language. Light and dark themes.
- Settings behind the gear icon: five font sets, three text sizes, input options, volume, and data export / import / reset. The home page fits a desktop screen without scrolling; stats, records, goals, rankings and achievements live in tabs.
- Arrow keys move between options on the menu; everything is keyboard-accessible.
- Export / import all local data as a JSON file.

## Controls

| Key | Action |
| --- | --- |
| `Enter` | Start / play again |
| `Esc` | Quit the current round |
| `← →` | Move between options on the menu |
| `Backspace` | Erase a wrong key (strict 2-set mode) |

## Project layout

```
index.html                page structure
css/style.css             pixel theme, light/dark palettes
js/game.js                game loop, modes, scoring, results, persistence, share card
js/hangul.js              Hangul ↔ 2-set key sequence engine + partial composition
js/sprite.js              pixel-art sprites (cat mascot with looks, hearts, stars)
js/i18n.js                Japanese / Korean / English UI strings
js/storage.js             localStorage persistence, export/import
js/audio.js               chiptune WebAudio sound effects
js/data/ja.js             Japanese sentences and warm-up drills
js/data/ko.js             Korean sentences and warm-up drills
js/data/en.js             English sentences, paragraphs and warm-up drills
.github/workflows/pages.yml  GitHub Pages deploy from main
```

## Adding sentences

Append to `js/data/ja.js`, `js/data/ko.js` or `js/data/en.js` with a `tag` (`daily`, `travel`, `work`, `food`)
and a `level` (1–3). Japanese entries need a full kana `reading` so ひらがな mode can use them.
Paragraphs live in `JA_PARAGRAPHS` / `KO_PARAGRAPHS` in the same files with the same fields.

## Not included

- Korean 3-set (세벌식) layout: left out until the key mapping can be verified against a
  reference layout; a wrong mapping would be worse than none.
