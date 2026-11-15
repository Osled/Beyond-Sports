// Pure game rules: no DOM, no timers. Time is passed in so the rules are testable.
import { LINES, FORM_BY_ID, type Form, type LineId, type Stage, type Tone } from "./data";

export const MIN = 60_000;
export const HOUR = 60 * MIN;

/** Game-time each stage lasts before the companion can evolve. */
export const STAGE_DURATION: Record<number, number> = { 0: 2 * MIN, 1: 20 * MIN, 2: 60 * MIN };
/** Bond + power needed before an Awakened companion ascends. */
export const ASCEND_REQUIREMENT = 60;
const OFFLINE_CAP = 8 * HOUR;
const NEGLECT_LIMIT = 12 * HOUR;
const MISTAKE_DELAY = 20 * MIN;

// Stat change per game-hour.
const DECAY = { fullness: 14, mood: 9, energy: 7, clean: 6 };
const SLEEP_GAIN = 30;
const MESS_INTERVAL = 90 * MIN;

export interface Pet {
  line: LineId;
  formId: string;
  fullness: number;
  mood: number;
  energy: number;
  clean: number;
  bond: number;
  power: number;
  mistakes: number;
  mess: number; // 0-3 bits of clutter in the room
  asleep: boolean;
  sick: boolean;
  ageMs: number; // total game-time alive
  stageMs: number; // game-time in the current stage
  messMs: number;
  lowMs: number; // how long some need has been at zero
  mistakeFlag: boolean;
  neglectMs: number;
  talkCooldownMs: number;
}

export interface Save {
  pet: Pet | null;
  album: string[];
  speed: number; // time multiplier (1 = real time)
  lastSeen: number; // wall-clock ms
  departed: string | null; // name of a companion who left from neglect
  skin: string; // device shell skin
  deskStyle: "faded" | "solid" | "roam"; // how she appears on the home screen
  deskFade: number; // shell opacity (%) for the faded style
}

export type GameEvent =
  | { type: "evolved"; from: Form; to: Form }
  | { type: "departed"; name: string }
  | { type: "sick" };

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

export function newSave(now: number): Save {
  return { pet: null, album: [], speed: 1, lastSeen: now, departed: null, skin: "sakura", deskStyle: "faded", deskFade: 35 };
}

export function adopt(save: Save, line: LineId): void {
  const form = LINES[line].forms.seed;
  save.pet = {
    line,
    formId: form.id,
    fullness: 70,
    mood: 70,
    energy: 80,
    clean: 100,
    bond: 0,
    power: 0,
    mistakes: 0,
    mess: 0,
    asleep: false,
    sick: false,
    ageMs: 0,
    stageMs: 0,
    messMs: 0,
    lowMs: 0,
    mistakeFlag: false,
    neglectMs: 0,
    talkCooldownMs: 0,
  };
  save.departed = null;
  discover(save, form.id);
}

function discover(save: Save, id: string) {
  if (!save.album.includes(id)) save.album.push(id);
}

export const formOf = (pet: Pet): Form => FORM_BY_ID[pet.formId];
export const stageOf = (pet: Pet): Stage => formOf(pet).stage;

/** Which form comes next, or null if she is fully ascended or not ready yet. */
export function nextForm(pet: Pet): Form | null {
  const forms = LINES[pet.line].forms;
  const stage = stageOf(pet);
  if (stage === 3 || pet.stageMs < STAGE_DURATION[stage]) return null;
  if (stage === 0) return forms.seed.id === pet.formId ? forms.familiar : null;
  if (stage === 1) return forms.awakened;
  if (pet.bond + pet.power < ASCEND_REQUIREMENT) return null;
  return pet.bond >= pet.power ? forms.grace : forms.valor;
}

/**
 * Advance the simulation by `realMs` of wall-clock time.
 * `offline` softens the rules for time spent with the app closed.
 */
export function tick(save: Save, realMs: number, offline = false): GameEvent[] {
  const events: GameEvent[] = [];
  const pet = save.pet;
  if (!pet || realMs <= 0) return events;
  let dt = realMs * save.speed;
  if (offline) dt = Math.min(dt, OFFLINE_CAP);

  // Step in slices so long gaps evolve and decay in the right order.
  while (dt > 0 && save.pet) {
    const step = Math.min(dt, 5 * MIN);
    dt -= step;
    stepPet(save, pet, step, offline, events);
  }
  return events;
}

