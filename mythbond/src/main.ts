import "./style.css";
import { ALL_FORMS, LINES, STAGE_NAMES, pickLine, type Form, type LineId } from "./data";
import { artUrl, isSprite, type Expr } from "./art";
import {
  ASCEND_REQUIREMENT,
  PLAY_COST,
  TRAIN_COST,
  act,
  adopt,
  busyReason,
  finishActivity,
  formOf,
  load,
  needKind,
  persist,
  stageOf,
  stageProgress,
  tick,
  toneOf,
  warm,
  type GameEvent,
  type Save,
} from "./game";

// Android bridges (android/app/src/main/java/com/osled/mythbond/). Both are absent in a browser.
// MythbondAndroid: the main app. MythbondOverlay: the floating home-screen companion window.
declare global {
  interface Window {
    MythbondAndroid?: { startOverlay(): boolean };
    MythbondOverlay?: {
      moveBy(dxDp: number): void;
      dragBy(dxDp: number, dyDp: number): void;
      setExpanded(on: boolean): void;
      setWindow(wDp: number, hDp: number): void;
      openApp(): void;
    };
  }
}
const android = window.MythbondAndroid;
const overlay = window.MythbondOverlay;
const isOverlay = new URLSearchParams(location.search).has("overlay");
if (isOverlay) document.body.classList.add("overlay");
let suspended = false; // main app is in the background while the overlay owns the save

const SKINS = [
  { id: "sakura", name: "Sakura" },
  { id: "midnight", name: "Midnight" },
  { id: "matcha", name: "Matcha" },
  { id: "crystal", name: "Crystal" },
  { id: "royal", name: "Royal" },
];

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
const store = () => suspended || persist(save, storage());
let save: Save = load(Date.now(), storage());
let lastTick = Date.now();

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ---------- markup ----------
const ICONS: [id: string, icon: string, label: string][] = [
  ["status", "📊", "Status"],
  ["feed", "🍙", "Feed"],
  ["train", "⚔️", "Train"],
  ["play", "🎴", "Play"],
  ["clean", "🫧", "Clean"],
  ["lights", "💡", "Lights"],
  ["heal", "💉", "Heal"],
  ["talk", "💬", "Talk"],
];
const iconBtn = ([id, icon, label]: (typeof ICONS)[number]) => `<button class="ico" id="ico-${id}" aria-label="${label}" title="${label}">${icon}</button>`;

document.getElementById("app")!.innerHTML = `
<div class="device" id="device">
  <div class="brand">MYTHBOND</div>
  <div class="bezel">
    <div class="call" id="call" aria-label="Needs attention">!</div>
    <div class="icons">${ICONS.slice(0, 4).map(iconBtn).join("")}</div>
    <div class="screen" id="screen">
      <div class="stage" id="stage">
        <div class="floor"></div>
        <div class="mess" id="mess"></div>
        <div class="pet" id="pet"><div class="pet-need" id="pet-need" hidden></div><img class="pet-img" id="pet-img" alt="" draggable="false" /></div>
        <div class="zzz" id="zzz" hidden><span>z</span><span>Z</span><span>z</span></div>
        <div class="fx" id="fx"></div>
        <div class="bubble" id="bubble" hidden></div>
        <div class="desk-menu" id="desk-menu" hidden></div>
      </div>
      <div class="lights" id="lights"></div>
      <div class="panel" id="panel" hidden></div>
      <div class="flash" id="flash"></div>
    </div>
    <div class="icons">${ICONS.slice(4).map(iconBtn).join("")}</div>
  </div>
  <div class="btns">
    <button class="vbtn" id="btn-a" aria-label="A: select">A</button>
    <button class="vbtn" id="btn-b" aria-label="B: confirm">B</button>
    <button class="vbtn" id="btn-c" aria-label="C: cancel">C</button>
  </div>
  <div class="pills">
    <button class="pill" id="pill-skin">Skin</button>
    <button class="pill" id="pill-desk">Desktop</button>
    <button class="pill" id="pill-menu">Menu</button>
  </div>
</div>
<div class="desk" id="desk" hidden><p class="desk-hint" id="desk-hint">Home-screen mode preview. Tap her for care; 📟 returns to the device.<br/>In the Android app she walks along your phone's home screen.</p></div>
<div class="modal" id="modal" hidden></div>`;

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const stageEl = $("stage");
const petEl = $("pet");
const petImg = $<HTMLImageElement>("pet-img");

