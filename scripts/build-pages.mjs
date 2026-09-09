#!/usr/bin/env node
// Builds the per-language entry pages of the site from index.html.
//
//   index.html            Japanese (also the x-default page) — the template for the other three
//   ko/index.html         Korean
//   en/index.html         English
//   tr/index.html         Turkish
//   manifest.webmanifest and one per language directory
//   sitemap.xml
//
// Each page is the same app with its own <title>, description, Open Graph / Twitter card, JSON-LD and
// hreflang links, so search engines and chat apps show the right language. The copy lives in SEO below;
// hero and page titles come from js/i18n.js. Run after editing index.html, js/i18n.js or this file:
//
//   node scripts/build-pages.mjs
//
// The GitHub Pages workflow runs it before deploying, so the committed copies only need to be fresh
// for opening the files locally. No dependencies; Node 18+.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://type.muratodesu.com/';
const LANGS = ['ja', 'ko', 'en', 'tr'];
const DIR = { ja: '', ko: 'ko/', en: 'en/', tr: 'tr/' };   // page directory; also the URL path under SITE
const AUTHOR = { '@type': 'Person', name: 'muratodesu', url: 'https://www.instagram.com/muratodesu/' };
const url = l => SITE + DIR[l];

// The UI strings are a plain script defining `const I18N`; evaluate it to reuse the titles.
const I18N = new Function(readFileSync(join(ROOT, 'js/i18n.js'), 'utf8') + '\nreturn I18N;')();

