/**
 * First-visit intro: a curry leaf draws itself, the name rises, then the
 * curtain lifts. Pure CSS (see globals.css `.intro`), gated by
 * html[data-intro="play"] which an inline script sets once per session.
 * It never delays LCP: content paints underneath immediately.
 */
export function Intro() {
  return (
    <div className="intro" aria-hidden>
      <div className="flex flex-col items-center gap-5 text-cream-50">
        <svg className="intro-leaf h-24 w-12" viewBox="0 0 34 72" fill="none">
          <path pathLength={1} d="M17 1C29 14 33 34 27 52C24 62 20 68 17 71C14 68 10 62 7 52C1 34 5 14 17 1Z" stroke="#C6D9A3" strokeWidth="1.4" />
          <path pathLength={1} d="M17 6L17 68" stroke="#C6D9A3" strokeWidth="1" />
        </svg>
        <p className="intro-word font-display text-4xl italic tracking-tight">Ritan Foods</p>
        <p className="intro-word eyebrow text-sprout-300">A taste of tradition</p>
      </div>
    </div>
  );
}

/** Runs before paint: marks JS, and plays the intro once per session. */
export const introScript = `(function(){try{var d=document.documentElement;d.classList.add('js');var k='ritan-intro';if(!sessionStorage.getItem(k)&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&location.pathname==='/'){d.setAttribute('data-intro','play');sessionStorage.setItem(k,'1');}}catch(e){}})();`;
