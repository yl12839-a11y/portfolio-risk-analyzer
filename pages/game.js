import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { signOut } from "next-auth/react";
import { INITIAL_GAME_STATE, MAX_LEVEL } from "../lib/gameEngine";
import { LEVEL_ROADMAP, formatExercise } from "../lib/levels";

export default function Roadmap() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [players, setPlayers] = useState([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(INITIAL_GAME_STATE.level);
  const [isComplete, setIsComplete] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const savedPlayers = JSON.parse(localStorage.getItem("players") || "[]");
    const savedActiveIndex = Number(localStorage.getItem("activePlayerIndex") || "0");
    const safeActiveIndex =
      Number.isFinite(savedActiveIndex) && savedActiveIndex >= 0 ? savedActiveIndex : 0;
    const activePlayer = savedPlayers[safeActiveIndex];
    const username = activePlayer?.name || localStorage.getItem("username");
    const goal = activePlayer?.goal || localStorage.getItem("goal");

    if (!username) {
      router.replace("/");
      return;
    }

    if (!goal) {
      router.replace("/onboarding");
      return;
    }

    if (savedPlayers.length > 0 && !activePlayer) {
      setPlayers(savedPlayers);
      setActivePlayerIndex(savedPlayers.length);
      setGameComplete(true);
      setHydrated(true);
      return;
    }

    const storedLevel = Number(localStorage.getItem("level"));
    const safeLevel =
      Number.isFinite(storedLevel) && storedLevel > 0
        ? Math.min(MAX_LEVEL, storedLevel)
        : INITIAL_GAME_STATE.level;

    setProfile({ username, goal });
    setPlayers(savedPlayers);
    setActivePlayerIndex(safeActiveIndex);
    setCurrentLevel(safeLevel);
    setIsComplete(false);
    setGameComplete(
      localStorage.getItem("gameComplete") === "true" || safeActiveIndex >= savedPlayers.length
    );
    setHydrated(true);
  }, [router]);

  const handleOpenLevel = (level) => {
    if (isComplete || level.id !== currentLevel) return;
    router.push(`/level/${level.id}`);
  };

  const handleLogout = async () => {
    localStorage.clear();
    await signOut({ callbackUrl: "/base_profile/login/login_page" });
  };

  const handleReturnHome = () => {
    router.push("/journey");
  };

  const handleContinuePlaying = () => {
    const savedPlayers = JSON.parse(localStorage.getItem("players") || "[]");
    const refreshed = savedPlayers.map((player) => ({ ...player, completed: false }));
    localStorage.setItem("players", JSON.stringify(refreshed));
    localStorage.setItem("activePlayerIndex", "0");
    localStorage.setItem("gameComplete", "false");
    localStorage.setItem("level", "1");
    localStorage.setItem("enemyHP", "100");
    localStorage.setItem("xp", "0");
    if (refreshed[0]) {
      localStorage.setItem("username", refreshed[0].name);
      localStorage.setItem("goal", refreshed[0].goal);
      setProfile({ username: refreshed[0].name, goal: refreshed[0].goal });
    }
    setPlayers(refreshed);
    setActivePlayerIndex(0);
    setCurrentLevel(1);
    setIsComplete(false);
    setGameComplete(false);
  };

  if ((!profile && !gameComplete) || !hydrated) return null;

  const winner =
    players.length > 0
      ? players.reduce((best, player) => (player.score > best.score ? player : best), players[0])
      : null;

  return (
    <main className="pixel-page px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="pixel-panel p-3 sm:p-5">
          <div className="pixel-screen p-4 sm:p-6">
            <header className="mb-6 flex flex-col gap-4 border-b-2 border-white/20 pb-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="pixel-ribbon inline-block px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                  Training Trail
                </div>
                <h1 className="mt-3 text-2xl font-black tracking-[0.12em] text-white sm:text-4xl">
                  {gameComplete ? "Final Scores" : "Choose Your Level"}
                </h1>
                {!gameComplete && (
                  <p className="mt-2 max-w-2xl text-sm text-blue-100/80 sm:text-base">
                    Turn {activePlayerIndex + 1} of {players.length || 1}:{" "}
                    <span className="font-semibold text-white">{profile.username}</span>. Goal:{" "}
                    <span className="font-semibold text-white">{profile.goal}</span>
                  </p>
                )}
              </div>
              <div className="pixel-row min-w-[220px] px-4 py-4 text-center md:text-left">
                <p className="pixel-label text-xs uppercase tracking-[0.16em] text-stone-600">
                  {gameComplete ? "Winner" : "Current Player"}
                </p>
                <p className="mt-2 pixel-title text-xl text-stone-900">
                  {gameComplete
                    ? `${winner?.name || "No winner"}${winner ? `: ${winner.score} pts` : ""}`
                    : profile.username}
                </p>
              </div>
            </header>

            {players.length > 0 && (
              <section className="mb-6 grid gap-3 md:grid-cols-4">
                {players.map((player, index) => (
                  <div
                    key={`${player.name}-${index}`}
                    className={`pixel-row p-4 ${
                      gameComplete
                        ? winner?.name === player.name && winner?.score === player.score
                          ? "ring-4 ring-[#5076cb]/40"
                          : ""
                        : index === activePlayerIndex
                          ? "ring-4 ring-[#5076cb]/40"
                          : ""
                    }`}
                  >
                    <p className="pixel-label text-xs uppercase tracking-[0.16em] text-stone-600">
                      {index === activePlayerIndex && !gameComplete
                        ? "Playing Now"
                        : player.completed
                          ? "Finished"
                          : "Waiting"}
                    </p>
                    <h2 className="mt-2 text-lg font-bold text-stone-900">{player.name}</h2>
                    <p className="mt-1 text-sm text-stone-700">{player.score} points</p>
                  </div>
                ))}
              </section>
            )}

            {!gameComplete && (
              <section className="grid gap-4 md:grid-cols-5">
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
                      className={`pixel-row min-h-[220px] p-5 text-left transition ${
                        active
                          ? "cursor-pointer border-[#d9e5ff] bg-[#eef4ff] hover:-translate-y-1"
                          : complete
                            ? "border-[#d3b882] bg-[#f6ebcf]"
                            : "cursor-not-allowed border-[#5e739d] bg-[#dfe6f6] opacity-70"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="pixel-title text-lg text-stone-900">{level.title}</h2>
                        <span
                          className={`pixel-label rounded border px-2 py-1 text-[10px] uppercase tracking-[0.14em] ${
                            complete
                              ? "border-[#a67e4d] bg-[#e1c887] text-stone-900"
                              : active
                                ? "border-[#315cba] bg-[#5076cb] text-white"
                                : "border-[#8ea3cb] bg-[#cdd8ef] text-stone-700"
                          }`}
                        >
                          {complete ? "Done" : active ? "Open" : "Locked"}
                        </span>
                      </div>
                      <p className="mt-5 text-lg font-semibold text-stone-900">{level.name}</p>
                      <p className="mt-2 text-sm text-stone-700">
                        {locked
                          ? "Complete the prior trail first."
                          : level.exercises.map(formatExercise).join(" + ")}
                      </p>
                      <p className="mt-6 text-sm font-semibold text-stone-800">
                        {level.targetReps > 0 && `${level.targetReps} reps`}
                        {level.targetReps > 0 && level.targetSeconds > 0 && " + "}
                        {level.targetSeconds > 0 && `${level.targetSeconds}s plank`}
                      </p>
                    </button>
                  );
                })}
              </section>
            )}

            <section className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]">
              <div className="pixel-row p-5">
                <h2 className="pixel-title text-lg text-stone-900">
                  {gameComplete ? "Round Complete" : "Trail Rule"}
                </h2>
                <p className="mt-2 text-sm text-stone-700">
                  {gameComplete
                    ? "Head back to the map for free roam, or jump into another round. Scores are saved either way."
                    : "Each player keeps scoring until they press Stop & Save Score. The next player starts after the current turn is saved. Your progress is saved automatically."}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
                <button
                  type="button"
                  onClick={handleReturnHome}
                  className="pixel-btn pixel-btn-secondary px-6 py-3 text-base"
                >
                  Return Home
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/leaderboard")}
                  className="pixel-btn pixel-btn-primary px-6 py-3 text-base"
                >
                  Leaderboard
                </button>
                {gameComplete && (
                  <button
                    type="button"
                    onClick={handleContinuePlaying}
                    className="pixel-btn pixel-btn-primary px-6 py-3 text-base"
                  >
                    Continue Playing
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="pixel-btn pixel-btn-secondary px-6 py-3 text-base"
                >
                  Logout
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
