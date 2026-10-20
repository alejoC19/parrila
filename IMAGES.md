# Imágenes de la demo → qué reemplazar por fotos reales

Todas las fotos de esta demo son de **Unsplash** (Licencia Unsplash: uso comercial libre, sin atribución obligatoria).
Están guardadas en `src/assets/images/`. Se referencian por **nombre de archivo sin extensión** desde
`src/data/restaurant.json`, así que para reemplazar una foto alcanza con **guardar la foto real con el mismo nombre**
(o cambiar el nombre en el JSON).

> Por qué `src/assets/images` y no `public/images`: el componente `<Picture>` de Astro solo puede generar AVIF/WebP,
> tamaños responsive y `lazy` con imágenes que importa el build. Lo que está en `public/` se sirve tal cual, sin optimizar.

Medidas sugeridas para las fotos reales: lado largo de **2000 px o más**, JPG calidad 85. Astro las baja solo a AVIF/WebP.

| Archivo | Dónde se usa | Qué foto real poner | Fuente de la demo (Unsplash) |
|---|---|---|---|
| `hero-asador.jpg` | Hero (pantalla completa) y imagen al compartir en redes (Open Graph) | Cortes sobre la parrilla con fuego. Mejor si se ve el local o el asador. Horizontal | photo-1558030137-a56c1b004fa3 |
| `historia-corte.jpg` | Sección 01 "Quiénes somos" | El asador o el equipo trabajando; o un corte en la tabla. Vertical o 4:5 | photo-1558030006-450675393462 |
| `plato-corte-tabla.jpg` | Plato 01 · Asado de asador | El plato real, visto desde arriba o a 45° | photo-1529692236671-f1f6cf9683ba |
| `plato-costillar.jpg` | Plato 02 · Costillar | El plato real | photo-1544025162-d76694265947 |
| `plato-entrana.jpg` | Plato 03 · Entraña | El plato real | photo-1588168333986-5078d3ae3976 |
| `plato-chorizo.jpg` | Plato 04 · Chorizo | Chorizo / choripán real | photo-1600797828610-468bb21b6f8e |
| `plato-picada.jpg` | Plato 05 · Picada Co | La picada real de la casa | photo-1555939594-58d7cb561ad1 |
| `galeria-fuego.jpg` | Galería | Parrilla encendida | photo-1588182657969-777d766e31ab |
| `galeria-pinza.jpg` | Galería (vertical) | Parrillero trabajando, de cerca | photo-1614119068601-483274e9dcb7 |
| `galeria-brasa.jpg` | Galería | Carne a la brasa | photo-1619719304744-2858f324351c |
| `galeria-carbon.jpg` | Galería (vertical) | Brasas / carbón | photo-1621851709622-e19c9a4f0cc5 |
| `galeria-lena.jpg` | Galería | La leña o el fuego del local | photo-1579360332966-252de47450d1 |
| `galeria-asador.jpg` | Galería | El asador con las piezas | photo-1558030089-02acba3c214e |
| `cerveza-tirada.jpg` | Galería | La barra / el chopp del local | photo-1555658636-6e4a36218be7 |
| `cerveza-vaso.jpg` | Galería | La cerveza servida en el local | photo-1566633806327-68e152aaf26d |

Cada archivo se encuentra en `https://images.unsplash.com/<photo-id>` (el id de la tabla ya incluye el prefijo `photo-`).

## Cambiar un nombre o agregar fotos
1. Guardá la foto en `src/assets/images/` (por ejemplo `local-fachada.jpg`).
2. En `src/data/restaurant.json` poné `"image": "local-fachada"` (sin extensión) y escribí un `alt` que describa lo que se ve.
3. `npm run build`.

## Antes de entregar
Fotos de stock **no** deben quedar en el sitio final: los platos de la demo no son los del restaurante.
Para la portada y el cuadro de "Quiénes somos" conviene hacer una sesión corta de fotos en el local (2 horas, con luz natural).
