// Generates the pixel-art sprites in src/sprites/ from the drawn characters.
//   npm run sprites        (needs Playwright's Chromium: npx playwright install chromium)
//
// Pipeline per sprite, run in a headless browser canvas:
//  1. render the character SVG at 4x the sprite size, in sprite mode (flat colours, no ink)
//  2. turn her to a three-quarter view facing left: the far (screen-left) side is squeezed and
//     the near side widened, more strongly for the head than the body
//  3. snap every pixel to the drawing's own palette, then shrink 4x by majority vote
//  4. shade like a hand-made sprite: light from the top-left (highlight on top/left edges,
//     2px shadow on right/bottom edges), dark lines between contrasting parts, dark outline
import { createRequire } from "node:module";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { ALL_FORMS } from "../src/data.ts";
import { LOOKS, portrait, type Expr } from "../src/portrait.ts";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const OUT = new URL("../src/sprites/", import.meta.url).pathname;
const EXPRS: Expr[] = ["idle", "happy", "eat", "sleep", "sad"];
const W = 130;
const H = 160;
const SMALL = 64; // charms and familiars

interface Job {
  name: string;
  svg: string;
  w: number;
  h: number;
  turn: boolean;
  noShade: string[]; // colours left flat (eyes, highlights)
}

const jobs: Job[] = [];
for (const form of ALL_FORMS) {
  const look = LOOKS[form.id];
  if (look) {
    for (const expr of EXPRS)
      jobs.push({ name: `${form.id}@${expr}`, svg: portrait(look, expr, true), w: W, h: H, turn: true, noShade: [look.eyes, "#ffffff", "#2a1740"] });
  } else {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><text x="60" y="96" font-size="96" text-anchor="middle">${form.glyph}</text></svg>`;
    jobs.push({ name: form.id, svg, w: SMALL, h: SMALL, turn: false, noShade: [] });
  }
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.evaluate("window.__name = (f) => f"); // helper the TS runner injects into functions
const results: { name: string; png: string }[] = await page.evaluate(async (jobs: Job[]) => {
  const hex = (h: string) => {
    const v = h.length === 4 ? h.replace(/#(.)(.)(.)/, "#$1$1$2$2$3$3") : h;
    return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16));
  };
  const lum = (c: number[]) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
  const shade = (c: number[], k: number) => c.map((v) => Math.round(Math.max(0, Math.min(255, k >= 1 ? v + (255 - v) * (k - 1) : v * k))));
  const dist = (a: number[], b: number[]) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  const OUTLINE = [28, 20, 38];

  const load = (svg: string) =>
    new Promise<HTMLImageElement>((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    });

  const out: { name: string; png: string }[] = [];
  for (const job of jobs) {
    const S = 4;
    const HW = job.w * S;
    const HH = job.h * S;
    const img = await load(job.svg);
    const big = document.createElement("canvas");
    big.width = HW;
    big.height = HH;
    const g = big.getContext("2d")!;
    if (job.turn) {
      // viewBox is -30 -20 260 320; the body's centre line x=100 sits at 130/260 of the width.
      const src = document.createElement("canvas");
      src.width = HW;
      src.height = HH;
      src.getContext("2d")!.drawImage(img, 0, 0, HW, HH);
      const mid = HW * (130 / 260);
      const centre = HW * (126 / 260);
      const headEnd = Math.round(HH * (112 / 320)); // chin / neck line
      const bands: [number, number, number, number][] = [
        [0, headEnd, 0.62, 1.18], // head turns most
        [headEnd, HH, 0.82, 1.06],
      ];
      for (const [y0, y1, kl, kr] of bands) {
        const h = y1 - y0;
        g.drawImage(src, 0, y0, mid, h, centre - mid * kl, y0, mid * kl, h);
        g.drawImage(src, mid, y0, HW - mid, h, centre, y0, (HW - mid) * kr, h);
      }
    } else g.drawImage(img, 0, 0, HW, HH);

    // palette: the SVG's own colours (or a posterized set for emoji art)
    const pal = [...new Set((job.svg.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) ?? []).map((c) => c.toLowerCase()))].map(hex);
    const data = g.getImageData(0, 0, HW, HH).data;
    const q = new Int32Array(HW * HH).fill(-1); // packed rgb, -1 transparent
    for (let i = 0; i < HW * HH; i++) {
      if (data[i * 4 + 3] < 128) continue;
      const c = [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]];
      let best = c;
      if (job.turn && pal.length) {
        let bd = Infinity;
        for (const pc of pal) {
          const d = dist(c, pc);
          if (d < bd) ((bd = d), (best = pc));
        }
      } else best = c.map((v) => Math.round(v / 42) * 42).map((v) => Math.min(255, v));
      q[i] = (best[0] << 16) | (best[1] << 8) | best[2];
    }
    // shrink by majority vote in each SxS block
    const w = job.w;
    const h = job.h;
    const px = new Int32Array(w * h).fill(-1);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const count = new Map<number, number>();
        for (let dy = 0; dy < S; dy++)
          for (let dx = 0; dx < S; dx++) {
            const v = q[(y * S + dy) * HW + x * S + dx];
            count.set(v, (count.get(v) ?? 0) + (v === -1 ? 1 : 1.15)); // lean towards solid pixels
          }
        let bv = -1;
        let bc = -1;
        for (const [v, c] of count) if (c > bc) ((bc = c), (bv = v));
        px[y * w + x] = bv;
      }
    const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? -1 : px[y * w + x]);
    const rgb = (v: number) => [(v >> 16) & 255, (v >> 8) & 255, v & 255];
    const flat = new Set(job.noShade.map((c) => {
      const [r, gg, b] = hex(c.toLowerCase());
      return (r << 16) | (gg << 8) | b;
    }));

    // horizontal runs of one colour, for rounded volume shading (lit from the left)
    const runStart = new Int32Array(w * h);
    const runLen = new Int32Array(w * h);
    for (let y = 0; y < h; y++) {
      let x = 0;
      while (x < w) {
        let e = x;
        while (e + 1 < w && px[y * w + e + 1] === px[y * w + x]) e++;
        for (let k = x; k <= e; k++) ((runStart[y * w + k] = x), (runLen[y * w + k] = e - x + 1));
        x = e + 1;
      }
    }

    const res = document.createElement("canvas");
    res.width = w;
    res.height = h;
    const rg = res.getContext("2d")!;
    const outImg = rg.createImageData(w, h);
    const put = (x: number, y: number, c: number[]) => {
      const i = (y * w + x) * 4;
      outImg.data.set([c[0], c[1], c[2], 255], i);
    };
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const v = at(x, y);
        if (v === -1) {
          // dark outline around the silhouette
          const n = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].find((t) => t !== -1);
          if (n !== undefined) put(x, y, rgb(n).map((c, i) => Math.round(c * 0.18 + OUTLINE[i] * 0.82)));
          continue;
        }
        let c = rgb(v);
        if (flat.has(v)) {
          put(x, y, c);
          continue;
        }
        const differs = (t: number) => t !== v;
        const right = at(x + 1, y);
        const down = at(x, y + 1);
        // contrasting neighbour on the right/bottom: a dark line on the darker side
        const line = [right, down].some((t) => t !== -1 && t !== v && dist(rgb(t), c) > 5200 && lum(c) <= lum(rgb(t)));
        const len = runLen[y * w + x];
        const t = (x - runStart[y * w + x] + 0.5) / len;
        let k = len >= 4 ? (t > 0.68 ? 0.8 : t < 0.26 ? 1.12 : 1) : 1;
        if (line) k = 0.5;
        else if (differs(right) || differs(at(x + 2, y)) || differs(down)) k = Math.min(k, 0.74);
        else if (differs(at(x - 1, y)) || differs(at(x, y - 1))) k = Math.max(k, 1.2);
        put(x, y, k === 1 ? c : shade(c, k));
      }
    rg.putImageData(outImg, 0, 0);
    out.push({ name: job.name, png: res.toDataURL("image/png") });
  }
  return out;
}, jobs);
await browser.close();

mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT)) if (f.endsWith(".png")) rmSync(OUT + f);
for (const r of results) writeFileSync(OUT + r.name + ".png", Buffer.from(r.png.split(",")[1], "base64"));
console.log(`${results.length} sprites written to src/sprites/`);
