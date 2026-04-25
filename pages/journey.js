import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { signOut } from "next-auth/react";
import CharacterSprite from "../components/CharacterSprite";
import { loadProfile } from "../lib/profile";

const TILE_SIZE = 32;
const VIEW_COLS = 20;
const VIEW_ROWS = 13;
const WALK_SPEED = 0.11;
const WATER_TILE_IDS = new Set([3, 12, 13, 14, 15]);
const PASSABLE_WALL_TILE_IDS = new Set([16]);
const KEY_TO_VECTOR = {
  ArrowUp: { x: 0, y: -1, direction: "north" },
  KeyW: { x: 0, y: -1, direction: "north" },
  ArrowDown: { x: 0, y: 1, direction: "south" },
  KeyS: { x: 0, y: 1, direction: "south" },
  ArrowLeft: { x: -1, y: 0, direction: "west" },
  KeyA: { x: -1, y: 0, direction: "west" },
  ArrowRight: { x: 1, y: 0, direction: "east" },
  KeyD: { x: 1, y: 0, direction: "east" },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getLayer(map, name) {
  return map?.layers?.find((layer) => layer.name === name);
}

function getObject(map, name) {
  const objectLayer = map?.layers?.find((layer) => layer.type === "objectgroup" && layer.name === "objects");
  return objectLayer?.objects?.find((object) => object.name === name) || null;
}

function readTile(layer, width, x, y) {
  if (!layer || x < 0 || y < 0 || x >= width || y >= layer.height) return 0;
  return layer.data[y * width + x] || 0;
}

function makeTileStyle(tileId, tileset) {
  if (!tileId || !tileset) return null;

  const localId = tileId - 1;
  const col = localId % tileset.columns;
  const row = Math.floor(localId / tileset.columns);

  return {
    backgroundImage: `url("${tileset.image}")`,
    backgroundSize: `${tileset.imagewidth}px ${tileset.imageheight}px`,
    backgroundPosition: `${col * -TILE_SIZE}px ${row * -TILE_SIZE}px`,
    backgroundRepeat: "no-repeat",
    imageRendering: "pixelated",
  };
}

export default function JourneyPage() {
  const router = useRouter();
  const animationRef = useRef(null);
  const lastFrameRef = useRef(0);
  const keysRef = useRef(new Set());
  const pendingRouteRef = useRef(null);
  const transitioningRef = useRef(false);
  const [hydrated, setHydrated] = useState(false);
  const [playerName, setPlayerName] = useState("Adventurer");
  const [preset, setPreset] = useState("player1");
  const [mapData, setMapData] = useState(null);
  const [tileset, setTileset] = useState(null);
  const [player, setPlayer] = useState({ x: 25, y: 35, direction: "north", moving: false });
  const [message, setMessage] = useState("Use arrow keys or WASD to explore the grasslands and find the gym.");
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const savedPlayers = JSON.parse(localStorage.getItem("players") || "[]");
    if (savedPlayers.length === 0) {
      router.replace("/");
      return;
    }

    const profile = loadProfile();
    setPlayerName(profile.username || savedPlayers[0]?.name || "Adventurer");
    setPreset(profile.avatar?.preset || "player1");
    setHydrated(true);
  }, [router]);

  useEffect(() => {
    if (!hydrated) return;

    let cancelled = false;

    async function loadMap() {
      const map = await fetch("/maps/gym-run.tmj").then((response) => response.json());
      const source = map.tilesets?.[0]?.source;
      const resolvedTilesetPath = source?.replace("../tilesets/", "/tilesets/");
      const tilesetData = await fetch(resolvedTilesetPath).then((response) => response.json());
      const spawn = getObject(map, "player_spawn");

      if (cancelled) return;

      setMapData(map);
      setTileset({
        ...tilesetData,
        image: `/tilesets/${tilesetData.image}`,
      });

      if (spawn) {
        setPlayer((current) => ({
          ...current,
          x: spawn.x / TILE_SIZE,
          y: spawn.y / TILE_SIZE,
          direction: "north",
          moving: false,
        }));
      }
    }

    loadMap();

    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  const handleLogout = useCallback(async () => {
    localStorage.clear();
    await signOut({ callbackUrl: "/base_profile/login/login_page" });
  }, []);

  useEffect(() => {
    if (!mapData) return;

    const onKeyDown = (event) => {
      if (transitioningRef.current) return;
      if (KEY_TO_VECTOR[event.code]) {
        event.preventDefault();
        keysRef.current.add(event.code);
      }
    };

    const onKeyUp = (event) => {
      keysRef.current.delete(event.code);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [mapData]);

  useEffect(() => {
    if (!mapData) return;

    const ground = getLayer(mapData, "ground");
    const walls = getLayer(mapData, "walls");
    const gymEntry = getObject(mapData, "gym_entry");

    const tick = (time) => {
      if (!lastFrameRef.current) lastFrameRef.current = time;
      const delta = time - lastFrameRef.current;
      lastFrameRef.current = time;
      const moveDistance = (delta / 16.67) * WALK_SPEED;
      const pressed = Array.from(keysRef.current);
      const activeKey = pressed[pressed.length - 1];
      const vector = activeKey ? KEY_TO_VECTOR[activeKey] : null;

      setPlayer((current) => {
        if (transitioningRef.current) {
          return current.moving ? { ...current, moving: false } : current;
        }
        if (!vector) {
          return current.moving ? { ...current, moving: false } : current;
        }

        const nextX = current.x + vector.x * moveDistance;
        const nextY = current.y + vector.y * moveDistance;
        const tileX = Math.floor(nextX);
        const tileY = Math.floor(nextY);
        const feetX = (nextX + 0.5) * TILE_SIZE;
        const feetY = (nextY + 0.85) * TILE_SIZE;
        const blockedByWater = WATER_TILE_IDS.has(readTile(ground, mapData.width, tileX, tileY));
        const wallTile = readTile(walls, mapData.width, tileX, tileY);
        const blockedByWall = wallTile !== 0 && !PASSABLE_WALL_TILE_IDS.has(wallTile);
        const outside = tileX < 0 || tileY < 0 || tileX >= mapData.width || tileY >= mapData.height;

        const updated = {
          ...current,
          direction: vector.direction,
          moving: true,
        };

        if (outside || blockedByWater || blockedByWall) {
          return updated;
        }

        const isOnGymDoorTile = wallTile === 16;
        const isInsideGymEntry =
          gymEntry &&
          feetX >= gymEntry.x &&
          feetX <= gymEntry.x + gymEntry.width &&
          feetY >= gymEntry.y &&
          feetY <= gymEntry.y + gymEntry.height;
        const isInsideGymFrontZone =
          gymEntry &&
          tileX >= Math.floor(gymEntry.x / TILE_SIZE) - 1 &&
          tileX <= Math.ceil((gymEntry.x + gymEntry.width) / TILE_SIZE) &&
          tileY >= Math.floor(gymEntry.y / TILE_SIZE) - 5 &&
          tileY <= Math.ceil((gymEntry.y + gymEntry.height) / TILE_SIZE);

        if (isOnGymDoorTile || isInsideGymEntry || isInsideGymFrontZone) {
          if (!pendingRouteRef.current) {
            transitioningRef.current = true;
            setTransitioning(true);
            setMessage("Entering the gym...");
            keysRef.current.clear();
            pendingRouteRef.current = setTimeout(() => router.push("/gym-entry"), 950);
            return {
              ...updated,
              x: nextX,
              y: nextY,
              direction: "north",
              moving: false,
            };
          }
        }

        return {
          ...updated,
          x: nextX,
          y: nextY,
        };
      });

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (pendingRouteRef.current) clearTimeout(pendingRouteRef.current);
      lastFrameRef.current = 0;
    };
  }, [mapData, router]);

  const viewport = useMemo(() => {
    if (!mapData) return null;
    const left = clamp(player.x - VIEW_COLS / 2, 0, Math.max(0, mapData.width - VIEW_COLS));
    const top = clamp(player.y - VIEW_ROWS / 2, 0, Math.max(0, mapData.height - VIEW_ROWS));
    const tileLeft = Math.floor(left);
    const tileTop = Math.floor(top);
    return {
      left,
      top,
      tileLeft,
      tileTop,
      offsetX: (left - tileLeft) * TILE_SIZE,
      offsetY: (top - tileTop) * TILE_SIZE,
    };
  }, [mapData, player.x, player.y]);

  const tilesToRender = useMemo(() => {
    if (!mapData || !viewport) return [];
    const ground = getLayer(mapData, "ground");
    const decor = getLayer(mapData, "decor");
    const walls = getLayer(mapData, "walls");
    const tiles = [];

    for (let row = 0; row <= VIEW_ROWS; row += 1) {
      for (let col = 0; col <= VIEW_COLS; col += 1) {
        const mapX = viewport.tileLeft + col;
        const mapY = viewport.tileTop + row;
        tiles.push({
          key: `${mapX}-${mapY}`,
          left: col * TILE_SIZE,
          top: row * TILE_SIZE,
          ground: readTile(ground, mapData.width, mapX, mapY),
          decor: readTile(decor, mapData.width, mapX, mapY),
          walls: readTile(walls, mapData.width, mapX, mapY),
        });
      }
    }

    return tiles;
  }, [mapData, viewport?.tileLeft, viewport?.tileTop]);

  const frameIndex = player.moving ? Math.floor((player.x + player.y) * 6) % 9 : 0;
  const playerScreen = useMemo(() => {
    if (!viewport) return { left: 0, top: 0 };
    return {
      left: (player.x - viewport.left) * TILE_SIZE,
      top: (player.y - viewport.top) * TILE_SIZE,
    };
  }, [player.x, player.y, viewport]);

  const gymGuide = useMemo(() => {
    if (!mapData || !viewport) return null;
    const gymEntry = getObject(mapData, "gym_entry");
    if (!gymEntry) return null;
    const gymTileX = (gymEntry.x + gymEntry.width / 2) / TILE_SIZE;
    const gymTileY = (gymEntry.y + gymEntry.height / 2) / TILE_SIZE;
    const dx = gymTileX - (player.x + 0.5);
    const dy = gymTileY - (player.y + 0.5);
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    const onScreen =
      gymTileX >= viewport.left &&
      gymTileX <= viewport.left + VIEW_COLS &&
      gymTileY >= viewport.top &&
      gymTileY <= viewport.top + VIEW_ROWS;
    return {
      distance,
      angleDeg,
      onScreen,
      markerLeft: (gymTileX - viewport.left) * TILE_SIZE,
      markerTop: (gymTileY - viewport.top) * TILE_SIZE,
    };
  }, [mapData, viewport, player.x, player.y]);

  if (!hydrated || !mapData || !tileset || !viewport) return null;

  return (
    <main className="pixel-page relative px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <div className="pixel-panel w-full max-w-6xl p-3 sm:p-5">
          <div className="pixel-screen p-4 sm:p-6">
            <div className="mb-8 flex flex-col gap-3 border-b-2 border-white/20 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="pixel-ribbon inline-block px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                  Grasslands
                </div>
                <h1 className="mt-3 text-2xl font-black tracking-[0.12em] text-white sm:text-4xl">
                  {playerName}, Find The Gym
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-blue-100/80 sm:text-base">
                  Explore the overworld freely. Water and buildings block movement, but grassland is open.
                </p>
              </div>
              <div className="flex items-center gap-3 self-start border-2 border-blue-200/40 bg-black/15 px-3 py-2 text-xs uppercase tracking-[0.2em] text-blue-100 sm:self-auto">
                <div className="pixel-orb h-5 w-5 shrink-0" />
                Free Roam
              </div>
            </div>

            <div className="pixel-subpanel p-4 sm:p-6">
              <div className="pixel-preview overflow-hidden p-4">
                <div
                  className="relative mx-auto overflow-hidden rounded-lg border-4 border-[#d6e1ff] bg-[#1c2d4d]"
                  style={{ width: VIEW_COLS * TILE_SIZE, height: VIEW_ROWS * TILE_SIZE }}
                >
                  <div
                    className="absolute inset-0 will-change-transform"
                    style={{ transform: `translate(${-viewport.offsetX}px, ${-viewport.offsetY}px)` }}
                  >
                    {tilesToRender.map((tile) => (
                      <div key={tile.key} className="absolute" style={{ left: tile.left, top: tile.top, width: TILE_SIZE, height: TILE_SIZE }}>
                        {tile.ground > 0 && (
                          <div className="absolute inset-0" style={makeTileStyle(tile.ground, tileset)} />
                        )}
                        {tile.decor > 0 && (
                          <div className="absolute inset-0" style={makeTileStyle(tile.decor, tileset)} />
                        )}
                        {tile.walls > 0 && (
                          <div className="absolute inset-0" style={makeTileStyle(tile.walls, tileset)} />
                        )}
                      </div>
                    ))}
                  </div>

                  <div
                    className="absolute z-20"
                    style={{
                      left: playerScreen.left,
                      top: playerScreen.top,
                      width: TILE_SIZE,
                      height: TILE_SIZE,
                      transform: "translate(-25%, -35%)",
                    }}
                  >
                    <div className="absolute left-1/2 top-[80%] h-4 w-10 -translate-x-1/2 rounded-full bg-black/20 blur-sm" />
                    <CharacterSprite
                      preset={preset}
                      scale={2}
                      direction={player.direction}
                      frameIndex={frameIndex}
                      className="relative z-10"
                    />
                  </div>

                  {gymGuide && gymGuide.distance > 2.5 && !transitioning && (
                    <div
                      className="pointer-events-none absolute z-30 flex flex-col items-center gap-1"
                      style={{
                        left: playerScreen.left + TILE_SIZE / 2,
                        top: playerScreen.top - 18,
                        transform: "translate(-50%, -100%)",
                      }}
                    >
                      <div className="rounded-sm border-2 border-yellow-200 bg-black/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-yellow-200 shadow-[0_2px_0_rgba(0,0,0,0.6)]">
                        Gym · {Math.round(gymGuide.distance)}
                      </div>
                      <div
                        className="drop-shadow-[0_2px_0_rgba(0,0,0,0.85)]"
                        style={{
                          transform: `rotate(${gymGuide.angleDeg}deg)`,
                          transformOrigin: "center",
                        }}
                      >
                        <svg
                          width="56"
                          height="28"
                          viewBox="0 0 56 28"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <path
                            d="M2 10 H30 V2 L54 14 L30 26 V18 H2 Z"
                            fill="#facc15"
                            stroke="#1f1300"
                            strokeWidth="2.5"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  )}

                  {gymGuide && gymGuide.onScreen && !transitioning && (
                    <div
                      className="pointer-events-none absolute z-30 flex flex-col items-center"
                      style={{
                        left: gymGuide.markerLeft,
                        top: gymGuide.markerTop - 20,
                        transform: "translate(-50%, -100%)",
                      }}
                    >
                      <div className="rounded-sm border border-yellow-200/70 bg-black/65 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-yellow-200">
                        Gym
                      </div>
                      <div className="text-xl leading-none text-yellow-300 drop-shadow-[0_2px_0_rgba(0,0,0,0.7)]">
                        ▼
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t-2 border-white/15 pt-6 sm:flex-row">
                <div className="text-center sm:text-left">
                  <p className="pixel-label text-xs uppercase tracking-[0.16em] text-stone-600">
                    Controls
                  </p>
                  <p className="mt-2 text-sm font-semibold text-stone-900">
                    Move with <span className="pixel-label">WASD</span> or{" "}
                    <span className="pixel-label">Arrow Keys</span>.
                  </p>
                  <p className="mt-2 text-sm text-stone-700">{message}</p>
                </div>

                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="pixel-btn pixel-btn-secondary px-6 py-3 text-base"
                  >
                    Logout
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/onboarding")}
                    className="pixel-btn pixel-btn-primary px-6 py-3 text-base"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="pointer-events-none fixed inset-0 z-50 bg-black transition-opacity duration-[900ms] ease-in-out"
        style={{ opacity: transitioning ? 1 : 0 }}
        aria-hidden="true"
      />
    </main>
  );
}
