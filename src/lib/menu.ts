// Lógica de la carta compartida entre el build (Astro) y el navegador (lectura de la planilla).

export type TagId = 'recomendado' | 'vegetariano' | 'sin-tacc' | 'picante';

export interface MenuItem {
  nombre: string;
  descripcion: string;
  precio: number | null;
  tags: TagId[];
}
export interface MenuCategory {
  name: string;
  slug: string;
  items: MenuItem[];
}

export const TAG_LABELS: Record<TagId, string> = {
  recomendado: 'Recomendado',
  vegetariano: 'Vegetariano',
  'sin-tacc': 'Sin TACC',
  picante: 'Picante',
};

export const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const slugify = (s: string) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** CSV simple con comillas, comas y saltos de línea dentro de campos entre comillas. */
export function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQ = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQ) {
      if (c === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++; } else inQ = false;
      } else cell += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((v) => v.trim() !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((v) => v.trim() !== '')) rows.push(row);
  if (rows.length < 2) return [];
  const head = rows[0].map((h) => norm(h));
  return rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
}

export function parsePrice(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  let s = String(v ?? '').replace(/[^\d.,]/g, '');
  if (!s) return null;
  if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
  else if (s.includes(',')) s = /,\d{1,2}$/.test(s) ? s.replace(',', '.') : s.replace(/,/g, '');
  else if (/\.\d{3}($|\.)/.test(s)) s = s.replace(/\./g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function parseTags(v: unknown): TagId[] {
  const out = new Set<TagId>();
  for (const raw of String(v ?? '').split(/[,;|]/)) {
    const t = norm(raw).replace(/\s+/g, ' ');
    if (!t) continue;
    if (['vegetariano', 'veggie', 'veg', 'v'].includes(t)) out.add('vegetariano');
    else if (['sin tacc', 'sintacc', 'celiaco', 'apto celiacos'].includes(t)) out.add('sin-tacc');
    else if (['picante', 'spicy'].includes(t)) out.add('picante');
    else if (['recomendado', 'favorito', 'estrella', 'del chef'].includes(t)) out.add('recomendado');
  }
  return [...out];
}

/** Convierte filas (CSV o JSON de respaldo) en categorías ordenadas. Oculta lo marcado como no disponible. */
export function buildMenu(rows: Record<string, unknown>[]): MenuCategory[] {
  const cats = new Map<string, { name: string; first: number; items: (MenuItem & { o: number })[] }>();
  rows.forEach((r, i) => {
    const get = (k: string) => String((r as Record<string, unknown>)[k] ?? '').trim();
    const nombre = get('nombre');
    const categoria = get('categoria');
    if (!nombre || !categoria) return;
    if (['no', 'n', '0', 'false', 'agotado'].includes(norm(get('disponible')))) return;
    const c = cats.get(categoria) ?? { name: categoria, first: i, items: [] };
    c.items.push({
      nombre,
      descripcion: get('descripcion'),
      precio: parsePrice((r as Record<string, unknown>)['precio']),
      tags: parseTags((r as Record<string, unknown>)['etiquetas']),
      o: Number(get('orden')) || i + 1,
    });
    cats.set(categoria, c);
  });
  return [...cats.values()]
    .sort((a, b) => a.first - b.first)
    .map((c) => ({
      name: c.name,
      slug: slugify(c.name),
      items: c.items.sort((a, b) => a.o - b.o).map(({ o, ...it }) => it),
    }));
}

const priceFmt = new Intl.NumberFormat('es-AR');
export const formatPrice = (n: number | null) => (n == null ? '' : `$ ${priceFmt.format(n)}`);

export function renderTabs(cats: MenuCategory[]): string {
  return cats
    .map((c) => `<a href="#${c.slug}" data-tab="${c.slug}" class="tab">${esc(c.name)}</a>`)
    .join('');
}

export function renderMenu(cats: MenuCategory[]): string {
  return cats
    .map(
      (c, ci) => `
<section id="${c.slug}" data-cat="${c.slug}" class="cat">
  <h2 class="cat-title"><span class="cat-n">${String(ci + 1).padStart(2, '0')}</span>${esc(c.name)}</h2>
  <ul>${c.items
    .map(
      (it) => `
    <li class="item" data-tags="${it.tags.join(' ')}" data-search="${esc(norm(`${it.nombre} ${it.descripcion} ${c.name}`))}">
      <div class="item-main">
        <h3 class="item-name">${esc(it.nombre)}</h3>
        ${it.descripcion ? `<p class="item-desc">${esc(it.descripcion)}</p>` : ''}
        ${
          it.tags.length
            ? `<ul class="tags">${it.tags
                .map((t) => `<li class="tag tag-${t}">${TAG_LABELS[t]}</li>`)
                .join('')}</ul>`
            : ''
        }
      </div>
      <p class="item-price">${formatPrice(it.precio)}</p>
    </li>`,
    )
    .join('')}</ul>
</section>`,
    )
    .join('');
}
