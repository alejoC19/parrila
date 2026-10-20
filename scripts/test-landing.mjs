// Verifica la landing: sin errores de JS, animaciones activas y modo reduced-motion con todo visible.
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
const base = process.argv[2] || 'http://localhost:4321';
const exe = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium'].find(existsSync);
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
let ok = 0, bad = 0;
const check = (n, c) => { c ? ok++ : bad++; console.log(`${c ? 'OK ' : 'FALLA'}  ${n}`); };

for (const rm of [false, true]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: rm ? 'reduce' : 'no-preference', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/maps\.google|ERR_/i.test(m.text()) && errs.push(m.text()));
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  const label = rm ? 'reduced-motion' : 'con animaciones';
  check(`[${label}] sin errores de JS`, errs.length === 0);
  if (errs.length) console.log(errs);
  const lenis = await page.evaluate(() => document.documentElement.classList.contains('lenis'));
  check(`[${label}] Lenis ${rm ? 'NO se activa' : 'activo'}`, rm ? !lenis : lenis);
  // scroll a una imagen con reveal y mira su clip-path
  const reveal = page.locator('[data-reveal]').first();
  await reveal.scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(1800);
  const clip = await reveal.evaluate((el) => getComputedStyle(el).clipPath);
  check(`[${label}] reveal de imagen termina visible (clip-path: ${clip})`, clip === 'none' || /inset\(0(px|%)?( 0(px|%)?){0,3}\)/.test(clip));
  const hiddenUp = await page.$$eval('[data-up]', (els) => els.filter((e) => getComputedStyle(e).opacity === '0' && e.getBoundingClientRect().top < innerHeight).length);
  check(`[${label}] textos a la vista no quedan ocultos`, hiddenUp === 0);
  if (!rm) {
    const t1 = await page.evaluate(() => scrollY);
    const y0 = await page.locator('.frame-px img').first().evaluate((el) => getComputedStyle(el).transform);
    check(`[${label}] parallax aplica transform (${y0.slice(0, 30)}…)`, y0 !== 'none');
  }
  await ctx.close();
}
// Sin JS: todo el contenido visible
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
const p = await ctx.newPage();
await p.goto(base + '/', { waitUntil: 'load' });
await p.waitForTimeout(1500);
const vis = await p.$$eval('[data-reveal], [data-up]', (els) => els.filter((e) => getComputedStyle(e).opacity === '0' || getComputedStyle(e).clipPath !== 'none').length);
check('[sin JS] nada queda oculto', vis === 0);
console.log(`\n${ok} OK, ${bad} con falla`);
await browser.close();
process.exit(bad ? 1 : 0);
