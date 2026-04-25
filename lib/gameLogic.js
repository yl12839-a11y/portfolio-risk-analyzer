export const INITIAL_GAME_STATE = { xp: 0, level: 1, enemyHP: 100 };
export const MAX_ENEMY_HP = 100;
export const XP_PER_REP = 10;
export const DAMAGE_PER_REP = 5;

export function xpThreshold(level) {
  return level * 100;
}

export function xpProgressPct(xp, level) {
  return Math.min(100, (xp / xpThreshold(level)) * 100);
}

export function hpPct(enemyHP) {
  return Math.max(0, (enemyHP / MAX_ENEMY_HP) * 100);
}

export function applyReps(state, reps) {
  let { xp, level, enemyHP } = state;
  xp += reps * XP_PER_REP;
  enemyHP -= reps * DAMAGE_PER_REP;
  let enemyDefeated = false;
  if (enemyHP <= 0) {
    enemyHP = MAX_ENEMY_HP;
    level += 1;
    enemyDefeated = true;
  }
  return { state: { xp, level, enemyHP }, enemyDefeated };
}
