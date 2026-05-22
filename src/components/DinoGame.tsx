import { useEffect, useState } from "react";
import { DINOS, type Dino, TOTAL_CARDS } from "@/lib/dinos";
import { DinoCard } from "@/components/DinoCard";
import { loadScores, saveScore, type ScoreEntry } from "@/lib/scores";

type Phase = "menu" | "rules" | "playing" | "reveal" | "finished";

type RoundResult = {
  player: Dino;
  system: Dino;
  outcome: "win" | "loss";
  delta: number;
};

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function DinoGame() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [deck, setDeck] = useState<Dino[]>([]);
  const [usedCount, setUsedCount] = useState(0);
  const [player, setPlayer] = useState<Dino | null>(null);
  const [system, setSystem] = useState<Dino | null>(null);
  const [score, setScore] = useState(0);
  const [swapsInARow, setSwapsInARow] = useState(0);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setScores(loadScores());
  }, []);

  const remaining = TOTAL_CARDS - usedCount;
  const progressPct = Math.min(100, (usedCount / TOTAL_CARDS) * 100);

  function startGame() {
    const shuffled = shuffle(DINOS);
    const p = shuffled[0];
    const s = shuffled[1];
    setDeck(shuffled.slice(2));
    setUsedCount(0);
    setPlayer(p);
    setSystem(s);
    setScore(0);
    setSwapsInARow(0);
    setLastResult(null);
    setSaved(false);
    setPhase("playing");
  }

  function drawNext(currentDeck: Dino[]): { p: Dino | null; s: Dino | null; rest: Dino[] } {
    const [a, b, ...rest] = currentDeck;
    return { p: a ?? null, s: b ?? null, rest };
  }

  function handleSwap() {
    if (!player || !system) return;
    if (swapsInARow >= 2) return;
    const newPlayer = system;
    const consumed = usedCount + 1;
    const [next, ...rest] = deck;
    if (!next) {
      setPlayer(newPlayer);
      setSystem(null);
      setUsedCount(consumed + 1);
      setSwapsInARow(swapsInARow + 1);
      finishGame();
      return;
    }
    setPlayer(newPlayer);
    setSystem(next);
    setDeck(rest);
    setUsedCount(consumed);
    setSwapsInARow(swapsInARow + 1);
    setLastResult(null);
  }

  function handlePlay() {
    if (!player || !system) return;
    const sum = player.power + system.power;
    const win = player.power >= system.power;
    const delta = win ? sum : -sum;
    const newScore = score + delta;
    setScore(newScore);
    setLastResult({ player, system, outcome: win ? "win" : "loss", delta });
    setSwapsInARow(0);
    setPhase("reveal");
    const consumed = usedCount + 2;
    setUsedCount(consumed);
  }

  function nextRound() {
    if (usedCount >= TOTAL_CARDS) {
      finishGame();
      return;
    }
    const { p, s, rest } = drawNext(deck);
    if (!p) {
      finishGame();
      return;
    }
    if (!s) {
      setPlayer(p);
      setSystem(null);
      setDeck(rest);
      setUsedCount(TOTAL_CARDS);
      finishGame();
      return;
    }
    setPlayer(p);
    setSystem(s);
    setDeck(rest);
    setLastResult(null);
    setPhase("playing");
  }

  function finishGame() {
    setPhase("finished");
  }

  function handleSaveScore() {
    const name = playerName.trim().slice(0, 16) || "ANÓNIMO";
    const entry: ScoreEntry = {
      name: name.toUpperCase(),
      score,
      date: new Date().toISOString(),
    };
    const next = saveScore(entry);
    setScores(next);
    setSaved(true);
  }

  if (phase === "menu") {
    return <Menu onPlay={() => setPhase("rules")} scores={scores} />;
  }

  if (phase === "rules") {
    return <Rules onStart={startGame} onBack={() => setPhase("menu")} />;
  }

  if (phase === "finished") {
    return (
      <GameOver
        score={score}
        playerName={playerName}
        setPlayerName={setPlayerName}
        onSave={handleSaveScore}
        saved={saved}
        scores={scores}
        onMenu={() => setPhase("menu")}
        onAgain={startGame}
      />
    );
  }

  return (
    <Board
      player={player}
      system={system}
      score={score}
      usedCount={usedCount}
      remaining={remaining}
      progressPct={progressPct}
      swapsInARow={swapsInARow}
      phase={phase}
      lastResult={lastResult}
      onSwap={handleSwap}
      onPlay={handlePlay}
      onContinue={nextRound}
      onQuit={() => setPhase("menu")}
    />
  );
}

/* ============================ MENU ============================ */

