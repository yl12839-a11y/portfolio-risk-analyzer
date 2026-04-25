import { useState } from "react";
import {
  AVATAR_PRESETS,
  BODY_SHEET_HEIGHT,
  DEFAULT_DIRECTION,
  DEFAULT_FRAME_INDEX,
  FRAME_SIZE,
  SHEET_WIDTH,
  WALK_ROW_BY_DIRECTION,
} from "../lib/avatar";

export default function CharacterSprite({
  preset = "player1",
  scale = 3,
  direction = DEFAULT_DIRECTION,
  frameIndex = DEFAULT_FRAME_INDEX,
  className = "",
}) {
  const size = FRAME_SIZE * scale;
  const activePreset = AVATAR_PRESETS[preset] ?? AVATAR_PRESETS.player1;
  const [sheetUrl, setSheetUrl] = useState(activePreset.file);
  const safeDirection = WALK_ROW_BY_DIRECTION[direction] !== undefined ? direction : DEFAULT_DIRECTION;
  const safeFrameIndex = Number.isFinite(frameIndex) ? Math.max(0, Math.floor(frameIndex)) : 0;
  const rowIndex = WALK_ROW_BY_DIRECTION[safeDirection];

  return (
    <div
      className={className}
      aria-label="Player character sprite"
      style={{
        position: "relative",
        width: size,
        height: size,
        backgroundImage: `url("${sheetUrl}")`,
        backgroundSize: `${SHEET_WIDTH * scale}px ${BODY_SHEET_HEIGHT * scale}px`,
        backgroundPosition: `${safeFrameIndex * FRAME_SIZE * -scale}px ${rowIndex * FRAME_SIZE * -scale}px`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
      }}
    >
      <img
        src={sheetUrl}
        alt=""
        hidden
        onError={() => {
          if (sheetUrl !== activePreset.fallback) {
            setSheetUrl(activePreset.fallback);
          }
        }}
      />
    </div>
  );
}
