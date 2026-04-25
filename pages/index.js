import { useState } from "react";
import { useRouter } from "next/router";

export default function Login() {
  const [username, setUsername] = useState("");
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;
    localStorage.setItem("username", trimmed);
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
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          className="w-full rounded-lg border border-emerald-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
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
