// Placeholder heroine art, drawn as SVG from a small description of each form.
// Used until a real PNG for the form is added to src/art/.
// Design language for evolved forms: eye-covering masks and visors, armored bodysuits, straps and
// belts, flowing ribbons, large wings and a spirit familiar behind the strongest forms.

export type Expr = "idle" | "happy" | "eat" | "sleep" | "sad";

export interface Look {
  skin: string;
  hair: string;
  hairStyle: "long" | "pony" | "short" | "twin";
  eyes: string;
  outfit: string; // main garment colour
  trim: string;
  dress: "kimono" | "dress" | "gown" | "tunic" | "armor" | "suit";
  sleeves?: string; // arm colour if covered (gloves / sleeves)
  boots?: string;
  ears?: "fox" | "elf";
  horns?: boolean;
  foxTails?: number;
  tailTip?: string;
  heartTail?: boolean;
  wings?: "bat" | "torn" | "fairy" | "butterfly" | "angel";
  wingColor?: string;
  wingPairs?: number; // angel wings: 1-3 pairs
  mask?: "visor" | "fox" | "demon" | "foxhelm";
  maskColor?: string;
  armor?: string; // breastplate + pauldrons
  belts?: string; // waist and thigh straps
  ribbons?: string;
  coat?: string; // long open coat with a torn hem
  chains?: boolean;
  claws?: string;
  familiar?: "fox" | "shade";
  crown?: boolean;
  item?: "fan" | "katana" | "bow" | "staff" | "rapier" | "daggers" | "scepter" | "shakujo" | "spear" | "crossbows";
  big?: boolean; // ascended: larger wings / tails and sparkles
}

const INK = "#2a1740";
// Sprite mode (used by scripts/make-sprites.mts): no ink strokes and no translucency, so the
// drawing quantizes cleanly into pixel art; the sprite pipeline adds its own outline and shading.
let SPRITE = false;
const mirror = (s: string) => s + `<g transform="translate(200 0) scale(-1 1)">${s}</g>`;
const p = (d: string, fill: string, extra = "") =>
  SPRITE ? `<path d="${d}" fill="${fill}" ${extra.replace(/(fill-)?opacity="[^"]*"/g, "")}/>` : `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round" ${extra}/>`;
const line = (d: string, c: string, w: number, extra = "") => `<path d="${d}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none" ${SPRITE ? extra.replace(/opacity="[^"]*"/g, "") : extra}/>`;
const inked = (d: string, c: string, w: number) => (SPRITE ? line(d, c, w + 1) : line(d, INK, w + 2.5) + line(d, c, w));
const op = (v: string) => (SPRITE ? "1" : v);
const darken = (hex: string, k: number) =>
  "#" + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, "0")).join("");

function tails(n: number, color: string, tip: string, big: boolean): string {
  const angles = n === 1 ? [75] : n === 3 ? [-72, 72, 104] : Array.from({ length: n }, (_, i) => -116 + (232 / (n - 1)) * i);
  const s = big ? 1.3 : 1;
  return angles
    .map(
      (a) =>
        `<g transform="rotate(${a} 100 172) translate(100 172) scale(${s}) translate(-100 -172)">` +
        p("M100 175C132 150 126 100 100 76C74 100 68 150 100 175Z", color) +
        p("M100 76C113 89 113 101 100 106C87 101 87 89 100 76Z", tip) +
        `</g>`,
    )
    .join("");
}

