import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const GOALS = ["strength", "endurance", "general fitness"];
const WORKOUTS = ["pushups", "squats", "plank"];

export default function Onboarding() {
  const [goal, setGoal] = useState("strength");
  const [workout, setWorkout] = useState("pushups");
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("username")) {
      router.replace("/");
    }
  }, [router]);

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem("goal", goal);
    localStorage.setItem("workout", workout);
    router.push("/game");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm space-y-6"
      >
        <h1 className="text-2xl font-bold text-center">Quick Setup</h1>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Fitness goal</label>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            {GOALS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Preferred workout</label>
          <select
            value={workout}
            onChange={(e) => setWorkout(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            {WORKOUTS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium hover:bg-blue-700"
        >
          Continue to Game
        </button>
      </form>
    </div>
  );
}
