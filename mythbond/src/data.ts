// Content tables: companion lines, their forms, and dialogue.
// Every humanoid form (stage 2+) is an adult; stages 0-1 are a charm and an animal familiar.

export type LineId = "kitsune" | "succubus" | "elf" | "pixie" | "seraph";
export type Stage = 0 | 1 | 2 | 3;

export interface Form {
  id: string; // also the art file name: public/art/<id>.png
  line: LineId;
  stage: Stage;
  name: string;
  title: string;
  blurb: string;
  glyph: string; // used by the placeholder art
}

export interface Line {
  id: LineId;
  name: string;
  tagline: string;
  colors: [string, string]; // scene gradient
  accent: string;
  favoriteTreat: string;
  forms: {
    seed: Form;
    familiar: Form;
    awakened: Form;
    grace: Form; // ascended, bond path
    valor: Form; // ascended, power path
  };
}

export const STAGE_NAMES = ["Charm", "Familiar", "Awakened", "Ascended"] as const;

function f(line: LineId, stage: Stage, key: string, name: string, title: string, blurb: string, glyph: string): Form {
  return { id: `${line}_${key}`, line, stage, name, title, blurb, glyph };
}

export const LINES: Record<LineId, Line> = {
  kitsune: {
    id: "kitsune",
    name: "Kitsune",
    tagline: "Playful fox spirit of the shrine",
    colors: ["#ffb347", "#7a1f3d"],
    accent: "#ff8a3d",
    favoriteTreat: "sweet tofu",
    forms: {
      seed: f("kitsune", 0, "seed", "Foxfire Charm", "Sealed spirit", "A paper charm that flickers with warm blue flame.", "🏮"),
      familiar: f("kitsune", 1, "familiar", "Emberkit", "Fox familiar", "A fluffy fox kit with a single glowing tail.", "🦊"),
      awakened: f("kitsune", 2, "awakened", "Akari", "Kitsune shrine maiden", "Three tails, a quick wit, and a fan she hides her grin behind.", "🦊"),
      grace: f("kitsune", 3, "grace", "Akari, Moonveil Priestess", "Ascended · Grace", "A golden fox mask, a ringing shakujo, and a spirit fox that guards her back.", "✨"),
      valor: f("kitsune", 3, "valor", "Akari, Stormfang", "Ascended · Valor", "Gold fox helm, armored bodysuit and a spear that cracks like thunder.", "⚡"),
    },
  },
  succubus: {
    id: "succubus",
    name: "Succubus",
    tagline: "Charming mischief from the dusk realm",
    colors: ["#c94b9b", "#22103f"],
    accent: "#ff5fa8",
    favoriteTreat: "dark chocolate",
    forms: {
      seed: f("succubus", 0, "seed", "Obsidian Sigil", "Sealed spirit", "A dark gem with a heartbeat of violet light.", "🔮"),
      familiar: f("succubus", 1, "familiar", "Impwing", "Bat familiar", "A round little bat with a heart-tipped tail.", "🦇"),
      awakened: f("succubus", 2, "awakened", "Lilith", "Succubus enchantress", "Small horns, big attitude, and a teasing smile.", "😈"),
      grace: f("succubus", 3, "grace", "Lilith, Queen of Dusk", "Ascended · Grace", "A crowned sovereign of twilight, regal and devoted.", "👑"),
      valor: f("succubus", 3, "valor", "Lilith, Shadebound", "Ascended · Valor", "Pale as moonlight, wrapped in chains, with a grinning shadow at her shoulder.", "⛓️"),
    },
  },
  elf: {
    id: "elf",
    name: "Elf",
    tagline: "Serene guardian of the moonlit woods",
    colors: ["#7fd8a6", "#12403a"],
    accent: "#5fe0a0",
    favoriteTreat: "honey berries",
    forms: {
      seed: f("elf", 0, "seed", "Moonleaf Seed", "Sealed spirit", "A silver seed that hums when held to the light.", "🌱"),
      familiar: f("elf", 1, "familiar", "Glimmerfawn", "Fawn familiar", "A tiny fawn with leaf-shaped ears and starry spots.", "🦌"),
      awakened: f("elf", 2, "awakened", "Sylwen", "Elven ranger", "Sharp ears, sharper aim, and a soft spot for you.", "🧝‍♀️"),
      grace: f("elf", 3, "grace", "Sylwen, Moon Priestess", "Ascended · Grace", "Keeper of the silver grove, wrapped in moonlight.", "🌙"),
      valor: f("elf", 3, "valor", "Sylwen, Duskhunter", "Ascended · Valor", "A masked hunter in a torn black coat, twin crossbows always loaded.", "🏹"),
    },
  },
  pixie: {
    id: "pixie",
    name: "Pixie",
    tagline: "Sparkling trickster of the flower court",
    colors: ["#9be7ff", "#4b2a8a"],
    accent: "#7fe3ff",
    favoriteTreat: "nectar candy",
    forms: {
      seed: f("pixie", 0, "seed", "Dewdrop Bud", "Sealed spirit", "A closed flower bud holding a single glowing drop.", "🌷"),
      familiar: f("pixie", 1, "familiar", "Glowmoth", "Moth familiar", "A fuzzy moth that leaves glitter wherever it lands.", "🦋"),
      awakened: f("pixie", 2, "awakened", "Faye", "Pixie of the flower court", "Gossamer wings and endless energy.", "🧚‍♀️"),
      grace: f("pixie", 3, "grace", "Faye, Aurora Queen", "Ascended · Grace", "Wings like the northern lights, crowned in blossoms.", "🌈"),
      valor: f("pixie", 3, "valor", "Faye, Thornwing", "Ascended · Valor", "A visored rose knight, fast as a hummingbird.", "🌹"),
    },
  },
  seraph: {
    id: "seraph",
    name: "Seraph",
    tagline: "Winged guardian of the starlit sky",
    colors: ["#ffe7a8", "#2a2a6e"],
    accent: "#ffd45c",
    favoriteTreat: "angel cake",
    forms: {
      seed: f("seraph", 0, "seed", "Halo Feather", "Sealed spirit", "A single white feather ringed by a faint golden halo.", "🪶"),
      familiar: f("seraph", 1, "familiar", "Dovelet", "Dove familiar", "A round little dove that glows when it coos.", "🕊️"),
      awakened: f("seraph", 2, "awakened", "Celes", "Halo knight", "A visored knight with one pair of wings and a very strict sense of duty.", "😇"),
      grace: f("seraph", 3, "grace", "Celes, Dawn Seraph", "Ascended · Grace", "Six white wings, gold armor and ribbons of light trailing behind her.", "🌅"),
      valor: f("seraph", 3, "valor", "Celes, Fallen Seraph", "Ascended · Valor", "Black-winged and silver-haired, she fell on purpose, to protect you.", "🌑"),
    },
  },
};

