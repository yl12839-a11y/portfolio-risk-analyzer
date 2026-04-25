import { INITIAL_GAME_STATE } from "./gameEngine";

const STORAGE_KEY = "gameState";
const LEGACY_KEYS = ["xp", "level", "enemyHP"];

const hasWindow = () => typeof window !== "undefined";

export function getInitialState() {
  return { ...INITIAL_GAME_STATE };
}

function validField(value, fallback) {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

export function loadState() {
  if (!hasWindow()) return getInitialState();

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
    return getInitialState();
  }

  try {
    const parsed = JSON.parse(raw);
    const defaults = getInitialState();
    return {
      xp: validField(parsed?.xp, defaults.xp),
      level: validField(parsed?.level, defaults.level),
      enemyHP: validField(parsed?.enemyHP, defaults.enemyHP),
    };
  } catch {
    return getInitialState();
  }
}

export function saveState(state) {
  if (!hasWindow()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState() {
  if (!hasWindow()) return;
  localStorage.removeItem(STORAGE_KEY);
}