// ---------- pet presentation ----------
let busy = false; // an action animation is playing
let expr: Expr | null = null; // expression override during animations
let x = 50; // pet position, % of stage width
let facing = 1;
let desk = false;
let shownSrc = "";

function baseExpr(): Expr {
  const pet = save.pet!;
  if (pet.asleep) return "sleep";
  if (pet.sick || pet.mood < 30 || pet.fullness < 25) return "sad";
  return "idle";
}
function drawPet(src?: string) {
  const pet = save.pet;
  if (!pet) return;
  const next = src ?? artUrl(formOf(pet), expr ?? baseExpr());
  if (next !== shownSrc) petImg.src = shownSrc = next;
  petEl.classList.toggle("small", stageOf(pet) < 2);
  petEl.classList.toggle("charm", stageOf(pet) === 0);
  petEl.classList.toggle("pixel", isSprite(formOf(pet)));
  fitPet();
}
// Pixel sprites look best at whole-number scales; pick the largest that fits the stage.
function fitPet() {
  const pet = save.pet;
  if (!pet) return;
  const small = stageOf(pet) < 2;
  const unit = small ? 64 : 160;
  const room = stageEl.clientHeight * (small ? 0.5 : 0.95) - (desk && !isOverlay ? 0 : 4);
  if (room <= 0) return;
  let scale = Math.floor(room / unit);
  if (scale < 1 || scale * unit < room * 0.72) scale = Math.max(0.5, Math.floor((room / unit) * 4) / 4);
  if (desk && !isOverlay) scale = small ? 1.5 : 1.5;
  petEl.style.height = `${Math.round(unit * scale)}px`;
}
window.addEventListener("resize", fitPet);
function setExpr(e: Expr | null) {
  expr = e;
  drawPet();
}
function place() {
  petEl.style.left = `${x}%`;
  petImg.style.transform = `scaleX(${facing})`;
  const b = $("bubble");
  b.style.left = `${clamp(x, 28, 72)}%`;
  $("desk-menu").style.left = `${clamp(x, 18, 82)}%`;
}
async function hop(times = 1) {
  for (let i = 0; i < times; i++) {
    petEl.classList.remove("hop");
    void petEl.offsetWidth;
    petEl.classList.add("hop");
    await wait(380);
  }
  petEl.classList.remove("hop");
}
function addFx(html: string, left?: number): HTMLElement {
  const holder = document.createElement("div");
  holder.innerHTML = html.trim();
  const el = holder.firstElementChild as HTMLElement;
  if (left !== undefined) el.style.left = `${left}%`;
  $("fx").append(el);
  return el;
}

let bubbleTimer = 0;
function say(text: string, ms = 3200) {
  if (!text) return;
  const b = $("bubble");
  b.textContent = text;
  b.hidden = false;
  expand();
  clearTimeout(bubbleTimer);
  bubbleTimer = window.setTimeout(() => ((b.hidden = true), expand()), ms);
}

async function run(fn: () => Promise<void>) {
  if (busy) return;
  busy = true;
  try {
    await fn();
  } finally {
    busy = false;
    setExpr(null);
    store();
    render();
  }
}

// ---------- animations ----------
async function celebrate() {
  setExpr("happy");
  await hop();
  facing = -facing;
  place();
  await hop();
  facing = -facing;
  place();
  await wait(250);
}
async function refuse() {
  setExpr("sad");
  for (let i = 0; i < 4; i++) {
    facing = -facing;
    place();
    await wait(170);
  }
}

async function animEat(kind: "meal" | "treat") {
  const r = act(save, kind);
  if (!r.ok) {
    say(r.message);
    return refuse();
  }
  const fx = x > 60 ? x - 22 : x + 22;
  facing = fx > x ? 1 : -1;
  place();
  const food = addFx(`<span class="item food">${kind === "meal" ? "🍙" : "🍰"}</span>`, fx);
  food.dataset.side = facing > 0 ? "l" : "r";
  for (let i = 1; i <= 3; i++) {
    setExpr("eat");
    await wait(300);
    setExpr("idle");
    food.dataset.bite = String(i);
    await wait(300);
  }
  food.remove();
  say(r.message, 2000);
  await celebrate();
}

async function animClean() {
  const before = save.pet!.mess;
  const r = act(save, "clean");
  if (!r.ok) {
    say(r.message);
    return refuse();
  }
  $("mess").textContent = "🍂".repeat(before);
  const wave = addFx(`<div class="wave"></div>`);
  await wait(650);
  $("mess").textContent = "";
  await wait(500);
  wave.remove();
  say(r.message, 2000);
  await celebrate();
}

