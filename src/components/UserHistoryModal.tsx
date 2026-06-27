import React, { useEffect, useState } from "react";
import { X, Shield, Trophy, Award, Percent } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { predictionService, matchService } from "../lib/services";
import { cn } from "../lib/utils";

interface UserHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export default function UserHistoryModal({ isOpen, onClose, user }: UserHistoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user?.id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [matchesRes, predictionsRes] = await Promise.all([
          matchService.getFinished(),
          predictionService.getUserPredictions(user.id)
        ]);

        const finishedMatches = matchesRes.data.data || [];
        const userPredictions = predictionsRes.data.data || [];

        // Map predictions by matchId for O(1) lookup
        const predictionsMap = new Map(
          userPredictions.map((p: any) => [p.matchId, p])
        );

        // Combine all finished matches with the user's prediction (if any)
        const combined = finishedMatches.map((m: any) => {
          const pred = predictionsMap.get(m.id);
          return {
            match: m,
            prediction: pred,
            hasPrediction: !!pred
          };
        });

        // Sort by matchNumber ascending
        combined.sort((a: any, b: any) => a.match.matchNumber - b.match.matchNumber);

        setMatches(combined);
      } catch (err) {
        console.error("Error loading user predictions history:", err);
        setError("Error al cargar el historial de elecciones.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, user?.id]);

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

  // Calculation of totals
  const totalFinished = matches.length;
  const totalPredicted = matches.filter(m => m.hasPrediction).length;
  const correctPredictions = matches.filter(
    m => m.hasPrediction && m.prediction.pointsEarned > 0
  ).length;
  const accuracy = totalPredicted > 0 ? (correctPredictions / totalPredicted) * 100 : 0;
  const totalPoints = matches.reduce(
    (sum, m) => sum + (m.prediction?.pointsEarned || 0),
    0
  );

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
            {/* Ambient glows inside the modal */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button X */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-text-muted hover:text-text-main transition-colors p-2 hover:bg-active rounded-full cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="mb-6 shrink-0">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none">Historial Oficial</span>
              <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-text-main mt-1">
                Historial de elecciones de <span className="text-accent">"{user?.displayName || user?.username}"</span>
              </h3>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              {loading ? (
                <div className="flex-1 flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                    <p className="text-text-muted text-xs font-black uppercase tracking-widest">
                      Obteniendo historial detallado...
                    </p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex-1 flex items-center justify-center py-20 text-red-500 font-bold text-sm uppercase tracking-wider">
                  {error}
                </div>
              ) : matches.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-20 text-text-muted font-bold text-xs uppercase tracking-widest italic">
                  Aún no hay partidos finalizados en el torneo.
                </div>
              ) : (
                <>
                  {/* Table Wrapper with scroll */}
                  <div className="flex-1 overflow-x-auto overflow-y-auto rounded-2xl border border-border-main bg-active/20 pr-1 scrollbar-thin">
                    <table className="w-full text-left border-collapse min-w-[750px]">
                      <thead>
                        <tr className="border-b border-border-main text-[9px] font-black uppercase text-text-muted tracking-wider sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                          <th className="py-3 px-4 text-center w-16">Nº</th>
                          <th className="py-3 px-6 text-center">Encuentro</th>
                          <th className="py-3 px-6 text-center w-32">Elección</th>
                          <th className="py-3 px-6 text-center w-32">Resultado Real</th>
                          <th className="py-3 px-6 text-center w-28">Puntos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matches.map((item, index) => {
                          const m = item.match;
                          const p = item.prediction;
                          const hasPred = item.hasPrediction;
                          const teamA = m.teamA;
                          const teamB = m.teamB;
                          const pts = p?.pointsEarned ?? 0;

                          return (
                            <tr
                              key={m.id}
                              className={cn(
                                "border-b border-border-main/50 transition-colors duration-200",
                                hasPred 
                                  ? "hover:bg-active/40" 
                                  : "opacity-45 bg-active/10 hover:opacity-60"
                              )}
                            >
                              {/* Match Number */}
                              <td className="py-3.5 px-4 text-center">
                                <span className="text-[10px] font-black text-text-muted">
                                  #{m.matchNumber}
                                </span>
                              </td>

                              {/* Teams with flags in the middle */}
                              <td className="py-3.5 px-6">
                                <div className="flex items-center gap-2 font-black uppercase text-[11px] tracking-tight italic">
                                  {/* Team A */}
                                  <span className="w-[42%] text-right truncate text-text-main">
                                    {teamA?.name || "TBD"}
                                  </span>

                                  {/* Flags centered */}
                                  <div className="flex items-center justify-center gap-1 shrink-0 w-[16%]">
                                    <div className="w-6 h-6 rounded-full bg-card border border-border-main flex items-center justify-center p-0.5 overflow-hidden shadow">
                                      {teamA?.logoUrl ? (
                                        <img src={teamA.logoUrl} className="w-full h-full object-contain rounded-full" alt="" />
                                      ) : (
                                        <Shield size={10} className="text-text-muted" />
                                      )}
                                    </div>
                                    <div className="w-6 h-6 rounded-full bg-card border border-border-main flex items-center justify-center p-0.5 overflow-hidden shadow">
                                      {teamB?.logoUrl ? (
                                        <img src={teamB.logoUrl} className="w-full h-full object-contain rounded-full" alt="" />
                                      ) : (
                                        <Shield size={10} className="text-text-muted" />
                                      )}
                                    </div>
                                  </div>

                                  {/* Team B */}
                                  <span className="w-[42%] text-left truncate text-text-main">
                                    {teamB?.name || "TBD"}
                                  </span>
                                </div>
                              </td>

                              {/* Player's prediction */}
                              <td className="py-3.5 px-6 text-center">
                                {hasPred ? (
                                  <span className="font-mono font-black text-xs bg-active px-3 py-1 rounded-xl border border-border-main text-text-main">
                                    {p.predictedScoreA} - {p.predictedScoreB}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-text-muted tracking-widest uppercase">
                                    -
                                  </span>
                                )}
                              </td>

                              {/* Real Result */}
                              <td className="py-3.5 px-6 text-center">
                                <span className="font-mono font-black text-xs bg-active/40 px-3 py-1 rounded-xl border border-border-main/50 text-text-main">
                                  {m.scoreA} - {m.scoreB}
                                </span>
                              </td>

                              {/* Points earned */}
                              <td className="py-3.5 px-6 text-center">
                                {hasPred ? (
                                  pts > 0 ? (
                                    <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
                                      +{pts} PTS
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-mono font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full uppercase">
                                      0 PTS
                                    </span>
                                  )
                                ) : (
                                  <span className="text-[10px] font-mono font-bold text-text-muted">
                                    0 PTS
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Totals Row */}
                  <div className="grid grid-cols-3 gap-4 border-t border-border-main pt-5 mt-5 shrink-0 bg-active/20 p-4 rounded-3xl border border-border-main/50 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none rounded-3xl" />
                    
                    <div className="text-center relative z-10 flex flex-col justify-center">
                      <div className="flex items-center justify-center gap-1.5 text-text-muted mb-1">
                        <Award size={13} className="text-accent" />
                        <span className="text-[9px] font-black uppercase tracking-wider">Pronósticos Realizados</span>
                      </div>
                      <p className="text-sm md:text-base font-black text-text-main tracking-tight">
                        {totalPredicted} <span className="text-[10px] text-text-muted font-bold uppercase">de {totalFinished}</span>
                      </p>
                    </div>

                    <div className="text-center border-x border-border-main/65 relative z-10 flex flex-col justify-center">
                      <div className="flex items-center justify-center gap-1.5 text-text-muted mb-1">
                        <Percent size={13} className="text-accent" />
                        <span className="text-[9px] font-black uppercase tracking-wider">Promedio de Aciertos</span>
                      </div>
                      <p className="text-sm md:text-base font-black text-accent tracking-tight">
                        {accuracy.toFixed(1)}%
                      </p>
                    </div>

                    <div className="text-center relative z-10 flex flex-col justify-center">
                      <div className="flex items-center justify-center gap-1.5 text-text-muted mb-1">
                        <Trophy size={13} className="text-accent" />
                        <span className="text-[9px] font-black uppercase tracking-wider">Total Puntos Ganados</span>
                      </div>
                      <p className="text-sm md:text-base font-black text-text-main tracking-tight">
                        {totalPoints} <span className="text-[10px] text-text-muted font-bold uppercase">PTS</span>
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Action Close Button */}
            <button
              onClick={onClose}
              className="w-full mt-6 py-3 bg-accent hover:bg-accent/90 text-black font-black text-[10px] uppercase tracking-[0.15em] rounded-2xl transition-all shadow-xl shadow-accent/15 cursor-pointer shrink-0"
            >
              Cerrar Historial
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