function wings(L: Look): string {
  const color = L.wingColor ?? L.outfit;
  const s = L.big ? 1.3 : 1;
  let one = "";
  switch (L.wings) {
    case "bat":
      one = p("M104 112Q140 58 178 66Q168 88 174 110Q158 102 152 124Q140 114 132 134Q118 124 104 130Z", color);
      break;
    case "torn":
      one = p("M104 110Q146 50 186 58L176 80L184 92L168 96L176 116L156 112L160 134L142 124L136 144L120 128L104 132Z", color, `opacity=".92"`);
      break;
    case "angel": {
      const pairs = L.wingPairs ?? 1;
      // Each pair is a fan of long feathers, longest at the top, sweeping up and out.
      for (let k = pairs - 1; k >= 0; k--) {
        const lift = [0, -30, 34][k];
        const base = [100, 80, 66][k];
        for (let i = 6; i >= 0; i--) {
          const a = -62 + i * 15 + lift;
          const len = base - i * 7;
          const w = 9 + (6 - i);
          one += `<g transform="rotate(${a} 106 112)"><path d="M106 110Q${106 + len * 0.5} ${110 - w} ${106 + len} 110Q${106 + len * 0.55} ${110 + w * 0.7} 106 118Z" fill="${color}" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/></g>`;
        }
      }
      break;
    }
    default: {
      const o = SPRITE ? 1 : L.wings === "butterfly" ? 0.8 : 0.55;
      const rx = L.wings === "butterfly" ? 46 : 40;
      one =
        `<ellipse cx="146" cy="92" rx="${rx}" ry="${L.wings === "butterfly" ? 26 : 16}" transform="rotate(-32 146 92)" fill="${color}" fill-opacity="${o}" stroke="#fff" stroke-width="1.5"/>` +
        `<ellipse cx="140" cy="136" rx="${rx - 14}" ry="${L.wings === "butterfly" ? 20 : 11}" transform="rotate(28 140 136)" fill="${L.wings === "butterfly" ? "#ffb3e6" : color}" fill-opacity="${o}" stroke="#fff" stroke-width="1.5"/>`;
    }
  }
  return `<g transform="translate(100 118) scale(${s}) translate(-100 -118)">${mirror(one)}</g>`;
}

function familiar(kind: NonNullable<Look["familiar"]>): string {
  if (kind === "fox")
    return (
      `<g opacity="${op(".55")}">` +
      `<path d="M150 70L162 18L178 54L196 48L190 86Q206 104 196 124L170 120Q150 112 140 96Z" fill="${SPRITE ? "#c4ecff" : "#9fe0ff"}" stroke="#e9fbff" stroke-width="2"/>` +
      `<path d="M150 70Q120 120 150 180Q170 230 214 220" stroke="${SPRITE ? "#c4ecff" : "#9fe0ff"}" stroke-width="16" fill="none" stroke-linecap="round"/>` +
      `<path d="M168 86L182 80" stroke="#fff" stroke-width="3" stroke-linecap="round"/>` +
      `</g>`
    );
  return (
    `<g opacity="${op(".85")}">` +
    `<path d="M140 108Q130 60 150 34Q166 12 190 30Q212 52 204 86Q214 96 208 112Q196 104 190 118Q178 104 170 120Q160 106 150 120Z" fill="#3a3346"/>` +
    `<path d="M156 52L170 60L156 62Z M196 52L182 60L196 62Z" fill="#ff3b4f"/>` +
    `<path d="M160 78Q176 90 192 78" stroke="#ff3b4f" stroke-width="2" fill="none"/>` +
    `<path d="M164 76v6M172 80v6M180 80v6M188 76v6" stroke="#ff3b4f" stroke-width="1.5"/>` +
    `</g>`
  );
}

function item(kind: NonNullable<Look["item"]>, trim: string): string {
  switch (kind) {
    case "fan": return p("M130 160L112 132A34 34 0 0 1 158 138Z", "#fff") + line("M130 160L135 133M130 160L148 134", trim, 1.5);
    case "katana": return line("M130 160L176 78", "#e9eef7", 4) + line("M127 165L134 153", INK, 6);
    case "rapier": return line("M130 160L182 96", "#e9eef7", 2.5) + `<circle cx="132" cy="158" r="6" fill="${trim}" stroke="${INK}" stroke-width="1.5"/>`;
    case "bow": return line("M44 96Q16 160 44 224", "#8a5a2b", 4) + line("M44 96L44 224", "#fff", 1);
    case "staff": return line("M132 250L132 70", "#c9c2e8", 4) + p("M132 44A16 16 0 1 0 146 70A12 12 0 1 1 132 44Z", "#fff3b0");
    case "scepter": return line("M132 240L132 96", trim, 3.5) + `<circle cx="132" cy="88" r="10" fill="#ff9ad5" stroke="${INK}" stroke-width="1.5"/><circle cx="132" cy="88" r="4" fill="#fff3b0"/>`;
    case "daggers": return line("M130 160L152 132", "#e9eef7", 4) + line("M70 160L48 132", "#e9eef7", 4);
    case "shakujo":
      return (
        inked("M134 262L134 62", trim, 3) +
        `<circle cx="134" cy="46" r="15" fill="none" stroke="${INK}" stroke-width="5"/><circle cx="134" cy="46" r="15" fill="none" stroke="${trim}" stroke-width="3"/>` +
        [-1, 1].map((d) => `<circle cx="${134 + d * 15}" cy="56" r="5" fill="none" stroke="${trim}" stroke-width="2"/>`).join("") +
        p("M134 28L139 40L134 52L129 40Z", "#fff6d0")
      );
    case "spear":
      return inked("M40 262L170 30", trim, 3.5) + p("M170 30L184 6L176 34Z", "#f2f4ff") + p("M164 40L156 30L172 34Z", trim);
    case "crossbows":
      return [70, 130]
        .map((cx) => {
          const d = cx < 100 ? -1 : 1;
          return inked(`M${cx} 158L${cx + d * 30} 152`, "#3a3346", 4) + line(`M${cx + d * 24} 140Q${cx + d * 32} 152 ${cx + d * 24} 166`, "#c9c2e8", 2.5);
        })
        .join("");
  }
}

