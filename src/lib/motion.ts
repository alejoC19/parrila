import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

/** Scroll suave + animaciones de entrada. Con prefers-reduced-motion no se hace nada y todo queda visible. */
export function initMotion() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // Anclas internas con el scroll de Lenis
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"], a[href^="/#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const hash = a.hash;
      if (!hash || (a.pathname !== location.pathname && a.getAttribute('href')!.startsWith('/') && a.pathname !== '/')) return;
      const target = document.querySelector<HTMLElement>(hash);
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: -64 });
      }
    });
  });

  // Imágenes: revelado con máscara (clip-path) al entrar
  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
    gsap.fromTo(
      el,
      { clipPath: 'inset(0% 0% 100% 0%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      },
    );
    const inner = el.querySelector('img');
    if (inner && !el.classList.contains('frame-px')) {
      gsap.fromTo(inner, { scale: 1.18 }, { scale: 1, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    }
  });

  // Textos: subida suave
  gsap.utils.toArray<HTMLElement>('[data-up]').forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  // Parallax suave en imágenes grandes
  gsap.utils.toArray<HTMLElement>('.frame-px').forEach((frame) => {
    const img = frame.querySelector('img');
    if (!img) return;
    gsap.fromTo(
      img,
      { yPercent: -6 },
      {
        yPercent: 6,
        ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });

  requestAnimationFrame(() => ScrollTrigger.refresh());
}
