import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { INITIAL_GAME_STATE, MAX_LEVEL } from "../lib/gameEngine";
import { LEVEL_ROADMAP, formatExercise } from "../lib/levels";

export default function Roadmap() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(INITIAL_GAME_STATE.level);
  const [isComplete, setIsComplete] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const username = localStorage.getItem("username");
    const goal = localStorage.getItem("goal");

    if (!username) {
      router.replace("/");
      return;
    }

    if (!goal) {
      router.replace("/onboarding");
      return;
    }

    const storedLevel = Number(localStorage.getItem("level"));
    const storedHP = Number(localStorage.getItem("enemyHP") ?? INITIAL_GAME_STATE.enemyHP);
    const safeLevel =
      Number.isFinite(storedLevel) && storedLevel > 0
        ? Math.min(MAX_LEVEL, storedLevel)
        : INITIAL_GAME_STATE.level;

    setProfile({ username, goal });
    setCurrentLevel(safeLevel);
    setIsComplete(safeLevel === MAX_LEVEL && storedHP === 0);
    setHydrated(true);
  }, [router]);

  const handleOpenLevel = (level) => {
    if (isComplete || level.id !== currentLevel) return;
    router.push(`/level/${level.id}`);
  };

  const handleReset = () => {
    ["username", "goal", "workout", "xp", "level", "enemyHP"].forEach((key) =>
      localStorage.removeItem(key)
    );
    router.push("/");
  };

  if (!profile || !hydrated) return null;

  const activeLevel = LEVEL_ROADMAP[Math.min(currentLevel, MAX_LEVEL) - 1];

  return (
    <div className="min-h-screen bg-[#0d2a1b] text-emerald-950">
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(132,204,22,0.28),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(20,184,166,0.2),_transparent_30%),linear-gradient(135deg,_#102f1f,_#1f5d36_48%,_#d6b15f)] px-4 py-8">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <header className="rounded-lg border border-lime-200/60 bg-lime-50/90 p-6 shadow-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                  Jungle Training Trail
                </p>
                <h1 className="mt-1 text-3xl font-bold text-emerald-950">
                  Choose Your Level
                </h1>
                <p className="mt-2 text-sm text-emerald-800">
                  Hi, {profile.username}. Goal: <span className="font-semibold">{profile.goal}</span>
                </p>
              </div>
              <div className="rounded-lg bg-emerald-900 px-4 py-3 text-lime-50">
                <p className="text-xs font-semibold uppercase tracking-wide text-lime-200">
                  Current Stop
                </p>
                <p className="text-xl font-bold">
                  {isComplete ? "Trail Complete" : `${activeLevel.title}: ${activeLevel.name}`}
                </p>
              </div>
            </div>
          </header>

          <main className="grid gap-4 md:grid-cols-5">
            {LEVEL_ROADMAP.map((level) => {
              const complete = currentLevel > level.id || isComplete;
              const active = !isComplete && currentLevel === level.id;
              const locked = currentLevel < level.id;

              return (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => handleOpenLevel(level)}
                  disabled={!active}
                  className={`min-h-[220px] rounded-lg border p-5 text-left shadow-xl transition ${
                    active
                      ? "border-yellow-200 bg-yellow-100 hover:-translate-y-1 hover:bg-yellow-50"
                      : complete
                        ? "border-lime-200 bg-lime-100"
                        : "border-emerald-700 bg-emerald-950/70 text-lime-50 opacity-80"
                  } ${active ? "cursor-pointer" : "cursor-not-allowed"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold">{level.title}</h2>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-bold ${
                        complete
                          ? "bg-lime-700 text-lime-50"
                          : active
                            ? "bg-yellow-500 text-emerald-950"
                            : "bg-emerald-800 text-lime-100"
                      }`}
                    >
                      {complete ? "Done" : active ? "Open" : "Locked"}
                    </span>
                  </div>
                  <p className="mt-5 text-lg font-semibold">{level.name}</p>
                  <p className="mt-2 text-sm">
                    {locked ? "Complete the prior trail first." : level.exercises.map(formatExercise).join(" + ")}
                  </p>
                  <p className="mt-6 text-sm font-semibold">
                    {level.targetReps > 0 && `${level.targetReps} reps`}
                    {level.targetReps > 0 && level.targetSeconds > 0 && " + "}
                    {level.targetSeconds > 0 && `${level.targetSeconds}s plank`}
                  </p>
                </button>
              );
            })}
          </main>

          <section className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="rounded-lg border border-lime-200/60 bg-lime-50/90 p-5 shadow-xl">
              <h2 className="text-lg font-bold text-emerald-950">Trail Rule</h2>
              <p className="mt-2 text-sm text-emerald-800">
                Level 1 opens first. Level 2 unlocks only after 10 reps on Level 1.
                Plank levels complete after 45 seconds.
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg bg-emerald-950 px-6 py-3 font-semibold text-lime-50 shadow-xl hover:bg-emerald-900"
            >
              Reset
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
