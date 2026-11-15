# Mythbond — game design

## Pitch

A pocket virtual pet in the tradition of 90s handheld V-pets: one companion, real-time needs,
care quality deciding what she grows into. The cast is original: fantasy heroines with animal
or mythic traits, drawn in anime illustration style.

## Core loop

1. **Check in** — needs drop in real time (including a capped amount while the app is closed).
2. **Care** — feed, treat, tidy, sleep, heal, talk.
3. **Activities** — two mini-games: *Find the star* (raises Bond) and *Training* (raises Power).
4. **Grow** — when the stage timer fills she changes form; Bond vs Power picks the final branch.
5. **Collect** — every form seen is recorded in the album; a new charm starts another line.

## Growth stages

| Stage | What it is | Lasts | Leaves when |
|---|---|---|---|
| Charm | A sealed object (lantern charm, gem, seed, bud). No needs. | 2 min | Timer fills; tapping it warms it faster |
| Familiar | A small animal spirit (fox kit, bat, fawn, moth) | 20 min | Timer fills |
| Awakened | The adult heroine | 60 min+ | Timer fills **and** Bond + Power ≥ 60 |
| Ascended | Final form, two variants | — | — |

All humanoid forms are adults. The early stages are an object and an animal, so there is no
child version of any heroine.

**Branching:** at ascension, Bond ≥ Power gives the *Grace* form; otherwise the *Valor* form.

## Cast

| Line | Charm | Familiar | Awakened | Grace | Valor |
|---|---|---|---|---|---|
| Kitsune | Foxfire Charm | Emberkit | Akari, shrine maiden | Nine-Tail Celestial | Stormfang Ronin |
| Succubus | Obsidian Sigil | Impwing | Lilith, enchantress | Queen of Dusk | Nightblade |
| Elf | Moonleaf Seed | Glimmerfawn | Sylwen, ranger | Moon Priestess | Wildwood Warden |
| Pixie | Dewdrop Bud | Glowmoth | Faye, flower court | Aurora Queen | Thornwing |

Personalities: Akari is playful and teasing; Lilith is proud and flirty but soft underneath;
Sylwen is calm and devoted; Faye is hyperactive and mischievous. Each has her own dialogue for
happy, neutral, sad, hungry, sleepy and sick moods.

## Needs and stats

| Stat | Drops per hour | Restored by |
|---|---|---|
| Food | 14 (half while asleep) | Feed +30, Treat +8 |
| Mood | 9, faster when hungry, dirty or sick | Treat +15, Play +10–25, Talk +3 |
| Energy | 7 | Sleep +30/h; she nods off at 0 and wakes at 100 |
| Clean | 6, faster with clutter | Clean → 100 |
| Bond | — | Play, Talk, Treat, Clean, Heal |
| Power | — | Training +2–6 |

- **Clutter:** a leaf pile appears every 90 min awake (max 3). Three piles or very low Clean can make her sick.
- **Sick:** blocks play and training, drains Mood. Medicine cures it.
- **Care mistakes:** a need left at zero for 20 min counts once and costs 5 Bond.
- **Neglect:** Food and Mood both at zero for 12 h while the app is open → she returns to the
  spirit realm and you pick a new charm. The album is kept. Nothing dies.
- **Away time:** at most 8 h is simulated, needs never drop below 10, and she cannot leave or fall sick.

## Screens

- **Home** — name and stage, the room with the companion, need chip, speech bubble, four need
  gauges, Bond / Power / age, growth bar, and a 4×2 care pad.
- **Choose your charm**, **Evolution reveal**, **Album**, **Settings**, and the two mini-games are overlays.

## Next steps

- Real character art for all 20 forms (prompts in `ART_PROMPTS.md`), plus mood expressions.
- More lines: catgirl, wolf, dragon, mermaid, angel.
- Battles against wild spirits using Power; outfits and room decoration bought with coins.
- Android notifications when she is hungry or ready to evolve; sound and music.
