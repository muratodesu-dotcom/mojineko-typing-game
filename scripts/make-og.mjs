#!/usr/bin/env node
// Renders the 1200×630 link-preview images (Open Graph / Twitter card), one per language:
//   assets/og.png (ja)  assets/og-ko.png  assets/og-en.png  assets/og-tr.png
// Same look as the app: dotted background, white card with the pixel cat from js/sprite.js, Noto Sans.
// Needs Playwright with Chromium (npm i -g playwright && playwright install chromium) and network access
// for Google Fonts. Optional: node scripts/make-og.mjs ko en tr   (default: ko en tr; pass ja to redo the Japanese one)
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const Sprite = new Function(readFileSync(join(ROOT, 'js/sprite.js'), 'utf8') + '\nreturn Sprite;')();

const CARDS = {
  ja: { file: 'og.png', title: 'もじねこ！', lines: ['日本語・韓国語・英語・トルコ語', 'タイピング練習ゲーム'], foot: 'Japanese · Korean · English · Turkish typing game' },
  ko: { file: 'og-ko.png', title: '모지네코!', lines: ['한국어·일본어·영어·터키어', '타자 연습 게임'], foot: 'Korean · Japanese · English · Turkish' },
  en: { file: 'og-en.png', title: 'Mojineko', lines: ['Japanese · Korean · English · Turkish', 'Typing practice game'], foot: 'もじねこ！ · 모지네코! · free, in your browser' },
  tr: { file: 'og-tr.png', title: 'Mojineko', lines: ['Türkçe · Japonca · Korece · İngilizce', 'Klavye pratiği oyunu'], foot: 'もじねこ！ · 모지네코! · ücretsiz, tarayıcında' },
};

const html = (l, c) => `<!DOCTYPE html><html lang="${l}"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&family=Noto+Sans+JP:wght@500;700&family=Noto+Sans+KR:wght@500;700&display=swap" rel="stylesheet">
<style>
  :root { --ink: #3b2f45; --sprite-body: #ffffff; --accent: #ff85a1; --warn: #ffcf4a; --bad: #ff6b6b; }
  html, body { margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; background: #fff4f7 radial-gradient(#f3d9e2 2.5px, transparent 2.5px) 0 0 / 28px 28px;
         font-family: 'Noto Sans JP', 'Noto Sans KR', 'Noto Sans', sans-serif; color: var(--ink); }
  .card { position: absolute; left: 80px; top: 80px; width: 1032px; height: 462px; background: #fff; border: 4px solid var(--ink); box-shadow: 10px 10px 0 var(--ink);
          display: flex; align-items: center; gap: 48px; padding: 0 72px; box-sizing: border-box; }
  .text { display: flex; flex-direction: column; }
  h1 { margin: 0 0 8px; font-size: 96px; line-height: 1.1; font-weight: 700; letter-spacing: 0.02em; }
  h1[lang="en"] { letter-spacing: 0; }
  .line { font-size: 36px; line-height: 1.35; font-weight: 500; white-space: nowrap; }
  .bar { width: 260px; height: 8px; background: var(--accent); margin: 26px 0 30px; }
  .foot { font-family: 'Noto Sans', 'Noto Sans JP', 'Noto Sans KR', sans-serif; font-size: 26px; color: #8b7a94; }
</style></head><body>
<div class="card">${Sprite.cat('happy', 20)}<div class="text"><h1 lang="${l}">${c.title}</h1><div class="line">${c.lines[0]}</div><div class="line">${c.lines[1]}</div><div class="bar"></div><div class="foot">${c.foot}</div></div></div>
</body></html>`;

async function loadPlaywright() {
  try { return await import('playwright'); } catch (e) {
    const root = execSync('npm root -g').toString().trim();   // fall back to a global install
    return import(pathToFileURL(join(root, 'playwright', 'index.mjs')).href);
  }
}

const langs = process.argv.slice(2).length ? process.argv.slice(2) : ['ko', 'en', 'tr'];
const { chromium } = await loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const l of langs) {
  const c = CARDS[l];
  if (!c) throw new Error(`unknown language ${l}`);
  await page.setContent(html(l, c), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(ROOT, 'assets', c.file) });
  console.log('wrote assets/' + c.file);
}
await browser.close();
