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

Controls work like a classic V-pet: **A** moves between the eight icons, **B** confirms, **C** cancels.
You can also tap an icon directly, or tap her to talk. On a keyboard: A/B/C, arrows, Enter and Esc.
The **Menu** pill under the buttons has the shell skins, the album, and a time-speed switch
(1× / 10× / 60×) for testing growth quickly.

## Android

The game is a web app wrapped with Capacitor; the Android project is in `android/`.
On a machine with Android Studio:

```bash
npm run android:sync    # build the web app and copy it into the Android project
npm run android:open    # open in Android Studio, then Run / Build APK
```

### Home-screen mode

The **Desktop** pill sends her out onto your phone's home screen: the app goes to the background
and she walks along the bottom of the screen in a small floating window, over other apps. Tap her
for a care menu; 📟 (or opening the app) brings her back into the device. The first time, Android
asks you to allow "Display over other apps". While she's out, a quiet notification stays in the
status bar, as Android requires.

The native side is `android/app/src/main/java/com/osled/mythbond/` (`MainActivity` and
`PetOverlayService`). In a browser the same button shows a preview of this mode.

## Adding character art

Put a transparent PNG named after the form id (for example `kitsune_awakened.png`) in `src/art/`.
It is picked up automatically; forms without a file show a placeholder. Form ids are listed in
`docs/ART_PROMPTS.md`.

## Layout

- `src/data.ts` — companion lines, forms, dialogue
- `src/game.ts` — rules (needs, care, evolution, saving); no DOM, covered by `tests/`
- `src/main.ts`, `src/style.css` — screen, menus, mini-games
- `src/art.ts`, `src/portrait.ts` — art lookup, and the drawn placeholder heroines with expressions
