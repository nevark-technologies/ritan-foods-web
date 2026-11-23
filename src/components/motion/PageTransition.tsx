import { ViewTransition, type ReactNode } from "react";

/**
 * Route transition (browser View Transitions via React <ViewTransition>):
 * the old page sinks and fades, the new one rises in behind a rounded
 * clip-path wipe. Styles: `.page-exit` / `.page-enter` in globals.css.
 * Wrap each page's content (layouts persist, so they never animate).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  );
}