export const ALL_FORMS: Form[] = Object.values(LINES).flatMap((l) => Object.values(l.forms));
export const FORM_BY_ID: Record<string, Form> = Object.fromEntries(ALL_FORMS.map((x) => [x.id, x]));

type Tone = "happy" | "neutral" | "sad" | "hungry" | "sleepy" | "sick";

const FAMILIAR_LINES: Record<Tone, string[]> = {
  happy: ["♪ ~", "*happy wiggle*", "*nuzzles your hand*"],
  neutral: ["...?", "*tilts head*", "*sniffs around*"],
  sad: ["*droops*", "*quiet whimper*"],
  hungry: ["*tummy rumble*", "*stares at the snack bag*"],
  sleepy: ["*big yawn*", "*blinks slowly*"],
  sick: ["*sniffle*", "*shivers*"],
};

const TALK: Record<LineId, Record<Tone, string[]>> = {
  kitsune: {
    happy: ["Ehehe~ you came back! My tails were getting restless.", "Stay a while? The shrine is cosier with you here.", "I saved you the best seat. It's next to me, obviously."],
    neutral: ["Hm? Were you staring at my ears again?", "A fox's favour is earned, you know. You're doing fine."],
    sad: ["...You were gone a long time.", "Even foxfire gets cold when it's left alone."],
    hungry: ["My stomach just growled louder than a temple bell...", "Sweet tofu. Now. Please?"],
    sleepy: ["*yawn* ...five more minutes on your shoulder.", "My tails make a fine pillow. Just saying."],
    sick: ["My nose is all stuffy... don't look at me like this.", "A little medicine, and I'll be teasing you again."],
  },
  succubus: {
    happy: ["Back so soon? Careful, I might think you like me.", "You're my favourite mortal. Don't tell the others.", "Mm, that smile of yours is dangerous."],
    neutral: ["Entertain me. I'm terribly bored.", "You may admire the horns. From there."],
    sad: ["Tch. I wasn't waiting for you or anything.", "The dusk realm is quiet without you."],
    hungry: ["I require chocolate. This is not a request.", "Feed me before I get dramatic."],
    sleepy: ["Even queens of the night need beauty sleep...", "Dim the lights, would you?"],
    sick: ["Ugh... demons aren't supposed to catch colds.", "Stay close. For warmth. Obviously."],
  },
  elf: {
    happy: ["The forest feels brighter when you visit.", "I picked these flowers thinking of you.", "Walk with me under the moon tonight?"],
    neutral: ["Patience. The woods teach it well.", "I heard your footsteps from a mile away."],
    sad: ["The leaves have been falling while I waited.", "Did you forget the path to my grove?"],
    hungry: ["Even rangers can't hunt on an empty stomach.", "Some honey berries would be lovely..."],
    sleepy: ["The stars are out... sit with me until I drift off.", "*soft yawn* Forgive me."],
    sick: ["I should have known better than that cold stream...", "Your care is the best medicine."],
  },
  seraph: {
    happy: ["Your arrival has been noted. And... appreciated.", "I polished my visor for you. Don't laugh.", "Stay. That is an order. A gentle one."],
    neutral: ["I am on guard. Always.", "The stars are calm tonight."],
    sad: ["A guardian with no one to guard... is only armor.", "I kept watch. You didn't come."],
    hungry: ["Even the heavens run on angel cake.", "My halo is flickering. Food, please."],
    sleepy: ["Permission to rest my wings?", "*yawn* ...the night watch is long."],
    sick: ["My wings feel heavy... I'll be fine. Probably.", "Your care heals better than any blessing."],
  },
  pixie: {
    happy: ["You're here, you're here, you're HERE!", "I made your hair sparkle. You're welcome!", "Let's play! Or dance! Or both!"],
    neutral: ["Bet you can't catch me~", "Pssst. Wanna hear a flower secret?"],
    sad: ["My wings feel heavy today...", "No one to prank. It was awful."],
    hungry: ["Nectar candy! Nectar candy! Nectar candy!", "I'm so hungry I could eat a whole petal."],
    sleepy: ["Glitter... running... low... *yawn*", "Tuck me into a tulip?"],
    sick: ["Achoo! ...that one had sparkles in it.", "Even my glow is sniffly."],
  },
};

export function pickLine(line: LineId, stage: Stage, tone: Tone, rnd = Math.random): string {
  const pool = stage < 2 ? FAMILIAR_LINES[tone] : TALK[line][tone];
  return pool[Math.floor(rnd() * pool.length)];
}
export type { Tone };
