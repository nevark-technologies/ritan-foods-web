import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Page not found" };

/** Unknown URLs render the branded 404 inside the site chrome. */
export default function Missing() {
  notFound();
}
