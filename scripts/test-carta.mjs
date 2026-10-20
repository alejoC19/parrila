// Prueba de la carta en un navegador real: buscador, etiquetas, tabs y lectura de la planilla (CSV simulado) con fallback.
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';

const base = process.argv[2] || 'http://localhost:4321';
const exe = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium'].find(existsSync);
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, serviceWorkers: 'block' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
let ok = 0, bad = 0;
const check = (name, cond) => { cond ? ok++ : bad++; console.log(`${cond ? 'OK ' : 'FALLA'}  ${name}`); };

await page.goto(base + '/carta', { waitUntil: 'networkidle' });
const visible = () => page.locator('.item:not([hidden])').count();
const total = await visible();
check(`carga ${total} platos desde el respaldo`, total > 20);

await page.fill('#q', 'vacío');
check('buscador encuentra "vacío" sin importar tildes', (await visible()) === 1);
await page.fill('#q', 'vacio');
check('buscador sin tilde también', (await visible()) === 1);
await page.fill('#q', 'zzzz');
check('búsqueda sin resultados muestra el aviso', (await page.locator('#empty').isVisible()));
await page.fill('#q', '');

await page.click('[data-chip="vegetariano"]');
const veg = await visible();
check(`filtro vegetariano deja ${veg} platos`, veg > 0 && veg < total);
await page.click('[data-chip="vegetariano"]');
check('al apagar el filtro vuelven todos', (await visible()) === total);

await page.click('[data-tab="postres"]');
await page.waitForTimeout(900);
const cur = await page.locator('.tab[aria-current="true"]').getAttribute('data-tab');
check(`al tocar Postres la pestaña activa es "${cur}"`, cur === 'postres');
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);
await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await page.waitForTimeout(700);
check('al scrollear a Bebidas se marca esa pestaña', (await page.locator('.tab[aria-current="true"]').getAttribute('data-tab')) === 'bebidas');

// Planilla simulada: se cambia un precio, se agrega un plato y se oculta otro. Después, el fallo de red.
const csv = [
  'categoria,nombre,descripcion,precio,etiquetas,disponible,orden',
  'Del asador,Vacío,"Jugoso, a punto",$ 25.000,sin tacc,si,1',
  'Del asador,Plato nuevo,De la planilla,30000,recomendado,si,2',
  'Del asador,Se terminó,,1000,,no,3',
  'Bebidas,Agua,,3.500,,si,1',
].join('\n');
const page2 = await ctx.newPage();
await page2.addInitScript(() => {});
// Se inyecta la URL de la planilla en el HTML servido, sin tocar el build
await page2.route('**/carta', async (route) => {
  const res = await route.fetch();
  const html = (await res.text()).replace(/&#34;csv&#34;:&#34;&#34;/, '&#34;csv&#34;:&#34;https://sheet.test/carta.csv&#34;');
  route.fulfill({ response: res, body: html });
});
await page2.route('https://sheet.test/carta.csv', (r) => r.fulfill({ status: 200, contentType: 'text/csv', body: csv }));
await page2.goto(base + '/carta', { waitUntil: 'networkidle' });
await page2.waitForTimeout(800);
const names = await page2.locator('.item-name').allTextContents();
check('con planilla: aparece el plato nuevo', names.includes('Plato nuevo'));
check('con planilla: no aparece el marcado como no disponible', !names.includes('Se terminó'));
check('con planilla: precio actualizado "$ 25.000"', (await page2.locator('.item-price').first().textContent()).includes('25.000'));
check('con planilla: la carta tiene solo las 2 categorías de la planilla', (await page2.locator('.tab').count()) === 2);

// Sin señal y con una copia guardada de la planilla: se muestra la última carta guardada
const page3 = await ctx.newPage();
await page3.route('**/carta', async (route) => {
  const res = await route.fetch();
  route.fulfill({ response: res, body: (await res.text()).replace(/&#34;csv&#34;:&#34;&#34;/, '&#34;csv&#34;:&#34;https://sheet.test/caida.csv&#34;') });
});
await page3.route('https://sheet.test/caida.csv', (r) => r.abort());
await page3.goto(base + '/carta', { waitUntil: 'networkidle' });
await page3.waitForTimeout(800);
check('sin señal: muestra la última planilla guardada', (await page3.locator('.item-name').allTextContents()).includes('Plato nuevo'));

// Sin señal y sin copia guardada (primera visita): carta de respaldo
const fresh = await browser.newContext({ viewport: { width: 375, height: 812 }, serviceWorkers: 'block' });
const page4 = await fresh.newPage();
await page4.route('**/carta', async (route) => {
  const res = await route.fetch();
  route.fulfill({ response: res, body: (await res.text()).replace(/&#34;csv&#34;:&#34;&#34;/, '&#34;csv&#34;:&#34;https://sheet.test/caida.csv&#34;') });
});
await page4.route('https://sheet.test/caida.csv', (r) => r.abort());
await page4.goto(base + '/carta', { waitUntil: 'networkidle' });
await page4.waitForTimeout(800);
check('planilla caída en primera visita: carta de respaldo', (await page4.locator('.item').count()) > 20);

check('sin errores de JavaScript', errors.length === 0);
if (errors.length) console.log(errors);
console.log(`\n${ok} OK, ${bad} con falla`);
await browser.close();
process.exit(bad ? 1 : 0);
