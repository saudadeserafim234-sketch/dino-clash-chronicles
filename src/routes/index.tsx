import { createFileRoute } from "@tanstack/react-router";
import { DinoGame } from "@/components/DinoGame";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Megafauna Arcade — Batalha de Cartas Pré-Históricas" },
      {
        name: "description",
        content:
          "Jogo de cartas retro arcade com 41 espécies reais de dinossauros. Troca ou joga para subir na tabela de honra.",
      },
      { property: "og:title", content: "Megafauna Arcade — Batalha de Cartas Pré-Históricas" },
      {
        property: "og:description",
        content: "Batalha de cartas de dinossauros em pixel art. 41 espécies. Pontuações guardadas localmente.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <DinoGame />;
}
