// Character art lookup, in priority order:
//  1. src/art/<formId>.png     — your own artwork, if added
//  2. src/sprites/<formId>@<expression>.png (or <formId>.png) — pixel sprites from scripts/make-sprites.mts
//  3. a drawn SVG placeholder
import { type Form } from "./data";
import { LOOKS, portrait, type Expr } from "./portrait";

const byName = (files: Record<string, string>) => {
  const out: Record<string, string> = {};
  for (const [path, url] of Object.entries(files)) out[path.slice(path.lastIndexOf("/") + 1, -4)] = url;
  return out;
};
const ART = byName(import.meta.glob("./art/*.png", { eager: true, query: "?url", import: "default" }) as Record<string, string>);
const SPRITES = byName(import.meta.glob("./sprites/*.png", { eager: true, query: "?url", import: "default" }) as Record<string, string>);

const cache: Record<string, string> = {};
const uri = (svg: string) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);

function emoji(form: Form): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><ellipse cx="60" cy="108" rx="34" ry="6" fill="#000" opacity=".25"/><text x="60" y="88" font-size="76" text-anchor="middle">${form.glyph}</text></svg>`;
}

/** True when the form is shown as a pixel sprite (so it should be scaled without smoothing). */
export const isSprite = (form: Form) => !ART[form.id] && !!(SPRITES[form.id] || SPRITES[`${form.id}@idle`]);

/** Image for a form in the given expression. */
export function artUrl(form: Form, expr: Expr = "idle"): string {
  if (ART[form.id]) return ART[form.id];
  const sprite = SPRITES[`${form.id}@${expr}`] ?? SPRITES[`${form.id}@idle`] ?? SPRITES[form.id];
  if (sprite) return sprite;
  const look = LOOKS[form.id];
  const key = form.id + (look ? ":" + expr : "");
  return (cache[key] ??= uri(look ? portrait(look, expr) : emoji(form)));
}
export type { Expr };
