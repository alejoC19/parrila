import { buildMenu, parseCSV, renderMenu, renderTabs, norm } from '../lib/menu';

const root = document.querySelector<HTMLElement>('[data-carta]')!;
const cfg: { csv: string; empty: string } = JSON.parse(root.dataset.carta!);

const q = document.querySelector<HTMLInputElement>('#q')!;
const tabsEl = document.querySelector<HTMLElement>('#tabs')!;
const menuEl = document.querySelector<HTMLElement>('#menu')!;
const emptyEl = document.querySelector<HTMLElement>('#empty')!;
const statusEl = document.querySelector<HTMLElement>('#status')!;
const chips = [...document.querySelectorAll<HTMLButtonElement>('[data-chip]')];

const KEY = 'carta:csv:v1';
const atBottom = () => innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
let observer: IntersectionObserver | null = null;

function applyFilters() {
  const term = norm(q.value);
  const tags = chips.filter((c) => c.getAttribute('aria-pressed') === 'true').map((c) => c.dataset.chip!);
  let total = 0;
  menuEl.querySelectorAll<HTMLElement>('.cat').forEach((cat) => {
    let visible = 0;
    cat.querySelectorAll<HTMLElement>('.item').forEach((it) => {
      const okText = !term || (it.dataset.search ?? '').includes(term);
      const itTags = (it.dataset.tags ?? '').split(' ');
      const okTags = tags.every((t) => itTags.includes(t));
      it.hidden = !(okText && okTags);
      if (!it.hidden) visible++;
    });
    cat.hidden = visible === 0;
    tabsEl.querySelector<HTMLElement>(`[data-tab="${cat.dataset.cat}"]`)!.hidden = visible === 0;
    total += visible;
  });
  emptyEl.classList.toggle('hidden', total > 0);
  watchSections();
}

function setCurrent(slug: string) {
  tabsEl.querySelectorAll<HTMLElement>('.tab').forEach((t) => {
    if (t.dataset.tab === slug) {
      t.setAttribute('aria-current', 'true');
      const left = t.offsetLeft - tabsEl.clientWidth / 2 + t.clientWidth / 2;
      tabsEl.scrollTo({ left, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    } else t.removeAttribute('aria-current');
  });
}

function watchSections() {
  observer?.disconnect();
  const bar = document.querySelector<HTMLElement>('#tabs-wrap')!;
  const offset = bar.offsetHeight + 8;
  observer = new IntersectionObserver(
    (entries) => {
      if (atBottom()) return;
      const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (hit) setCurrent((hit.target as HTMLElement).dataset.cat!);
    },
    { rootMargin: `-${offset}px 0px -65% 0px` },
  );
  const cats = [...menuEl.querySelectorAll<HTMLElement>('.cat:not([hidden])')];
  cats.forEach((c) => observer!.observe(c));
  if (cats[0] && !tabsEl.querySelector('[aria-current]')) setCurrent(cats[0].dataset.cat!);
}

function render(csv: string): boolean {
  const cats = buildMenu(parseCSV(csv));
  if (!cats.length) return false;
  tabsEl.innerHTML = renderTabs(cats);
  menuEl.innerHTML = renderMenu(cats);
  applyFilters();
  return true;
}

// Al llegar al final de la página, el último rubro queda marcado aunque no llegue a subir al borde
addEventListener(
  'scroll',
  () => {
    const cats = menuEl.querySelectorAll<HTMLElement>('.cat:not([hidden])');
    if (!cats.length) return;
    if (atBottom()) setCurrent(cats[cats.length - 1].dataset.cat!);
    else if (scrollY < cats[0].offsetTop - 160) setCurrent(cats[0].dataset.cat!);
  },
  { passive: true },
);

q.addEventListener('input', applyFilters);
chips.forEach((c) =>
  c.addEventListener('click', () => {
    c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true'));
    applyFilters();
  }),
);
tabsEl.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a.tab');
  if (!a) return;
  e.preventDefault();
  const target = document.getElementById(a.dataset.tab!);
  target?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  history.replaceState(null, '', `#${a.dataset.tab}`);
});

// 1) Primer pintado: HTML estático del build (carta de respaldo). 2) Si hay una copia guardada de la planilla, se usa al instante.
// 3) Si hay conexión, se pide la planilla y se actualiza. Si falla, se queda lo anterior.
async function loadSheet() {
  if (!cfg.csv) return;
  let cached: { t: number; csv: string } | null = null;
  try {
    cached = JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {}
  if (cached?.csv && render(cached.csv)) {
    statusEl.textContent = `Precios al ${new Date(cached.t).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}.`;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const res = await fetch(cfg.csv, { signal: ctrl.signal, cache: 'no-cache' });
    if (!res.ok) throw new Error(String(res.status));
    const csv = await res.text();
    if (render(csv)) {
      try {
        localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), csv }));
      } catch {}
      statusEl.textContent = 'Precios actualizados hoy.';
    }
  } catch {
    if (cached?.csv) statusEl.textContent += ' Sin conexión: mostramos la última carta guardada.';
  } finally {
    clearTimeout(timer);
  }
}

watchSections();
loadSheet();

// Segunda visita sin señal: el service worker guarda la página y las fuentes
if ('serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
