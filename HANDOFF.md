# Handoff

## Current state

Working: Login -> Onboarding -> Avatar Creator -> Game flow end-to-end. Everything persists to `localStorage`. Profile and game state are two JSON blobs under keys `profile` and `gameState`.

Not yet verified: The LPC avatar creator and the new game header were just wired up; nothing has been opened in a browser yet. First thing the next person should do is run `npm run dev` and walk the flow to confirm the sprite renders correctly.

## Architecture

```text
lib/
  gameEngine.js       Game math (Person A's file — don't touch)
  gameEngine.test.js  Person A's tests — npm test to run
  gameState.js        localStorage for xp/level/enemyHP
  profile.js          localStorage for username/goal/workout/avatar
  avatar.js           LPC sprite manifest (layer options + defaults)

components/
  CharacterSprite.js  Renders a layered LPC character (body+legs+torso+hair)

pages/
  index.js            Username entry
  onboarding.js       Goal + workout, routes to /avatar
  avatar.js           Character creator (layer pickers + randomize)
  game.js             Main game UI with XP/HP bars + reps form

public/sprites/lpc/   Downloaded LPC sprite sheets (832×2944 each)
  body/  hair/  torso/  legs/
```

How LPC rendering works: Each PNG is a full animation sheet. `CharacterSprite` stacks 4 absolutely-positioned divs, each using `background-image` + `background-position: 0 -640px` to crop to walk-south frame 0 (the idle pose). `scale` prop scales the whole thing via `background-size`.

## Immediate TODO

The next person's first hour:

1. Run the app and verify the sprite displays correctly. `npm run dev` -> `http://localhost:3000`. Clear `localStorage` in DevTools, walk through login -> onboarding -> avatar -> game. If the sprite looks cropped wrong, adjust `IDLE_OFFSET_Y` in `lib/avatar.js:3`.
2. Uninstall DiceBear. Not used anymore: `npm uninstall @dicebear/core @dicebear/collection`. This was skipped so the app still builds if the LPC path fails.
3. Delete the empty placeholder `db.py`. Not used.

## Open questions / future work

The user's larger vision (see screenshots earlier in the conversation) is a top-down pixel-art game, Stardew/Pokemon style. That's months of work. For the hackathon, the realistic next features in order:

1. Add more sprites to the LPC manifest. Right now only 4 bodies, 3 hair styles x 3 colors, 2 tops x 2 colors, 2 pant colors. Add more by downloading from the LPC repo and extending `lib/avatar.js`. See the shell script pattern in the conversation history.
2. Weapons / accessories layer. Add `weapon` to `LAYER_ORDER` and a new section in `LAYERS`. LPC has a `weapons/` directory.
3. Battle scene in `game.js`. Replace the plain HP bar with an enemy sprite opposite the player. When reps are submitted, play attack frame (use a different `IDLE_OFFSET_Y` for 1 second via state).
4. Walkable world. Don't attempt in Next.js; switch to Kaboom.js or Phaser if pursued. Big undertaking.

## Gotchas

- LPC license is GPL/CC-BY-SA. Fine for a hackathon demo. If this ships, attribution is required.
- Sprite sheets are `832×2944` (46 rows of `64×64` frames). Idle = row 10 (walk-south frame 0) = y-offset `-640`. If you use a different sprite pack, re-measure.
- Female body only right now. Male bodies exist in the LPC repo at `body/bodies/male/` — same color palette. Adding would mean either a body-type picker or swapping all the corresponding hair/clothes to male variants (they're in parallel `male/` subdirs).
- Person A owns `lib/gameEngine.js`. Don't modify it without coordinating. It has tests; they enforce the engine's contract.
- Storage migration: `loadProfile()` in `lib/profile.js` reads legacy separate keys (`username`/`goal`/`workout`) if the JSON blob is missing — kept so existing testers don't lose data. Safe to remove in about a week.

## How to run

```bash
npm install      # already done, but just in case
npm run dev      # http://localhost:3000
npm test         # runs Person A's engine tests
```
