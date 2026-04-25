const STORAGE_KEY = "profile";
const LEGACY_KEYS = ["username", "goal", "workout"];

const hasWindow = () => typeof window !== "undefined";

function readLegacy() {
  const out = {};
  for (const k of LEGACY_KEYS) {
    const v = localStorage.getItem(k);
    if (v !== null) out[k] = v;
  }
  return out;
}

export function loadProfile() {
  if (!hasWindow()) return {};

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // fall through to legacy / empty
    }
  }

  return readLegacy();
}

export function saveProfile(partial) {
  if (!hasWindow()) return;
  const next = { ...loadProfile(), ...partial };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
}

export function resetProfile() {
  if (!hasWindow()) return;
  localStorage.removeItem(STORAGE_KEY);
  LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
}
