// Capturas de la landing y la carta en mobile, tablet y desktop.
// Uso: npm run build && npx astro preview --port 4321 &  luego: node scripts/shots.mjs [baseUrl]
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';

const base = process.argv[2] || 'http://localhost:4321';
const out = new URL('../screenshots/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });

const exe = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium'].find(existsSync);
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });

const sizes = [
  { name: 'mobile', width: 375, height: 812, mobile: true },
  { name: 'tablet', width: 768, height: 1024, mobile: true },
  { name: 'desktop', width: 1440, height: 900, mobile: false },
];
const pages = [
  { name: 'landing', path: '/' },
  { name: 'carta', path: '/carta' },
];

for (const s of sizes) {
  const ctx = await browser.newContext({
    viewport: { width: s.width, height: s.height },
    deviceScaleFactor: 1,
    isMobile: s.mobile,
    hasTouch: s.mobile,
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
  });
  for (const p of pages) {
    const page = await ctx.newPage();
    await page.goto(base + p.path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1600); // termina el reveal del hero
    await page.screenshot({ path: `${out}${p.name}-${s.name}-fold.png` });
    // recorre la página para disparar reveals y lazy-load
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += Math.round(s.height * 0.6)) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(260);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${out}${p.name}-${s.name}-full.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    console.log(`${p.name} ${s.name}: alto ${h}px, desborde horizontal ${overflow}px`);
    await page.close();
  }
  await ctx.close();
}
await browser.close();
