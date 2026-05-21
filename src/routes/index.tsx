import { createFileRoute } from "@tanstack/react-router";
import { DinoGame } from "@/components/DinoGame";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dino Arcade — Prehistoric Card Battle" },
      {
        name: "description",
        content:
          "Retro arcade card game with 41 real dinosaur species. Swap or play to climb the leaderboard.",
      },
      { property: "og:title", content: "Dino Arcade — Prehistoric Card Battle" },
      {
        property: "og:description",
        content: "Pixel-art dinosaur card battle. 41 species. Local high scores.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <DinoGame />;
}