function stepPet(save: Save, pet: Pet, dt: number, offline: boolean, events: GameEvent[]) {
  const h = dt / HOUR;
  pet.ageMs += dt;
  pet.stageMs += dt;
  pet.talkCooldownMs = Math.max(0, pet.talkCooldownMs - dt);

  if (stageOf(pet) > 0) {
    const floor = offline ? 10 : 0; // she looks after herself a little while you're away
    const dirty = 1 + pet.mess * 0.5;
    pet.fullness = Math.max(Math.min(pet.fullness, floor), pet.fullness - DECAY.fullness * h * (pet.asleep ? 0.5 : 1));
    pet.clean = Math.max(Math.min(pet.clean, floor), pet.clean - DECAY.clean * h * dirty);
    let moodLoss = DECAY.mood * (pet.asleep ? 0.3 : 1);
    if (pet.sick) moodLoss += 10;
    if (pet.fullness < 20) moodLoss += 6;
    if (pet.clean < 20) moodLoss += 4;
    pet.mood = Math.max(Math.min(pet.mood, floor), pet.mood - moodLoss * h);

    if (pet.asleep) {
      pet.energy = clamp(pet.energy + SLEEP_GAIN * h);
      if (pet.energy >= 100) pet.asleep = false; // wakes up rested
    } else {
      pet.energy = clamp(pet.energy - DECAY.energy * h);
      if (pet.energy <= 0) pet.asleep = true; // nods off on her own
      pet.messMs += dt;
      if (pet.messMs >= MESS_INTERVAL) {
        pet.messMs = 0;
        pet.mess = Math.min(3, pet.mess + 1);
      }
    }

    if (!pet.sick && !offline && (pet.clean <= 10 || pet.mess >= 3) && Math.random() < h * 1.5) {
      pet.sick = true;
      events.push({ type: "sick" });
    }

    // Care mistakes: a need left at zero for too long counts once per incident.
    const atZero = pet.fullness <= 0 || pet.mood <= 0 || pet.clean <= 0;
    if (atZero) {
      pet.lowMs += dt;
      if (pet.lowMs >= MISTAKE_DELAY && !pet.mistakeFlag) {
        pet.mistakeFlag = true;
        pet.mistakes++;
        pet.bond = clamp(pet.bond - 5);
      }
    } else {
      pet.lowMs = 0;
      pet.mistakeFlag = false;
    }

    // Long neglect: she returns to the spirit realm (no death, but the run ends).
    if (pet.fullness <= 0 && pet.mood <= 0) {
      pet.neglectMs += dt;
      if (pet.neglectMs >= NEGLECT_LIMIT) {
        save.departed = formOf(pet).name;
        save.pet = null;
        events.push({ type: "departed", name: save.departed });
        return;
      }
    } else pet.neglectMs = 0;
  }

  const next = nextForm(pet);
  if (next) {
    const from = formOf(pet);
    pet.formId = next.id;
    pet.stageMs = 0;
    pet.mood = clamp(pet.mood + 20);
    pet.energy = clamp(pet.energy + 30);
    pet.asleep = false;
    discover(save, next.id);
    events.push({ type: "evolved", from, to: next });
  }
}

/** Warm the charm: tapping the seed speeds up its awakening. */
export function warm(pet: Pet): void {
  if (stageOf(pet) === 0) pet.stageMs += 5_000;
}

export type ActionId = "meal" | "treat" | "clean" | "sleep" | "heal" | "talk";
export interface ActionResult {
  ok: boolean;
  message: string;
}
const ok = (message: string): ActionResult => ({ ok: true, message });
const no = (message: string): ActionResult => ({ ok: false, message });

/** Why an activity can't start right now, or null if it can. */
export function busyReason(pet: Pet, energyCost = 0): string | null {
  if (stageOf(pet) === 0) return "The charm hasn't awakened yet. Tap it to warm it.";
  if (pet.asleep) return "Shh, she's asleep.";
  if (pet.sick) return "She's not feeling well. Give her medicine first.";
  if (pet.energy < energyCost) return "She's too tired for that.";
  return null;
}

