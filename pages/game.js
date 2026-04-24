import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Game() {
  const [profile, setProfile] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const username = localStorage.getItem("username");
    const goal = localStorage.getItem("goal");
    const workout = localStorage.getItem("workout");

    if (!username) {
      router.replace("/");
      return;
    }
    if (!goal || !workout) {
      router.replace("/onboarding");
      return;
    }

    setProfile({ username, goal, workout });
  }, [router]);

  const handleReset = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("goal");
    localStorage.removeItem("workout");
    router.push("/");
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">
          Hi, {profile.username}
        </h1>
        <div className="space-y-2 text-gray-700">
          <p>
            <span className="font-medium">Goal:</span> {profile.goal}
          </p>
          <p>
            <span className="font-medium">Workout:</span> {profile.workout}
          </p>
        </div>
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
