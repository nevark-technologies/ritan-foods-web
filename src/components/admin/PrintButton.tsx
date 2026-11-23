"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex h-10 items-center gap-2 rounded-full bg-forest-800 px-5 text-sm font-semibold text-cream-50">
      <Printer className="size-4" /> Print / save PDF
    </button>
  );
}
