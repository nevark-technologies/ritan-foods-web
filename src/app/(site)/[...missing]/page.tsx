import { notFound } from "next/navigation";

/** Unknown URLs render the branded 404 inside the site chrome. */
export default function Missing() {
  notFound();
}