function mask(kind: NonNullable<Look["mask"]>, color: string, hair: string): string {
  switch (kind) {
    case "visor":
      return (
        p("M73 70Q70 26 100 24Q130 26 127 70Q114 74 100 74Q86 74 73 70Z", color) +
        line("M77 54H123M76 62H124", INK, 1.5, `opacity=".6"`) +
        mirror(p("M78 36Q60 22 52 6Q70 12 84 28Z", "#fff") + p("M80 42Q62 34 50 22Q68 26 84 36Z", "#fff"))
      );
    case "fox":
      return (
        p("M75 62L76 32L90 44H110L124 32L125 62Q118 76 100 78Q82 76 75 62Z", color) +
        mirror(`<path d="M84 56Q90 50 95 58Q89 62 84 56Z" fill="#7b4bd1"/><path d="M80 36L84 44" stroke="#d6263f" stroke-width="2"/>`) +
        `<path d="M98 46Q100 40 102 46" stroke="#7b4bd1" stroke-width="2" fill="none"/>`
      );
    case "demon":
      return p("M76 66L70 28L88 46L100 22L112 46L130 28L124 66Q100 76 76 66Z", color) + mirror(`<path d="M84 58L96 60L86 63Z" fill="#9fd4ff"/>`);
    case "foxhelm":
      return (
        p("M72 72Q68 26 100 22Q132 26 128 72Q114 70 100 76Q86 70 72 72Z", color) +
        mirror(p("M78 38L70 2L96 26Z", color) + `<path d="M79 32L75 12L90 26Z" fill="#d6263f"/>`) +
        line("M80 60H120", INK, 2, `opacity=".55"`) +
        `<path d="M70 58Q60 74 66 96" stroke="${hair}" stroke-width="0" fill="none"/>`
      );
  }
}

export function portrait(L: Look, expr: Expr = "idle", sprite = false): string {
  SPRITE = sprite;
  try {
    return draw(L, expr);
  } finally {
    SPRITE = false;
  }
}

