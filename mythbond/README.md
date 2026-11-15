# Mythbond

A 2D virtual-pet game for Android (and the web). You adopt a sealed spirit charm, care for it
in real time, and it grows into a fantasy companion: a kitsune, succubus, elf or pixie.

- Design: [docs/DESIGN.md](docs/DESIGN.md)
- Character art prompts: [docs/ART_PROMPTS.md](docs/ART_PROMPTS.md)

## Run

```bash
npm install
npm run dev        # play in a browser
npm test           # game-rule tests
npm run build      # production build in dist/
```

Settings (the gear icon) has a time-speed switch (1× / 10× / 60×) for testing growth quickly.

## Android

The game is a web app wrapped with Capacitor. On a machine with Android Studio:

```bash
npm run android:add     # once: creates the android/ project
npm run android:sync    # build the web app and copy it into the Android project
npm run android:open    # open in Android Studio, then Run / Build APK
```

## Adding character art

Put a transparent PNG named after the form id (for example `kitsune_awakened.png`) in `src/art/`.
It is picked up automatically; forms without a file show a placeholder. Form ids are listed in
`docs/ART_PROMPTS.md`.

## Layout

- `src/data.ts` — companion lines, forms, dialogue
- `src/game.ts` — rules (needs, care, evolution, saving); no DOM, covered by `tests/`
- `src/main.ts`, `src/style.css` — screen, menus, mini-games
- `src/art.ts` — art lookup and placeholders
