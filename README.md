# もじねこ！ (Mojineko) — Japanese, Korean & English typing game

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

## SEO / sharing

The site has one entry page per language, all running the same app:

| URL | Language | Files |
| --- | --- | --- |
| `/` | 日本語 (also `x-default`) | `index.html`, `manifest.webmanifest`, `assets/og.png` |
| `/ko/` | 한국어 | `ko/index.html`, `ko/manifest.webmanifest`, `assets/og-ko.png` |
| `/en/` | English | `en/index.html`, `en/manifest.webmanifest`, `assets/og-en.png` |

Each page carries its own title, meta description, Open Graph / Twitter card (with a 1200×630
preview image in that language), schema.org `WebApplication` JSON-LD, `og:locale`, hreflang links to
the other two pages, and a localized `<noscript>` text and hero. `sitemap.xml` lists the three URLs
with their hreflang alternates; `robots.txt` points at it. The footer links the three pages to each
other. A first visit to a page starts with that language for both the menu and the practice
sentences; afterwards the saved settings win, and the address bar follows the menu language
(switching the menu to 한국어 on `/` moves the URL to `/ko/`).

`ko/` and `en/` are **generated** from `index.html` by `scripts/build-pages.mjs`, which also rewrites
the SEO block of `index.html` itself, the three manifests and the sitemap. The per-language copy
(descriptions, JSON-LD, noscript) lives in that script; the titles and hero come from `js/i18n.js`.
After editing any of those run `node scripts/build-pages.mjs` (no dependencies) and commit the output.
The Pages workflow runs it before deploying, so the deployed copies never lag behind. The preview
images are rendered by `scripts/make-og.mjs` (needs Playwright + Chromium).

The absolute URLs point at `https://type.muratodesu.com/`; if the app moves to another domain,
change `SITE` in `scripts/build-pages.mjs`, run it, and update `robots.txt`.

## Features

The `?` button in the header opens an **About / How to use** panel in the selected language:
what the app is, the five steps to a round, and tips (IME on/off, packs, settings, streaks, backup).

**Practice**
- Japanese and Korean with about 170 sentences each (with English translations) and English with 75,
  three difficulty tiers, themed packs: 日常 / 旅行 / 仕事 / 食べ物 (daily, travel, work, food),
  plus hand-written paragraphs per language for paragraph mode. The 仕事 pack is everyday
  office language (お疲れ様です。いつもお世話になっております。, business-email phrases) rather than
  sentences *about* work, so what you practise is what you type at your desk.
- **Japanese** shows the sentence as written (kanji, katakana, hiragana) with optional furigana
  above the kanji, and is typed as **romaji on a plain keyboard** (Sushida-style, the default):
  the romaji line under the sentence lights up as you type, kana light up one by one and a kanji
  run lights up once its reading is done. Every spelling an IME accepts works (shi / si / ci,
  tsu / tu, fu / hu, ji / zi, kya / kixya, kko / xtuko, n / nn / xn for ん) and the displayed
  spelling follows what you type. An **IME** mode types the same sentence through your Japanese IME.
- **Korean**: 2-set (두벌식) keys on a regular keyboard with live syllable composition, an
  on-screen keyboard with jamo on the keys, and a key guide under the sentence that shows each
  syllable as the jamo its keys produce (ㅇㅓㄹ), lighting up jamo by jamo as you type; the QWERTY
  letters (djf) can be added underneath with a setting, off by default. Or your Korean IME.
  Optional strict mode where wrong keys must be erased with Backspace.
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
- XP and five player levels (見習い → 正メイド → プレミアム → スーパープレミアム → レジェンド at 0 / 5,000 /
  20,000 / 50,000 / 100,000 XP) with an XP multiplier by difficulty (×1 / ×1.25 / ×1.5, mixed ×1.2), 27
  achievements (30), a goals panel with tiered targets per difficulty, per-mode top-10 leaderboards,
  a history chart of your recent rounds, and a ghost pace marker comparing you to your best run.
- Daily streak with one automatic freeze per week.
- A pixel cat mascot that reacts to your typing, can be petted, and gains a new look at every
  level (maid headdress, ribbon and cream coat, scarf, crown and golden coat); the home panel
  shows all five looks with the ones still locked dimmed. Petting it 1,000 times unlocks a secret
  accessory (a little heart on the ear) that stays on at every level and joins the look ladder.
- Result share card saved as a PNG.

**Interface**
- Menu and HUD in Japanese, Korean or English, chosen separately from the practice language
  (Settings → 表示言語 / Menu language; Japanese by default). Light theme by default, dark theme via the header toggle.
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
index.html                page structure (Japanese entry page; template for the other two)
ko/, en/                  generated Korean / English entry pages and manifests (do not edit by hand)
scripts/build-pages.mjs   generates ko/, en/, the manifests, sitemap.xml and the SEO block of index.html
scripts/make-og.mjs       renders the per-language link-preview images (Playwright)
css/style.css             pixel theme, light/dark palettes
js/game.js                game loop, modes, scoring, results, persistence, share card
js/hangul.js              Hangul ↔ 2-set key sequence engine + partial composition
js/romaji.js              kana reading → romaji typing units with every accepted spelling
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
and a `level` (1–3). Japanese entries need a full kana `reading`: romaji mode types the reading, and
furigana is aligned from it.
Paragraphs live in `JA_PARAGRAPHS` / `KO_PARAGRAPHS` in the same files with the same fields.

## Not included

- Korean 3-set (세벌식) layout: left out until the key mapping can be verified against a
  reference layout; a wrong mapping would be worse than none.