async function animLights() {
  const pet = save.pet!;
  const wasAsleep = pet.asleep;
  const r = act(save, "sleep");
  if (!r.ok) {
    say(r.message);
    return refuse();
  }
  if (!wasAsleep) {
    setExpr("sleep");
    render();
    await wait(700);
  } else {
    render();
    setExpr(pet.mood < 40 ? "sad" : "happy");
    say(r.message, 2000);
    await hop();
  }
}

async function animHeal() {
  const r = act(save, "heal");
  if (!r.ok) {
    say(r.message);
    return refuse();
  }
  setExpr("sad");
  const shot = addFx(`<span class="item syringe">💉</span>`, clamp(x + 14, 10, 90));
  await wait(900);
  shot.remove();
  for (let i = 0; i < 3; i++) addFx(`<span class="spark" style="--d:${i * 120}ms">✚</span>`, clamp(x - 12 + i * 12, 5, 95));
  await wait(600);
  $("fx").querySelectorAll(".spark").forEach((s) => s.remove());
  say(r.message, 2200);
  await celebrate();
}

async function animTalk() {
  const pet = save.pet!;
  if (pet.asleep) return say("Zzz...", 1500);
  act(save, "talk");
  say(pickLine(pet.line, stageOf(pet), toneOf(pet)), 4000);
  if (toneOf(pet) === "happy" || toneOf(pet) === "neutral") {
    setExpr("happy");
    await hop();
  } else await wait(500);
}

async function animShoot(hits: number, msg: string) {
  x = 24;
  facing = 1;
  place();
  const target = addFx(`<span class="item target">🪵</span>`, 82);
  for (let i = 0; i < 3; i++) {
    setExpr("happy");
    const hit = i < hits;
    const ball = addFx(`<span class="ball"></span>`, x + 10);
    await wait(30);
    ball.classList.add(hit ? "go" : "miss");
    await wait(460);
    ball.remove();
    setExpr("idle");
    if (hit) {
      target.classList.remove("shake");
      void target.offsetWidth;
      target.classList.add("shake");
      const boom = addFx(`<span class="item boom">💥</span>`, 80);
      await wait(260);
      boom.remove();
    } else await wait(260);
  }
  target.remove();
  say(msg, 2400);
  if (hits >= 2) await celebrate();
  else await refuse();
}

async function animEvolve(from: Form, to: Form) {
  closePanel();
  x = 50;
  place();
  const a = artUrl(from);
  const b = artUrl(to);
  const flash = $("flash");
  for (let i = 0; i < 10; i++) {
    drawPet(i % 2 ? b : a);
    flash.classList.toggle("on", i % 2 === 0);
    await wait(260 - i * 16);
  }
  flash.classList.remove("on");
  setExpr("happy");
  for (let i = 0; i < 6; i++) addFx(`<span class="spark star" style="--d:${i * 90}ms">✦</span>`, 14 + i * 14);
  await hop(2);
  $("fx").querySelectorAll(".spark").forEach((s) => s.remove());
  const label = to.stage === 1 ? "AWAKENED" : to.stage === 3 ? "ASCENDED" : "EVOLVED";
  await showNotice(`<p class="ptitle">${label}!</p><p class="pbig">${to.name}</p><p>${to.title}</p><p class="psmall">${to.blurb}</p>`);
}

// ---------- in-screen panels (driven by A / B / C or taps) ----------
interface Panel {
  a?(): void;
  b?(): void;
  c?(): void;
}
let panel: Panel | null = null;
function openPanel(html: string, handlers: Panel) {
  if (desk) setDesk(false);
  const el = $("panel");
  el.innerHTML = html;
  el.hidden = false;
  panel = handlers;
}
function closePanel() {
  $("panel").hidden = true;
  $("panel").innerHTML = "";
  panel = null;
}
function showNotice(html: string): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      closePanel();
      resolve();
    };
    openPanel(`<div class="notice">${html}<p class="hint">B ▸ OK</p></div>`, { b: done, c: done });
    $("panel").onclick = done;
  });
}
function menuList(title: string, items: string[], pick: (i: number) => void) {
  let cur = 0;
  const draw = () => {
    $("panel").innerHTML = `<p class="ptitle">${title}</p>` + items.map((t, i) => `<button class="opt ${i === cur ? "on" : ""}" data-i="${i}">${i === cur ? "▶" : "&nbsp;"} ${t}</button>`).join("") + `<p class="hint">A ▸ move · B ▸ pick · C ▸ back</p>`;
    $("panel").querySelectorAll<HTMLButtonElement>(".opt").forEach((o) => (o.onclick = (e) => (e.stopPropagation(), choose(Number(o.dataset.i)))));
  };
  const choose = (i: number) => {
    closePanel();
    pick(i);
  };
  openPanel("", { a: () => ((cur = (cur + 1) % items.length), draw()), b: () => choose(cur), c: closePanel });
  $("panel").onclick = null;
  draw();
}