function draw(L: Look, expr: Expr): string {
  const long = L.dress === "kimono" || L.dress === "gown";
  const covered = L.dress === "suit" || L.dress === "armor";
  const back: string[] = [];
  const front: string[] = [];

  if (L.big && !SPRITE)
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      back.push(`<path d="M0-7L2-2 7 0 2 2 0 7-2 2-7 0-2-2Z" fill="#fff" opacity=".85" transform="translate(${(100 + Math.cos(a) * 88).toFixed(0)} ${(140 + Math.sin(a) * 118).toFixed(0)})"/>`);
    }
  if (L.familiar) back.push(familiar(L.familiar));
  if (!SPRITE) back.push(`<ellipse cx="100" cy="287" rx="50" ry="8" fill="#000" opacity=".25"/>`);
  if (L.wings) back.push(wings(L));
  if (L.foxTails) back.push(tails(L.foxTails, L.hair, L.tailTip ?? "#fff", !!L.big));
  if (L.heartTail) back.push(`<path d="M108 168Q156 186 152 232Q150 252 136 250" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>` + p("M136 250c-8-8-16 0-8 8l8 7 7-8c7-9-2-15-7-7z", "#ff5fa8"));
  if (L.ribbons) back.push(line("M66 104C20 70 6 150 34 190S30 262 6 286", L.ribbons, 5, `opacity=".95"`) + line("M134 104C184 64 196 160 166 198S172 258 196 280", L.ribbons, 5, `opacity=".95"`));
  if (L.item === "bow") back.push(item("bow", L.trim));
  if (L.item === "spear") back.push(item("spear", L.trim));

  // hair behind the body
  if (L.hairStyle === "long" || L.hairStyle === "twin") back.push(p("M72 60Q62 18 100 24Q138 18 128 60L138 172Q100 188 62 172Z", L.hair));
  else back.push(p("M72 60Q62 18 100 24Q138 18 128 60L130 94Q100 102 70 94Z", L.hair));
  if (L.hairStyle === "pony") back.push(p("M122 34Q168 40 156 138Q144 96 126 62Z", L.hair));
  if (SPRITE && (L.hairStyle === "long" || L.hairStyle === "twin"))
    back.push(mirror(line("M74 70Q68 120 70 168M80 96Q76 130 80 176", darken(L.hair, 0.78), 2.2)));
  if (L.hairStyle === "twin") back.push(mirror(p("M74 70Q40 120 52 230Q60 250 66 232Q58 150 84 92Z", L.hair) + line("M56 150Q62 146 68 150", "#fff", 3)));

  // long coat behind the legs
  if (L.coat) back.push(mirror(p("M80 100L52 272L62 262L66 280L76 266L84 282L92 140L94 104Z", L.coat)));

  // legs and boots
  const leg = covered ? L.outfit : L.skin;
  const boot = L.boots ?? (covered || L.dress === "tunic" ? L.trim : INK);
  if (!long) {
    front.push(mirror(`<path d="M91 190L89 282" stroke="${INK}" stroke-width="12.5" stroke-linecap="round"/><path d="M91 190L89 282" stroke="${leg}" stroke-width="10" stroke-linecap="round"/><path d="M90 232L89 282" stroke="${boot}" stroke-width="11" stroke-linecap="round"/>`));
    if (L.boots) front.push(mirror(line("M85 234H95", L.trim, 3)));
    if (SPRITE) front.push(`<ellipse cx="84" cy="282" rx="7" ry="4" fill="${boot}"/><ellipse cx="106" cy="282" rx="7" ry="4" fill="${boot}"/>`);
    if (L.belts) front.push(mirror(`<rect x="84" y="200" width="13" height="5" rx="1" fill="${L.belts}" stroke="${INK}" stroke-width="1"/><rect x="88" y="200" width="4" height="5" fill="#e9c46a"/>`));
  }

  // skirt / gown / suit hips
  if (long) front.push(p("M86 138Q100 142 114 138L140 280Q100 292 60 280Z", L.outfit) + `<path d="M64 270Q100 282 136 270" stroke="${L.trim}" stroke-width="3" fill="none"/>`);
  else if (L.dress === "armor") front.push(p("M86 138Q100 142 114 138L124 186L108 196L100 184L92 196L76 186Z", L.trim));
  else if (L.dress === "suit") front.push(p("M86 138Q100 142 114 138L118 192Q100 200 82 192Z", L.outfit) + (L.armor ? p("M92 150L108 150L104 170L100 176L96 170Z", L.armor) : ""));
  else front.push(p("M86 138Q100 142 114 138L130 200Q100 212 70 200Z", L.outfit) + `<path d="M73 194Q100 205 127 194" stroke="${L.trim}" stroke-width="2.5" fill="none"/>`);

  // arms
  const arm = L.sleeves ?? (L.dress === "suit" ? L.outfit : L.skin);
  if (L.dress === "kimono") front.push(mirror(p("M80 97L54 152L76 164L90 116Z", L.outfit) + `<circle cx="70" cy="162" r="5" fill="${L.skin}" stroke="${INK}" stroke-width="1.5"/>`));
  else front.push(mirror(inked("M81 101Q67 132 71 160", arm, 8) + (L.dress === "armor" ? p("M72 96Q82 90 90 98L84 112Q76 108 72 110Z", L.trim) : "")));
  if (L.claws) front.push(mirror(p("M66 160L60 176L68 166L68 180L72 166L76 178L75 162Z", L.claws)));
  if (L.chains) front.push(mirror([0, 1, 2, 3, 4, 5].map((i) => `<ellipse cx="${80 - i * 2}" cy="${110 + i * 9}" rx="3.2" ry="2.2" fill="none" stroke="#c9ccd6" stroke-width="1.6"/>`).join("") + line("M71 160Q60 190 40 196", "#c9ccd6", 1.6, `stroke-dasharray="3 2"`)));
  if (L.ribbons) front.push(mirror(line("M64 126Q73 120 82 126M66 138Q74 132 80 138M67 150Q74 144 79 150", L.ribbons, 3.5)));

  // torso
  front.push(`<rect x="95" y="84" width="10" height="14" fill="${L.skin}" stroke="${INK}" stroke-width="1.5"/>`);
  front.push(p("M78 97Q100 91 122 97L114 140Q100 145 86 140Z", L.outfit));
  if (L.dress === "kimono") front.push(`<path d="M90 95L100 118L110 95" stroke="${L.trim}" stroke-width="3" fill="none"/>` + p("M86 126H114V140Q100 145 86 140Z", L.trim));
  else if (L.dress === "armor") front.push(p("M84 100Q100 96 116 100L112 126Q100 132 88 126Z", L.trim));
  else if (L.dress !== "suit") front.push(`<path d="M86 134Q100 139 114 134" stroke="${L.trim}" stroke-width="3" fill="none"/><path d="M88 97Q100 106 112 97" stroke="${L.trim}" stroke-width="2.5" fill="none"/>`);
  if (L.coat) front.push(mirror(p("M78 97L86 98L92 140L84 142Z", L.coat)));
  if (L.armor) front.push(p("M81 100Q100 95 119 100L116 118Q108 124 100 118Q92 124 84 118Z", L.armor) + mirror(p("M70 96Q80 88 90 97L84 108Q76 104 70 106Z", L.armor)));
  if (L.belts) front.push(`<rect x="85" y="130" width="30" height="6" rx="1" fill="${L.belts}" stroke="${INK}" stroke-width="1.2"/><rect x="96" y="129" width="8" height="8" rx="1" fill="#e9c46a" stroke="${INK}" stroke-width="1"/>` + `<rect x="86" y="121" width="28" height="4" rx="1" fill="${L.belts}" stroke="${INK}" stroke-width="1"/>`);
  if (L.chains) front.push(`<path d="M100 104Q96 112 100 120Q104 112 100 104Z" fill="#fff"/><circle cx="98" cy="110" r="1.4" fill="${INK}"/><circle cx="102" cy="110" r="1.4" fill="${INK}"/>`);

  if (L.item && L.item !== "bow" && L.item !== "spear") front.push(item(L.item, L.trim));
  if (L.item === "spear") front.push(`<circle cx="129" cy="160" r="5" fill="${arm}" stroke="${INK}" stroke-width="1.5"/>`);

  // head
  if (L.ears === "elf") front.push(mirror(p("M77 60L50 46L78 74Z", L.skin)));
  front.push(p("M76 58Q76 86 100 91Q124 86 124 58Q124 34 100 34Q76 34 76 58Z", L.skin));
  const blush = `<ellipse cx="84" cy="74" rx="5" ry="2.6" fill="#ff7aa8" opacity=".45"/>`;
  const arc = (d: string) => line(d, INK, SPRITE ? 3.4 : 1.8);
  const openEye = SPRITE
    ? `<ellipse cx="89" cy="65" rx="5.4" ry="7.4" fill="${INK}"/><ellipse cx="89" cy="67" rx="3.8" ry="4.8" fill="${darken(L.eyes, 0.72)}"/><ellipse cx="89" cy="69" rx="3.2" ry="2.6" fill="${L.eyes}"/><rect x="85.4" y="60.4" width="3.4" height="3.4" fill="#fff"/><path d="M82 58Q89 54 96 58" stroke="${INK}" stroke-width="2.6" fill="none"/>`
    : `<ellipse cx="90" cy="65" rx="4.6" ry="6" fill="${L.eyes}" stroke="${INK}" stroke-width="1.2"/><circle cx="90" cy="66" r="2.4" fill="${INK}"/><circle cx="88.4" cy="63" r="1.5" fill="#fff"/>`;
  const eye =
    expr === "happy" ? arc("M85 67Q90 59 95 67")
    : expr === "sleep" ? arc("M85 64Q90 69 95 64")
    : expr === "sad" ? openEye + (SPRITE ? "" : arc("M84 56L95 60"))
    : openEye + (SPRITE ? "" : arc("M84 59Q90 55 96 59"));
  front.push(mirror((L.mask ? "" : eye) + (SPRITE ? "" : blush)));
  const lip = L.mask ? "#b8325a" : "#c2456b";
  const mouth =
    expr === "happy" ? `<path d="M94 79Q100 88 106 79Z" fill="${lip}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`
    : expr === "eat" ? `<ellipse cx="100" cy="82" rx="4.2" ry="4.8" fill="${lip}" stroke="${INK}" stroke-width="1.2"/>`
    : expr === "sad" ? arc("M95 83Q100 79 105 83")
    : expr === "sleep" ? arc("M97 81Q100 83 103 81")
    : L.mask ? `<path d="M95 81Q100 84 105 81" stroke="${lip}" stroke-width="${SPRITE ? 3.4 : 2.4}" fill="none" stroke-linecap="round"/>`
    : SPRITE ? `<path d="M96 80H103" stroke="${lip}" stroke-width="3" fill="none"/>`
    : arc("M95 78Q100 82 105 78");
  front.push(mouth);
  if (L.mask && expr === "sleep") front.push(`<text x="118" y="40" font-size="12" fill="#fff" font-family="monospace">z</text>`);
  front.push(p("M75 60Q74 30 100 30Q126 30 125 60Q116 44 105 49Q100 39 92 51Q84 45 75 60Z", L.hair));
  if (SPRITE) front.push(line("M90 34Q86 42 84 52M104 33Q108 40 112 48M97 33L95 44", darken(L.hair, 0.78), 2));
  if (L.ears === "fox" && L.mask !== "foxhelm") front.push(mirror(p("M79 40L72 10L97 29Z", L.hair) + `<path d="M80 34L77 19L90 29Z" fill="#ffb3c7"/>`));
  if (L.mask) front.push(mask(L.mask, L.maskColor ?? "#8a6b5a", L.hair));
  if (L.horns) front.push(mirror(p("M85 35Q72 22 80 6Q86 22 94 31Z", "#3a2148")));
  if (L.crown) front.push(p("M85 33L86 19L93 27L100 14L107 27L114 19L115 33Z", "#ffd45c") + `<circle cx="100" cy="25" r="2.5" fill="#ff5fa8"/>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-30 -20 260 320">${back.join("")}${front.join("")}</svg>`;
}

