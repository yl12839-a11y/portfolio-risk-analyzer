import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { signOut } from "next-auth/react";

const GOALS = ["strength", "endurance", "general fitness"];

export default function Onboarding() {
  const [players, setPlayers] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const savedPlayers = JSON.parse(localStorage.getItem("players") || "[]");
    if (savedPlayers.length === 0) {
      router.replace("/");
      return;
    }
    setPlayers(savedPlayers);
  }, [router]);

  const updateGoal = (index, goal) => {
    setPlayers((currentPlayers) =>
      currentPlayers.map((player, currentIndex) =>
        currentIndex === index ? { ...player, goal } : player
      )
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const updatedPlayers = players.map((player) => ({
      ...player,
      score: 0,
      completed: false,
    }));

    localStorage.setItem("players", JSON.stringify(updatedPlayers));
    localStorage.setItem("activePlayerIndex", "0");
    localStorage.setItem("username", updatedPlayers[0].name);
    localStorage.setItem("goal", updatedPlayers[0].goal);
    localStorage.setItem("xp", "0");
    localStorage.setItem("level", "1");
    localStorage.setItem("enemyHP", "100");
    localStorage.setItem("gameComplete", "false");
    router.push("/game");
  };

  const handleLogout = async () => {
    localStorage.clear();
    await signOut({ callbackUrl: "/base_profile/login/login_page" });
  };

  if (players.length === 0) return null;

  return (
    <main className="pixel-page px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <div className="pixel-panel w-full max-w-4xl p-3 sm:p-5">
          <div className="pixel-screen p-4 sm:p-6">
            <div className="mb-8 flex flex-col gap-3 border-b-2 border-white/20 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="pixel-ribbon inline-block px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                  Setup
                </div>
                <h1 className="mt-3 text-2xl font-black tracking-[0.12em] text-white sm:text-4xl">
                  Choose Your Goal
                </h1>
                <p className="mt-2 max-w-xl text-sm text-blue-100/80 sm:text-base">
                  Set each player&apos;s training focus before entering the roadmap.
                </p>
              </div>
              <div className="flex items-center gap-3 self-start border-2 border-blue-200/40 bg-black/15 px-3 py-2 text-xs uppercase tracking-[0.2em] text-blue-100 sm:self-auto">
                <div className="pixel-orb h-5 w-5 shrink-0" />
                Team Setup
              </div>
            </div>

            <form onSubmit={handleSubmit} className="pixel-subpanel p-4 sm:p-6">
              <div className="mx-auto max-w-2xl pixel-row p-5 sm:p-6">
                <div className="mb-6">
                  <p className="pixel-label text-xs uppercase tracking-[0.16em] text-stone-600">
                    Player Goals
                  </p>
                  <h2 className="mt-2 pixel-title text-2xl text-stone-900">Quick Setup</h2>
                </div>

                <div className="space-y-4">
                  {players.map((player, index) => (
                    <div key={`${player.name}-${index}`} className="rounded-lg border-2 border-[#ccb382] bg-[#fff9ec] p-4">
                      <label className="pixel-label block text-xs uppercase tracking-[0.16em] text-stone-600">
                        {player.name} Fitness Goal
                      </label>
                      <select
                        value={player.goal}
                        onChange={(e) => updateGoal(index, e.target.value)}
                        className="mt-3 w-full rounded-lg border-2 border-[#ccb382] bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-[#5076cb]"
                      >
                        {GOALS.map((goal) => (
                          <option key={goal} value={goal}>
                            {goal}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t-2 border-stone-300/80 pt-6 sm:flex-row">
                  <p className="text-sm text-stone-700">Save the goals, then enter the roadmap.</p>
                  <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="pixel-btn pixel-btn-secondary px-6 py-3 text-base"
                    >
                      Logout
                    </button>
                    <button
                      type="submit"
                      className="pixel-btn pixel-btn-primary px-6 py-3 text-base"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