const hearts = (v: number) => {
  const n = Math.round(clamp(v, 0, 100) / 25);
  return `<span class="hearts">${"♥".repeat(n)}<i>${"♥".repeat(4 - n)}</i></span>`;
};
function openStatus() {
  const pet = save.pet!;
  const form = formOf(pet);
  const stage = stageOf(pet);
  const mins = Math.floor(pet.ageMs / 60000);
  const p = stageProgress(pet);
  let next = stage === 3 ? "MAX" : `${Math.floor(p * 100)}%`;
  if (stage === 2 && p >= 1) next = `${Math.round(pet.bond + pet.power)}/${ASCEND_REQUIREMENT} ♥+⚔`;
  const pages = [
    `<p class="pbig">${form.name}</p><p>${STAGE_NAMES[stage]} · ${form.title}</p><p>AGE ${Math.floor(mins / 60)}h ${mins % 60}m</p><p>MISTAKES ${pet.mistakes}</p>`,
    stage === 0
      ? `<p class="ptitle">SEALED</p><p>Tap the charm to warm it.</p><p>GROWTH ${next}</p>`
      : `<div class="row"><span>FOOD</span>${hearts(pet.fullness)}</div><div class="row"><span>MOOD</span>${hearts(pet.mood)}</div><div class="row"><span>ENERGY</span>${hearts(pet.energy)}</div><div class="row"><span>CLEAN</span>${hearts(pet.clean)}</div>`,
    `<div class="row"><span>BOND</span><b>${Math.round(pet.bond)}</b></div><div class="row"><span>POWER</span><b>${Math.round(pet.power)}</b></div><div class="row"><span>NEXT</span><b>${next}</b></div><div class="meter"><i style="width:${p * 100}%"></i></div>`,
  ];
  let page = 0;
  const draw = () => ($("panel").innerHTML = `<div class="status">${pages[page]}<p class="hint">${page + 1}/${pages.length} · A ▸ next · C ▸ back</p></div>`);
  const nextPage = () => (page + 1 < pages.length ? ((page += 1), draw()) : closePanel());
  openPanel("", { a: nextPage, b: nextPage, c: closePanel });
  $("panel").onclick = nextPage;
  draw();
}

function openFeed() {
  const line = LINES[save.pet!.line];
  menuList("FEED", ["🍙 Meal", `🍰 Treat (${line.favoriteTreat})`], (i) => run(() => animEat(i === 0 ? "meal" : "treat")));
}

// Find the star: three face-down cards, three rounds.
function openPlay() {
  let round = 0;
  let hits = 0;
  let cur = 1;
  let locked = false;
  let star = 0;
  const draw = (reveal = -1) => {
    $("panel").innerHTML =
      `<p class="ptitle">FIND THE STAR · ${round}/3</p><div class="cards">` +
      [0, 1, 2].map((i) => `<button class="pcard ${i === cur ? "on" : ""}" data-i="${i}">${reveal < 0 ? "?" : i === star ? "★" : "·"}</button>`).join("") +
      `</div><p class="hint">${reveal < 0 ? "A ▸ move · B ▸ pick" : reveal === star ? "Found it!" : "Not there..."}</p>`;
    $("panel").querySelectorAll<HTMLButtonElement>(".pcard").forEach((c) => (c.onclick = () => pick(Number(c.dataset.i))));
  };
  const nextRound = () => {
    if (round === 3) {
      closePanel();
      const msg = finishActivity(save.pet!, "play", hits / 3);
      run(async () => {
        say(msg, 2400);
        await celebrate();
        await celebrate();
      });
      return;
    }
    round++;
    star = Math.floor(Math.random() * 3);
    locked = false;
    draw();
  };
  const pick = (i: number) => {
    if (locked) return;
    locked = true;
    cur = i;
    if (i === star) hits++;
    draw(i);
    setTimeout(nextRound, 800);
  };
  openPanel("", { a: () => !locked && ((cur = (cur + 1) % 3), draw()), b: () => pick(cur), c: () => {} });
  $("panel").onclick = null;
  nextRound();
}

