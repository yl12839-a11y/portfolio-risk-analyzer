import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  INITIAL_GAME_STATE,
  applyWorkout,
  hpPct,
  sanitizeReps,
  xpProgressPct,
  xpThreshold,
} from "../lib/gameEngine";
import { loadState, saveState, resetState } from "../lib/gameState";
import { loadProfile, resetProfile } from "../lib/profile";
import CharacterSprite from "../components/CharacterSprite";

export default function Game() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [game, setGame] = useState(INITIAL_GAME_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [reps, setReps] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const stored = loadProfile();

    if (!stored.username) {
      router.replace("/");
      return;
    }
    if (!stored.goal || !stored.workout) {
      router.replace("/onboarding");
      return;
    }
    if (!stored.avatar) {
      router.replace("/avatar");
      return;
    }

    setProfile(stored);
    setGame(loadState());
    setHydrated(true);
  }, [router]);

  useEffect(() => {
    if (!hydrated) return;
    saveState(game);
  }, [hydrated, game]);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(""), 2000);
    return () => clearTimeout(id);
  }, [message]);

  const handleSubmitReps = (e) => {
    e.preventDefault();
    const n = sanitizeReps(reps);
    if (n === null) return;
    const { state, enemyDefeated } = applyWorkout(game, n);
    setGame(state);
    setReps("");
    if (enemyDefeated) setMessage("Enemy defeated! Level up!");
  };

  const handleReset = () => {
    resetProfile();
    resetState();
    router.push("/");
  };

  if (!profile || !hydrated) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-1 shrink-0">
              <CharacterSprite preset={profile.avatar?.preset} scale={2} />
            </div>
            <h1 className="text-2xl font-bold">Hi, {profile.username}</h1>
          </div>
          <span className="text-sm font-medium text-blue-600">
            Level {game.level}
          </span>
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <p><span className="font-medium">Goal:</span> {profile.goal}</p>
          <p><span className="font-medium">Workout:</span> {profile.workout}</p>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium">XP</span>
            <span className="text-gray-600">
              {game.xp} / {xpThreshold(game.level)}
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${xpProgressPct(game.xp, game.level)}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Enemy HP</span>
            <span className="text-gray-600">{game.enemyHP} / 100</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all"
              style={{ width: `${hpPct(game.enemyHP)}%` }}
            />
          </div>
        </div>

        {message && (
          <div className="bg-yellow-100 text-yellow-800 text-center font-medium py-2 rounded-lg">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmitReps} className="flex gap-2">
          <input
            type="number"
            min="1"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder={`${profile.workout} reps`}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-700"
          >
            Attack
          </button>
        </form>

        <button
          onClick={handleReset}
          className="w-full bg-gray-200 text-gray-800 rounded-lg py-2 font-medium hover:bg-gray-300"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
