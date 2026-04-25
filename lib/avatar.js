export const DEFAULT_AVATAR = {
  preset: "player1",
};

export const AVATAR_PRESETS = {
  player1: {
    id: "player1",
    label: "Player 1",
    role: "Girl",
    file: "/sprites/player1.png",
    fallback: "/sprites/player-fallback.png",
  },
  player2: {
    id: "player2",
    label: "Player 2",
    role: "Boy",
    file: "/sprites/player2.png",
    fallback: "/sprites/player2-fallback.png",
  },
};

export const FRAME_SIZE = 64;
export const SHEET_WIDTH = 832;
export const BODY_SHEET_HEIGHT = 2944;
export const CLOTHING_SHEET_HEIGHT = 1344;
export const WALK_ROW_BY_DIRECTION = {
  north: 8,
  west: 9,
  south: 10,
  east: 11,
};
export const DEFAULT_DIRECTION = "south";
export const DEFAULT_FRAME_INDEX = 0;