export function act(save: Save, action: ActionId): ActionResult {
  const pet = save.pet;
  if (!pet) return no("No companion.");
  if (stageOf(pet) === 0) return no(busyReason(pet)!);
  const line = LINES[pet.line];

  switch (action) {
    case "sleep":
      if (pet.asleep) {
        pet.asleep = false;
        if (pet.energy < 50) {
          pet.mood = clamp(pet.mood - 8);
          return ok("You woke her early. She's a bit grumpy.");
        }
        return ok("Good morning!");
      }
      if (pet.energy > 85) return no("She isn't sleepy yet.");
      pet.asleep = true;
      return ok("Lights out. Sweet dreams.");
    case "heal":
      if (!pet.sick) return no("She's perfectly healthy.");
      pet.sick = false;
      pet.mood = clamp(pet.mood - 5);
      pet.bond = clamp(pet.bond + 2);
      return ok("Bitter medicine... but she feels better.");
  }
  if (pet.asleep) return no("Shh, she's asleep.");

  switch (action) {
    case "meal":
      if (pet.fullness >= 95) {
        pet.mood = clamp(pet.mood - 3);
        return no("She's full and pushes the plate away.");
      }
      pet.fullness = clamp(pet.fullness + 30);
      return ok("A hearty meal. Delicious!");
    case "treat":
      if (pet.sick) return no("No sweets while she's sick.");
      pet.fullness = clamp(pet.fullness + 8);
      pet.mood = clamp(pet.mood + 15);
      pet.clean = clamp(pet.clean - 4);
      pet.bond = clamp(pet.bond + 1);
      return ok(`She loves ${line.favoriteTreat}!`);
    case "clean":
      if (pet.clean >= 95 && pet.mess === 0) return no("Everything is already spotless.");
      pet.clean = 100;
      pet.mess = 0;
      pet.messMs = 0;
      pet.bond = clamp(pet.bond + 1);
      return ok("Fresh and sparkling!");
    case "talk": {
      if (pet.talkCooldownMs > 0) return ok("");
      pet.talkCooldownMs = 30_000;
      pet.bond = clamp(pet.bond + 1);
      pet.mood = clamp(pet.mood + 3);
      return ok("");
    }
  }
  return no("");
}

/** Apply a finished mini-game. `score` is 0..1. */
export function finishActivity(pet: Pet, kind: "play" | "train", score: number): string {
  const s = clamp(score, 0, 1);
  if (kind === "play") {
    pet.mood = clamp(pet.mood + 10 + 15 * s);
    pet.bond = clamp(pet.bond + 2 + Math.round(3 * s));
    pet.energy = clamp(pet.energy - 10);
    pet.fullness = clamp(pet.fullness - 4);
    return s >= 0.67 ? "She had a wonderful time!" : s > 0 ? "That was fun!" : "She still enjoyed your company.";
  }
  const gain = 2 + Math.round(4 * s);
  pet.power = clamp(pet.power + gain);
  pet.energy = clamp(pet.energy - 15);
  pet.fullness = clamp(pet.fullness - 8);
  pet.clean = clamp(pet.clean - 5);
  return `Training complete. Power +${gain}.`;
}

export const PLAY_COST = 10;
export const TRAIN_COST = 15;

export function toneOf(pet: Pet): Tone {
  if (pet.sick) return "sick";
  if (pet.fullness < 25) return "hungry";
  if (pet.energy < 20) return "sleepy";
  if (pet.mood < 30) return "sad";
  return pet.mood >= 65 ? "happy" : "neutral";
}

export type NeedKind = "heal" | "meal" | "clean" | "sleep" | "talk";
/** The care action that would help most right now, if any. */
export function needKind(pet: Pet): NeedKind | null {
  if (stageOf(pet) === 0 || pet.asleep) return null;
  if (pet.sick) return "heal";
  if (pet.fullness < 25) return "meal";
  if (pet.mess >= 2 || pet.clean < 25) return "clean";
  if (pet.energy < 20) return "sleep";
  if (pet.mood < 30) return "talk";
  return null;
}

/** What she needs most right now, for the status line. */
export function needOf(pet: Pet): string | null {
  if (stageOf(pet) === 0) return "Tap the charm to warm it";
  if (pet.asleep) return "Sleeping";
  if (pet.sick) return "Needs medicine";
  if (pet.fullness < 25) return "Hungry";
  if (pet.mess >= 2 || pet.clean < 25) return "Room needs tidying";
  if (pet.energy < 20) return "Sleepy";
  if (pet.mood < 30) return "Lonely";
  return null;
}

/** 0..1 progress toward the next evolution timer. */
export function stageProgress(pet: Pet): number {
  const stage = stageOf(pet);
  return stage === 3 ? 1 : Math.min(1, pet.stageMs / STAGE_DURATION[stage]);
}

const KEY = "mythbond.save.v1";
export function load(now: number, storage: Pick<Storage, "getItem"> | null): Save {
  try {
    const raw = storage?.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Save;
      if (s && Array.isArray(s.album) && (!s.pet || FORM_BY_ID[s.pet.formId])) return { ...newSave(now), ...s };
    }
  } catch {
    /* corrupt save: start fresh */
  }
  return newSave(now);
}
export function persist(save: Save, storage: Pick<Storage, "setItem"> | null): void {
  try {
    storage?.setItem(KEY, JSON.stringify(save));
  } catch {
    /* storage unavailable */
  }
}
