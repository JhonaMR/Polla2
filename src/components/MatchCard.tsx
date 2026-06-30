import React, { useState, useEffect } from "react";
import { Shield, Lock, Eye } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

interface MatchCardProps {
  match: any;
  teams: Record<number, any>;
  prediction?: any;
  onSave: (id: number, a: number, b: number) => void;
  isLocked: boolean;
  onLockTrigger: () => void;
  onDetailTrigger: (match: any) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  teams,
  prediction,
  onSave,
  isLocked,
  onLockTrigger,
  onDetailTrigger
}) => {
  const [scoreA, setScoreA] = useState<string>(prediction?.predictedScoreA?.toString() || "");
  const [scoreB, setScoreB] = useState<string>(prediction?.predictedScoreB.toString() || "");

  useEffect(() => {
    setScoreA(prediction?.predictedScoreA.toString() || "");
    setScoreB(prediction?.predictedScoreB.toString() || "");
  }, [prediction]);

  const teamA = teams[match.teamAId];
  const teamB = teams[match.teamBId];

  const handleSave = () => {
    if (isLocked) {
      onLockTrigger();
      return;
    }
    if (scoreA !== "" && scoreB !== "") {
      onSave(match.id, parseInt(scoreA), parseInt(scoreB));
    }
  };

  const isFinished = match.status === "FINISHED";
  const pts = prediction?.pointsEarned ?? 0;

  // Style calculations
  let cardStyle = "border-border-main bg-card";
  let statusText = isFinished ? "Finalizado" : isLocked ? "Votos Cerrados" : "Eliminación Directa";
  let badgeColor = "bg-accent/10 border-accent/20 text-accent";
  let tintClass = "";

  if (isFinished) {
    if (prediction) {
      const isExactScore = prediction.predictedScoreA === match.scoreA && prediction.predictedScoreB === match.scoreB;
      if (isExactScore) {
        cardStyle = "border-emerald-500 bg-card shadow-xl shadow-emerald-500/5";
        statusText = `✨ +${pts} Puntos`;
        badgeColor = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
        tintClass = "bg-emerald-500/10";
      } else if (pts > 0) {
        cardStyle = "border-emerald-500/40 bg-card shadow-lg shadow-emerald-500/5";
        statusText = `✓ +${pts} Puntos`;
        badgeColor = "bg-emerald-500/10 border-emerald-500/10 text-emerald-400";
        tintClass = "bg-emerald-500/5";
      } else {
        cardStyle = "border-red-500/30 bg-card";
        statusText = "✕ 0 Puntos";
        badgeColor = "bg-red-500/10 border-red-500/20 text-red-400";
        tintClass = "bg-red-500/5";
      }
    } else {
      cardStyle = "border-red-500/20 bg-card opacity-80";
      statusText = "✕ 0 Puntos (Sin Voto)";
      badgeColor = "bg-red-500/10 border-red-500/20 text-red-400";
      tintClass = "bg-red-500/5";
    }
  } else if (isLocked) {
    cardStyle = "border-border-main bg-card opacity-80";
    badgeColor = "bg-yellow-500/10 border-yellow-500/20 text-yellow-500";
    tintClass = "bg-active/60";
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "border rounded-[2.5rem] p-6 transition-all duration-500 relative overflow-hidden shadow-2xl flex flex-col justify-between h-[300px]",
        cardStyle
      )}
    >
      {/* Glow effects for correct predictions */}
      {isFinished && pts > 0 && (
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none z-0" />
      )}

      {/* Dynamic Tint Overlay */}
      {tintClass && (
        <div className={cn("absolute inset-0 pointer-events-none z-0", tintClass)} />
      )}

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">M#{match.matchNumber}</span>
            <button
              onClick={() => onDetailTrigger(match)}
              className="text-gray-500 hover:text-text-main transition-colors p-1 hover:bg-active rounded-md"
              title="Detalles"
            >
              <Eye size={12} />
            </button>
          </div>
          <div className={cn("px-3 py-1 border rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1", badgeColor)}>
            {isLocked && !isFinished && <Lock size={8} />} {statusText}
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <TeamPredictRow
            team={teamA}
            score={scoreA}
            setScore={setScoreA}
            disabled={isLocked}
            onLockClick={() => isLocked && onLockTrigger()}
            realScore={isFinished ? match.scoreA : undefined}
            penaltiesScore={isFinished ? match.penaltiesScoreA : undefined}
          />
          <TeamPredictRow
            team={teamB}
            score={scoreB}
            setScore={setScoreB}
            disabled={isLocked}
            onLockClick={() => isLocked && onLockTrigger()}
            realScore={isFinished ? match.scoreB : undefined}
            penaltiesScore={isFinished ? match.penaltiesScoreB : undefined}
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isLocked}
        className={cn(
          "w-full py-3 font-black text-[9px] uppercase tracking-[0.15em] rounded-xl transition-all shadow-xl relative z-10 mb-5",
          isFinished
            ? "bg-active/50 text-text-muted border border-border-main/50 cursor-not-allowed shadow-none"
            : isLocked
              ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 cursor-pointer"
              : "bg-accent text-black hover:scale-105 active:scale-95 shadow-accent/20"
        )}
      >
        {isFinished ? "RESULTADO FINALIZADO" : isLocked ? "PRONÓSTICO CERRADO" : "GUARDAR PRONÓSTICO"}
      </button>
    </motion.div>
  );
}

function TeamPredictRow({
  team,
  score,
  setScore,
  disabled,
  onLockClick,
  realScore,
  penaltiesScore
}: {
  team?: any,
  score: string,
  setScore: (v: string) => void,
  disabled: boolean,
  onLockClick?: () => void,
  realScore?: number,
  penaltiesScore?: number | null
}) {
  return (
    <div className="flex items-center gap-4 bg-active/40 p-3 rounded-2xl border border-border-main/50 hover:border-border-main transition-all shadow-inner relative">
      <div className="w-12 h-12 rounded-full bg-card border border-border-main flex items-center justify-center p-1.5 overflow-hidden shadow-2xl">
        {team?.logoUrl ? <img src={team.logoUrl} className="w-full h-full object-contain rounded-full" /> : <Shield size={20} className="text-gray-700" />}
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="text-sm font-black uppercase tracking-tight truncate italic text-text-main">{team?.name || 'TBD'}</p>
        {realScore !== undefined && (
          <p className="text-[9px] text-text-muted font-bold uppercase">
            Resultado Real: <span className="text-text-main font-black">{realScore}</span>
            {penaltiesScore !== undefined && penaltiesScore !== null && (
              <span className="text-accent font-black"> ({penaltiesScore})</span>
            )}
          </p>
        )}
      </div>
      <div onClick={onLockClick}>
        <input
          type="number"
          value={score}
          disabled={disabled}
          onChange={(e) => setScore(e.target.value)}
          className="w-12 h-12 bg-active border border-border-main rounded-xl text-center text-base font-black text-text-main focus:outline-none focus:border-accent/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="-"
        />
      </div>
    </div>
  );
}

export default MatchCard;
