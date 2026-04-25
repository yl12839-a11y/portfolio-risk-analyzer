export const LEVEL_ROADMAP = [
  {
    id: 1,
    title: "Level 1",
    name: "Pushup",
    exercises: ["pushup"],
    targetReps: 10,
    targetSeconds: 0,
  },
  {
    id: 2,
    title: "Level 2",
    name: "Squat",
    exercises: ["squat"],
    targetReps: 10,
    targetSeconds: 0,
  },
  {
    id: 3,
    title: "Level 3",
    name: "Plank",
    exercises: ["plank"],
    targetReps: 0,
    targetSeconds: 45,
  },
  {
    id: 4,
    title: "Level 4",
    name: "Mix",
    exercises: ["pushup", "squat"],
    targetReps: 10,
    targetSeconds: 0,
  },
  {
    id: 5,
    title: "Level 5",
    name: "All",
    exercises: ["pushup", "squat", "plank"],
    targetReps: 10,
    targetSeconds: 45,
  },
];

export function formatExercise(exercise) {
  return exercise.charAt(0).toUpperCase() + exercise.slice(1);
}

export function levelInstruction(level) {
  if (level.targetReps > 0 && level.targetSeconds > 0) {
    return `Get ${level.targetReps} detected reps and hold plank for ${level.targetSeconds} seconds to complete this level.`;
  }

  if (level.targetSeconds > 0) {
    return `Keep the camera on while holding plank. This level completes at ${level.targetSeconds} seconds.`;
  }

  return `Start from rep 0. This level completes at ${level.targetReps} detected reps.`;
}