// Training: stop the marker in the bright zone, three strikes.
function openTrain() {
  let strikes = 0;
  let total = 0;
  let pos = 0;
  let alive = true;
  const t0 = performance.now();
  openPanel(`<p class="ptitle">TRAINING</p><p id="tr-msg">B ▸ strike in the zone</p><div class="timing"><div class="zone"></div><div class="marker" id="marker"></div></div><p class="hint" id="tr-n">0 / 3</p>`, {
    b: () => strike(),
    a: () => strike(),
    c: () => {},
  });
  $("panel").onclick = () => strike();
  const marker = $("marker");
  const loop = (t: number) => {
    if (!alive) return;
    const ph = ((t - t0) / 850) % 2;
    pos = ph < 1 ? ph : 2 - ph;
    marker.style.left = `${Math.round(pos * 16) * 6.25}%`; // stepped, LCD-like
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  const strike = () => {
    if (!alive) return;
    const score = Math.max(0, 1 - Math.abs(pos - 0.5) / 0.35);
    total += score;
    strikes++;
    $("tr-msg").textContent = score > 0.75 ? "PERFECT!" : score > 0.3 ? "GOOD" : "MISS";
    $("tr-n").textContent = `${strikes} / 3`;
    if (strikes < 3) return;
    alive = false;
    setTimeout(() => {
      closePanel();
      const s = total / 3;
      const msg = finishActivity(save.pet!, "train", s);
      const hits = s > 0.75 ? 3 : s > 0.45 ? 2 : s > 0.15 ? 1 : 0;
      run(() => animShoot(hits, msg));
    }, 500);
  };
}

// ---------- input ----------
let sel = -1; // highlighted icon
function doIcon(id: string) {
  const pet = save.pet;
  if (busy || !pet) return;
  if (id === "status") return openStatus();
  if (stageOf(pet) === 0) return say(busyReason(pet)!, 2200);
  switch (id) {
    case "feed":
      return pet.asleep ? say("Zzz...", 1500) : openFeed();
    case "play":
    case "train": {
      const reason = busyReason(pet, id === "play" ? PLAY_COST : TRAIN_COST);
      if (reason) return say(reason, 2200);
      return id === "play" ? openPlay() : openTrain();
    }
    case "clean":
      return run(animClean);
    case "lights":
      return run(animLights);
    case "heal":
      return run(animHeal);
    case "talk":
      return run(animTalk);
  }
}
function drawSel() {
  ICONS.forEach(([id], i) => $(`ico-${id}`).classList.toggle("sel", i === sel));
}
function press(btn: "a" | "b" | "c") {
  if (!$("modal").hidden) return;
  if (panel) return panel[btn]?.();
  if (busy) return;
  if (btn === "a") sel = (sel + 1) % ICONS.length;
  else if (btn === "b" && sel >= 0) doIcon(ICONS[sel][0]);
  else if (btn === "c") sel = -1;
  drawSel();
}
ICONS.forEach(([id], i) => ($(`ico-${id}`).onclick = () => ((sel = i), drawSel(), panel || doIcon(id))));
$("btn-a").onclick = () => press("a");
$("btn-b").onclick = () => press("b");
$("btn-c").onclick = () => press("c");
document.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (desk && k === "escape") return setDesk(false);
  if (docked && !panel && k === "escape" && !isOverlay) return setDocked(false);
  if (k === "a" || k === "arrowright" || k === "arrowdown") press("a");
  else if (k === "b" || k === "enter" || k === " ") press("b");
  else if (k === "c" || k === "escape" || k === "backspace") press("c");
  else return;
  e.preventDefault();
});

petEl.onclick = (e) => {
  e.stopPropagation();
  const pet = save.pet;
  if (!pet || busy) return;
  if (desk) return toggleDeskMenu();
  if (panel) return;
  if (stageOf(pet) === 0) {
    warm(pet);
    petEl.classList.remove("wiggle");
    void petEl.offsetWidth;
    petEl.classList.add("wiggle");
    return;
  }
  run(animTalk);
};

