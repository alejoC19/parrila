import type { ImageMetadata } from 'astro';

const all = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/*.{jpg,jpeg,png,webp,avif}',
  { eager: true },
);

/** Devuelve la imagen por nombre de archivo, sin extensión (el que se usa en restaurant.json). */
export function img(name: string): ImageMetadata {
  const key = Object.keys(all).find((k) => k.split('/').pop()!.replace(/\.[^.]+$/, '') === name);
  if (!key) throw new Error(`No existe la imagen "${name}" en src/assets/images`);
  return all[key].default;
}
