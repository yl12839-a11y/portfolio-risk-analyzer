import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { signOut } from "next-auth/react";
import CharacterSprite from "../../components/CharacterSprite";
import { loadProfile } from "../../lib/profile";
import { INITIAL_GAME_STATE, MAX_LEVEL } from "../../lib/gameEngine";
import { LEVEL_ROADMAP, formatExercise, levelInstruction } from "../../lib/levels";

const ROUND_SECONDS = 30;

const POSE_DEFAULT = { direction: "south", frameIndex: 0, bob: 0 };
const POSE_BY_EXERCISE = {
  squat: {
    up: { direction: "south", frameIndex: 0, bob: 0 },
    down: { direction: "south", frameIndex: 1, bob: 18 },
  },
  pushup: {
    up: { direction: "east", frameIndex: 2, bob: 0 },
    down: { direction: "east", frameIndex: 1, bob: 10 },
  },
  plank: {
    up: { direction: "east", frameIndex: 0, bob: 0 },
    down: { direction: "east", frameIndex: 1, bob: 4 },
  },
};

const VISION_BUNDLE_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/vision_bundle.js";
const VISION_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm";
const MODEL_ASSET_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

const MIN_VISIBILITY = 0.5;
const SEGMENTS = [
  [11, 12],
  [11, 23],
  [12, 24],
  [23, 24],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
];
const JOINTS = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
const EXERCISES = {
  squat: {
    DOWN_THRESHOLD: 110,
    UP_THRESHOLD: 150,
    MIN_ANGLE: 70,
    HOLD_REQUIRED: 3,
  },
  pushup: {
    DOWN_THRESHOLD: 90,
    UP_THRESHOLD: 150,
    SHOULDER_DOWN: 130,
    MIN_ANGLE: 50,
    HOLD_REQUIRED: 3,
  },
  plank: {
    BACK_MIN: 160,
    HIP_MIN: 155,
    HOLD_REQUIRED: 30,
  },
};
const EXERCISE_OPTIONS = Object.keys(EXERCISES);

