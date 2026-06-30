import React, { useEffect, useState } from "react";
import { X, Shield, Trophy, Award, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { predictionService } from "../lib/services";
import { cn } from "../lib/utils";

interface MatchElectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: any;
}

export default function MatchElectionsModal({ isOpen, onClose, match }: MatchElectionsModalProps) {
  const [loading, setLoading] = useState(false);
  const [elections, setElections] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const teamA = match?.teamA;
  const teamB = match?.teamB;
  const isFinished = match?.status === "FINISHED";

  useEffect(() => {
    if (!isOpen || !match?.id) return;

    const fetchElections = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await predictionService.getMatchElections(match.id);
        const data = res.data.data || [];

        // Sorting logic based on match status
        if (isFinished) {
          // Sort: has prediction first, then points earned descending, break ties by general points
          data.sort((a: any, b: any) => {
            const hasPredA = !!a.prediction;
            const hasPredB = !!b.prediction;

            // Put users without prediction at the absolute bottom
            if (hasPredA !== hasPredB) {
              return hasPredA ? -1 : 1;
            }

            // If both have prediction, sort by points earned descending
            if (hasPredA && hasPredB) {
              const ptsA = a.prediction.pointsEarned || 0;
              const ptsB = b.prediction.pointsEarned || 0;
              if (ptsB !== ptsA) return ptsB - ptsA;
            }

            // Fallback to overall points descending
            return (b.user.points || 0) - (a.user.points || 0);
          });
        } else {
          // Sort by overall leaderboard points descending
          data.sort((a: any, b: any) => (b.user.points || 0) - (a.user.points || 0));
        }

        setElections(data);
      } catch (err) {
        console.error("Error loading match elections:", err);
        setError("Error al cargar las elecciones de los jugadores.");
      } finally {
        setLoading(false);
      }
    };

    fetchElections();
  }, [isOpen, match?.id, isFinished]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="bg-card border border-border-main rounded-[2.5rem] w-full max-w-4xl p-6 md:p-8 relative overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]"
          >
            {/* Ambient glows */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button X */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-text-muted hover:text-text-main transition-colors p-2 hover:bg-active rounded-full cursor-pointer z-20"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="mb-6 shrink-0">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none">
                Elecciones de la Comunidad
              </span>
              <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-text-main mt-1">
                Elecciones - Partido #{match?.matchNumber}
              </h3>
            </div>

            {/* Top Banner (Stacked Teams left, score right with dividers) */}
            <div className="bg-active/30 border border-border-main/70 rounded-3xl mb-6 relative overflow-hidden shrink-0 grid grid-cols-[1fr_120px] z-10">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />

              {/* Team A */}
              <div className="flex items-center gap-4 p-4 border-r border-border-main/40 col-span-1">
                <div className="w-11 h-11 rounded-full bg-card border border-border-main flex items-center justify-center p-0.5 overflow-hidden shrink-0 shadow-md">
                  {teamA?.logoUrl ? (
                    <img src={teamA.logoUrl} className="w-full h-full object-contain rounded-full" alt="" />
                  ) : (
                    <Shield size={18} className="text-text-muted" />
                  )}
                </div>
                <span className="font-black uppercase text-sm md:text-base tracking-tight text-text-main italic">
                  {teamA?.name || "TBD"}
                </span>
              </div>

              {/* Score A */}
              <div className="flex items-center justify-center p-4 col-span-1">
                <span className="text-xl md:text-2xl font-mono font-black text-text-main flex items-center gap-1.5">
                  {isFinished ? match?.scoreA : "TBD"}
                  {isFinished && match?.penaltiesScoreA !== null && match?.penaltiesScoreA !== undefined && (
                    <span className="text-sm font-bold text-accent">({match.penaltiesScoreA})</span>
                  )}
                </span>
              </div>

              {/* Team B */}
              <div className="flex items-center gap-4 p-4 border-t border-r border-border-main/40 col-span-1">
                <div className="w-11 h-11 rounded-full bg-card border border-border-main flex items-center justify-center p-0.5 overflow-hidden shrink-0 shadow-md">
                  {teamB?.logoUrl ? (
                    <img src={teamB.logoUrl} className="w-full h-full object-contain rounded-full" alt="" />
                  ) : (
                    <Shield size={18} className="text-text-muted" />
                  )}
                </div>
                <span className="font-black uppercase text-sm md:text-base tracking-tight text-text-main italic">
                  {teamB?.name || "TBD"}
                </span>
              </div>

              {/* Score B */}
              <div className="flex items-center justify-center p-4 border-t border-border-main/40 col-span-1">
                <span className="text-xl md:text-2xl font-mono font-black text-text-main flex items-center gap-1.5">
                  {isFinished ? match?.scoreB : "TBD"}
                  {isFinished && match?.penaltiesScoreB !== null && match?.penaltiesScoreB !== undefined && (
                    <span className="text-sm font-bold text-accent">({match.penaltiesScoreB})</span>
                  )}
                </span>
              </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              {loading ? (
                <div className="flex-1 flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                    <p className="text-text-muted text-xs font-black uppercase tracking-widest">
                      Cargando predicciones de la comunidad...
                    </p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex-1 flex items-center justify-center py-20 text-red-500 font-bold text-sm uppercase tracking-wider">
                  {error}
                </div>
              ) : elections.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-20 text-text-muted font-bold text-xs uppercase tracking-widest italic">
                  No hay participantes registrados.
                </div>
              ) : (
                <div className="flex-1 overflow-x-auto overflow-y-auto rounded-none md:rounded-2xl border-y border-x-0 md:border border-border-main bg-active/20 pr-1 scrollbar-thin -mx-6 md:mx-0">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-border-main text-[9px] font-black uppercase text-text-muted tracking-wider sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                        <th className="py-3 px-6 w-12 text-center">Puesto</th>
                        <th className="py-3 px-6">Jugador</th>
                        <th className="py-3 px-6 text-center w-36">Marcador Elección</th>
                        <th className="py-3 px-6 text-center w-36">Puntos Ganados</th>
                        <th className="py-3 px-6 text-center w-36">Puntaje Acumulado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {elections.map((item, idx) => {
                        const user = item.user;
                        const pred = item.prediction;
                        const runningTotal = item.runningTotal;
                        const hasPred = !!pred;
                        const isRowMuted = isFinished && !hasPred;

                        return (
                          <tr
                            key={user.id}
                            className={cn(
                              "border-b border-border-main/50 transition-colors duration-200 hover:bg-active/30",
                              isRowMuted && "opacity-45 bg-active/10"
                            )}
                          >
                            {/* Position index (either in this match or overall) */}
                            <td className="py-3 px-6 text-center">
                              <span className="text-[10px] font-black text-text-muted">
                                {(idx + 1).toString().padStart(2, "0")}
                              </span>
                            </td>

                            {/* Player name */}
                            <td className="py-3 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-active border border-border-main flex items-center justify-center font-black text-[10px] text-text-main shrink-0">
                                  {user.displayName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "US"}
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-text-main block">
                                    {user.displayName}
                                  </span>
                                  <span className="text-[9px] text-text-muted font-bold block tracking-tighter uppercase leading-none mt-0.5">
                                    @{user.username}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Prediction marker */}
                            <td className="py-3 px-6 text-center">
                              {!isFinished ? (
                                <div className="flex items-center justify-center gap-1.5 text-[10px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  <EyeOff size={11} />
                                  <span>Pendiente</span>
                                </div>
                              ) : hasPred ? (
                                <span className="font-mono font-black text-xs bg-active px-3 py-1 rounded-xl border border-border-main text-text-main">
                                  {pred.predictedScoreA} - {pred.predictedScoreB}
                                </span>
                              ) : (
                                <span className="text-[10px] font-black text-text-muted tracking-widest">
                                  -
                                </span>
                              )}
                            </td>

                            {/* Points earned */}
                            <td className="py-3 px-6 text-center">
                              {!isFinished ? (
                                <span className="text-[10px] font-bold text-text-muted">-</span>
                              ) : hasPred ? (
                                pred.pointsEarned > 0 ? (
                                  <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
                                    +{pred.pointsEarned} PTS
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full uppercase">
                                    0 PTS
                                  </span>
                                )
                              ) : (
                                <span className="text-[10px] font-mono font-bold text-text-muted">0 PTS</span>
                              )}
                            </td>

                            {/* Accumulative total points */}
                            <td className="py-3 px-6 text-center">
                              {!isFinished ? (
                                <span className="text-[10px] font-bold text-text-muted">-</span>
                              ) : (
                                <span className="text-xs font-mono font-black text-text-main">
                                  {runningTotal} <span className="text-[9px] text-text-muted font-bold uppercase">PTS</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Action Close Button */}
            <button
              onClick={onClose}
              className="w-full mt-6 py-3 bg-accent hover:bg-accent/90 text-black font-black text-[10px] uppercase tracking-[0.15em] rounded-2xl transition-all shadow-xl shadow-accent/15 cursor-pointer shrink-0"
            >
              Cerrar Elecciones
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
