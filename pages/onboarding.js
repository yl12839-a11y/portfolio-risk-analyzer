import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const GOALS = ["strength", "endurance", "general fitness"];

export default function Onboarding() {
  const [goal, setGoal] = useState("strength");
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("username")) {
      router.replace("/");
    }
  }, [router]);

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem("goal", goal);
    localStorage.setItem("xp", "0");
    localStorage.setItem("level", "1");
    localStorage.setItem("enemyHP", "100");
    router.push("/game");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d2a1b] bg-[radial-gradient(circle_at_top_left,_rgba(132,204,22,0.28),_transparent_32%),linear-gradient(135deg,_#102f1f,_#1f5d36_52%,_#d6b15f)] p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-6 rounded-lg border border-lime-200/60 bg-lime-50/90 p-8 shadow-xl"
      >
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Trail Details
          </p>
          <h1 className="mt-1 text-2xl font-bold text-emerald-950">Quick Setup</h1>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-emerald-950">Fitness goal</label>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full rounded-lg border border-emerald-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            {GOALS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-yellow-500 py-2 font-bold text-emerald-950 hover:bg-yellow-400"
        >
          Continue to Roadmap
        </button>
      </form>
    </div>
  );
}
