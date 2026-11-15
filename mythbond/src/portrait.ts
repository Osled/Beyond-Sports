// Placeholder heroine art, drawn as SVG from a small description of each form.
// Used until a real PNG for the form is added to src/art/.

export interface Look {
  skin: string;
  hair: string;
  hairStyle: "long" | "pony" | "short";
  eyes: string;
  outfit: string;
  trim: string;
  dress: "kimono" | "dress" | "gown" | "tunic" | "armor";
  ears?: "fox" | "elf";
  horns?: boolean;
  foxTails?: number;
  tailTip?: string;
  heartTail?: boolean;
  wings?: "bat" | "fairy" | "butterfly";
  wingColor?: string;
  crown?: boolean;
  item?: "fan" | "katana" | "bow" | "staff" | "rapier" | "daggers" | "scepter";
  big?: boolean; // ascended: larger wings / tails and sparkles
}

const INK = "#2a1740";
const mirror = (s: string) => s + `<g transform="translate(200 0) scale(-1 1)">${s}</g>`;
const p = (d: string, fill: string, extra = "") => `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round" ${extra}/>`;

function tails(n: number, color: string, tip: string, big: boolean): string {
  const angles = n === 1 ? [75] : n === 3 ? [-72, 72, 104] : Array.from({ length: n }, (_, i) => -116 + (232 / (n - 1)) * i);
  const s = big ? 1.3 : 1;
  return angles
    .map(
      (a) => `<g transform="rotate(${a} 100 172) translate(100 172) scale(${s}) translate(-100 -172)">` +
        p("M100 175C132 150 126 100 100 76C74 100 68 150 100 175Z", color) +
        p("M100 76C113 89 113 101 100 106C87 101 87 89 100 76Z", tip) + `</g>`,
    )
    .join("");
}

function wings(kind: NonNullable<Look["wings"]>, color: string, big: boolean): string {
  const s = big ? 1.3 : 1;
  let one: string;
  if (kind === "bat") one = p("M104 112Q140 58 178 66Q168 88 174 110Q158 102 152 124Q140 114 132 134Q118 124 104 130Z", color);
  else {
    const o = kind === "butterfly" ? 0.8 : 0.55;
    const rx = kind === "butterfly" ? 46 : 40;
    one =
      `<ellipse cx="146" cy="92" rx="${rx}" ry="${kind === "butterfly" ? 26 : 16}" transform="rotate(-32 146 92)" fill="${color}" fill-opacity="${o}" stroke="#fff" stroke-width="1.5"/>` +
      `<ellipse cx="140" cy="136" rx="${rx - 14}" ry="${kind === "butterfly" ? 20 : 11}" transform="rotate(28 140 136)" fill="${kind === "butterfly" ? "#ffb3e6" : color}" fill-opacity="${o}" stroke="#fff" stroke-width="1.5"/>`;
  }
  return `<g transform="translate(100 118) scale(${s}) translate(-100 -118)">${mirror(one)}</g>`;
}

