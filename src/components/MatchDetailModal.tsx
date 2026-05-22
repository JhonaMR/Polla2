import React, { useEffect, useState } from "react";
import { X, Calendar, Award, BarChart2, Shield } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { predictionService } from "../lib/services";

interface MatchDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: any;
  teams: Record<number, any>;
}

export default function MatchDetailModal({ isOpen, onClose, match, teams }: MatchDetailModalProps) {
  const [stats, setStats] = useState({ teamA: 0, draw: 0, teamB: 0, total: 0 });
  const [loading, setLoading] = useState(false);

  const teamA = teams[match.teamAId];
  const teamB = teams[match.teamBId];

  useEffect(() => {
    if (!isOpen || !match.id) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await predictionService.getMatchPredictions(match.id);
        const predictions = res.data.data || [];
        
        let winA = 0;
        let draw = 0;
        let winB = 0;

        predictions.forEach((p: any) => {
          if (p.predictedScoreA > p.predictedScoreB) winA++;
          else if (p.predictedScoreA < p.predictedScoreB) winB++;
          else draw++;
        });

        const total = predictions.length;
        if (total > 0) {
          setStats({
            teamA: Math.round((winA / total) * 100),
            draw: Math.round((draw / total) * 100),
            teamB: Math.round((winB / total) * 100),
            total
          });
        } else {
          setStats({ teamA: 0, draw: 0, teamB: 0, total: 0 });
        }
      } catch (err) {
        console.error("Error calculating prediction stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isOpen, match.id]);

  // Handle ESC key
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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

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
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-card border border-border-main rounded-[2.5rem] w-full max-w-3xl p-8 relative overflow-hidden shadow-2xl z-10"
          >
            {/* Ambient glows inside the modal */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button X */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-text-muted hover:text-text-main transition-colors p-2 hover:bg-active rounded-full"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="mb-6">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none">Detalles del Partido</span>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-text-main mt-1">
                Partido #{match.matchNumber}
              </h3>
            </div>

            {/* Match Information */}
            <div className="space-y-6">
              {/* Equipos Participantes */}
              <div className="grid grid-cols-2 gap-4">
                {/* Equipo A */}
                <div className="flex items-center gap-3 bg-active border border-border-main rounded-2xl p-4">
                  <div className="w-8 h-8 rounded-full bg-card border border-border-main flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-md">
                    {teamA?.logoUrl ? (
                      <img src={teamA.logoUrl} className="w-full h-full object-contain rounded-full" />
                    ) : (
                      <Shield size={14} className="text-text-muted" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Equipo A</p>
                    <p className="text-text-main text-xs font-black truncate uppercase italic mt-0.5">{teamA?.name || 'TBD'}</p>
                  </div>
                </div>

                {/* Equipo B */}
                <div className="flex items-center gap-3 bg-active border border-border-main rounded-2xl p-4">
                  <div className="w-8 h-8 rounded-full bg-card border border-border-main flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-md">
                    {teamB?.logoUrl ? (
                      <img src={teamB.logoUrl} className="w-full h-full object-contain rounded-full" />
                    ) : (
                      <Shield size={14} className="text-text-muted" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Equipo B</p>
                    <p className="text-text-main text-xs font-black truncate uppercase italic mt-0.5">{teamB?.name || 'TBD'}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-active border border-border-main rounded-2xl p-4">
                <Calendar className="text-accent shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Fecha y Hora de Kickoff</p>
                  <p className="text-text-main text-xs font-black capitalize mt-0.5">{formatDate(match.matchDate)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-active border border-border-main rounded-2xl p-4">
                <Award className="text-accent shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Fase y Estado</p>
                  <p className="text-text-main text-xs font-black uppercase mt-0.5">
                    {match.phase} • {match.status === "FINISHED" ? "Finalizado" : "Pendiente"}
                  </p>
                </div>
              </div>

              {/* Prediction Statistics */}
              <div className="bg-active border border-border-main rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-border-main/50 pb-3">
                  <BarChart2 className="text-accent" size={18} />
                  <h4 className="text-xs font-black uppercase tracking-widest text-text-main">Estadísticas de la Polla</h4>
                </div>

                {loading ? (
                  <div className="py-6 text-center animate-pulse text-xs font-bold text-text-muted uppercase">
                    Calculando porcentajes...
                  </div>
                ) : stats.total > 0 ? (
                  <div className="space-y-4">
                    <p className="text-[10px] text-text-muted font-semibold">
                      Basado en {stats.total} pronósticos de usuarios registrados:
                    </p>

                    {/* Progress Bar Group */}
                    <div className="space-y-3">
                      {/* Team A Win */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-text-main truncate uppercase italic">{teamA?.name || 'Equipo local'} gana</span>
                          <span className="text-accent">{stats.teamA}%</span>
                        </div>
                        <div className="h-2 bg-active rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${stats.teamA}%` }} />
                        </div>
                      </div>

                      {/* Draw */}
                      {match.phase === 'GROUPS' && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-text-muted">Empate</span>
                            <span className="text-text-muted">{stats.draw}%</span>
                          </div>
                          <div className="h-2 bg-active rounded-full overflow-hidden">
                            <div className="h-full bg-text-muted/55 rounded-full" style={{ width: `${stats.draw}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Team B Win */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-text-main truncate uppercase italic">{teamB?.name || 'Equipo visitante'} gana</span>
                          <span className="text-yellow-500">{stats.teamB}%</span>
                        </div>
                        <div className="h-2 bg-active rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${stats.teamB}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs font-bold text-text-muted uppercase">
                    Aún no hay predicciones para este partido.
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-6 py-3.5 bg-accent hover:bg-accent/90 text-black font-black text-[10px] uppercase tracking-[0.15em] rounded-2xl transition-all shadow-xl shadow-accent/15 cursor-pointer"
            >
              Cerrar Detalles
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
