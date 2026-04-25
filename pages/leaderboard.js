import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";

function rankSuffix(rank) {
  if (!rank) return "";
  const mod100 = rank % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  const mod10 = rank % 10;
  if (mod10 === 1) return "st";
  if (mod10 === 2) return "nd";
  if (mod10 === 3) return "rd";
  return "th";
}

export default function LeaderboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [top, setTop] = useState([]);
  const [me, setMe] = useState(null);
  const [loadStatus, setLoadStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/base_profile/login/login_page");
      return;
    }

    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/leaderboard");
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setError(data.error || "Could not load leaderboard.");
          setLoadStatus("error");
          return;
        }
        setTop(data.top || []);
        setMe(data.me || null);
        setLoadStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setError(err.message || "Could not load leaderboard.");
        setLoadStatus("error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [router, status]);

  const myUsername = session?.user?.username;
  const myRow = me;
  const inTop = myUsername && top.some((row) => row.username === myUsername);

  const handleLogout = async () => {
    localStorage.clear();
    await signOut({ callbackUrl: "/base_profile/login/login_page" });
  };

  return (
    <main className="pixel-page px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="pixel-panel p-3 sm:p-5">
          <div className="pixel-screen p-4 sm:p-6">
            <header className="mb-6 flex flex-col gap-3 border-b-2 border-white/20 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="pixel-ribbon inline-block px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                  Hall Of Fame
                </div>
                <h1 className="mt-3 text-2xl font-black tracking-[0.12em] text-white sm:text-4xl">
                  Leaderboard
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-blue-100/80 sm:text-base">
                  Points add up across every round. The more reps and planks you log, the higher
                  you climb.
                </p>
              </div>
              {myRow && (
                <div className="pixel-row min-w-[220px] px-4 py-4 text-center sm:text-left">
                  <p className="pixel-label text-xs uppercase tracking-[0.16em] text-stone-600">
                    Your Rank
                  </p>
                  <p className="mt-2 pixel-title text-xl text-stone-900">
                    #{myRow.rank}
                    {rankSuffix(myRow.rank)}{" "}
                    <span className="text-base font-semibold text-stone-700">
                      &middot; {myRow.points} pts
                    </span>
                  </p>
                </div>
              )}
            </header>

            {loadStatus === "loading" && (
              <p className="text-center text-sm text-blue-100/80">Loading leaderboard...</p>
            )}

            {loadStatus === "error" && (
              <div className="rounded-lg border-2 border-red-300 bg-red-500/20 p-4 text-center text-sm text-red-100">
                {error}
              </div>
            )}

            {loadStatus === "ready" && (
              <section className="pixel-row p-4 sm:p-6">
                <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 border-b-2 border-stone-300/70 pb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-600">
                  <span>Rank</span>
                  <span>Player</span>
                  <span className="text-right">Workouts</span>
                  <span className="text-right">Points</span>
                </div>

                {top.length === 0 ? (
                  <p className="mt-4 text-center text-sm text-stone-700">
                    No scores yet. Be the first to finish a round!
                  </p>
                ) : (
                  <ul className="mt-2 divide-y-2 divide-stone-200/70">
                    {top.map((row) => {
                      const isMe = row.username === myUsername;
                      return (
                        <li
                          key={row.username}
                          className={`grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 py-3 text-sm ${
                            isMe ? "bg-[#dfeaff] font-bold text-stone-900" : "text-stone-800"
                          }`}
                        >
                          <span
                            className={`pixel-label rounded border px-2 py-1 text-xs ${
                              row.rank === 1
                                ? "border-[#a67e4d] bg-[#f4d27a] text-stone-900"
                                : row.rank === 2
                                  ? "border-[#7f8590] bg-[#d6dae0] text-stone-900"
                                  : row.rank === 3
                                    ? "border-[#a67e4d] bg-[#e6c39c] text-stone-900"
                                    : "border-[#8ea3cb] bg-[#cdd8ef] text-stone-700"
                            }`}
                          >
                            #{row.rank}
                          </span>
                          <span className="truncate">
                            {row.name || row.username}
                            {isMe && (
                              <span className="ml-2 rounded border border-[#5076cb] bg-[#5076cb]/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[#1d3a85]">
                                You
                              </span>
                            )}
                            <span className="ml-2 text-xs font-normal text-stone-600">
                              @{row.username}
                            </span>
                          </span>
                          <span className="text-right text-sm">{row.workouts}</span>
                          <span className="text-right font-bold">{row.points}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {myRow && !inTop && (
                  <>
                    <p className="mt-6 border-t-2 border-dashed border-stone-300/70 pt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-600">
                      Your standing
                    </p>
                    <div className="mt-2 grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-lg bg-[#dfeaff] py-3 px-3 text-sm font-bold text-stone-900">
                      <span className="pixel-label rounded border border-[#5076cb] bg-[#5076cb]/20 px-2 py-1 text-xs text-[#1d3a85]">
                        #{myRow.rank}
                      </span>
                      <span className="truncate">
                        {myRow.name || myRow.username}
                        <span className="ml-2 text-xs font-normal text-stone-600">
                          @{myRow.username}
                        </span>
                      </span>
                      <span className="text-right text-sm">{myRow.workouts}</span>
                      <span className="text-right">{myRow.points}</span>
                    </div>
                  </>
                )}
              </section>
            )}

            <section className="mt-6 grid gap-4 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => router.push("/journey")}
                className="pixel-btn pixel-btn-secondary px-6 py-3 text-base"
              >
                Return Home
              </button>
              <button
                type="button"
                onClick={() => router.push("/game")}
                className="pixel-btn pixel-btn-primary px-6 py-3 text-base"
              >
                Back To Levels
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="pixel-btn pixel-btn-secondary px-6 py-3 text-base"
              >
                Logout
              </button>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