function item(kind: NonNullable<Look["item"]>, trim: string): string {
  const line = (d: string, c: string, w: number) => `<path d="${d}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
  switch (kind) {
    case "fan": return p("M130 160L112 132A34 34 0 0 1 158 138Z", "#fff") + line("M130 160L135 133M130 160L148 134", trim, 1.5);
    case "katana": return line("M130 160L176 78", "#e9eef7", 4) + line("M127 165L134 153", INK, 6);
    case "rapier": return line("M130 160L182 96", "#e9eef7", 2.5) + `<circle cx="132" cy="158" r="6" fill="${trim}" stroke="${INK}" stroke-width="1.5"/>`;
    case "bow": return line("M44 96Q16 160 44 224", "#8a5a2b", 4) + line("M44 96L44 224", "#fff", 1);
    case "staff": return line("M132 250L132 70", "#c9c2e8", 4) + p("M132 44A16 16 0 1 0 146 70A12 12 0 1 1 132 44Z", "#fff3b0");
    case "scepter": return line("M132 240L132 96", trim, 3.5) + `<circle cx="132" cy="88" r="10" fill="#ff9ad5" stroke="${INK}" stroke-width="1.5"/><circle cx="132" cy="88" r="4" fill="#fff3b0"/>`;
    case "daggers": return line("M130 160L152 132", "#e9eef7", 4) + line("M70 160L48 132", "#e9eef7", 4);
  }
}

export function portrait(L: Look, aura: string): string {
  const long = L.dress === "kimono" || L.dress === "gown";
  const back: string[] = [];
  const front: string[] = [];

  back.push(`<circle cx="100" cy="140" r="${L.big ? 128 : 105}" fill="url(#a)"/>`);
  if (L.big) for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    back.push(`<path d="M0-7L2-2 7 0 2 2 0 7-2 2-7 0-2-2Z" fill="#fff" opacity=".85" transform="translate(${(100 + Math.cos(a) * 88).toFixed(0)} ${(140 + Math.sin(a) * 118).toFixed(0)})"/>`);
  }
  back.push(`<ellipse cx="100" cy="287" rx="50" ry="8" fill="#000" opacity=".25"/>`);
  if (L.wings) back.push(wings(L.wings, L.wingColor ?? L.outfit, !!L.big));
  if (L.foxTails) back.push(tails(L.foxTails, L.hair, L.tailTip ?? "#fff", !!L.big));
  if (L.heartTail) back.push(`<path d="M108 168Q156 186 152 232Q150 252 136 250" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>` + p("M136 250c-8-8-16 0-8 8l8 7 7-8c7-9-2-15-7-7z", "#ff5fa8"));
  if (L.item === "bow") back.push(item("bow", L.trim));

  // hair behind the body
  if (L.hairStyle === "long") back.push(p("M72 60Q62 18 100 24Q138 18 128 60L138 172Q100 188 62 172Z", L.hair));
  else back.push(p("M72 60Q62 18 100 24Q138 18 128 60L130 94Q100 102 70 94Z", L.hair));
  if (L.hairStyle === "pony") back.push(p("M122 34Q168 40 156 138Q144 96 126 62Z", L.hair));

  // legs and boots
  const boot = L.dress === "armor" || L.dress === "tunic" ? L.trim : INK;
  if (!long) front.push(mirror(`<path d="M91 190L89 282" stroke="${L.skin}" stroke-width="10" stroke-linecap="round"/><path d="M90 236L89 282" stroke="${boot}" stroke-width="11" stroke-linecap="round"/>`));

  // skirt / gown
  if (long) front.push(p("M86 138Q100 142 114 138L140 280Q100 292 60 280Z", L.outfit) + `<path d="M64 270Q100 282 136 270" stroke="${L.trim}" stroke-width="3" fill="none"/>`);
  else if (L.dress === "armor") front.push(p("M86 138Q100 142 114 138L124 186L108 196L100 184L92 196L76 186Z", L.trim));
  else front.push(p("M86 138Q100 142 114 138L130 200Q100 212 70 200Z", L.outfit) + `<path d="M73 194Q100 205 127 194" stroke="${L.trim}" stroke-width="2.5" fill="none"/>`);

  // arms / sleeves
  if (L.dress === "kimono") front.push(mirror(p("M80 97L54 152L76 164L90 116Z", L.outfit) + `<circle cx="70" cy="162" r="5" fill="${L.skin}" stroke="${INK}" stroke-width="1.5"/>`));
  else front.push(mirror(`<path d="M81 101Q67 132 71 160" stroke="${INK}" stroke-width="10.5" stroke-linecap="round" fill="none"/><path d="M81 101Q67 132 71 160" stroke="${L.skin}" stroke-width="8" stroke-linecap="round" fill="none"/>` + (L.dress === "armor" ? p("M72 96Q82 90 90 98L84 112Q76 108 72 110Z", L.trim) : "")));

  // torso
  front.push(`<rect x="95" y="84" width="10" height="14" fill="${L.skin}" stroke="${INK}" stroke-width="1.5"/>`);
  front.push(p("M78 97Q100 91 122 97L114 140Q100 145 86 140Z", L.outfit));
  if (L.dress === "kimono") front.push(`<path d="M90 95L100 118L110 95" stroke="${L.trim}" stroke-width="3" fill="none"/>` + p("M86 126H114V140Q100 145 86 140Z", L.trim));
  else if (L.dress === "armor") front.push(p("M84 100Q100 96 116 100L112 126Q100 132 88 126Z", L.trim));
  else front.push(`<path d="M86 134Q100 139 114 134" stroke="${L.trim}" stroke-width="3" fill="none"/><path d="M88 97Q100 106 112 97" stroke="${L.trim}" stroke-width="2.5" fill="none"/>`);

  if (L.item && L.item !== "bow") front.push(item(L.item, L.trim));

  // head
  if (L.ears === "elf") front.push(mirror(p("M77 60L50 46L78 74Z", L.skin)));
  front.push(p("M76 58Q76 86 100 91Q124 86 124 58Q124 34 100 34Q76 34 76 58Z", L.skin));
  front.push(mirror(`<ellipse cx="90" cy="65" rx="4.6" ry="6" fill="${L.eyes}" stroke="${INK}" stroke-width="1.2"/><circle cx="90" cy="66" r="2.4" fill="${INK}"/><circle cx="88.4" cy="63" r="1.5" fill="#fff"/><path d="M84 59Q90 55 96 59" stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/><ellipse cx="84" cy="74" rx="5" ry="2.6" fill="#ff7aa8" opacity=".45"/>`));
  front.push(`<path d="M95 78Q100 82 105 78" stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`);
  front.push(p("M75 60Q74 30 100 30Q126 30 125 60Q116 44 105 49Q100 39 92 51Q84 45 75 60Z", L.hair));
  if (L.ears === "fox") front.push(mirror(p("M79 40L72 10L97 29Z", L.hair) + `<path d="M80 34L77 19L90 29Z" fill="#ffb3c7"/>`));
  if (L.horns) front.push(mirror(p("M85 35Q72 22 80 6Q86 22 94 31Z", "#3a2148")));
  if (L.crown) front.push(p("M85 33L86 19L93 27L100 14L107 27L114 19L115 33Z", "#ffd45c") + `<circle cx="100" cy="25" r="2.5" fill="#ff5fa8"/>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-30 -20 260 320"><defs><radialGradient id="a"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".55" stop-color="${aura}" stop-opacity=".5"/><stop offset="1" stop-color="${aura}" stop-opacity="0"/></radialGradient></defs>${back.join("")}${front.join("")}</svg>`;
}

