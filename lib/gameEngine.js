export const INITIAL_GAME_STATE = { xp: 0, level: 1, enemyHP: 100 };
export const MAX_LEVEL = 5;
export const MAX_ENEMY_HP = 100;
export const XP_PER_REP = 10;
export const DAMAGE_PER_REP = 5;

function clampPct(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function xpThreshold(level) {
  const safeLevel = Number.isFinite(level) && level > 0 ? level : 1;
  return safeLevel * 100;
}

export function xpProgressPct(xp, level) {
  return clampPct((xp / xpThreshold(level)) * 100);
}

export function hpPct(enemyHP) {
  return clampPct((enemyHP / MAX_ENEMY_HP) * 100);
}

export function sanitizeReps(input) {
  const reps = Number(input);
  if (!Number.isFinite(reps) || reps <= 0) return null;
  const wholeReps = Math.floor(reps);
  return wholeReps > 0 ? wholeReps : null;
}

export function applyWorkout(state, reps) {
  const safeReps = sanitizeReps(reps);
  if (safeReps === null) {
    return { state: { ...state }, enemyDefeated: false, gameComplete: false };
  }

  let { xp, level, enemyHP } = state;
  const safeLevel = Math.min(MAX_LEVEL, Math.max(1, Math.floor(level || 1)));
  xp += safeReps * XP_PER_REP;
  enemyHP -= safeReps * DAMAGE_PER_REP;
  let enemyDefeated = false;
  let gameComplete = false;

  if (enemyHP <= 0) {
    enemyDefeated = true;
    if (safeLevel >= MAX_LEVEL) {
      level = MAX_LEVEL;
      enemyHP = 0;
      gameComplete = true;
    } else {
      enemyHP = MAX_ENEMY_HP;
      level = safeLevel + 1;
    }
  } else {
    level = safeLevel;
  }

  return { state: { xp, level, enemyHP }, enemyDefeated, gameComplete };
}