const SEO = {
  ja: {
    locale: 'ja_JP', appName: 'もじねこ！', currency: 'JPY',
    description: 'もじねこ！は日本語・韓国語・英語・トルコ語のかわいいピクセルアート風タイピング練習ゲーム。漢字混じりの文をローマ字で入力（IME入力も可）、2벌식・英語・トルコ語Q配列に対応。スコア、ランク、コンボ、実績、連続記録つき。登録不要、ブラウザだけで動き、記録は端末内に保存されます。',
    ogDescription: 'ねこと一緒に毎日ちょっとずつ。日本語（ローマ字入力）・한국어・English・Türkçe に対応した、スコアと実績つきのかわいいタイピング練習ゲーム。',
    twitterDescription: 'ねこと一緒に毎日ちょっとずつ。スコアと実績つきのかわいいタイピング練習ゲーム。',
    image: 'assets/og.png', imageAlt: 'もじねこ！ ピクセルアートのねこと「日本語・韓国語・英語 タイピング練習ゲーム」の文字',
    ldName: 'もじねこ！', ldAlt: ['Mojineko', 'もじねこ', '모지네코'],
    ldDescription: '日本語・韓国語・英語・トルコ語のタイピング練習ゲーム。漢字混じりの文をローマ字で入力、2벌식・英語・トルコ語Q配列に対応し、スコア、ランク、実績、連続記録で毎日の練習を続けやすくします。',
    noscript: 'もじねこ！は日本語・韓国語・英語・トルコ語のタイピング練習ゲームです。日本語（ローマ字入力・IME入力）・한국어（2벌식）・English・Türkçe（Q配列）に対応し、スコア・ランク・実績・連続記録で毎日の練習を続けやすくします。プレイには JavaScript を有効にしてください。',
    manifestDescription: '日本語・韓国語・英語・トルコ語のかわいいタイピング練習ゲーム。スコア・ランク・実績・連続記録つき。ブラウザだけで動き、記録は端末内に保存されます。',
  },
  ko: {
    locale: 'ko_KR', appName: '모지네코!', currency: 'KRW',
    description: '모지네코!는 한국어·일본어·영어·터키어를 연습하는 귀여운 픽셀아트 타자 연습 게임입니다. 한국어는 두벌식 자판(화면 키보드 포함) 또는 한글 IME, 일본어는 로마자 입력(IME 입력도 가능), 영어와 터키어(Q 자판)는 자판 직접 입력. 점수·랭크·콤보·업적·연속 기록 제공. 회원 가입 없이 브라우저에서 바로 실행되고 기록은 기기 안에 저장됩니다.',
    ogDescription: '고양이와 함께 매일 조금씩. 한국어(두벌식)·일본어(로마자 입력)·영어·터키어에 대응하는, 점수와 업적이 있는 귀여운 타자 연습 게임.',
    twitterDescription: '고양이와 함께 매일 조금씩. 점수와 업적이 있는 귀여운 타자 연습 게임.',
    image: 'assets/og-ko.png', imageAlt: '모지네코! 픽셀아트 고양이와 「한국어·일본어·영어·터키어 타자 연습 게임」 문구',
    ldName: '모지네코!', ldAlt: ['Mojineko', 'もじねこ！', '모지네코'],
    ldDescription: '한국어·일본어·영어·터키어 타자 연습 게임. 한글 두벌식 자판, 일본어 로마자 입력, 영어·터키어 Q 자판에 대응하며 점수·랭크·업적·연속 기록으로 매일 연습을 이어가기 쉽게 도와줍니다.',
    noscript: '모지네코!는 한국어·일본어·영어·터키어 타자 연습 게임입니다. 한국어(두벌식·IME)·일본어(로마자 입력·IME 입력)·영어·터키어(Q 자판)에 대응하며, 점수·랭크·업적·연속 기록으로 매일 연습을 이어가기 쉽게 도와줍니다. 플레이하려면 JavaScript를 켜 주세요.',
    manifestDescription: '한국어·일본어·영어·터키어 귀여운 타자 연습 게임. 점수·랭크·업적·연속 기록. 브라우저만으로 실행되고 기록은 기기 안에 저장됩니다.',
  },
  en: {
    locale: 'en_US', appName: 'Mojineko', currency: 'USD',
    description: 'Mojineko is a cute pixel-art typing game for practising Japanese, Korean, English and Turkish. Type Japanese sentences with kanji as romaji (or through your IME), Korean on the 2-set (두벌식) layout with an on-screen keyboard, and English and Turkish (Türkçe Q layout) directly. Scores, ranks, combos, achievements and daily streaks. Free, no account, runs in your browser and keeps your progress on your device.',
    ogDescription: 'Practise a little every day with a pixel cat. Japanese (romaji input), Korean (2-set layout), English and Turkish typing with scores, ranks and achievements.',
    twitterDescription: 'Practise a little every day with a pixel cat. A cute typing game with scores, ranks and achievements.',
    image: 'assets/og-en.png', imageAlt: 'Mojineko: a pixel-art cat next to the words “Japanese · Korean · English · Turkish typing practice game”',
    ldName: 'Mojineko', ldAlt: ['もじねこ！', '모지네코!', 'Mojineko!'],
    ldDescription: 'A typing practice game for Japanese, Korean, English and Turkish: Japanese sentences with kanji typed as romaji, Korean on the 2-set (두벌식) keyboard layout, English and Turkish (Q layout), with scores, ranks, achievements and streaks that make a daily habit easy to keep.',
    noscript: 'Mojineko is a typing practice game for Japanese, Korean, English and Turkish. Japanese (romaji or IME input), Korean (2-set layout or IME), English and Turkish (Q layout), with scores, ranks, achievements and daily streaks. Please enable JavaScript to play.',
    manifestDescription: 'A cute typing practice game for Japanese, Korean, English and Turkish. Scores, ranks, achievements and streaks. Runs in your browser and keeps your progress on your device.',
  },
  tr: {
    locale: 'tr_TR', appName: 'Mojineko', currency: 'TRY',
    description: 'Mojineko, Japonca, Korece, İngilizce ve Türkçe klavye pratiği için sevimli bir piksel sanatı yazma oyunudur. Türkçeyi Türkçe Q düzeninde (ı ğ ü ş i ö ç gerçek yerlerinde) ekran klavyesiyle, Japoncayı romaji ile (ya da IME ile), Koreceyi 2-set (두벌식) düzeninde, İngilizceyi doğrudan yazın. Puan, rütbe, kombo, başarım ve günlük seri. Ücretsiz, hesap gerektirmez, tarayıcıda çalışır ve ilerlemeni cihazında saklar.',
    ogDescription: 'Piksel bir kediyle her gün biraz. Türkçe (Q düzeni), Japonca (romaji), Korece (2-set) ve İngilizce klavye pratiği; puan, rütbe ve başarımlarla.',
    twitterDescription: 'Piksel bir kediyle her gün biraz. Puan, rütbe ve başarımlı sevimli bir klavye oyunu.',
    image: 'assets/og-tr.png', imageAlt: 'Mojineko: piksel sanatı bir kedi ve “Japonca · Korece · İngilizce · Türkçe klavye pratiği oyunu” yazısı',
    ldName: 'Mojineko', ldAlt: ['もじねこ！', '모지네코!', 'Mojineko!'],
    ldDescription: 'Japonca, Korece, İngilizce ve Türkçe için klavye pratiği oyunu: Türkçe Q düzeni, Japonca romaji girişi, Korece 2-set (두벌식) düzeni ve İngilizce; puan, rütbe, başarım ve günlük seriyle alışkanlık edinmeyi kolaylaştırır.',
    noscript: 'Mojineko, Japonca, Korece, İngilizce ve Türkçe için bir klavye pratiği oyunudur. Türkçe (Q düzeni), Japonca (romaji veya IME), Korece (2-set veya IME) ve İngilizce; puan, rütbe, başarım ve günlük seriyle. Oynamak için lütfen JavaScript\'i etkinleştirin.',
    manifestDescription: 'Japonca, Korece, İngilizce ve Türkçe için sevimli bir klavye pratiği oyunu. Puan, rütbe, başarım ve seri. Tarayıcıda çalışır, ilerlemeni cihazında saklar.',
  },
};
const LANG_NAMES = { ja: '日本語', ko: '한국어', en: 'English', tr: 'Türkçe' };

