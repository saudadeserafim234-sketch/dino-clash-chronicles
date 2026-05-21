export type ScoreEntry = { name: string; score: number; date: string };

const KEY = "dino_arcade_scores_v1";

export function loadScores(): ScoreEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as ScoreEntry[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveScore(entry: ScoreEntry) {
  const all = loadScores();
  all.push(entry);
  all.sort((a, b) => b.score - a.score);
  const trimmed = all.slice(0, 50);
  window.localStorage.setItem(KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function clearScores() {
  window.localStorage.removeItem(KEY);
}