const S = "#ffe3d0";
const GOLD = "#e8b93a";
export const LOOKS: Record<string, Look> = {
  // Kitsune: shrine maiden → masked moon priestess with a spirit fox, or a gold-helmed spear warrior.
  kitsune_awakened: { skin: S, hair: "#f3f0ff", hairStyle: "twin", eyes: "#ffae2b", outfit: "#fffaf5", trim: "#d6263f", dress: "kimono", ears: "fox", foxTails: 3, tailTip: "#ff9a3d", item: "fan" },
  kitsune_grace: { skin: S, hair: "#f6f4ff", hairStyle: "twin", eyes: "#ffae2b", outfit: "#fffaf5", trim: GOLD, dress: "kimono", ears: "fox", foxTails: 9, tailTip: "#9fe0ff", mask: "fox", maskColor: GOLD, item: "shakujo", familiar: "fox", big: true },
  kitsune_valor: { skin: S, hair: "#dfe3f5", hairStyle: "twin", eyes: "#ffae2b", outfit: "#2a2238", trim: "#8a5cc9", dress: "suit", boots: "#8a5cc9", ears: "fox", foxTails: 3, tailTip: GOLD, mask: "foxhelm", maskColor: GOLD, armor: GOLD, belts: "#3a3346", item: "spear", big: true },
  // Succubus: enchantress → crowned queen, or a pale chained duelist with a shadow familiar.
  succubus_awakened: { skin: "#ffe0d6", hair: "#d93f9c", hairStyle: "long", eyes: "#ff5fa8", outfit: "#2a1838", trim: "#b05cff", dress: "dress", horns: true, heartTail: true, wings: "bat", wingColor: "#6a2f8f" },
  succubus_grace: { skin: "#ffe0d6", hair: "#5a2a8c", hairStyle: "long", eyes: "#ff5fa8", outfit: "#1d1230", trim: GOLD, dress: "gown", horns: true, heartTail: true, wings: "bat", wingColor: "#7a2f6f", crown: true, ribbons: "#b05cff", big: true },
  succubus_valor: { skin: "#e9e4f2", hair: "#e8d2c8", hairStyle: "long", eyes: "#ff3b4f", outfit: "#26222e", trim: "#c22a4a", dress: "suit", boots: "#26222e", horns: true, wings: "torn", wingColor: "#3a3346", chains: true, claws: "#e0283f", belts: "#4a4458", familiar: "shade", big: true },
  // Elf: ranger → moon priestess, or a masked gunslinger-style hunter in a long torn coat.
  elf_awakened: { skin: S, hair: "#f6d776", hairStyle: "long", eyes: "#2fbf7a", outfit: "#3f8f5a", trim: "#8a5a2b", dress: "tunic", ears: "elf", item: "bow" },
  elf_grace: { skin: S, hair: "#f4f1e4", hairStyle: "long", eyes: "#2fbf7a", outfit: "#f7f9ff", trim: "#b9c4e8", dress: "gown", ears: "elf", crown: true, item: "staff", ribbons: "#9fd4ff", big: true },
  elf_valor: { skin: S, hair: "#f2d27a", hairStyle: "long", eyes: "#2fbf7a", outfit: "#1f1d26", trim: "#5a5468", dress: "suit", boots: "#1f1d26", sleeves: "#1f1d26", ears: "elf", mask: "demon", maskColor: "#2e3f8f", coat: "#2b2833", belts: "#4a4458", item: "crossbows", big: true },
  // Pixie: flower-court pixie → aurora queen, or an armored rose rogue.
  pixie_awakened: { skin: S, hair: "#3fc9c0", hairStyle: "short", eyes: "#ff7ac8", outfit: "#ff9ad5", trim: "#3fc9c0", dress: "dress", ears: "elf", wings: "fairy", wingColor: "#c9f6ff" },
  pixie_grace: { skin: S, hair: "#7fe0d0", hairStyle: "long", eyes: "#ff7ac8", outfit: "#ffe3f6", trim: "#ffd45c", dress: "gown", ears: "elf", wings: "butterfly", wingColor: "#8fe9ff", crown: true, item: "scepter", ribbons: "#ff9ad5", big: true },
  pixie_valor: { skin: S, hair: "#3fc9c0", hairStyle: "pony", eyes: "#ff7ac8", outfit: "#2f5b45", trim: "#c22a4a", dress: "suit", boots: "#c22a4a", ears: "elf", wings: "fairy", wingColor: "#ff5d7a", mask: "visor", maskColor: "#c22a4a", armor: "#e05a72", belts: "#2a1a22", item: "daggers", big: true },
  // Seraph: halo knight → dawn seraph (white) or fallen seraph (black), the light/dark pair.
  seraph_awakened: { skin: S, hair: "#f7e08a", hairStyle: "long", eyes: "#6ab8ff", outfit: "#f7f6ff", trim: GOLD, dress: "suit", boots: "#f7f6ff", sleeves: "#f7f6ff", wings: "angel", wingColor: "#ffffff", wingPairs: 1, mask: "visor", maskColor: "#8a6b5a", armor: GOLD, belts: "#6b4a3a" },
  seraph_grace: { skin: S, hair: "#f7d65a", hairStyle: "long", eyes: "#6ab8ff", outfit: "#f7f6ff", trim: GOLD, dress: "suit", boots: "#f7f6ff", sleeves: "#f7f6ff", wings: "angel", wingColor: "#ffffff", wingPairs: 3, mask: "visor", maskColor: "#8a6b5a", armor: GOLD, belts: "#6b4a3a", ribbons: "#ff7ac8", big: true },
  seraph_valor: { skin: S, hair: "#d8d8e4", hairStyle: "long", eyes: "#b05cff", outfit: "#1e1a26", trim: GOLD, dress: "suit", boots: "#1e1a26", wings: "angel", wingColor: "#26222e", wingPairs: 3, mask: "visor", maskColor: "#6b5a52", armor: GOLD, belts: "#4a3a32", ribbons: "#a64dd6", big: true },
};
