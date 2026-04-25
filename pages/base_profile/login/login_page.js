import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");

    if (!username || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username: username.toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Incorrect username or password.");
        setLoading(false);
        return;
      }

      const session = await getSession();
      const sessionUsername = session?.user?.username || username.toLowerCase();

      localStorage.setItem(
        "players",
        JSON.stringify([{ name: sessionUsername, goal: "strength", score: 0, completed: false }])
      );
      localStorage.setItem("activePlayerIndex", "0");
      localStorage.setItem("username", sessionUsername);
      localStorage.setItem("gameComplete", "false");

      router.push("/avatar");
    } catch (err) {
      setError(`Network error: ${err.message}`);
      setLoading(false);
    }
  }

  return (
    <main className="pixel-page px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <div className="pixel-panel w-full max-w-4xl p-3 sm:p-5">
          <div className="pixel-screen p-4 sm:p-6">
            <div className="mb-8 flex flex-col gap-3 border-b-2 border-white/20 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="pixel-ribbon inline-block px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                  Login
                </div>
                <h1 className="mt-3 text-2xl font-black tracking-[0.12em] text-white sm:text-4xl">
                  Welcome Back
                </h1>
                <p className="mt-2 max-w-xl text-sm text-blue-100/80 sm:text-base">
                  Log in to enter the game and continue your training run.
                </p>
              </div>
              <div className="flex items-center gap-3 self-start border-2 border-blue-200/40 bg-black/15 px-3 py-2 text-xs uppercase tracking-[0.2em] text-blue-100 sm:self-auto">
                <div className="pixel-orb h-5 w-5 shrink-0" />
                Player Access
              </div>
            </div>

            <div className="pixel-subpanel p-4 sm:p-6">
              <div className="mx-auto max-w-xl pixel-row p-5 sm:p-6">
                <div className="mb-6">
                  <p className="pixel-label text-xs uppercase tracking-[0.16em] text-stone-600">
                    Sign In
                  </p>
                  <h2 className="mt-2 pixel-title text-2xl text-stone-900">Enter Your Account</h2>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="pixel-label block text-xs uppercase tracking-[0.16em] text-stone-600">
                      Username
                    </label>
                    <input
                      className="mt-2 w-full rounded-lg border-2 border-[#ccb382] bg-[#fff9ec] px-4 py-3 text-base text-stone-900 outline-none transition focus:border-[#5076cb]"
                      type="text"
                      placeholder="your_username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      autoComplete="username"
                    />
                  </div>

                  <div>
                    <label className="pixel-label block text-xs uppercase tracking-[0.16em] text-stone-600">
                      Password
                    </label>
                    <input
                      className="mt-2 w-full rounded-lg border-2 border-[#ccb382] bg-[#fff9ec] px-4 py-3 text-base text-stone-900 outline-none transition focus:border-[#5076cb]"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                {error && (
                  <div className="mt-5 rounded-lg border-2 border-[#c77d7d] bg-[#f7d6d6] px-4 py-3 text-sm font-semibold text-[#7a2d2d]">
                    {error}
                  </div>
                )}

                <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t-2 border-stone-300/80 pt-6 sm:flex-row">
                  <p className="text-sm text-stone-700">
                    New here?{" "}
                    <Link
                      href="/base_profile/signup/signup_page"
                      className="font-semibold text-[#315cba] underline"
                    >
                      Create an account
                    </Link>
                  </p>

                  <button
                    type="button"
                    onClick={handleLogin}
                    disabled={loading}
                    className="pixel-btn pixel-btn-primary min-w-[180px] px-6 py-3 text-base disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Logging In..." : "Log In"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
