// Writes each vector ingredient sprite to public/images/sprites/<id>.svg so pages
// can reference them as cacheable files instead of inlining data URLs.
// Run: npm run assets:sprites   (Node 24+ loads the TypeScript module directly)
import { mkdirSync, writeFileSync } from "node:fs";
import { SPRITES } from "../../src/components/physics/sprites.ts";

const dir = new URL("../../public/images/sprites/", import.meta.url);
mkdirSync(dir, { recursive: true });
for (const [id, def] of Object.entries(SPRITES)) {
  writeFileSync(new URL(`${id}.svg`, dir), `${def.svg.replace(/\s{2,}/g, " ").trim()}\n`);
}
console.log(`Wrote ${Object.keys(SPRITES).length} sprites to public/images/sprites/`);