// ---------- shell: skins, menu, desktop mode ----------
function applySkin() {
  $("device").dataset.skin = save.skin;
}
$("pill-skin").onclick = () => {
  const i = SKINS.findIndex((s) => s.id === save.skin);
  save.skin = SKINS[(i + 1) % SKINS.length].id;
  applySkin();
  store();
  say(`Shell: ${SKINS[(i + 1) % SKINS.length].name}`, 1200);
};
$("pill-desk").onclick = () => {
  if (docked) return isOverlay ? overlay?.openApp() : setDocked(false);
  if (!android) return enterHome();
  store();
  if (!android.startOverlay()) say("Allow \"display over other apps\", then tap Desktop again.", 4000);
};
$("pill-menu").onclick = openMenu;

// ---------- home-screen styles: faded / solid device, or free roam ----------
let docked = false;
const DOCK_W = 230; // dp; the device keeps its 360:600 shape
function enterHome() {
  if (!save.pet || panel || busy) return;
  if (save.deskStyle === "roam") setDesk(true);
  else setDocked(true);
}
function applyDock() {
  const d = $("device");
  d.classList.toggle("faded", docked && save.deskStyle === "faded");
  d.style.setProperty("--fade-level", String(save.deskFade / 100));
}
function setDocked(on: boolean) {
  docked = on;
  document.body.classList.toggle("docked", on);
  applyDock();
  $("pill-desk").textContent = on ? "Return" : "Desktop";
  $("pill-menu").hidden = on;
  if (on && overlay) overlay.setWindow(DOCK_W, Math.round((DOCK_W * 600) / 360));
  if (on && !isOverlay) say(save.deskStyle === "faded" ? "Home-screen preview. Touch the shell to show it; Return goes back." : "Home-screen preview. Return goes back.", 3500);
  render();
}
let revealTimer = 0;
$("device").addEventListener("pointerdown", () => {
  if (!docked) return;
  $("device").classList.add("reveal");
  clearTimeout(revealTimer);
  revealTimer = window.setTimeout(() => $("device").classList.remove("reveal"), 4000);
});
// Drag the floating device around the home screen by its shell.
let drag: { x: number; y: number } | null = null;
$("device").addEventListener("pointerdown", (e) => {
  if (!docked || !overlay || (e.target as HTMLElement).closest("button, .screen")) return;
  drag = { x: e.screenX, y: e.screenY };
});
window.addEventListener("pointermove", (e) => {
  if (!drag || !overlay) return;
  const dx = e.screenX - drag.x;
  const dy = e.screenY - drag.y;
  if (Math.abs(dx) + Math.abs(dy) < 2) return;
  overlay.dragBy(dx, dy);
  drag = { x: e.screenX, y: e.screenY };
});
window.addEventListener("pointerup", () => (drag = null));

function setDesk(on: boolean) {
  if (isOverlay && !on) return overlay?.openApp();
  if (on && (!save.pet || panel || busy)) return;
  desk = on;
  closeDeskMenu();
  document.body.classList.toggle("desktop", on);
  (on ? $("desk") : $("screen")).prepend(stageEl);
  $("device").hidden = on;
  $("desk").hidden = !on;
  $("desk-hint").hidden = isOverlay;
  render();
}

const DESK_ACTIONS: [string, string][] = [
  ["feed-meal", "🍙"],
  ["feed-treat", "🍰"],
  ["clean", "🫧"],
  ["lights", "💡"],
  ["heal", "💉"],
  ["talk", "💬"],
  ["play", "🎴"],
  ["train", "⚔️"],
  ["device", "📟"],
];
function toggleDeskMenu() {
  const m = $("desk-menu");
  if (!m.hidden) return closeDeskMenu();
  m.innerHTML = DESK_ACTIONS.map(([id, icon]) => `<button data-id="${id}" aria-label="${id}">${icon}</button>`).join("");
  m.querySelectorAll<HTMLButtonElement>("button").forEach(
    (b) =>
      (b.onclick = (e) => {
        e.stopPropagation();
        const id = b.dataset.id!;
        closeDeskMenu();
        const pet = save.pet!;
        if (id === "device") return setDesk(false);
        if (id === "play" || id === "train") {
          setDesk(false);
          return doIcon(id);
        }
        if (stageOf(pet) === 0) return say(busyReason(pet)!, 2200);
        if (id.startsWith("feed")) return pet.asleep ? say("Zzz...", 1500) : run(() => animEat(id === "feed-meal" ? "meal" : "treat"));
        doIcon(id);
      }),
  );
  m.hidden = false;
  expand();
}
function closeDeskMenu() {
  $("desk-menu").hidden = true;
  expand();
}
// The overlay window stays pet-sized, and grows only while her menu or speech bubble is showing.
let expanded = false;
function expand() {
  const on = !$("desk-menu").hidden || !$("bubble").hidden;
  if (!overlay || !desk || on === expanded) return;
  expanded = on;
  overlay.setExpanded(on);
}
$("desk").addEventListener("click", () => closeDeskMenu());

