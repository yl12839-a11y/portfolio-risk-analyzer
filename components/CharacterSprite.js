import { useState } from "react";
import {
  AVATAR_PRESETS,
  FRAME_SIZE,
  IDLE_OFFSET_X,
  IDLE_OFFSET_Y,
  SHEET_WIDTH,
} from "../lib/avatar";

const SHEET_HEIGHT = 2944;

export default function CharacterSprite({
  preset = "player1",
  scale = 3,
  className = "",
}) {
  const size = FRAME_SIZE * scale;
  const activePreset = AVATAR_PRESETS[preset] ?? AVATAR_PRESETS.player1;
  const [sheetUrl, setSheetUrl] = useState(activePreset.file);

  return (
    <div
      className={className}
      aria-label="Player character sprite"
      style={{
        position: "relative",
        width: size,
        height: size,
        backgroundImage: `url("${sheetUrl}")`,
        backgroundSize: `${SHEET_WIDTH * scale}px ${SHEET_HEIGHT * scale}px`,
        backgroundPosition: `${IDLE_OFFSET_X * scale}px ${IDLE_OFFSET_Y * scale}px`,
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
