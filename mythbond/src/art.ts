// Character art lookup. Drop a PNG named <formId>.png into src/art/ and it is used
// automatically; forms without art get a generated placeholder.
import { LINES, type Form } from "./data";

const files = import.meta.glob("./art/*.png", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const ART: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) ART[path.slice(path.lastIndexOf("/") + 1, -4)] = url;

export const hasArt = (form: Form) => form.id in ART;

function placeholder(form: Form): string {
  const [c1] = LINES[form.line].colors;
  const size = [58, 64, 76, 84][form.stage];
  const rays =
    form.stage === 3
      ? Array.from({ length: 12 }, (_, i) => `<rect x="99" y="14" width="2" height="22" rx="1" fill="#fff" opacity=".7" transform="rotate(${i * 30} 100 120)"/>`).join("")
      : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240">
<defs><radialGradient id="a"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".55" stop-color="${c1}" stop-opacity=".55"/><stop offset="1" stop-color="${c1}" stop-opacity="0"/></radialGradient></defs>
<circle cx="100" cy="120" r="${60 + form.stage * 12}" fill="url(#a)"/>${rays}
<ellipse cx="100" cy="212" rx="48" ry="9" fill="#000" opacity=".25"/>
<text x="100" y="${120 + size * 0.36}" font-size="${size}" text-anchor="middle">${form.glyph}</text>
</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

export const artUrl = (form: Form): string => ART[form.id] ?? placeholder(form);