// ---------- page-level modals ----------
function openModal(): HTMLElement {
  const m = $("modal");
  m.innerHTML = `<div class="card"></div>`;
  m.hidden = false;
  return m.firstElementChild as HTMLElement;
}
function closeModal() {
  $("modal").hidden = true;
  $("modal").innerHTML = "";
  render();
}
function btn(label: string, onclick: () => void, cls = "mbtn") {
  const b = document.createElement("button");
  b.className = cls;
  b.textContent = label;
  b.onclick = onclick;
  return b;
}

function openAdopt() {
  if (isOverlay) return overlay?.openApp();
  if (desk) setDesk(false);
  closePanel();
  const card = openModal();
  const gone = save.departed;
  card.innerHTML = `<h2>${gone ? "A new bond awaits" : "Choose your charm"}</h2><p class="sub">${gone ? `${gone} returned to the spirit realm. Another spirit is waiting.` : "Each charm holds a sleeping spirit. Care for her and she will awaken."}</p>`;
  const grid = document.createElement("div");
  grid.className = "adopt-grid";
  for (const line of Object.values(LINES)) {
    const b = btn("", () => {
      adopt(save, line.id as LineId);
      x = 50;
      store();
      closeModal();
      say("Tap the charm to warm it!", 3000);
    }, "adopt-opt");
    b.dataset.line = line.id;
    b.style.setProperty("--c1", line.colors[0]);
    b.style.setProperty("--c2", line.colors[1]);
    b.innerHTML = `<img src="${artUrl(line.forms.awakened, "happy")}" alt="" /><b>${line.name}</b><span>${line.tagline}</span>`;
    grid.append(b);
  }
  card.append(grid);
}

function openMenu() {
  const card = openModal();
  card.innerHTML = `<h2>Menu</h2>`;
  const mk = (title: string) => {
    const s = document.createElement("div");
    s.className = "msec";
    s.innerHTML = `<p class="mlabel">${title}</p>`;
    card.append(s);
    return s;
  };
  const skins = mk("Shell skin");
  const sw = document.createElement("div");
  sw.className = "swatches";
  for (const s of SKINS) {
    const b = btn(s.name, () => {
      save.skin = s.id;
      applySkin();
      store();
      openMenu();
    }, `swatch ${save.skin === s.id ? "on" : ""}`);
    b.dataset.skin = s.id;
    sw.append(b);
  }
  skins.append(sw);
  const speed = mk("Time speed (for testing)");
  const seg = document.createElement("div");
  seg.className = "seg";
  for (const v of [1, 10, 60]) seg.append(btn(`${v}×`, () => ((save.speed = v), store(), openMenu()), `segb ${save.speed === v ? "on" : ""}`));
  speed.append(seg);
  const home = mk("Home-screen style");
  const hs = document.createElement("div");
  hs.className = "seg";
  for (const [v, label] of [["faded", "Faded shell"], ["solid", "Solid shell"], ["roam", "Free roam"]] as const)
    hs.append(btn(label, () => ((save.deskStyle = v), store(), openMenu()), `segb ${save.deskStyle === v ? "on" : ""}`));
  home.append(hs);
  if (save.deskStyle === "faded") {
    const row = document.createElement("label");
    row.className = "slider";
    row.innerHTML = `<span>Shell opacity</span><input type="range" id="fade" min="10" max="90" step="5" value="${save.deskFade}" /><b id="fade-v">${save.deskFade}%</b>`;
    const input = row.querySelector("input")!;
    input.oninput = () => {
      save.deskFade = Number(input.value);
      $("fade-v").textContent = `${save.deskFade}%`;
      applyDock();
      store();
    };
    home.append(row);
  }
  const hint = document.createElement("p");
  hint.className = "mhint";
  hint.textContent =
    save.deskStyle === "faded"
      ? "The device stays on your home screen, see-through, with her fully visible. Touch it to bring the shell back."
      : save.deskStyle === "solid"
        ? "The whole device stays on your home screen."
        : "She walks along the bottom of your home screen on her own. Tap her for care.";
  home.append(hint);
  const more = mk("Companion");
  more.append(btn(`Spirit album · ${save.album.length}/${ALL_FORMS.length}`, openAlbum, "mbtn ghost"));
  if (save.pet) {
    const release = btn("Release companion", () => {
      release.replaceWith(
        btn("Tap again to confirm release", () => {
          save.pet = null;
          save.departed = null;
          store();
          openAdopt();
        }, "mbtn danger"),
      );
    }, "mbtn ghost");
    more.append(release);
  }
  card.append(btn("Close", closeModal));
}

