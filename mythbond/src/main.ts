import "./style.css";
import { ALL_FORMS, LINES, STAGE_NAMES, pickLine, type Form, type LineId } from "./data";
import { artUrl } from "./art";
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
  needOf,
  persist,
  stageOf,
  stageProgress,
  tick,
  toneOf,
  warm,
  type ActionId,
  type GameEvent,
  type Save,
} from "./game";

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const app = document.getElementById("app")!;
let save: Save = load(Date.now(), storage());
let lastTick = Date.now();
let bubbleTimer = 0;
let toastTimer = 0;

function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", html = ""): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html) el.innerHTML = html;
  return el;
}

// ---------- shell ----------
app.innerHTML = `
<div class="phone">
  <header class="top">
    <div class="who"><div class="name" id="name"></div><div class="title" id="title"></div></div>
    <button class="icon-btn" id="btn-album" aria-label="Album">📖</button>
    <button class="icon-btn" id="btn-settings" aria-label="Settings">⚙️</button>
  </header>
  <section class="scene" id="scene">
    <div class="chip" id="need" hidden></div>
    <div class="bubble" id="bubble" hidden></div>
    <button class="sprite-btn" id="sprite-btn" aria-label="Companion"><img id="sprite" alt="" draggable="false" /></button>
    <div class="zzz" id="zzz" hidden>💤</div>
    <div class="sick" id="sick" hidden>🤒</div>
    <div class="mess" id="mess"></div>
    <div class="toast" id="toast" hidden></div>
  </section>
  <section class="stats" id="stats"></section>
  <nav class="actions" id="actions"></nav>
</div>
<div class="modal" id="modal" hidden></div>`;

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const BARS: [key: "fullness" | "mood" | "energy" | "clean", label: string, icon: string][] = [
  ["fullness", "Food", "🍙"],
  ["mood", "Mood", "💗"],
  ["energy", "Energy", "⚡"],
  ["clean", "Clean", "🫧"],
];
$("stats").innerHTML =
  BARS.map(([k, label, icon]) => `<div class="bar" title="${label}"><span class="bar-ico">${icon}</span><div class="track"><div class="fill" id="bar-${k}"></div></div></div>`).join("") +
  `<div class="meta"><span id="bond">💞 Bond 0</span><span id="power">⚔️ Power 0</span><span id="age"></span></div>
   <div class="evo"><span id="evo-label"></span><div class="track"><div class="fill evo-fill" id="evo-fill"></div></div></div>`;

const ACTIONS: [id: string, icon: string, label: string][] = [
  ["meal", "🍙", "Feed"],
  ["treat", "🍰", "Treat"],
  ["play", "🎴", "Play"],
  ["train", "⚔️", "Train"],
  ["clean", "🫧", "Clean"],
  ["sleep", "🌙", "Sleep"],
  ["heal", "💊", "Heal"],
  ["talk", "💬", "Talk"],
];
for (const [id, icon, label] of ACTIONS) {
  const b = h("button", "act", `<span class="act-ico">${icon}</span><span>${label}</span>`);
  b.id = `act-${id}`;
  b.onclick = () => onAction(id);
  $("actions").append(b);
}
$("btn-album").onclick = openAlbum;
$("btn-settings").onclick = openSettings;
$("sprite-btn").onclick = () => {
  const pet = save.pet;
  if (!pet) return;
  if (stageOf(pet) === 0) {
    warm(pet);
    pulse();
    render();
  } else onAction("talk");
};