const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rel = (l, path) => (DIR[l] ? '../' : '') + path;          // asset path as seen from the page's directory

function seoBlock(l) {
  const m = SEO[l], title = I18N[l].pageTitle;
  const hreflang = [...LANGS.map(x => `  <link rel="alternate" hreflang="${x}" href="${url(x)}">`), `  <link rel="alternate" hreflang="x-default" href="${url('ja')}">`];
  const ld = {
    '@context': 'https://schema.org', '@type': 'WebApplication',
    name: m.ldName, alternateName: m.ldAlt, url: url(l), description: m.ldDescription,
    applicationCategory: 'GameApplication', applicationSubCategory: 'Typing practice',
    operatingSystem: 'Any (web browser)', browserRequirements: 'Requires JavaScript',
    inLanguage: [l, ...LANGS.filter(x => x !== l)], isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: m.currency },
    image: SITE + m.image, author: AUTHOR,
  };
  return [
    `  <title>${esc(title)}</title>`,
    `  <meta name="description" content="${esc(m.description)}">`,
    `  <meta name="application-name" content="${esc(m.appName)}">`,
    `  <meta name="apple-mobile-web-app-title" content="${esc(m.appName)}">`,
    '  <meta name="theme-color" content="#ff85a1">',
    '  <meta name="robots" content="index, follow">',
    `  <link rel="canonical" href="${url(l)}">`,
    ...hreflang,
    `  <link rel="icon" href="${rel(l, 'assets/favicon.svg')}" type="image/svg+xml">`,
    `  <link rel="icon" href="${rel(l, 'assets/icon-192.png')}" type="image/png" sizes="192x192">`,
    `  <link rel="apple-touch-icon" href="${rel(l, 'assets/apple-touch-icon.png')}">`,
    '  <link rel="manifest" href="manifest.webmanifest">',
    '  <meta property="og:type" content="website">',
    `  <meta property="og:site_name" content="${esc(m.appName)}">`,
    `  <meta property="og:title" content="${esc(title)}">`,
    `  <meta property="og:description" content="${esc(m.ogDescription)}">`,
    `  <meta property="og:url" content="${url(l)}">`,
    `  <meta property="og:image" content="${SITE + m.image}">`,
    '  <meta property="og:image:width" content="1200">',
    '  <meta property="og:image:height" content="630">',
    `  <meta property="og:image:alt" content="${esc(m.imageAlt)}">`,
    `  <meta property="og:locale" content="${m.locale}">`,
    ...LANGS.filter(x => x !== l).map(x => `  <meta property="og:locale:alternate" content="${SEO[x].locale}">`),
    '  <meta name="twitter:card" content="summary_large_image">',
    `  <meta name="twitter:title" content="${esc(title)}">`,
    `  <meta name="twitter:description" content="${esc(m.twitterDescription)}">`,
    `  <meta name="twitter:image" content="${SITE + m.image}">`,
    `  <meta name="twitter:image:alt" content="${esc(m.imageAlt)}">`,
    '  <script type="application/ld+json">',
    JSON.stringify(ld, null, 2).replace(/^/gm, '  '),
    '  </script>',
  ].join('\n') + '\n';
}