const S = "#ffe3d0";
export const LOOKS: Record<string, Look> = {
  kitsune_awakened: { skin: S, hair: "#f3f0ff", hairStyle: "long", eyes: "#ffae2b", outfit: "#fffaf5", trim: "#d6263f", dress: "kimono", ears: "fox", foxTails: 3, tailTip: "#ff9a3d", item: "fan" },
  kitsune_grace: { skin: S, hair: "#fffdf2", hairStyle: "long", eyes: "#ffae2b", outfit: "#fffaf5", trim: "#e9b93a", dress: "kimono", ears: "fox", foxTails: 9, tailTip: "#ffd76a", crown: true, big: true },
  kitsune_valor: { skin: S, hair: "#dfe3f5", hairStyle: "pony", eyes: "#ffae2b", outfit: "#2b2f6b", trim: "#d6263f", dress: "armor", ears: "fox", foxTails: 3, tailTip: "#7fd6ff", item: "katana", big: true },
  succubus_awakened: { skin: "#ffe0d6", hair: "#d93f9c", hairStyle: "long", eyes: "#ff5fa8", outfit: "#2a1838", trim: "#b05cff", dress: "dress", horns: true, heartTail: true, wings: "bat", wingColor: "#6a2f8f" },
  succubus_grace: { skin: "#ffe0d6", hair: "#5a2a8c", hairStyle: "long", eyes: "#ff5fa8", outfit: "#1d1230", trim: "#e9b93a", dress: "gown", horns: true, heartTail: true, wings: "bat", wingColor: "#7a2f6f", crown: true, big: true },
  succubus_valor: { skin: "#ffe0d6", hair: "#d93f9c", hairStyle: "short", eyes: "#ff5fa8", outfit: "#2a1838", trim: "#c22a4a", dress: "armor", horns: true, heartTail: true, wings: "bat", wingColor: "#3a2148", item: "rapier", big: true },
  elf_awakened: { skin: S, hair: "#f6d776", hairStyle: "long", eyes: "#2fbf7a", outfit: "#3f8f5a", trim: "#8a5a2b", dress: "tunic", ears: "elf", item: "bow" },
  elf_grace: { skin: S, hair: "#f4f1e4", hairStyle: "long", eyes: "#2fbf7a", outfit: "#f7f9ff", trim: "#b9c4e8", dress: "gown", ears: "elf", crown: true, item: "staff", big: true },
  elf_valor: { skin: S, hair: "#f6d776", hairStyle: "pony", eyes: "#2fbf7a", outfit: "#2f6b45", trim: "#7a5230", dress: "armor", ears: "elf", item: "bow", big: true },
  pixie_awakened: { skin: S, hair: "#3fc9c0", hairStyle: "short", eyes: "#ff7ac8", outfit: "#ff9ad5", trim: "#3fc9c0", dress: "dress", ears: "elf", wings: "fairy", wingColor: "#c9f6ff" },
  pixie_grace: { skin: S, hair: "#7fe0d0", hairStyle: "long", eyes: "#ff7ac8", outfit: "#ffe3f6", trim: "#ffd45c", dress: "gown", ears: "elf", wings: "butterfly", wingColor: "#8fe9ff", crown: true, item: "scepter", big: true },
  pixie_valor: { skin: S, hair: "#3fc9c0", hairStyle: "pony", eyes: "#ff7ac8", outfit: "#2f6b45", trim: "#c22a4a", dress: "armor", ears: "elf", wings: "fairy", wingColor: "#ff5d7a", item: "daggers", big: true },
};