// ---------- feedback ----------
function toast(msg: string) {
  if (!msg) return;
  const t = $("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (t.hidden = true), 2200);
}
function say(msg: string) {
  const b = $("bubble");
  b.textContent = msg;
  b.hidden = false;
  clearTimeout(bubbleTimer);
  bubbleTimer = window.setTimeout(() => (b.hidden = true), 3500);
}
function pulse() {
  const s = $("sprite");
  s.classList.remove("pulse");
  void s.offsetWidth;
  s.classList.add("pulse");
}

// ---------- actions ----------
function onAction(id: string) {
  const pet = save.pet;
  if (!pet) return;
  if (id === "play" || id === "train") {
    const reason = busyReason(pet, id === "play" ? PLAY_COST : TRAIN_COST);
    if (reason) return toast(reason);
    return id === "play" ? openPlay() : openTrain();
  }
  const r = act(save, id as ActionId);
  if (id === "talk" && r.ok) {
    if (pet.asleep) return toast("Shh, she's asleep.");
    say(pickLine(pet.line, stageOf(pet), toneOf(pet)));
  } else toast(r.message);
  if (r.ok) pulse();
  render();
  persist(save, storage());
}

// ---------- render ----------
let shownForm = "";
function render() {
  const pet = save.pet;
  if (!pet) {
    if ($("modal").hidden) openAdopt();
    return;
  }
  const form = formOf(pet);
  const line = LINES[pet.line];
  const stage = stageOf(pet);
  $("name").textContent = form.name;
  $("title").textContent = `${STAGE_NAMES[stage]} · ${form.title}`;
  const scene = $("scene");
  scene.style.setProperty("--c1", line.colors[0]);
  scene.style.setProperty("--c2", line.colors[1]);
  document.documentElement.style.setProperty("--accent", line.accent);
  scene.classList.toggle("asleep", pet.asleep);
  if (shownForm !== form.id) {
    shownForm = form.id;
    $<HTMLImageElement>("sprite").src = artUrl(form);
  }
  $("sprite").classList.toggle("sad", !pet.asleep && (pet.mood < 30 || pet.sick));
  $("zzz").hidden = !pet.asleep;
  $("sick").hidden = !pet.sick;
  $("mess").textContent = "🍂".repeat(pet.mess);
  const need = needOf(pet);
  $("need").hidden = !need;
  $("need").textContent = need ?? "";

  for (const [k] of BARS) {
    const el = $(`bar-${k}`);
    const v = stage === 0 ? 0 : pet[k];
    el.style.width = `${v}%`;
    el.classList.toggle("low", stage > 0 && v < 25);
  }
  $("bond").textContent = `💞 Bond ${Math.round(pet.bond)}`;
  $("power").textContent = `⚔️ Power ${Math.round(pet.power)}`;
  const mins = Math.floor(pet.ageMs / 60000);
  $("age").textContent = mins >= 60 ? `Age ${Math.floor(mins / 60)}h ${mins % 60}m` : `Age ${mins}m`;

  const p = stageProgress(pet);
  let label = "Fully ascended";
  if (stage < 3) {
    label = `Next form ${Math.floor(p * 100)}%`;
    if (stage === 2 && p >= 1) label = `Needs Bond + Power ${Math.round(pet.bond + pet.power)}/${ASCEND_REQUIREMENT}`;
  }
  $("evo-label").textContent = label;
  $("evo-fill").style.width = `${p * 100}%`;

  $("act-sleep").lastElementChild!.textContent = pet.asleep ? "Wake" : "Sleep";
  $("act-heal").classList.toggle("attn", pet.sick);
  $("act-meal").classList.toggle("attn", stage > 0 && pet.fullness < 25);
  $("act-clean").classList.toggle("attn", stage > 0 && (pet.mess >= 2 || pet.clean < 25));
}

// ---------- modals ----------
function openModal(cls: string): HTMLElement {
  const m = $("modal");
  m.innerHTML = "";
  m.hidden = false;
  const card = h("div", `card ${cls}`);
  m.append(card);
  return card;
}
function closeModal() {
  $("modal").hidden = true;
  $("modal").innerHTML = "";
  render();
}
function button(label: string, onclick: () => void, cls = "btn"): HTMLButtonElement {
  const b = h("button", cls);
  b.textContent = label;
  b.onclick = onclick;
  return b;
}

function openAdopt() {
  const card = openModal("adopt");
  const gone = save.departed;
  card.append(
    h("h2", "", gone ? "A new bond awaits" : "Choose your charm"),
    h("p", "sub", gone ? `${gone} returned to the spirit realm. Another spirit is waiting for you.` : "Each charm holds a sleeping spirit. Care for her and she will awaken."),
  );
  const grid = h("div", "adopt-grid");
  for (const line of Object.values(LINES)) {
    const b = h("button", "adopt-opt", `<img src="${artUrl(line.forms.seed)}" alt="" /><b>${line.name}</b><span>${line.tagline}</span>`);
    b.style.setProperty("--c1", line.colors[0]);
    b.style.setProperty("--c2", line.colors[1]);
    b.dataset.line = line.id;
    b.onclick = () => {
      adopt(save, line.id as LineId);
      shownForm = "";
      persist(save, storage());
      closeModal();
      toast("Tap the charm to warm it!");
    };
    grid.append(b);
  }
  card.append(grid);
}

function showEvolution(from: Form, to: Form) {
  const card = openModal("evolve");
  const line = LINES[to.line];
  card.style.setProperty("--c1", line.colors[0]);
  card.style.setProperty("--c2", line.colors[1]);
  card.append(
    h("p", "eyebrow", to.stage === 1 ? "The charm awakens" : to.stage === 3 ? "Ascension" : "Awakening"),
    h("img", "evolve-art"),
    h("h2", "", to.name),
    h("p", "sub", `${from.name} became ${to.title.toLowerCase()}. ${to.blurb}`),
    button("Continue", closeModal),
  );
  card.querySelector<HTMLImageElement>("img")!.src = artUrl(to);
}

function openAlbum() {
  const card = openModal("album");
  card.append(h("h2", "", "Spirit album"), h("p", "sub", `${save.album.length} of ${ALL_FORMS.length} forms discovered`));
  const grid = h("div", "album-grid");
  for (const form of ALL_FORMS) {
    const known = save.album.includes(form.id);
    const cell = h("div", `cell ${known ? "" : "unknown"}`);
    cell.innerHTML = known ? `<img src="${artUrl(form)}" alt="" /><b>${form.name}</b><span>${form.title}</span>` : `<div class="q">?</div><b>???</b><span>${STAGE_NAMES[form.stage]}</span>`;
    grid.append(cell);
  }
  card.append(grid, button("Close", closeModal));
}

function openSettings() {
  const card = openModal("settings");
  card.append(h("h2", "", "Settings"), h("p", "sub", "Time speed makes needs and growth pass faster, for testing."));
  const row = h("div", "seg");
  for (const s of [1, 10, 60]) {
    const b = button(`${s}×`, () => {
      save.speed = s;
      persist(save, storage());
      openSettings();
    }, `seg-btn ${save.speed === s ? "on" : ""}`);
    row.append(b);
  }
  card.append(row);
  const release = button("Release companion", () => {
    release.replaceWith(
      button("Tap again to confirm release", () => {
        save.pet = null;
        save.departed = null;
        shownForm = "";
        persist(save, storage());
        openAdopt();
      }, "btn danger"),
    );
  }, "btn ghost");
  if (save.pet) card.append(release);
  card.append(button("Close", closeModal));
}

// Mini-game: find the hidden star, three rounds.
function openPlay() {
  const pet = save.pet!;
  const card = openModal("game");
  let round = 0;
  let hits = 0;
  const head = h("h2", "", "Find the star");
  const sub = h("p", "sub");
  const row = h("div", "cards");
  card.append(head, sub, row);
  const next = () => {
    if (round === 3) {
      const msg = finishActivity(pet, "play", hits / 3);
      persist(save, storage());
      closeModal();
      toast(msg);
      return;
    }
    round++;
    sub.textContent = `Round ${round} of 3 · ${hits} found`;
    row.innerHTML = "";
    const star = Math.floor(Math.random() * 3);
    for (let i = 0; i < 3; i++) {
      const c = button("🎴", () => {
        row.querySelectorAll("button").forEach((b, j) => {
          (b as HTMLButtonElement).disabled = true;
          b.textContent = j === star ? "⭐" : "🍃";
        });
        if (i === star) hits++;
        c.classList.add(i === star ? "hit" : "miss");
        sub.textContent = i === star ? "You found it!" : "Not there...";
        setTimeout(next, 800);
      }, "pick");
      row.append(c);
    }
  };
  next();
}

// Mini-game: stop the marker in the centre zone, three strikes.
function openTrain() {
  const pet = save.pet!;
  const card = openModal("game");
  const sub = h("p", "sub", "Strike when the marker is in the bright zone.");
  const track = h("div", "timing", `<div class="zone"></div><div class="marker" id="marker"></div>`);
  let strikes = 0;
  let total = 0;
  let pos = 0;
  let alive = true;
  const start = performance.now();
  const marker = track.querySelector<HTMLElement>(".marker")!;
  const loop = (t: number) => {
    if (!alive) return;
    const phase = ((t - start) / 900) % 2;
    pos = phase < 1 ? phase : 2 - phase;
    marker.style.left = `${pos * 100}%`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  const strike = button("Strike!", () => {
    const score = Math.max(0, 1 - Math.abs(pos - 0.5) / 0.35);
    total += score;
    strikes++;
    sub.textContent = `${score > 0.75 ? "Perfect!" : score > 0.3 ? "Good hit" : "Missed"} · ${strikes} of 3`;
    if (strikes === 3) {
      alive = false;
      strike.disabled = true;
      setTimeout(() => {
        const msg = finishActivity(pet, "train", total / 3);
        persist(save, storage());
        closeModal();
        toast(msg);
      }, 600);
    }
  }, "btn big");
  card.append(h("h2", "", "Training"), sub, track, strike);
}

// ---------- loop ----------
function handle(events: GameEvent[]) {
  for (const e of events) {
    if (e.type === "evolved") showEvolution(e.from, e.to);
    else if (e.type === "sick") toast("She caught a cold...");
    else if (e.type === "departed") openAdopt();
  }
}

function frame() {
  const now = Date.now();
  const events = tick(save, now - lastTick);
  lastTick = now;
  save.lastSeen = now;
  // Don't interrupt a mini-game with an evolution; it will fire once the modal closes.
  if (events.length) handle(events);
  render();
}

// Catch up on time spent away, then run.
handle(tick(save, Date.now() - save.lastSeen, true));
save.lastSeen = lastTick = Date.now();
render();
setInterval(frame, 1000);
setInterval(() => persist(save, storage()), 5000);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) persist(save, storage());
});
