import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { INITIAL_GAME_STATE, MAX_LEVEL } from "../../lib/gameEngine";
import { LEVEL_ROADMAP, formatExercise, levelInstruction } from "../../lib/levels";

export default function LevelGame() {
  const router = useRouter();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const previousFrameRef = useRef(null);
  const phaseRef = useRef("rest");
  const lastRepAtRef = useRef(0);
  const plankIntervalRef = useRef(null);
  const repCountRef = useRef(0);
  const plankSecondsRef = useRef(0);
  const [profile, setProfile] = useState(null);
  const [storedLevel, setStoredLevel] = useState(INITIAL_GAME_STATE.level);
  const [level, setLevel] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [message, setMessage] = useState("");
  const [cameraStatus, setCameraStatus] = useState("idle");
  const [tracking, setTracking] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [plankSeconds, setPlankSeconds] = useState(0);
  const [motionLevel, setMotionLevel] = useState(0);

  const stopCamera = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    previousFrameRef.current = null;
    phaseRef.current = "rest";
    setTracking(false);
    setMotionLevel(0);

    if (plankIntervalRef.current) {
      clearInterval(plankIntervalRef.current);
      plankIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraStatus("idle");
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  useEffect(() => {
    if (!router.isReady) return;

    const username = localStorage.getItem("username");
    const goal = localStorage.getItem("goal");
    if (!username) {
      router.replace("/");
      return;
    }
    if (!goal) {
      router.replace("/onboarding");
      return;
    }

    const requestedLevel = Number(router.query.id);
    const roadmapLevel = LEVEL_ROADMAP.find((item) => item.id === requestedLevel);
    const savedLevel = Number(localStorage.getItem("level"));
    const savedHP = Number(localStorage.getItem("enemyHP") ?? INITIAL_GAME_STATE.enemyHP);
    const safeSavedLevel =
      Number.isFinite(savedLevel) && savedLevel > 0
        ? Math.min(MAX_LEVEL, savedLevel)
        : INITIAL_GAME_STATE.level;

    if (!roadmapLevel || requestedLevel !== safeSavedLevel || savedHP === 0) {
      router.replace("/game");
      return;
    }

    setProfile({ username, goal });
    setStoredLevel(safeSavedLevel);
    setLevel(roadmapLevel);
    setIsComplete(safeSavedLevel === MAX_LEVEL && savedHP === 0);
    setHydrated(true);
  }, [router]);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(""), 2500);
    return () => clearTimeout(id);
  }, [message]);

  const completeLevel = useCallback((completedLevel) => {
    const nextLevel = Math.min(MAX_LEVEL, completedLevel.id + 1);
    const finishedFinalLevel = completedLevel.id === MAX_LEVEL;
    const storedXp = Number(localStorage.getItem("xp"));
    const nextXp = (Number.isFinite(storedXp) && storedXp > 0 ? storedXp : 0) + 100;

    localStorage.setItem("xp", String(nextXp));
    localStorage.setItem("level", String(nextLevel));
    localStorage.setItem("enemyHP", finishedFinalLevel ? "0" : "100");

    setMessage(
      finishedFinalLevel
        ? "All 5 jungle levels complete."
        : `Level ${completedLevel.id} complete. Level ${nextLevel} unlocked.`
    );
    stopCamera();
    setTimeout(() => router.push("/game"), 900);
  }, [router, stopCamera]);

  const checkLevelCompletion = useCallback((completedLevel, reps, seconds) => {
    const repsComplete = completedLevel.targetReps === 0 || reps >= completedLevel.targetReps;
    const secondsComplete =
      completedLevel.targetSeconds === 0 || seconds >= completedLevel.targetSeconds;

    if (repsComplete && secondsComplete) completeLevel(completedLevel);
  }, [completeLevel]);

  const awardRep = useCallback(() => {
    if (!level || isComplete) return;

    setRepCount((score) => {
      const nextScore = score + 1;
      repCountRef.current = nextScore;
      setMessage(`Rep ${nextScore} of ${level.targetReps}`);
      checkLevelCompletion(level, nextScore, plankSecondsRef.current);
      return nextScore;
    });
  }, [checkLevelCompletion, isComplete, level]);

  const trackMotion = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      animationRef.current = requestAnimationFrame(trackMotion);
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const width = canvas.width;
    const height = canvas.height;
    ctx.drawImage(video, 0, 0, width, height);
    const data = ctx.getImageData(0, 0, width, height).data;
    const previousFrame = previousFrameRef.current;
    const currentFrame = new Uint8ClampedArray(width * height);
    let diff = 0;

    for (let i = 0, pixel = 0; i < data.length; i += 4, pixel += 1) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      currentFrame[pixel] = brightness;
      if (previousFrame) diff += Math.abs(brightness - previousFrame[pixel]);
    }

    previousFrameRef.current = currentFrame;

    if (previousFrame) {
      const normalizedMotion = Math.min(100, Math.round(diff / currentFrame.length));
      setMotionLevel(normalizedMotion);

      const now = Date.now();
      if (phaseRef.current === "rest" && normalizedMotion > 18) {
        phaseRef.current = "moving";
      } else if (
        phaseRef.current === "moving" &&
        normalizedMotion < 9 &&
        now - lastRepAtRef.current > 900
      ) {
        lastRepAtRef.current = now;
        phaseRef.current = "rest";
        awardRep();
      }
    }

    animationRef.current = requestAnimationFrame(trackMotion);
  }, [awardRep]);

  const startCamera = async () => {
    if (!level) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("error");
      setMessage("Camera is not supported in this browser.");
      return;
    }

    try {
      setCameraStatus("requesting");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      repCountRef.current = 0;
      plankSecondsRef.current = 0;
      setRepCount(0);
      setPlankSeconds(0);
      setCameraStatus("ready");
      setTracking(true);

      if (level.targetSeconds > 0) {
        plankIntervalRef.current = setInterval(() => {
          setPlankSeconds((seconds) => {
            const nextSeconds = seconds + 1;
            plankSecondsRef.current = nextSeconds;
            setMessage(`${nextSeconds} of ${level.targetSeconds} seconds`);
            checkLevelCompletion(level, repCountRef.current, nextSeconds);
            return nextSeconds;
          });
        }, 1000);
      }

      if (level.targetReps > 0) {
        animationRef.current = requestAnimationFrame(trackMotion);
      }
    } catch (err) {
      setCameraStatus("error");
      setMessage("Camera permission is required to score your workout.");
    }
  };

  if (!hydrated || !profile || !level) return null;

  const exerciseLabel = level.exercises.map(formatExercise).join(" + ");

  return (
    <div className="min-h-screen bg-[#0d2a1b] text-emerald-950">
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(132,204,22,0.26),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(234,179,8,0.24),_transparent_32%),linear-gradient(135deg,_#102f1f,_#1f5d36_48%,_#d6b15f)] px-4 py-8">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <header className="flex flex-col gap-3 rounded-lg border border-lime-200/60 bg-lime-50/90 p-5 shadow-xl md:flex-row md:items-center md:justify-between">
            <div>
              <button
                type="button"
                onClick={() => router.push("/game")}
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-950"
              >
                Back to levels
              </button>
              <h1 className="mt-2 text-3xl font-bold">
                {level.title}: {level.name}
              </h1>
              <p className="mt-1 text-sm text-emerald-800">
                {profile.username} - {exerciseLabel}
              </p>
            </div>
            <div className="rounded-lg bg-emerald-950 px-4 py-3 text-lime-50">
              <p className="text-xs font-semibold uppercase tracking-wide text-lime-200">
                Required
              </p>
              <p className="text-lg font-bold">
                {level.targetReps > 0 && `${level.targetReps} reps`}
                {level.targetReps > 0 && level.targetSeconds > 0 && " + "}
                {level.targetSeconds > 0 && `${level.targetSeconds}s plank`}
              </p>
            </div>
          </header>

          {message && (
            <div className="rounded-lg bg-yellow-100 py-2 text-center font-semibold text-yellow-900 shadow-xl">
              {message}
            </div>
          )}

          <main className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <section className="space-y-4 rounded-lg border border-lime-200/60 bg-lime-50/90 p-5 shadow-xl">
              <div className="relative overflow-hidden rounded-lg bg-emerald-950 aspect-video">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="h-full w-full object-cover scale-x-[-1]"
                />
                {cameraStatus !== "ready" && (
                  <div className="absolute inset-0 flex items-center justify-center px-5 text-center text-sm font-semibold text-lime-50">
                    Camera scoring starts after you allow webcam access.
                  </div>
                )}
              </div>

              <canvas ref={canvasRef} width="80" height="60" className="hidden" />

              <p className="text-sm text-emerald-800">{levelInstruction(level)}</p>

              <button
                type="button"
                onClick={tracking ? stopCamera : startCamera}
                disabled={cameraStatus === "requesting"}
                className="w-full rounded-lg bg-yellow-500 px-4 py-3 font-bold text-emerald-950 shadow-lg hover:bg-yellow-400 disabled:cursor-not-allowed disabled:bg-yellow-200"
              >
                {cameraStatus === "requesting"
                  ? "Starting Camera..."
                  : tracking
                    ? "Stop Tracking"
                    : "Start Camera Tracking"}
              </button>
            </section>

            <aside className="space-y-4 rounded-lg border border-lime-200/60 bg-lime-50/90 p-5 shadow-xl">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                  Trail Progress
                </p>
                <h2 className="mt-1 text-xl font-bold">Level {storedLevel}</h2>
              </div>

              {level.targetReps > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">Reps</span>
                    <span>{repCount} / {level.targetReps}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-emerald-200">
                    <div
                      className="h-full bg-yellow-500 transition-all"
                      style={{ width: `${Math.min(100, (repCount / level.targetReps) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {level.targetSeconds > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">Plank</span>
                    <span>{plankSeconds} / {level.targetSeconds}s</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-emerald-200">
                    <div
                      className="h-full bg-lime-600 transition-all"
                      style={{
                        width: `${Math.min(100, (plankSeconds / level.targetSeconds) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-emerald-950 p-4 text-lime-50">
                <p className="text-sm font-semibold">Motion</p>
                <p className="mt-1 text-3xl font-bold">{motionLevel}%</p>
              </div>
            </aside>
          </main>
        </div>
      </div>
    </div>
  );
}
