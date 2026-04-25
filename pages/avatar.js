import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { signOut } from "next-auth/react";
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
    router.push("/journey");
  };

  const handleLogout = async () => {
    localStorage.clear();
    await signOut({ callbackUrl: "/base_profile/login/login_page" });
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
        <div className="pixel-panel w-full max-w-4xl p-3 sm:p-5">
          <div className="pixel-screen p-4 sm:p-6">
            <div className="mb-8 flex flex-col gap-3 border-b-2 border-white/20 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="pixel-ribbon inline-block px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                  Character Select
                </div>
                <h1 className="mt-3 text-2xl font-black tracking-[0.12em] text-white sm:text-4xl">
                  Select Your Character
                </h1>
                <p className="mt-2 max-w-xl text-sm text-blue-100/80 sm:text-base">
                  Choose a character for <span className="font-semibold text-white">{playerName}</span>, then continue.
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

            <div className="pixel-subpanel p-4 sm:p-6">
              <div className="pixel-preview px-4 py-6 sm:px-8 sm:py-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  {Object.values(AVATAR_PRESETS).map((preset) => {
                    const selected = config.preset === preset.id;

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setConfig({ preset: preset.id })}
                        className={`relative flex min-h-[360px] flex-col items-center justify-center overflow-hidden rounded-xl border-4 px-4 py-8 transition ${
                          selected
                            ? "border-blue-100 bg-white/10 shadow-[0_0_0_4px_rgba(80,118,203,0.45)]"
                            : "border-white/20 bg-black/10 hover:bg-white/5"
                        }`}
                      >
                        <div className="absolute inset-x-6 bottom-10 h-12 rounded-full bg-black/20 blur-md" />
                        <div className="absolute inset-x-8 bottom-16 h-16 border border-white/10 bg-white/5" />
                        <div className="absolute left-4 top-4">
                          <span
                            className={`pixel-label rounded border px-3 py-1 text-xs uppercase tracking-[0.16em] ${
                              selected
                                ? "border-blue-100/80 bg-blue-500/30 text-white"
                                : "border-white/20 bg-black/20 text-blue-100"
                            }`}
                          >
                            {selected ? "Selected" : "Choose"}
                          </span>
                        </div>

                        <CharacterSprite
                          preset={preset.id}
                          scale={4}
                          className="relative z-10"
                        />

                        <div className="relative z-10 mt-8 text-center">
                          <div className="pixel-title text-xl text-white sm:text-2xl">
                            {preset.role}
                          </div>
                          <p className="mt-2 text-sm uppercase tracking-[0.18em] text-blue-100/80">
                            {preset.label}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t-2 border-white/15 pt-6 sm:flex-row">
                  <div className="text-center sm:text-left">
                    <p className="pixel-label text-xs uppercase tracking-[0.16em] text-blue-100/70">
                      Current Pick
                    </p>
                    <p className="mt-2 pixel-title text-2xl text-white">
                      {AVATAR_PRESETS[config.preset]?.role ?? "Character"}
                    </p>
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
