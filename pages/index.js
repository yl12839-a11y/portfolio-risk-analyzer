import { useState } from "react";
import { useRouter } from "next/router";

export default function Login() {
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState(["", ""]);
  const router = useRouter();

  const updatePlayerCount = (count) => {
    const safeCount = Number(count);
    setPlayerCount(safeCount);
    setPlayerNames((names) =>
      Array.from({ length: safeCount }, (_, index) => names[index] ?? "")
    );
  };

  const updatePlayerName = (index, value) => {
    setPlayerNames((names) =>
      names.map((name, currentIndex) => (currentIndex === index ? value : name))
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const players = playerNames
      .map((name, index) => ({
        name: name.trim() || `Player ${index + 1}`,
        goal: "strength",
        score: 0,
        completed: false,
      }));

    localStorage.setItem("players", JSON.stringify(players));
    localStorage.setItem("activePlayerIndex", "0");
    localStorage.setItem("username", players[0].name);
    localStorage.setItem("gameComplete", "false");
    router.push("/onboarding");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d2a1b] bg-[radial-gradient(circle_at_top_left,_rgba(132,204,22,0.28),_transparent_32%),linear-gradient(135deg,_#102f1f,_#1f5d36_52%,_#d6b15f)] p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-lg border border-lime-200/60 bg-lime-50/90 p-8 shadow-xl"
      >
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Jungle Training Trail
          </p>
          <h1 className="mt-1 text-2xl font-bold text-emerald-950">Welcome</h1>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-emerald-950">
            How many players?
          </label>
          <select
            value={playerCount}
            onChange={(e) => updatePlayerCount(e.target.value)}
            className="w-full rounded-lg border border-emerald-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            {[1, 2, 3, 4].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {playerNames.map((name, index) => (
            <input
              key={index}
              type="text"
              value={name}
              onChange={(e) => updatePlayerName(index, e.target.value)}
              placeholder={`Player ${index + 1} name`}
              className="w-full rounded-lg border border-emerald-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          ))}
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-yellow-500 py-2 font-bold text-emerald-950 hover:bg-yellow-400"
        >
          Start
        </button>
      </form>
    </div>
  );
}