function openAlbum() {
  const card = openModal();
  card.innerHTML = `<h2>Spirit album</h2><p class="sub">${save.album.length} of ${ALL_FORMS.length} forms discovered</p>`;
  const grid = document.createElement("div");
  grid.className = "album-grid";
  for (const form of ALL_FORMS) {
    const known = save.album.includes(form.id);
    const c = document.createElement("div");
    c.className = `cell ${known ? "" : "unknown"}`;
    c.innerHTML = known ? `<img src="${artUrl(form)}" alt="" /><b>${form.name}</b><span>${form.title}</span>` : `<div class="q">?</div><b>???</b><span>${STAGE_NAMES[form.stage]}</span>`;
    grid.append(c);
  }
  card.append(grid, btn("Back", openMenu));
}

// ---------- render + loop ----------
function render() {
  const pet = save.pet;
  if (!pet) {
    if ($("modal").hidden) openAdopt();
    return;
  }
  const line = LINES[pet.line];
  $("screen").style.setProperty("--c1", line.colors[0]);
  $("screen").style.setProperty("--c2", line.colors[1]);
  document.documentElement.style.setProperty("--accent", line.accent);
  const need = needKind(pet);
  $("call").classList.toggle("on", !!need);
  const needIcon = need === "meal" ? "feed" : need;
  ICONS.forEach(([id]) => $(`ico-${id}`).classList.toggle("attn", id === needIcon));
  $("pet-need").hidden = !need;
  $("pet-need").textContent = need ? ICONS.find(([id]) => id === needIcon)![1] : "";
  $("lights").classList.toggle("dark", pet.asleep);
  $("zzz").hidden = !pet.asleep;
  $("zzz").style.left = `${x}%`;
  if (!busy) {
    $("mess").textContent = "🍂".repeat(pet.mess);
    $("mess").classList.toggle("left", x > 60);
    drawPet();
  }
  place();
}

function wander() {
  petEl.classList.toggle("step");
  const pet = save.pet;
  if (busy || panel || !pet || stageOf(pet) === 0 || pet.asleep || !$("desk-menu").hidden) return;
  if (Math.random() < 0.6) {
    const dir = Math.random() < 0.5 ? -1 : 1;
    facing = dir;
    if (overlay && desk) overlay.moveBy(dir * 22); // the whole window walks along the home screen
    else x = desk ? clamp(x + dir * 3, 6, 94) : clamp(x + dir * 9, 24, 76);
    place();
    $("zzz").style.left = `${x}%`;
  }
}

const pending: GameEvent[] = [];
async function handleEvents() {
  if (busy || panel || !$("modal").hidden) return;
  const e = pending.shift();
  if (!e) return;
  if (e.type === "evolved") await run(() => animEvolve(e.from, e.to));
  else if (e.type === "sick") say("*achoo* ...she caught a cold.", 2600);
  else if (e.type === "departed") {
    pending.length = 0;
    openAdopt();
  }
}

function frame() {
  if (suspended) return;
  const now = Date.now();
  pending.push(...tick(save, now - lastTick));
  lastTick = save.lastSeen = now;
  render();
  handleEvents();
}

applySkin();
pending.push(...tick(save, Date.now() - save.lastSeen, true));
save.lastSeen = lastTick = Date.now();
render();
handleEvents();
setInterval(frame, 1000);
setInterval(wander, 650);
setInterval(() => suspended || store(), 5000);
document.addEventListener("visibilitychange", () => {
  if (!android) return document.hidden && store();
  if (document.hidden) {
    store();
    suspended = true; // the home-screen overlay may take over the save now
  } else {
    save = load(Date.now(), storage()); // pick up whatever happened on the home screen
    lastTick = Date.now();
    suspended = false;
    applySkin();
    render();
  }
});
if (isOverlay) {
  x = 50;
  if (save.deskStyle === "roam") setDesk(true);
  else setDocked(true);
}
