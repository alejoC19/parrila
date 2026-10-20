# Parrilla Co · landing + carta digital (demo)

Sitio estático en **Astro + Tailwind CSS v4**, con **GSAP + ScrollTrigger + Lenis** para las animaciones. Se despliega en **Vercel**.
Todo el contenido del restaurante vive en **un solo archivo**: `src/data/restaurant.json`.

## Comandos

```bash
npm install
npm run dev          # desarrollo en http://localhost:4321
npm run build        # genera dist/
npm run preview      # sirve dist/
npm run qr           # genera el QR y el cartel A6 en qr/
node scripts/shots.mjs   # capturas con Playwright en screenshots/ (con el preview corriendo)
```

## Reutilizarlo para otro cliente

1. Editá `src/data/restaurant.json` (nombre, textos, horarios, WhatsApp, Instagram, mapa, platos destacados).
2. Reemplazá las fotos en `src/assets/images/` por las del local, con los mismos nombres (ver `IMAGES.md`).
3. Cambiá `meta.siteUrl` por el dominio real y poné `demo.enabled` en `false` cuando ya no sea una demo.
4. Cargá la carta: `src/data/menu.fallback.json` (respaldo) o, mejor, la planilla de Google (abajo).
5. `npm run build` y `npm run qr`.

Los colores y las tipografías están en `src/styles/global.css` (bloque `@theme`).

### Datos clave de `restaurant.json`
| Campo | Para qué sirve |
|---|---|
| `contact.whatsapp` | Número con código de país y sin `+` ni espacios: `5492235119361`. Genera el link `wa.me` |
| `contact.whatsappMessage` | Mensaje precargado de la reserva |
| `hours.schedule` | Días (`0` = domingo … `6` = sábado) y franjas. De acá salen la tabla, el "Abierto ahora" y los datos para Google |
| `location.lat / lng` | Pin del mapa y datos estructurados |
| `carta.sheetCsvUrl` | URL de la planilla publicada como CSV (ver abajo). Vacío = se usa solo el respaldo |

## Carta editable desde el celular (Google Sheets)

El dueño actualiza **precios y platos desde una planilla de Google** y la carta se actualiza sola, sin tocar el sitio.
Si la planilla falla o no hay señal, la carta muestra el respaldo (`menu.fallback.json`) o la última versión guardada en el teléfono.

### Paso a paso (no hace falta saber de tecnología)

1. Entrá a **sheets.google.com** con la cuenta de Google del restaurante y creá una **planilla en blanco**.
2. En el menú **Archivo → Importar → Subir** elegí el archivo **`plantilla-carta.csv`** de este proyecto. En "Ubicación de importación" elegí **Reemplazar hoja de cálculo** y confirmá. Te queda la carta de ejemplo para editar.
3. Las columnas son siempre estas, en este orden y con estos nombres (en la primera fila):

   | categoria | nombre | descripcion | precio | etiquetas | disponible | orden |
   |---|---|---|---|---|---|---|
   | Del asador | Vacío | Jugoso, a punto. | 19500 | sin tacc | si | 3 |

   - **categoria**: las categorías aparecen en el orden en que figuran por primera vez en la planilla.
   - **precio**: solo el número (`19500`). También acepta `$19.500`.
   - **etiquetas**: separadas por coma. Las que entiende: `recomendado`, `vegetariano`, `sin tacc`, `picante`.
   - **disponible**: `si` o `no`. Con `no` el plato desaparece de la carta (por ejemplo, cuando se terminó).
   - **orden**: número para ordenar los platos dentro de la categoría.
4. Para publicarla: **Archivo → Compartir → Publicar en la Web**.
   - En el primer desplegable elegí la **hoja** (no "Documento completo").
   - En el segundo elegí **Valores separados por comas (.csv)**.
   - Tocá **Publicar** y confirmá.
5. Copiá el **enlace** que te muestra (empieza con `https://docs.google.com/spreadsheets/d/e/...`).
6. Ese enlace va en `src/data/restaurant.json`, en `carta.sheetCsvUrl`. Es un cambio **una sola vez**; después, cada cambio en la planilla se ve en la carta sin tocar nada más.
7. **Para actualizar un precio**: abrí la planilla desde el celular (app Google Sheets), cambiá el número y listo. Puede tardar **hasta 5 minutos** en verse en la carta (es la demora normal de Google al publicar).

Consejos:
- No cambies los nombres de las columnas de la primera fila ni les agregues tildes raras.
- Si al probar no se ve el cambio, entrá a la carta, esperá unos minutos y recargá. Si sigue igual, revisá que la hoja esté publicada (paso 4) y que el enlace sea de tipo **CSV**.
- No pongas datos privados en la planilla: la hoja publicada es visible para quien tenga el enlace.

## QR para las mesas

```bash
npm run qr                                   # usa meta.siteUrl + /carta
npm run qr -- https://micarta.com.ar/carta   # o una URL específica
```

Genera en `qr/`:
- `carta-qr.svg` y `carta-qr.png` (2400 px): QR suelto, con corrección de errores alta.
- `mesa-a6.pdf` y `mesa-a6.png` (≈1240×1748 px, 300 dpi): cartel **A6 (105×148 mm)** listo para imprimir, con el nombre del restaurante.
- `mesa-a6.html`: el cartel editable.

Antes de imprimir, **generá el QR con el dominio definitivo** y probalo con un celular. Un QR impreso con la URL de la demo deja de servir si esa URL cambia.

## Deploy en Vercel

1. Subí el proyecto a un repositorio de GitHub.
2. En Vercel: **Add New → Project**, elegí el repo. Detecta Astro solo (no hace falta configurar nada).
3. Cuando tengas dominio propio, agregalo en **Settings → Domains** y actualizá `meta.siteUrl`.

## Calidad y decisiones técnicas

- **Imágenes** en `src/assets/images/` con el componente `<Picture>` de Astro (AVIF + WebP + JPG de respaldo, `srcset`, `lazy`); la del hero carga con prioridad. (`public/` no se optimiza: ver `IMAGES.md`).
- **Animaciones**: el revelado del título del hero es CSS puro (aparece sin esperar al JS). GSAP, ScrollTrigger y Lenis cargan **después** del primer render y **solo en la landing**; la carta no carga nada de eso. Todo respeta `prefers-reduced-motion`.
- **Carta rápida con mala señal**: HTML estático (sin JS para el primer pintado), CSS en línea, 2 fuentes, un service worker que guarda la página y las fuentes, y copia local de la última planilla.
- **SEO**: `title`, `description`, canonical, Open Graph con imagen 1200×630, JSON-LD `Restaurant` (landing y carta) y `Menu` (carta).
- No se publican reseñas ni puntaje en los datos estructurados; los números de Google se muestran en pantalla como dato visible, con su fuente.
