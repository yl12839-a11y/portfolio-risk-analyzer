import test from "node:test";
import assert from "node:assert/strict";

import {
  DAMAGE_PER_REP,
  INITIAL_GAME_STATE,
  MAX_ENEMY_HP,
  XP_PER_REP,
  applyWorkout,
  hpPct,
  sanitizeReps,
  xpProgressPct,
  xpThreshold,
} from "./gameEngine.js";

test("applyWorkout awards XP and damages enemy without leveling before defeat", () => {
  const result = applyWorkout(INITIAL_GAME_STATE, 3);

  assert.deepEqual(result, {
    state: {
      xp: 3 * XP_PER_REP,
      level: 1,
      enemyHP: MAX_ENEMY_HP - 3 * DAMAGE_PER_REP,
    },
    enemyDefeated: false,
    gameComplete: false,
  });
});

test("applyWorkout levels only on enemy defeat and discards overkill damage", () => {
  const result = applyWorkout({ xp: 90, level: 2, enemyHP: 10 }, 3);

  assert.deepEqual(result, {
    state: {
      xp: 90 + 3 * XP_PER_REP,
      level: 3,
      enemyHP: MAX_ENEMY_HP,
    },
    enemyDefeated: true,
    gameComplete: false,
  });
});

test("applyWorkout does not level from XP threshold alone", () => {
  const result = applyWorkout({ xp: 90, level: 1, enemyHP: 95 }, 1);

  assert.deepEqual(result, {
    state: {
      xp: 100,
      level: 1,
      enemyHP: 90,
    },
    enemyDefeated: false,
    gameComplete: false,
  });
});

test("applyWorkout ignores invalid reps", () => {
  const state = { xp: 50, level: 2, enemyHP: 80 };

  assert.deepEqual(applyWorkout(state, 0), {
    state,
    enemyDefeated: false,
    gameComplete: false,
  });
  assert.deepEqual(applyWorkout(state, "nope"), {
    state,
    enemyDefeated: false,
    gameComplete: false,
  });
});

test("applyWorkout caps progression at level five", () => {
  const result = applyWorkout({ xp: 400, level: 5, enemyHP: 5 }, 1);

  assert.deepEqual(result, {
    state: {
      xp: 400 + XP_PER_REP,
      level: 5,
      enemyHP: 0,
    },
    enemyDefeated: true,
    gameComplete: true,
  });
});

test("progress helpers clamp percentages", () => {
  assert.equal(xpThreshold(3), 300);
  assert.equal(xpThreshold(0), 100);
  assert.equal(xpProgressPct(50, 2), 25);
  assert.equal(xpProgressPct(-10, 2), 0);
  assert.equal(xpProgressPct(250, 2), 100);

  assert.equal(hpPct(50), 50);
  assert.equal(hpPct(-5), 0);
  assert.equal(hpPct(150), 100);
});

test("sanitizeReps returns positive whole reps or null", () => {
  assert.equal(sanitizeReps("12"), 12);
  assert.equal(sanitizeReps(4.9), 4);
  assert.equal(sanitizeReps(0.5), null);
  assert.equal(sanitizeReps(0), null);
  assert.equal(sanitizeReps(-2), null);
  assert.equal(sanitizeReps(""), null);
  assert.equal(sanitizeReps("abc"), null);
});
