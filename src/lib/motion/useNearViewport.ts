"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Flips to true (once) when the element comes within `rootMargin` of the
 * viewport. Scroll effects use it to set themselves up just ahead of time
 * instead of all at once during hydration, which keeps start-up tasks short.
 */
export function useNearViewport(ref: RefObject<Element | null>, rootMargin = "100% 0px") {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, near]);
  return near;
}
