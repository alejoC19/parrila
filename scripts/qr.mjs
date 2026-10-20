// Genera el QR de /carta: SVG y PNG de alta resolución + cartelito A6 para la mesa (PNG 300 dpi y PDF).
// Uso: npm run qr            (usa meta.siteUrl de src/data/restaurant.json)
//      npm run qr -- https://micarta.com.ar/carta
import QRCode from 'qrcode';
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const data = JSON.parse(readFileSync(`${root}src/data/restaurant.json`, 'utf8'));
const url = process.argv[2] || new URL('/carta', data.meta.siteUrl).toString();
const out = `${root}qr/`;
mkdirSync(out, { recursive: true });

const INK = '#14110f';
const PAPER = '#efe6d2';

// 1) QR suelto
const svg = await QRCode.toString(url, { type: 'svg', margin: 2, errorCorrectionLevel: 'H', color: { dark: INK, light: PAPER } });
writeFileSync(`${out}carta-qr.svg`, svg);
await QRCode.toFile(`${out}carta-qr.png`, url, { width: 2400, margin: 2, errorCorrectionLevel: 'H', color: { dark: INK, light: PAPER } });

// 2) Cartelito A6 (105 x 148 mm) con el nombre del restaurante
const fontFile = resolve(root, 'node_modules/@fontsource-variable/big-shoulders-display/files/big-shoulders-display-latin-wght-normal.woff2');
const sansFile = resolve(root, 'node_modules/@fontsource-variable/public-sans/files/public-sans-latin-wght-normal.woff2');
const qrInline = svg.replace('<svg ', '<svg style="width:100%;height:100%;display:block" ');

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Carta · ${data.brand.name}</title>
<style>
@font-face{font-family:BSD;src:url('${pathToFileURL(fontFile)}');font-weight:100 900}
@font-face{font-family:PS;src:url('${pathToFileURL(sansFile)}');font-weight:100 900}
@page{size:105mm 148mm;margin:0}
*{box-sizing:border-box;margin:0}
html,body{width:105mm;height:148mm;background:${PAPER};color:${INK};font-family:PS,sans-serif}
.card{width:105mm;height:148mm;padding:8mm;display:flex;flex-direction:column;border:0}
.top{display:flex;justify-content:space-between;align-items:baseline;border-bottom:.4mm solid ${INK};padding-bottom:2.5mm;font:700 2.6mm PS;letter-spacing:.18em;text-transform:uppercase}
h1{font:800 24mm/.86 BSD;text-transform:uppercase;margin-top:6mm}
h1 span{color:#b3261e}
.qr{width:50mm;height:50mm;margin:5mm auto 0;border:.8mm solid ${INK};padding:1.5mm;background:${PAPER}}
.cta{margin-top:5mm;text-align:center;font:800 9mm/1 BSD;text-transform:uppercase}
.small{margin-top:auto;display:flex;justify-content:space-between;border-top:.4mm solid ${INK};padding-top:2.5mm;font:600 2.8mm PS}
</style></head><body><div class="card">
<div class="top"><span>${data.brand.name}</span><span>${data.location.city}</span></div>
<h1>La<br><span>carta</span></h1>
<div class="qr">${qrInline}</div>
<p class="cta">Escaneá y pedí</p>
<div class="small"><span>${data.location.street}</span><span>${data.contact.instagramHandle}</span></div>
</div></body></html>`;
writeFileSync(`${out}mesa-a6.html`, html);

const exe = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium'].find(existsSync);
const browser = await chromium.launch(exe ? { executablePath: exe, args: ['--no-sandbox'] } : {});
const page = await browser.newPage({ viewport: { width: 397, height: 559 }, deviceScaleFactor: 1240 / 397 }); // 105mm = 397px a 96 dpi
await page.goto(pathToFileURL(`${out}mesa-a6.html`).toString());
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: `${out}mesa-a6.png`, clip: { x: 0, y: 0, width: 397, height: 559 } });
await page.pdf({ path: `${out}mesa-a6.pdf`, width: '105mm', height: '148mm', printBackground: true });
await browser.close();

console.log(`QR para: ${url}\nArchivos en ${out}:\n  carta-qr.svg · carta-qr.png (2400 px)\n  mesa-a6.png (≈1240×1748, 300 dpi) · mesa-a6.pdf · mesa-a6.html`);
