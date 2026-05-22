import React from "react";
import MatchCard from "./MatchCard";

interface BracketVisualizationProps {
  matches: any[];
  teams: Record<number, any>;
  predictions: Record<number, any>;
  onSave: (id: number, a: number, b: number) => void;
  isMatchLocked: (match: any) => boolean;
  onLockTrigger: () => void;
  onDetailTrigger: (match: any) => void;
}

export default function BracketVisualization({
  matches,
  teams,
  predictions,
  onSave,
  isMatchLocked,
  onLockTrigger,
  onDetailTrigger
}: BracketVisualizationProps) {
  // Filter matches for each phase
  const r32 = matches.filter(m => m.phase === "ROUND_OF_32").sort((a, b) => a.matchNumber - b.matchNumber);
  const r16 = matches.filter(m => m.phase === "ROUND_OF_16").sort((a, b) => a.matchNumber - b.matchNumber);
  const qf = matches.filter(m => m.phase === "QUARTERFINALS").sort((a, b) => a.matchNumber - b.matchNumber);
  const sf = matches.filter(m => m.phase === "SEMIFINALS").sort((a, b) => a.matchNumber - b.matchNumber);
  const final = matches.filter(m => m.phase === "FINAL").sort((a, b) => a.matchNumber - b.matchNumber);
  const third = matches.filter(m => m.phase === "THIRD_PLACE").sort((a, b) => a.matchNumber - b.matchNumber);

  const rounds = [
    { title: "Dieciseisavos", matches: r32, spacing: "space-y-4" },
    { title: "Octavos", matches: r16, spacing: "space-y-12 justify-around" },
    { title: "Cuartos", matches: qf, spacing: "space-y-28 justify-around" },
    { title: "Semifinal", matches: sf, spacing: "space-y-48 justify-around" },
    { title: "Final y 3er Puesto", matches: [...final, ...third], spacing: "space-y-16 justify-center" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Árbol de Eliminatorias</h2>
          <p className="text-gray-500 text-[9px] font-bold uppercase tracking-[0.2em]">FASE DE ELIMINACIÓN DIRECTA COMPLETA</p>
        </div>
      </div>

      {/* Bracket Scrolling Container */}
      <div className="overflow-x-auto pb-8 pt-4 no-scrollbar">
        <div className="flex gap-12 min-w-max px-4 items-stretch">
          {rounds.map((round, rIdx) => (
            <div key={rIdx} className="w-80 shrink-0 flex flex-col">
              {/* Round Title */}
              <div className="text-center mb-6 bg-active/40 border border-white/5 py-3 rounded-2xl shadow-inner">
                <span className="text-[10px] font-black uppercase text-accent tracking-[0.2em]">{round.title}</span>
              </div>

              {/* Column of matches */}
              <div className={`flex-1 flex flex-col ${round.spacing}`}>
                {round.matches.map((m) => (
                  <div key={m.id} className="transition-all duration-300">
                    <MatchCard
                      match={m}
                      teams={teams}
                      prediction={predictions[m.id]}
                      onSave={onSave}
                      isLocked={isMatchLocked(m)}
                      onLockTrigger={onLockTrigger}
                      onDetailTrigger={onDetailTrigger}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
