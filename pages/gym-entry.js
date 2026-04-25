import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import CharacterSprite from "../components/CharacterSprite";
import { loadProfile } from "../lib/profile";

const STEPS = [
  "Warming up...",
  "Checking form...",
  "Loading workout floor...",
  "Stepping onto the mat...",
];

const WORKOUT_BEATS = [
  { label: "Squat set", direction: "south", frameIndex: 0, bob: 0 },
  { label: "Squat set", direction: "south", frameIndex: 1, bob: 14 },
  { label: "Push-up set", direction: "east", frameIndex: 2, bob: 6 },
  { label: "Plank hold", direction: "east", frameIndex: 1, bob: 2 },
];

export default function GymEntryPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [beatIndex, setBeatIndex] = useState(0);
  const [preset, setPreset] = useState("player1");
  const [playerName, setPlayerName] = useState("Adventurer");
  const [intro, setIntro] = useState(true);
  const [outro, setOutro] = useState(false);

  useEffect(() => {
    const savedPlayers = JSON.parse(localStorage.getItem("players") || "[]");
    if (savedPlayers.length === 0) {
      router.replace("/");
      return;
    }

    const profile = loadProfile();
    setPreset(profile.avatar?.preset || "player1");
    setPlayerName(profile.username || savedPlayers[0]?.name || "Adventurer");

    const introTimer = setTimeout(() => setIntro(false), 60);
    const stepTimers = [
      setTimeout(() => setStepIndex(1), 1100),
      setTimeout(() => setStepIndex(2), 2300),
      setTimeout(() => setStepIndex(3), 3500),
      setTimeout(() => setOutro(true), 4400),
      setTimeout(() => router.replace("/onboarding"), 5300),
    ];
    const beatTimer = setInterval(() => {
      setBeatIndex((current) => (current + 1) % WORKOUT_BEATS.length);
    }, 280);

    return () => {
      clearTimeout(introTimer);
      stepTimers.forEach(clearTimeout);
      clearInterval(beatTimer);
    };
  }, [router]);

  const progressWidth = useMemo(() => `${((stepIndex + 1) / STEPS.length) * 100}%`, [stepIndex]);
  const activeBeat = WORKOUT_BEATS[beatIndex];

  return (
    <main className="pixel-page relative px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center justify-center">
        <div className="pixel-panel w-full max-w-4xl p-3 sm:p-5">
          <div className="pixel-screen overflow-hidden p-4 sm:p-6">
            <div className="mb-8 flex flex-col gap-3 border-b-2 border-white/20 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="pixel-ribbon inline-block px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                  Loading
                </div>
                <h1 className="mt-3 text-2xl font-black tracking-[0.12em] text-white sm:text-4xl">
                  Preparing Workout
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-blue-100/80 sm:text-base">
                  {playerName} is getting ready for the exercise round.
                </p>
              </div>
              <div className="flex items-center gap-3 self-start border-2 border-blue-200/40 bg-black/15 px-3 py-2 text-xs uppercase tracking-[0.2em] text-blue-100 sm:self-auto">
                <div className="pixel-orb h-5 w-5 shrink-0" />
                Workout Load
              </div>
            </div>

            <div className="pixel-subpanel p-4 sm:p-6">
              <div className="rounded-xl border-4 border-[#d6e1ff] bg-[#26406d] p-5 sm:p-8">
                <div
                  className="relative overflow-hidden rounded-lg border-4 border-[#d6e1ff] bg-[linear-gradient(180deg,#3b6095_0%,#2b4875_100%)]"
                  style={{ minHeight: 320 }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-45"
                    style={{
                      backgroundImage:
                        "linear-gradient(transparent 31px, rgba(255,255,255,0.08) 32px), linear-gradient(90deg, transparent 31px, rgba(255,255,255,0.08) 32px)",
                      backgroundSize: "32px 32px",
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-[repeating-linear-gradient(135deg,#dcb07a_0px,#dcb07a_14px,#c99767_14px,#c99767_28px)]" />

                  <div className="absolute left-8 top-8 rounded-lg border-2 border-[#a8bbeb] bg-[#21365b] px-4 py-3 text-xs uppercase tracking-[0.18em] text-blue-100">
                    {activeBeat.label}
                  </div>

                  <div className="absolute right-8 top-8 flex gap-2">
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className={`h-3 w-10 rounded-full border border-white/30 ${
                          index <= stepIndex ? "bg-[#78a0f2]" : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>

                  <div
                    className="absolute left-1/2 top-1/2 z-10"
                    style={{
                      transform: `translate(-50%, calc(-50% + ${activeBeat.bob}px))`,
                      transition: "transform 180ms linear",
                    }}
                  >
                    <div className="absolute left-1/2 top-[86px] h-5 w-16 -translate-x-1/2 rounded-full bg-black/25 blur-sm" />
                    <CharacterSprite
                      preset={preset}
                      scale={3}
                      direction={activeBeat.direction}
                      frameIndex={activeBeat.frameIndex}
                      className="relative z-10"
                    />
                  </div>

                  <div className="absolute inset-x-8 bottom-8 rounded-lg border-2 border-[#ccb382] bg-[#fff8e8] p-4">
                    <p className="pixel-label text-xs uppercase tracking-[0.16em] text-stone-600">Status</p>
                    <p className="mt-2 text-lg font-semibold text-stone-900">{STEPS[stepIndex]}</p>
                    <div className="mt-4 h-4 overflow-hidden rounded-full border-2 border-[#b68b66] bg-[#ecd3a7]">
                      <div
                        className="h-full bg-[linear-gradient(90deg,#4e73c9_0%,#6f92e1_100%)] transition-all duration-300"
                        style={{ width: progressWidth }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="pointer-events-none fixed inset-0 z-50 bg-black transition-opacity duration-[900ms] ease-in-out"
        style={{ opacity: intro || outro ? 1 : 0 }}
        aria-hidden="true"
      />
    </main>
  );
}
