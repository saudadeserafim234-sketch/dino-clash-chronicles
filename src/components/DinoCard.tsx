import type { Dino } from "@/lib/dinos";

type Props = {
  dino: Dino;
  hidePower?: boolean;
  variant?: "player" | "system";
  label?: string;
};

export function DinoCard({ dino, hidePower, variant = "player", label }: Props) {
  const borderClass = variant === "player" ? "arcade-border" : "arcade-border-orange";
  const labelClass = variant === "player" ? "neon-teal" : "neon-orange";

  return (
    <div className="flex flex-col items-center gap-3">
      {label && (
        <div className={`text-pixel text-[10px] sm:text-xs ${labelClass}`}>{label}</div>
      )}
      <div className={`relative ${borderClass} bg-card p-3 sm:p-4 w-[200px] sm:w-[240px]`}>
        <div className="relative aspect-square bg-background overflow-hidden flex items-center justify-center">
          {hidePower ? (
            <HiddenArt />
          ) : (
            <img
              src={`/dinos/${dino.slug}.png`}
              alt={dino.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                const sib = e.currentTarget.nextElementSibling as HTMLElement | null;
                if (sib) sib.style.display = "flex";
              }}
            />
          )}
          {!hidePower && <FallbackArt name={dino.name} />}
        </div>
        <div className="mt-3 text-center">
          <div className="text-pixel text-[9px] sm:text-[11px] leading-tight min-h-[28px]">
            {hidePower ? "???" : dino.name}
          </div>
          <div className={`mt-2 text-pixel text-sm sm:text-base ${variant === "player" ? "neon-yellow" : "neon-yellow"}`}>
            {hidePower ? "PWR ???" : `PWR ${dino.power}`}
          </div>
        </div>
      </div>
    </div>
  );
}

function HiddenArt() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-pixel text-6xl neon-orange blink">?</div>
    </div>
  );
}

function FallbackArt({ name }: { name: string }) {
  return (
    <div
      style={{ display: "none" }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-background p-2"
    >
      <svg viewBox="0 0 16 16" className="w-32 h-32" shapeRendering="crispEdges">
        {/* Tiny pixel-art generic dino silhouette */}
        {[
          [10,2],[11,2],[12,2],[10,3],[11,3],[12,3],[13,3],
          [9,4],[10,4],[11,4],[12,4],[13,4],[14,4],
          [8,5],[9,5],[10,5],[11,5],[12,5],[13,5],
          [7,6],[8,6],[9,6],[10,6],[11,6],[12,6],
          [3,7],[4,7],[5,7],[6,7],[7,7],[8,7],[9,7],[10,7],[11,7],
          [2,8],[3,8],[4,8],[5,8],[6,8],[7,8],[8,8],[9,8],[10,8],
          [3,9],[4,9],[5,9],[6,9],[7,9],[8,9],[9,9],
          [3,10],[5,10],[7,10],[9,10],
          [3,11],[5,11],[7,11],[9,11],
        ].map(([x,y],i)=>(
          <rect key={i} x={x} y={y} width={1} height={1} fill="#2dd4a8" />
        ))}
      </svg>
      <div className="mt-1 text-pixel text-[8px] neon-teal text-center">{name}</div>
    </div>
  );
}