function Menu({ onPlay, scores }: { onPlay: () => void; scores: ScoreEntry[] }) {
  return (
    <div className="min-h-screen px-4 py-10 flex flex-col items-center gap-10">
      <header className="text-center">
        <h1 className="text-pixel text-3xl sm:text-5xl neon-teal flicker">
          MEGAFAUNA ARCADE
        </h1>
        <p className="mt-4 text-pixel text-[10px] sm:text-xs neon-orange">
          BATALHA DE CARTAS PRÉ-HISTÓRICAS
        </p>
      </header>

      <button onClick={onPlay} className="arcade-btn arcade-btn-yellow text-base">
        ▶ PREMIR PARA COMEÇAR
      </button>

      <section className="w-full max-w-2xl">
        <h2 className="text-pixel text-sm sm:text-base neon-orange mb-4 text-center">
          ◆ TABELA DE HONRA ◆
        </h2>
        <Leaderboard scores={scores} />
      </section>

      <footer className="text-pixel text-[8px] sm:text-[10px] text-muted-foreground opacity-70">
        v1.0 · GUARDADO LOCALMENTE · 41 ESPÉCIES
      </footer>
    </div>
  );
}

function Leaderboard({ scores }: { scores: ScoreEntry[] }) {
  if (scores.length === 0) {
    return (
      <div className="arcade-border-orange bg-card p-6 text-center">
        <p className="text-pixel text-[10px] sm:text-xs text-muted-foreground">
          AINDA SEM PONTUAÇÕES — SÊ O PRIMEIRO PALEONTÓLOGO
        </p>
      </div>
    );
  }
  return (
    <div className="arcade-border-orange bg-card p-3 sm:p-5">
      <ul className="space-y-2">
        {scores.slice(0, 10).map((s, i) => (
          <li
            key={i}
            className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 text-pixel text-[10px] sm:text-xs"
          >
            <span className={i === 0 ? "neon-yellow" : i < 3 ? "neon-orange" : "neon-teal"}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="truncate">{s.name}</span>
            <span className="neon-yellow">{s.score.toLocaleString("pt-PT")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ============================ REGRAS ============================ */

function Rules({ onStart, onBack }: { onStart: () => void; onBack: () => void }) {
  return (
    <div className="min-h-screen px-4 py-10 flex flex-col items-center">
      <h2 className="text-pixel text-xl sm:text-3xl neon-teal mb-8">COMO JOGAR</h2>
      <div className="arcade-border bg-card p-5 sm:p-8 max-w-2xl text-pixel text-[10px] sm:text-xs leading-relaxed space-y-4">
        <p><span className="neon-yellow">▸ BARALHO:</span> 41 dinossauros reais e únicos, cada um com PODER de 0 a 100.</p>
        <p><span className="neon-yellow">▸ RONDA:</span> A tua carta enfrenta uma carta escondida do sistema.</p>
        <p>
          <span className="neon-orange">▸ TROCAR:</span> Trocas a tua carta pela do sistema.
          A tua carta é eliminada. Só descobres o novo poder depois da troca.
          Máximo de <span className="neon-yellow">2 trocas seguidas</span>.
        </p>
        <p>
          <span className="neon-orange">▸ JOGAR:</span> Revelam-se as duas cartas. Ganha quem tiver maior poder.
          <br />Vitória → <span className="neon-teal">+soma dos dois poderes</span>
          <br />Derrota → <span className="neon-orange">−soma dos dois poderes</span>
          <br />As duas cartas são eliminadas e recebes uma nova.
        </p>
        <p><span className="neon-yellow">▸ FIM:</span> O jogo acaba quando as 41 cartas se esgotam. A pontuação pode ser negativa.</p>
      </div>
      <div className="mt-8 flex flex-wrap gap-4 justify-center">
        <button onClick={onBack} className="arcade-btn arcade-btn-orange">◀ VOLTAR</button>
        <button onClick={onStart} className="arcade-btn arcade-btn-yellow">COMEÇAR ▶</button>
      </div>
    </div>
  );
}

/* ============================ TABULEIRO ============================ */

function Board(props: {
  player: Dino | null;
  system: Dino | null;
  score: number;
  usedCount: number;
  remaining: number;
  progressPct: number;
  swapsInARow: number;
  phase: Phase;
  lastResult: RoundResult | null;
  onSwap: () => void;
  onPlay: () => void;
  onContinue: () => void;
  onQuit: () => void;
}) {
  const {
    player, system, score, usedCount, progressPct,
    swapsInARow, phase, lastResult, onSwap, onPlay, onContinue, onQuit,
  } = props;

  if (!player || !system) return null;

  const swapsLeft = Math.max(0, 2 - swapsInARow);
  const canSwap = phase === "playing" && swapsLeft > 0;

  return (
    <div className="min-h-screen px-4 py-6 flex flex-col items-center gap-6">
      {/* HUD */}
      <div className="w-full max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-pixel text-[9px] sm:text-[11px]">
        <HudCell label="PONTOS" value={score.toLocaleString("pt-PT")} accent={score >= 0 ? "teal" : "orange"} />
        <HudCell label="JOGADAS" value={`${usedCount}/${TOTAL_CARDS}`} accent="yellow" />
        <HudCell label="RESTAM" value={String(Math.max(0, TOTAL_CARDS - usedCount))} accent="teal" />
        <HudCell label="TROCAS" value={String(swapsLeft)} accent="orange" />
      </div>

      {/* Barra de progresso */}
      <div className="w-full max-w-4xl">
        <div className="arcade-border-orange bg-background h-5 relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 transition-all"
            style={{
              width: `${progressPct}%`,
              background:
                "repeating-linear-gradient(90deg, var(--primary) 0 8px, color-mix(in oklab, var(--primary) 60%, black) 8px 12px)",
              boxShadow: "0 0 12px var(--primary)",
            }}
          />
        </div>
      </div>

      {/* Cartas */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 mt-2">
        <DinoCard dino={player} variant="player" label="A TUA CARTA" />
        <div className="text-pixel text-2xl sm:text-4xl neon-yellow">VS</div>
        <DinoCard
          dino={system}
          variant="system"
          label="ADVERSÁRIO"
          hidePower={phase === "playing"}
        />
      </div>

      {phase === "playing" && (
        <div className="flex flex-wrap gap-4 justify-center mt-2">
          <button onClick={onSwap} disabled={!canSwap} className="arcade-btn arcade-btn-orange">
            ⇄ TROCAR {swapsLeft > 0 ? `(RESTAM ${swapsLeft})` : "(MÁX)"}
          </button>
          <button onClick={onPlay} className="arcade-btn">
            ⚔ JOGAR
          </button>
        </div>
      )}

      {phase === "reveal" && lastResult && (
        <div className="flex flex-col items-center gap-4 mt-2">
          <div
            className={`text-pixel text-lg sm:text-2xl ${
              lastResult.outcome === "win" ? "neon-teal" : "neon-orange"
            }`}
          >
            {lastResult.outcome === "win" ? "★ VITÓRIA ★" : "✗ DERROTA ✗"}
          </div>
          <div className="text-pixel text-xs sm:text-sm neon-yellow">
            {lastResult.outcome === "win" ? "+" : "−"}
            {Math.abs(lastResult.delta)} PTS
          </div>
          <button onClick={onContinue} className="arcade-btn arcade-btn-yellow">
            PRÓXIMA RONDA ▶
          </button>
        </div>
      )}

      <button
        onClick={onQuit}
        className="text-pixel text-[9px] sm:text-[10px] text-muted-foreground hover:neon-orange mt-4"
      >
        ◀ SAIR PARA O MENU
      </button>
    </div>
  );
}

function HudCell({ label, value, accent }: { label: string; value: string; accent: "teal" | "orange" | "yellow" }) {
  const cls = accent === "teal" ? "neon-teal" : accent === "orange" ? "neon-orange" : "neon-yellow";
  return (
    <div className="arcade-border bg-card px-3 py-2 text-center">
      <div className="text-muted-foreground">{label}</div>
      <div className={`mt-1 text-sm sm:text-base ${cls}`}>{value}</div>
    </div>
  );
}

/* ============================ FIM DE JOGO ============================ */

function GameOver(props: {
  score: number;
  playerName: string;
  setPlayerName: (n: string) => void;
  onSave: () => void;
  saved: boolean;
  scores: ScoreEntry[];
  onMenu: () => void;
  onAgain: () => void;
}) {
  const { score, playerName, setPlayerName, onSave, saved, scores, onMenu, onAgain } = props;
  return (
    <div className="min-h-screen px-4 py-10 flex flex-col items-center gap-8">
      <h2 className="text-pixel text-2xl sm:text-4xl neon-orange flicker">FIM DE JOGO</h2>
      <div className="arcade-border bg-card p-6 sm:p-8 text-center">
        <div className="text-pixel text-xs sm:text-sm text-muted-foreground">PONTUAÇÃO FINAL</div>
        <div className={`mt-2 text-pixel text-4xl sm:text-6xl ${score >= 0 ? "neon-teal" : "neon-orange"}`}>
          {score.toLocaleString("pt-PT")}
        </div>
      </div>

      {!saved ? (
        <div className="flex flex-col items-center gap-3">
          <label className="text-pixel text-[10px] sm:text-xs neon-yellow">INTRODUZ O TEU NOME</label>
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value.toUpperCase().slice(0, 16))}
            maxLength={16}
            placeholder="ANÓNIMO"
            className="text-pixel text-sm bg-input border-2 border-primary px-3 py-2 text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button onClick={onSave} className="arcade-btn arcade-btn-yellow">GUARDAR PONTUAÇÃO</button>
        </div>
      ) : (
        <div className="text-pixel text-xs neon-teal">✓ PONTUAÇÃO GUARDADA</div>
      )}

      <div className="w-full max-w-2xl">
        <h3 className="text-pixel text-sm neon-orange mb-3 text-center">◆ TABELA DE HONRA ◆</h3>
        <Leaderboard scores={scores} />
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        <button onClick={onMenu} className="arcade-btn arcade-btn-orange">◀ MENU</button>
        <button onClick={onAgain} className="arcade-btn">JOGAR DE NOVO ▶</button>
      </div>
    </div>
  );
}