function langNav(l) {
  const links = LANGS.map(x => `      <a href="${rel(l, DIR[x]) || './'}" hreflang="${x}" lang="${x}"${x === l ? ' aria-current="page"' : ''}>${LANG_NAMES[x]}</a>`);
  return `    <nav class="lang-nav" aria-label="Language">\n${links.join('\n')}\n    </nav>\n`;
}

function replaceBetween(html, start, end, body) {
  const a = html.indexOf(start), b = html.indexOf(end, a);
  if (a < 0 || b < 0) throw new Error(`marker not found: ${start} … ${end}`);
  const lineEnd = html.indexOf('\n', a) + 1;   // keep the start marker's own line (it carries the note)
  return html.slice(0, lineEnd) + body + html.slice(b);
}

function replaceOne(html, re, replacement) {
  if (!re.test(html)) throw new Error(`pattern not found: ${re}`);
  return html.replace(re, replacement);
}

function buildPage(template, l) {
  let html = template;
  html = replaceOne(html, /<html[^>]*>/, `<html lang="${l}" data-lang="${l}" data-ui="${l}" data-site-lang="${l}">`);
  html = replaceBetween(html, '<!-- seo:start', '  <!-- seo:end -->', seoBlock(l));
  html = replaceBetween(html, '<!-- lang-nav:start', '    <!-- lang-nav:end -->', langNav(l));
  html = replaceOne(html, /<noscript>[\s\S]*?<\/noscript>/, `<noscript>\n    <p>${esc(SEO[l].noscript)}</p>\n  </noscript>`);
  html = replaceOne(html, /(<h1 class="hero-title" data-t="heroTitle">)[^<]*(<\/h1>)/, `$1${esc(I18N[l].heroTitle)}$2`);
  html = replaceOne(html, /(<p class="hero-sub" data-t="heroSub">)[^<]*(<\/p>)/, `$1${esc(I18N[l].heroSub)}$2`);
  if (DIR[l]) {
    html = html.replace(/ (href|src)="(assets|css|js)\//g, ' $1="../$2/');
    html = html.replace('<!DOCTYPE html>\n', '<!DOCTYPE html>\n<!-- Generated from ../index.html by scripts/build-pages.mjs: edit those and run the script; this file is overwritten. -->\n');
  }
  return html;
}

function manifest(l) {
  const m = SEO[l];
  return JSON.stringify({
    name: m.appName, short_name: m.appName, description: m.manifestDescription, lang: l,
    start_url: './', scope: './', display: 'standalone', background_color: '#fff4f7', theme_color: '#ff85a1',
    icons: [
      { src: rel(l, 'assets/icon-192.png'), sizes: '192x192', type: 'image/png' },
      { src: rel(l, 'assets/icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  }, null, 2) + '\n';
}

function sitemap() {
  const alternates = [...LANGS.map(x => `    <xhtml:link rel="alternate" hreflang="${x}" href="${url(x)}"/>`), `    <xhtml:link rel="alternate" hreflang="x-default" href="${url('ja')}"/>`].join('\n');
  const entries = LANGS.map(l => `  <url>\n    <loc>${url(l)}</loc>\n${alternates}\n    <changefreq>weekly</changefreq>\n    <priority>${l === 'ja' ? '1.0' : '0.9'}</priority>\n  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`;
}

// index.html is the template; its own SEO block is regenerated in place so the Japanese copy has one home too.
const template = readFileSync(join(ROOT, 'index.html'), 'utf8').replace(/^<!DOCTYPE html>\n<!-- Generated[^\n]*\n/, '<!DOCTYPE html>\n');
const written = [];
for (const l of LANGS) {
  if (DIR[l]) mkdirSync(join(ROOT, DIR[l]), { recursive: true });
  writeFileSync(join(ROOT, DIR[l], 'index.html'), buildPage(template, l));
  writeFileSync(join(ROOT, DIR[l], 'manifest.webmanifest'), manifest(l));
  written.push(`${DIR[l]}index.html`, `${DIR[l]}manifest.webmanifest`);
}
writeFileSync(join(ROOT, 'sitemap.xml'), sitemap());
written.push('sitemap.xml');
console.log('wrote ' + written.join(', '));
