# Kotoba Type — Japanese & Korean typing game

A cute, pixel-art typing game for practising **Japanese** and **Korean**.
No build step, no server, no accounts: open `index.html` and play. Scores, stats,
achievements and streaks are saved in your browser's `localStorage`.

## Play

```
git clone <this repo>
open index.html        # or double-click it, or serve the folder with any static server
```

Works offline. Google Fonts are loaded opportunistically and fall back to your system CJK fonts.

## Features

- **Japanese (default) and Korean**, 60 sentences each with English translations and three difficulty tiers.
- The menu and in-game text follow the selected language (日本語 / 한국어), as does the accent colour.
- **Japanese** is typed with your Japanese IME. Choose the script to type:
  - **ひらがな** — the sentence is shown and matched as hiragana only.
  - **混合** — kanji, katakana and hiragana exactly as written.
- **Korean** offers two input methods:
  - **두벌식 keys** — type on a regular keyboard using the 2-set layout; syllables compose on screen as you type (ㄷ → 다 → 달 → 닭), with an optional key guide and on-screen keyboard.
  - **Korean IME** — type real Hangul with your OS input method.
- **Modes**: time attack (30 / 60 / 120 s) or sprint (5 / 10 / 20 sentences). Every round starts with a 3-second countdown.
- **Kawaii pixel look** — pixel fonts (Galmuri / DotGothic16 / Press Start 2P, with system fallbacks), chunky outlines, pastel palette, and a pixel cat mascot that reacts to your typing and can be petted (click or tap it).
- **Light and dark mode** — follows the system by default, toggle in the header, remembered locally.
- **Difficulty progression** — a goals panel with tiered targets per difficulty (games, sentences, best rank), eight difficulty-specific achievements, and an XP multiplier (×1 / ×1.25 / ×1.5, mixed ×1.2).
- **Score system**: combo multiplier (up to 3×), perfect-sentence bonuses, S–E ranks, sound effects.
- **Progression**: XP and levels, 24 achievements, daily streak, per-mode top-10 leaderboards, lifetime stats.
- Everything is stored under one `localStorage` key; the menu has a reset button.

## Controls

| Key | Action |
| --- | --- |
| `Enter` | Start / play again |
| `Esc` | Quit the current round |

For Korean 2-set mode, switch your IME off so the game receives raw key presses.

## Project layout

```
index.html        page structure
css/style.css     flat theme, light/dark palettes
js/game.js        game loop, scoring, results, leaderboards, achievements
js/i18n.js        Japanese and Korean UI strings
js/hangul.js      Hangul ↔ 2-set key sequence engine + partial composition
js/sprite.js      pixel-art sprites (cat mascot, hearts, stars) as inline SVG
js/storage.js     localStorage persistence
js/audio.js       WebAudio sound effects
js/data/ja.js     Japanese sentences (text, kana reading, translation, level)
js/data/ko.js     Korean sentences (text, translation, level)
```

## Adding sentences

Append to `js/data/ja.js` or `js/data/ko.js`. Japanese entries need a full kana
`reading` so the ひらがな mode can display them (katakana is converted to hiragana).