function calcAngle3D(a, b, c) {
  const ba = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  const bc = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
  const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;
  const mag =
    Math.sqrt(ba.x ** 2 + ba.y ** 2 + ba.z ** 2) *
    Math.sqrt(bc.x ** 2 + bc.y ** 2 + bc.z ** 2);

  if (mag === 0) return 0;

  return (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI;
}

function calculateAngles(lm) {
  const kneeL = calcAngle3D(lm[23], lm[25], lm[27]);
  const kneeR = calcAngle3D(lm[24], lm[26], lm[28]);
  const elbowL = calcAngle3D(lm[11], lm[13], lm[15]);
  const elbowR = calcAngle3D(lm[12], lm[14], lm[16]);
  const shoulderL = calcAngle3D(lm[23], lm[11], lm[13]);
  const shoulderR = calcAngle3D(lm[24], lm[12], lm[14]);

  return {
    knee: (kneeL + kneeR) / 2,
    elbow: (elbowL + elbowR) / 2,
    shoulder: (shoulderL + shoulderR) / 2,
    hipAlign: calcAngle3D(lm[11], lm[23], lm[25]),
    hip: calcAngle3D(lm[11], lm[23], lm[25]),
    back: calcAngle3D(lm[11], lm[23], lm[24]),
  };
}

function scoreSquat(minKnee, angles) {
  let score = 100;
  if (minKnee > 110) score -= 30;
  if (minKnee < 70) score -= 30;
  if (angles.back < 160) score -= 20;
  if (angles.hip < 70) score -= 20;
  return Math.max(score, 0);
}

function scorePushup(minElbow, angles) {
  let score = 100;
  if (minElbow > 100) score -= 30;
  if (minElbow < 50) score -= 20;
  if (angles.back < 160) score -= 20;
  if (angles.hipAlign < 160) score -= 30;
  return Math.max(score, 0);
}

function smoothLandmarks(nextLandmarks, previousLandmarks) {
  if (!previousLandmarks) return nextLandmarks;

  return nextLandmarks.map((point, index) => {
    const previous = previousLandmarks[index];
    const dx = point.x - previous.x;
    const dy = point.y - previous.y;
    const movement = Math.sqrt(dx ** 2 + dy ** 2);
    const alpha = Math.min(0.9, 0.1 + movement * 20);

    return {
      x: alpha * point.x + (1 - alpha) * previous.x,
      y: alpha * point.y + (1 - alpha) * previous.y,
      z: alpha * point.z + (1 - alpha) * previous.z,
      visibility: point.visibility,
    };
  });
}

export default function LevelGame() {
  const router = useRouter();
  const videoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const poseLandmarkerRef = useRef(null);
  const smoothedLandmarksRef = useRef(null);
  const repStateRef = useRef("up");
  const holdFramesRef = useRef(0);
  const minAngleRef = useRef(180);
  const plankFramesRef = useRef(0);
  const plankIntervalRef = useRef(null);
  const repCountRef = useRef(0);
  const plankSecondsRef = useRef(0);
  const activeExerciseRef = useRef("pushup");
  const roundIntervalRef = useRef(null);
  const mirrorPoseRef = useRef(POSE_DEFAULT);
  const [profile, setProfile] = useState(null);
  const [players, setPlayers] = useState([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [storedLevel, setStoredLevel] = useState(INITIAL_GAME_STATE.level);
  const [level, setLevel] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [message, setMessage] = useState("");
  const [cameraStatus, setCameraStatus] = useState("idle");
  const [tracking, setTracking] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [plankSeconds, setPlankSeconds] = useState(0);
  const [formMessage, setFormMessage] = useState("--");
  const [formTone, setFormTone] = useState("text-lime-50");
  const [debugLines, setDebugLines] = useState([]);
  const [activeExercise, setActiveExercise] = useState("pushup");
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [mirrorPose, setMirrorPose] = useState(POSE_DEFAULT);
  const [preset, setPreset] = useState("player1");

  const updateMirrorPose = useCallback((exercise, isDown) => {
    const poses = POSE_BY_EXERCISE[exercise] || POSE_BY_EXERCISE.squat;
    const next = isDown ? poses.down : poses.up;
    const current = mirrorPoseRef.current;
    if (
      next.direction === current.direction &&
      next.frameIndex === current.frameIndex &&
      next.bob === current.bob
    ) {
      return;
    }
    mirrorPoseRef.current = next;
    setMirrorPose(next);
  }, []);

  const resetTrackingState = useCallback((nextExercise) => {
    repStateRef.current = "up";
    holdFramesRef.current = 0;
    minAngleRef.current = 180;
    plankFramesRef.current = 0;
    smoothedLandmarksRef.current = null;
    activeExerciseRef.current = nextExercise;
    setActiveExercise(nextExercise);
    setFormMessage("--");
    setFormTone("text-lime-50");
    setDebugLines([]);
    const restPose = (POSE_BY_EXERCISE[nextExercise] || POSE_BY_EXERCISE.squat).up;
    mirrorPoseRef.current = restPose;
    setMirrorPose(restPose);

    if (plankIntervalRef.current) {
      clearInterval(plankIntervalRef.current);
      plankIntervalRef.current = null;
    }
  }, []);

  const updateHudState = useCallback((text, tone = "text-lime-50") => {
    setFormMessage(text);
    setFormTone(tone);
  }, []);

  const awardRep = useCallback(() => {
    setRepCount((current) => {
      const next = current + 1;
      repCountRef.current = next;
      setMessage(`Rep ${next}`);
      return next;
    });
  }, []);

  const incrementPlankSeconds = useCallback(() => {
    setPlankSeconds((seconds) => {
      const next = seconds + 1;
      plankSecondsRef.current = next;
      setMessage(`${next} seconds`);
      return next;
    });
  }, []);

  const toPixel = useCallback((lm, idx, canvas) => {
    const point = lm[idx];
    if (!point || point.visibility < MIN_VISIBILITY) return null;
    return { x: point.x * canvas.width, y: point.y * canvas.height };
  }, []);

  const drawSkeleton = useCallback(
    (lm) => {
      const canvas = overlayCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth = 3;

      for (const [a, b] of SEGMENTS) {
        const start = toPixel(lm, a, canvas);
        const end = toPixel(lm, b, canvas);
        if (!start || !end) continue;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }

      ctx.fillStyle = "#ffffff";
      for (const joint of JOINTS) {
        const point = toPixel(lm, joint, canvas);
        if (!point) continue;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [toPixel]
  );

  const setDebugState = useCallback((angles, stateLabel, exercise) => {
    setDebugLines([
      `Exercise: ${formatExercise(exercise)}`,
      `Knee: ${angles.knee.toFixed(1)} deg`,
      `Elbow: ${angles.elbow.toFixed(1)} deg`,
      `Shoulder: ${angles.shoulder.toFixed(1)} deg`,
      `Hip align: ${angles.hipAlign.toFixed(1)} deg`,
      `Back: ${angles.back.toFixed(1)} deg`,
      `State: ${stateLabel}`,
    ]);
  }, []);

  const countSquat = useCallback(
    (angles) => {
      const cfg = EXERCISES.squat;
      const knee = angles.knee;
      updateMirrorPose("squat", knee < cfg.DOWN_THRESHOLD);

      if (repStateRef.current === "up") {
        if (knee < cfg.DOWN_THRESHOLD) {
          minAngleRef.current = Math.min(minAngleRef.current, knee);
          holdFramesRef.current += 1;
          if (holdFramesRef.current >= cfg.HOLD_REQUIRED) {
            repStateRef.current = "down";
            holdFramesRef.current = 0;
          }
        } else {
          holdFramesRef.current = 0;
          minAngleRef.current = 180;
        }
      } else if (repStateRef.current === "down") {
        minAngleRef.current = Math.min(minAngleRef.current, knee);
        if (knee > cfg.UP_THRESHOLD) {
          holdFramesRef.current += 1;
          if (holdFramesRef.current >= cfg.HOLD_REQUIRED) {
            if (minAngleRef.current > cfg.MIN_ANGLE) {
              awardRep();
              const score = scoreSquat(minAngleRef.current, angles);
              updateHudState(
                `Last rep: ${score}/100`,
                score >= 70 ? "text-lime-300" : "text-red-300"
              );
            } else {
              updateHudState("Too deep!", "text-amber-300");
            }
            repStateRef.current = "up";
            holdFramesRef.current = 0;
            minAngleRef.current = 180;
          }
        } else {
          holdFramesRef.current = 0;
        }
      }

      setDebugState(
        angles,
        `${repStateRef.current} (${holdFramesRef.current}/${cfg.HOLD_REQUIRED})`,
        "squat"
      );
    },
    [awardRep, setDebugState, updateHudState, updateMirrorPose]
  );

  const countPushup = useCallback(
    (angles) => {
      const cfg = EXERCISES.pushup;
      const elbow = angles.elbow;
      const shoulder = angles.shoulder;
      const goodForm = angles.hipAlign > 160;
      updateMirrorPose("pushup", elbow < cfg.DOWN_THRESHOLD);

      if (repStateRef.current === "up") {
        if (elbow < cfg.DOWN_THRESHOLD && shoulder < cfg.SHOULDER_DOWN && goodForm) {
          minAngleRef.current = Math.min(minAngleRef.current, elbow);
          holdFramesRef.current += 1;
          if (holdFramesRef.current >= cfg.HOLD_REQUIRED) {
            repStateRef.current = "down";
            holdFramesRef.current = 0;
          }
        } else {
          holdFramesRef.current = 0;
          minAngleRef.current = 180;
        }
      } else if (repStateRef.current === "down") {
        minAngleRef.current = Math.min(minAngleRef.current, elbow);
        if (elbow > cfg.UP_THRESHOLD) {
          holdFramesRef.current += 1;
          if (holdFramesRef.current >= cfg.HOLD_REQUIRED) {
            if (minAngleRef.current > cfg.MIN_ANGLE && goodForm) {
              awardRep();
              const score = scorePushup(minAngleRef.current, angles);
              updateHudState(
                `Last rep: ${score}/100`,
                score >= 70 ? "text-lime-300" : "text-red-300"
              );
            } else if (!goodForm) {
              updateHudState("Hips sagging!", "text-amber-300");
            } else {
              updateHudState("Too deep!", "text-amber-300");
            }
            repStateRef.current = "up";
            holdFramesRef.current = 0;
            minAngleRef.current = 180;
          }
        } else {
          holdFramesRef.current = 0;
        }
      }

      setDebugState(
        angles,
        `${repStateRef.current} (${holdFramesRef.current}/${cfg.HOLD_REQUIRED})`,
        "pushup"
      );
    },
    [awardRep, setDebugState, updateHudState, updateMirrorPose]
  );

  const countPlank = useCallback(
    (angles) => {
      const cfg = EXERCISES.plank;
      const holding = angles.back > cfg.BACK_MIN && angles.hip > cfg.HIP_MIN;
      updateMirrorPose("plank", holding);

      if (holding) {
        plankFramesRef.current += 1;
        updateHudState("Hold it!", "text-lime-300");

        if (plankFramesRef.current === cfg.HOLD_REQUIRED && !plankIntervalRef.current) {
          plankIntervalRef.current = setInterval(incrementPlankSeconds, 1000);
        }
      } else {
        if (plankIntervalRef.current) {
          clearInterval(plankIntervalRef.current);
          plankIntervalRef.current = null;
          updateHudState("Form broke!", "text-red-300");
        }
        plankFramesRef.current = 0;
      }

      setDebugState(
        angles,
        `${plankIntervalRef.current ? "holding" : "waiting"} (${plankFramesRef.current}/${cfg.HOLD_REQUIRED})`,
        "plank"
      );
    },
    [incrementPlankSeconds, setDebugState, updateHudState, updateMirrorPose]
  );

  const runDetection = useCallback(() => {
    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;
    const landmarker = poseLandmarkerRef.current;

    if (!video || !canvas || !landmarker) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const result = landmarker.detectForVideo(video, performance.now());
    const landmarks = result?.landmarks?.[0];

    if (!landmarks) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setDebugLines(["Waiting for a person in frame..."]);
      updateHudState("Step into the frame", "text-amber-300");
      animationRef.current = requestAnimationFrame(runDetection);
      return;
    }

    const smoothed = smoothLandmarks(landmarks, smoothedLandmarksRef.current);
    smoothedLandmarksRef.current = smoothed;
    const angles = calculateAngles(smoothed);
    drawSkeleton(smoothed);

    if (activeExerciseRef.current === "squat") {
      countSquat(angles);
    } else if (activeExerciseRef.current === "pushup") {
      countPushup(angles);
    } else {
      countPlank(angles);
    }

    animationRef.current = requestAnimationFrame(runDetection);
  }, [countPlank, countPushup, countSquat, drawSkeleton, updateHudState]);

  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (plankIntervalRef.current) {
      clearInterval(plankIntervalRef.current);
      plankIntervalRef.current = null;
    }

    if (roundIntervalRef.current) {
      clearInterval(roundIntervalRef.current);
      roundIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    }

    setTracking(false);
    setCameraStatus("idle");
    resetTrackingState(activeExerciseRef.current);
  }, [resetTrackingState]);

  useEffect(() => stopCamera, [stopCamera]);

  useEffect(() => {
    if (!router.isReady) return;

    const savedPlayers = JSON.parse(localStorage.getItem("players") || "[]");
    const savedActiveIndex = Number(localStorage.getItem("activePlayerIndex") || "0");
    const safeActiveIndex =
      Number.isFinite(savedActiveIndex) && savedActiveIndex >= 0 ? savedActiveIndex : 0;
    const activePlayer = savedPlayers[safeActiveIndex];
    const username = activePlayer?.name || localStorage.getItem("username");
    const goal = activePlayer?.goal || localStorage.getItem("goal");

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
        ? Math.min(LEVEL_ROADMAP.length, savedLevel)
        : INITIAL_GAME_STATE.level;

    if (!roadmapLevel || requestedLevel !== safeSavedLevel || savedHP === 0) {
      router.replace("/game");
      return;
    }

    const initialExercise = roadmapLevel.exercises[0] || "pushup";
    resetTrackingState(initialExercise);
    const storedProfile = loadProfile();
    setPreset(storedProfile.avatar?.preset || "player1");
    setProfile({ username, goal });
    setPlayers(savedPlayers);
    setActivePlayerIndex(safeActiveIndex);
    setStoredLevel(safeSavedLevel);
    setLevel(roadmapLevel);
    setTimeLeft(ROUND_SECONDS);
    setHydrated(true);
  }, [resetTrackingState, router]);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(""), 2500);
    return () => clearTimeout(id);
  }, [message]);

  const ensurePoseLandmarker = useCallback(async () => {
    if (poseLandmarkerRef.current) return poseLandmarkerRef.current;

    const { FilesetResolver, PoseLandmarker } = await import(
      /* webpackIgnore: true */ VISION_BUNDLE_URL
    );
    const vision = await FilesetResolver.forVisionTasks(VISION_WASM_URL);
    poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_ASSET_URL,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numPoses: 1,
    });

    return poseLandmarkerRef.current;
  }, []);

  const startCamera = useCallback(async () => {
    if (!level) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("error");
      setMessage("Camera is not supported in this browser.");
      return;
    }

    try {
      setCameraStatus("loading-model");
      await ensurePoseLandmarker();
      setCameraStatus("requesting");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });

      streamRef.current = stream;
      repCountRef.current = 0;
      plankSecondsRef.current = 0;
      setRepCount(0);
      setPlankSeconds(0);
      resetTrackingState(activeExerciseRef.current || "pushup");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setTracking(true);
      setCameraStatus("ready");
      updateHudState("Pose tracking live", "text-lime-300");
      animationRef.current = requestAnimationFrame(runDetection);

      setTimeLeft(ROUND_SECONDS);
      if (roundIntervalRef.current) clearInterval(roundIntervalRef.current);
      roundIntervalRef.current = setInterval(() => {
        setTimeLeft((current) => {
          if (current <= 1) {
            clearInterval(roundIntervalRef.current);
            roundIntervalRef.current = null;
            return 0;
          }
          return current - 1;
        });
      }, 1000);
    } catch (error) {
      setCameraStatus("error");
      setMessage("Camera permission and model load are required to start.");
    }
  }, [ensurePoseLandmarker, level, resetTrackingState, runDetection, updateHudState]);

  const handleExerciseChange = useCallback(
    (exercise) => {
      if (!EXERCISES[exercise]) return;
      resetTrackingState(exercise);
      updateHudState(`Switched to ${formatExercise(exercise)}`, "text-lime-300");
    },
    [resetTrackingState, updateHudState]
  );

  const finishTurn = useCallback(() => {
    const currentTurnScore = repCountRef.current * 10 + plankSecondsRef.current;
    if (currentTurnScore > 0) {
      fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: currentTurnScore }),
      }).catch(() => {});
    }
    const savedPlayers = JSON.parse(localStorage.getItem("players") || "[]");
    const updatedPlayers = savedPlayers.map((player, index) =>
      index === activePlayerIndex
        ? {
            ...player,
            score: (Number(player.score) || 0) + currentTurnScore,
            completed: true,
          }
        : player
    );
    const nextPlayerIndex = activePlayerIndex + 1;
    const nextPlayer = updatedPlayers[nextPlayerIndex];

    localStorage.setItem("players", JSON.stringify(updatedPlayers));
    localStorage.setItem("activePlayerIndex", String(nextPlayerIndex));
    localStorage.setItem("xp", "0");
    localStorage.setItem("level", "1");
    localStorage.setItem("enemyHP", "100");

    if (nextPlayer) {
      localStorage.setItem("username", nextPlayer.name);
      localStorage.setItem("goal", nextPlayer.goal);
      localStorage.setItem("gameComplete", "false");
      setMessage(`${profile.username} scored ${currentTurnScore}. ${nextPlayer.name} is next.`);
    } else {
      localStorage.setItem("gameComplete", "true");
      setMessage(`${profile.username} scored ${currentTurnScore}. Final scores are ready.`);
    }

    setPlayers(updatedPlayers);
    stopCamera();
    setTimeout(() => router.push("/game"), 900);
  }, [activePlayerIndex, profile?.username, router, stopCamera]);

  const handleLogout = useCallback(async () => {
    stopCamera();
    localStorage.clear();
    await signOut({ callbackUrl: "/base_profile/login/login_page" });
  }, [stopCamera]);

  useEffect(() => {
    if (tracking && timeLeft === 0) {
      finishTurn();
    }
  }, [finishTurn, timeLeft, tracking]);

  if (!hydrated || !profile || !level) return null;

  const exerciseLabel = level.exercises.map(formatExercise).join(" + ");
  const mainCounter = activeExercise === "plank" ? `${plankSeconds}s` : `${repCount}`;

  return (
    <main className="pixel-page px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="pixel-panel p-3 sm:p-5">
          <div className="pixel-screen p-4 sm:p-6">
          <header className="mb-6 flex flex-col gap-3 border-b-2 border-white/20 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/game")}
                  className="text-sm font-semibold text-blue-100 hover:text-white"
                >
                  Back to levels
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-sm font-semibold text-blue-100 hover:text-white"
                >
                  Logout
                </button>
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-[0.12em] text-white">
                {level.title}: {level.name}
              </h1>
              <p className="mt-1 text-sm text-blue-100/80">
                Player {activePlayerIndex + 1} of {players.length || 1}: {profile.username} -{" "}
                {exerciseLabel}
              </p>
            </div>
            <div className="pixel-row px-4 py-4">
              <p className="pixel-label text-xs uppercase tracking-[0.16em] text-stone-600">
                Required
              </p>
              <p className="mt-2 pixel-title text-lg text-stone-900">
                {level.targetReps > 0 && `${level.targetReps} reps`}
                {level.targetReps > 0 && level.targetSeconds > 0 && " + "}
                {level.targetSeconds > 0 && `${level.targetSeconds}s plank`}
              </p>
            </div>
          </header>

          {message && (
            <div className="mb-6 rounded-lg border-2 border-[#d3b882] bg-[#f6ebcf] py-2 text-center font-semibold text-stone-900">
              {message}
            </div>
          )}

          <main className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_340px]">
            <section className="pixel-row space-y-4 p-5">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border-4 border-[#d6e1ff] bg-[#1c2d4d]">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="h-full w-full object-contain scale-x-[-1]"
                />
                <canvas
                  ref={overlayCanvasRef}
                  className="pointer-events-none absolute inset-0 h-full w-full scale-x-[-1]"
                />

                <div className="absolute left-4 top-4 flex items-stretch gap-3">
                  <div className="rounded-lg bg-black/70 px-4 py-3 text-white shadow-lg">
                    <p className="text-4xl font-bold leading-none">{mainCounter}</p>
                    <p className={`mt-2 text-base font-semibold ${formTone}`}>{formMessage}</p>
                  </div>
                  <div
                    className={`flex flex-col items-center justify-center rounded-lg border-2 px-4 py-3 shadow-lg ${
                      tracking && timeLeft <= 3
                        ? "border-red-300 bg-red-500/30 text-red-50 animate-pulse"
                        : "border-lime-300/60 bg-black/70 text-lime-100"
                    }`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Time</p>
                    <p className="text-3xl font-black leading-none">
                      {tracking ? timeLeft : ROUND_SECONDS}s
                    </p>
                  </div>
                </div>

                <div className="absolute right-4 top-4 w-52 rounded-lg bg-black/70 p-3 text-white shadow-lg">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-lime-200">
                    Exercise
                  </p>
                  <div className="space-y-2">
                    {EXERCISE_OPTIONS.map((exercise) => {
                      const selected = activeExercise === exercise;
                      return (
                        <button
                          key={exercise}
                          type="button"
                          onClick={() => handleExerciseChange(exercise)}
                          className={`w-full rounded-lg border px-3 py-2 text-left text-sm font-semibold transition ${
                            selected
                              ? "border-lime-300 bg-lime-500/20 text-lime-200"
                              : "border-white/20 bg-white/5 text-white hover:bg-white/10"
                          }`}
                        >
                          {formatExercise(exercise)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {cameraStatus !== "ready" && (
                  <div className="absolute inset-0 flex items-center justify-center px-5 text-center text-sm font-semibold text-lime-50">
                    {cameraStatus === "loading-model"
                      ? "Loading pose detector..."
                      : cameraStatus === "requesting"
                        ? "Requesting webcam access..."
                        : "Camera scoring starts after you allow webcam access."}
                  </div>
                )}

                <div className="pointer-events-none absolute bottom-4 right-4 flex flex-col items-center rounded-lg border-2 border-lime-300/60 bg-black/70 p-3 text-white shadow-lg">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-lime-200">
                    Buddy
                  </p>
                  <div className="relative flex h-32 w-32 items-end justify-center overflow-hidden">
                    <div className="absolute inset-x-2 bottom-1 h-2 rounded-full bg-black/40 blur-sm" />
                    <div
                      style={{
                        transform: `translateY(${mirrorPose.bob}px)`,
                        transition: "transform 220ms ease-out",
                      }}
                    >
                      <CharacterSprite
                        preset={preset}
                        scale={2}
                        direction={mirrorPose.direction}
                        frameIndex={mirrorPose.frameIndex}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-stone-700">{levelInstruction(level)}</p>

              <button
                type="button"
                onClick={tracking ? finishTurn : startCamera}
                disabled={cameraStatus === "loading-model" || cameraStatus === "requesting"}
                className="pixel-btn pixel-btn-primary w-full px-4 py-3 text-base disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cameraStatus === "loading-model"
                  ? "Loading Detector..."
                  : cameraStatus === "requesting"
                    ? "Starting Camera..."
                    : tracking
                      ? "Stop & Save Score"
                      : "Start Game Camera"}
              </button>
            </section>

            <aside className="pixel-row space-y-4 p-5">
              <div>
                <p className="pixel-label text-xs uppercase tracking-[0.16em] text-stone-600">
                  Trail Progress
                </p>
                <h2 className="mt-2 pixel-title text-xl text-stone-900">Level {storedLevel}</h2>
                <p className="mt-1 text-sm text-stone-700">
                  Current turn score: {repCount * 10 + plankSeconds}
                </p>
              </div>

              {level.targetReps > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">Reps</span>
                    <span>
                      {repCount} / {level.targetReps}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[#d8c8a3]">
                    <div
                      className="h-full bg-[#5076cb] transition-all"
                      style={{ width: `${Math.min(100, (repCount / level.targetReps) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {level.targetSeconds > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">Plank</span>
                    <span>
                      {plankSeconds} / {level.targetSeconds}s
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[#d8c8a3]">
                    <div
                      className="h-full bg-[#b86974] transition-all"
                      style={{
                        width: `${Math.min(100, (plankSeconds / level.targetSeconds) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="rounded-lg border-2 border-[#315693] bg-[#314c7b] p-4 text-white">
                <p className="text-sm font-semibold">Live Debug</p>
                <div className="mt-2 space-y-1 text-sm text-blue-100">
                  {debugLines.length > 0 ? (
                    debugLines.map((line) => <p key={line}>{line}</p>)
                  ) : (
                    <p>Start the camera to see pose feedback.</p>
                  )}
                </div>
              </div>
            </aside>
          </main>
          </div>
        </div>
      </div>
    </main>
  );
}
