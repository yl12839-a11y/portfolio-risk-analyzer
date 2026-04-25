import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { loadProfile, saveProfile } from "../lib/profile";
import { AVATAR_PRESETS, DEFAULT_AVATAR } from "../lib/avatar";
import CharacterSprite from "../components/CharacterSprite";

export default function AvatarCreator() {
  const router = useRouter();
  const [config, setConfig] = useState(DEFAULT_AVATAR);
  const [hydrated, setHydrated] = useState(false);
  const [playerName, setPlayerName] = useState("Adventurer");
  const [statusMessage, setStatusMessage] = useState("Loading your workshop...");
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    const profile = loadProfile();
    if (!profile.username) {
      setPreviewMode(true);
      setStatusMessage("Preview mode: no saved profile found, using default character settings.");
      setHydrated(true);
      return;
    }
    setPlayerName(profile.username);
    if (profile.avatar && typeof profile.avatar === "object") {
      setConfig({ ...DEFAULT_AVATAR, ...profile.avatar });
    }
    setHydrated(true);
  }, [router]);

  const handleContinue = () => {
    if (previewMode) {
      setStatusMessage("Preview mode is active. Finish login to save this character.");
      return;
    }
    saveProfile({ avatar: config });
    router.push("/onboarding");
  };

  if (!hydrated) {
    return (
      <div className="pixel-page px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl items-center justify-center">
          <div className="pixel-panel w-full max-w-2xl p-3 sm:p-5">
            <div className="pixel-screen p-8 text-center sm:p-10">
              <div className="pixel-ribbon inline-block px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                Preparing Session
              </div>
              <h1 className="mt-4 text-2xl font-black tracking-[0.12em] text-white sm:text-3xl">
                Opening Character Workshop
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-sm text-blue-100/85 sm:text-base">
                {statusMessage}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pixel-page px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <div className="pixel-panel w-full max-w-5xl p-3 sm:p-5">
          <div className="pixel-screen p-4 sm:p-6">
            <div className="mb-6 flex flex-col gap-3 border-b-2 border-white/20 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="pixel-ribbon inline-block px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                  Character Select
                </div>
                <h1 className="mt-3 text-2xl font-black tracking-[0.12em] text-white sm:text-4xl">
                  Select Your Character
                </h1>
                <p className="mt-2 max-w-xl text-sm text-blue-100/80 sm:text-base">
                  Pick who <span className="font-semibold text-white">{playerName}</span> will play as before entering the game.
                </p>
                {previewMode && (
                  <p className="mt-3 max-w-xl text-sm text-amber-100">
                    Preview mode is on. Finish the full setup flow to save this choice.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 self-start border-2 border-blue-200/40 bg-black/15 px-3 py-2 text-xs uppercase tracking-[0.2em] text-blue-100 sm:self-auto">
                <div className="pixel-orb h-5 w-5 shrink-0" />
                {previewMode ? "Preview Mode" : "Select One"}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
              <div className="pixel-subpanel p-4">
                <div className="pixel-preview flex min-h-[320px] items-center justify-center p-6 sm:min-h-[360px]">
                  <div className="grid w-full gap-4 sm:grid-cols-2">
                    {Object.values(AVATAR_PRESETS).map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setConfig({ preset: preset.id })}
                        className={`relative flex flex-col items-center rounded-lg p-2 transition ${
                          config.preset === preset.id
                            ? "bg-white/10 ring-2 ring-blue-200/70"
                            : "bg-transparent hover:bg-white/5"
                        }`}
                      >
                        <div className="absolute bottom-3 h-5 w-24 bg-black/25 blur-[2px]" />
                        <div className="absolute bottom-5 h-8 w-28 border border-white/10 bg-emerald-200/10" />
                        <CharacterSprite
                          preset={preset.id}
                          scale={3}
                          className="relative z-10"
                        />
                        <div className={`mt-4 rounded border px-3 py-1 text-xs uppercase tracking-[0.16em] ${
                          config.preset === preset.id
                            ? "border-blue-200/80 bg-blue-500/20 text-white"
                            : "border-white/15 bg-black/15 text-blue-100"
                        }`}>
                          {preset.role}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              <div className="pixel-subpanel p-4 sm:p-5">
                <div className="mt-5 pixel-row p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="pixel-label text-xs uppercase text-stone-600">Selection</div>
                      <div className="pixel-title mt-1 text-xl text-stone-900">Ready To Enter</div>
                    </div>
                    <div className="pixel-label border-2 border-stone-500/40 bg-white/50 px-3 py-1 text-xs text-stone-700">
                      Character Chosen
                    </div>
                  </div>

                  <div className="pixel-screen px-4 py-5 text-center">
                    <div className="pixel-title text-xl text-white sm:text-2xl">
                      {AVATAR_PRESETS[config.preset]?.label ?? "Character"}
                    </div>
                    <div className="mt-2 text-sm text-blue-100/85">
                      Selected: <span className="font-semibold text-white">{AVATAR_PRESETS[config.preset]?.role ?? "Unknown"}</span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {Object.values(AVATAR_PRESETS).map((preset) => (
                      <div key={preset.id} className="pixel-row px-4 py-3">
                        <div className="pixel-label text-xs uppercase text-stone-600">{preset.label}</div>
                        <div className="mt-1 text-sm font-semibold text-stone-900">{preset.role}</div>
                      </div>
                    ))}
                    <div className="pixel-row px-4 py-3">
                      <div className="pixel-label text-xs uppercase text-stone-600">Current Pick</div>
                      <div className="mt-1 text-sm font-semibold text-stone-900">{AVATAR_PRESETS[config.preset]?.role ?? "Unknown"}</div>
                    </div>
                    <div className="pixel-row px-4 py-3">
                      <div className="pixel-label text-xs uppercase text-stone-600">Action</div>
                      <div className="mt-1 text-sm font-semibold text-stone-900">Press Continue</div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={handleContinue}
                      className="pixel-btn pixel-btn-primary px-6 py-3 text-base"
                    >
                      {previewMode ? "Preview Only" : "Continue"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
