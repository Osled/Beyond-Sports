// Character art lookup. Drop a PNG named <formId>.png into src/art/ and it is used
// automatically; forms without art get a drawn placeholder (with facial expressions).
import { type Form } from "./data";
import { LOOKS, portrait, type Expr } from "./portrait";

const files = import.meta.glob("./art/*.png", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const ART: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) ART[path.slice(path.lastIndexOf("/") + 1, -4)] = url;

const cache: Record<string, string> = {};
const uri = (svg: string) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);

function emoji(form: Form): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><ellipse cx="60" cy="108" rx="34" ry="6" fill="#000" opacity=".25"/><text x="60" y="88" font-size="76" text-anchor="middle">${form.glyph}</text></svg>`;
}

/** Image for a form. `expr` only changes drawn placeholders; real PNG art is used as-is. */
export function artUrl(form: Form, expr: Expr = "idle"): string {
  if (ART[form.id]) return ART[form.id];
  const look = LOOKS[form.id];
  const key = form.id + (look ? ":" + expr : "");
  return (cache[key] ??= uri(look ? portrait(look, expr) : emoji(form)));
}
export type { Expr };
