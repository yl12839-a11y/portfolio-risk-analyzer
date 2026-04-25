import { useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/base_profile/login/login_page");
      return;
    }

    const username = session?.user?.username;
    if (!username) return;

    const existingPlayers = (() => {
      try {
        return JSON.parse(localStorage.getItem("players") || "[]");
      } catch {
        return [];
      }
    })();

    if (existingPlayers.length === 0) {
      localStorage.setItem(
        "players",
        JSON.stringify([
          { name: username, goal: "strength", score: 0, completed: false },
        ])
      );
      localStorage.setItem("activePlayerIndex", "0");
      localStorage.setItem("username", username);
      localStorage.setItem("gameComplete", "false");
    }

    router.replace("/avatar");
  }, [status, session, router]);

  return null;
}
