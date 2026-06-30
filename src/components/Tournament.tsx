import React, { useEffect, useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { matchService, predictionService, phaseService } from "../lib/services";
import { motion } from "motion/react";
import { Shield, AlertCircle, Lock, Eye } from "lucide-react";
import { cn } from "../lib/utils";
import LockModal from "./LockModal";
import MatchDetailModal from "./MatchDetailModal";
import MatchCard from "./MatchCard";

export default function Tournament() {
  const { profile } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<Record<number, any>>({});
  const [teams, setTeams] = useState<Record<number, any>>({});
  const [phaseConfigs, setPhaseConfigs] = useState<any[]>([]);
  const [activePhase, setActivePhase] = useState<string>("GROUPS");
  const [loading, setLoading] = useState(true);

  // Modal States
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedMatchForDetail, setSelectedMatchForDetail] = useState<any>(null);

  const loadData = async () => {
    try {
      const matchesRes = await matchService.getMatches();
      const matchesList = matchesRes.data.data || [];
      setMatches(matchesList.sort((a: any, b: any) => a.matchNumber - b.matchNumber));

      // Build teams map
      const teamsMap: Record<number, any> = {};
      matchesList.forEach((m: any) => {
        if (m.teamA) teamsMap[m.teamA.id] = m.teamA;
        if (m.teamB) teamsMap[m.teamB.id] = m.teamB;
      });
      setTeams(teamsMap);

      // Load Phase Configurations
      const phasesRes = await phaseService.getPhases();
      setPhaseConfigs(phasesRes.data.data || []);

      if (profile?.uid) {
        const predsRes = await predictionService.getUserPredictions(parseInt(profile.uid));
        const predsMap: Record<number, any> = {};
        (predsRes.data.data || []).forEach((p: any) => {
          predsMap[p.matchId] = p;
        });
        setPredictions(predsMap);
      }
      setLoading(false);
    } catch (err: any) {
      console.error('[TOURNAMENT] Error loading data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      loadData();
    }
  }, [profile]);

  const savePrediction = async (matchId: number, scoreA: number, scoreB: number) => {
    if (!profile) return;
    
    // Pre-emptively check client-side lock
    const targetMatch = matches.find(m => m.id === matchId);
    if (targetMatch && isMatchLocked(targetMatch)) {
      setLockModalOpen(true);
      return;
    }

    try {
      const existingPred = predictions[matchId];
      if (existingPred) {
        await predictionService.update(existingPred.id, {
          predictedScoreA: scoreA,
          predictedScoreB: scoreB,
        });
      } else {
        await predictionService.create({
          matchId,
          predictedScoreA: scoreA,
          predictedScoreB: scoreB,
        });
      }
      
      // Reload predictions from API
      if (profile?.uid) {
        const predsRes = await predictionService.getUserPredictions(parseInt(profile.uid));
        const predsMap: Record<number, any> = {};
        (predsRes.data.data || []).forEach((p: any) => {
          predsMap[p.matchId] = p;
        });
        setPredictions(predsMap);
      }
    } catch (err: any) {
      console.error('[TOURNAMENT] Error saving prediction:', err);
      if (
        err.response?.status === 400 || 
        err.response?.data?.error?.includes("bloqueada") || 
        err.response?.data?.message?.includes("bloqueada") || 
        err.message?.includes("bloqueada")
      ) {
        setLockModalOpen(true);
      }
    }
  };

  const isMatchLocked = (match: any) => {
    if (match.status === "FINISHED") return true;

    // Check Administrative Phase Status
    const config = phaseConfigs.find(c => c.phase === match.phase);
    if (config && config.status !== 'OPEN_FOR_PREDICTIONS') {
      return true;
    }

    // Check 15-minute lock rule
    const kickoff = new Date(match.matchDate);
    const fifteenMinutes = 15 * 60 * 1000;
    if (kickoff.getTime() - Date.now() < fifteenMinutes) {
      return true;
    }

    return false;
  };

  const isPhaseTabDisabled = (phaseId: string) => {
    // SOP user (admin) can access everything for testing/management
    if (profile?.role === "ADMIN") return false;
    
    const config = phaseConfigs.find(c => c.phase === phaseId);
    return !config || config.status === 'LOCKED';
  };

  const phases: { id: string, label: string }[] = [
    { id: "GROUPS", label: "Grupos" },
    { id: "ROUND_OF_32", label: "Dieciseisavos" },
    { id: "ROUND_OF_16", label: "Octavos" },
    { id: "QUARTERFINALS", label: "Cuartos" },
    { id: "SEMIFINALS", label: "Semifinal" },
    { id: "THIRD_PLACE", label: "3° Lugar" },
    { id: "FINAL", label: "Final" }
  ];

  const currentMatches = matches.filter(m => m.phase === activePhase);
  const groupNames = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

  const handleDetailTrigger = (match: any) => {
    setSelectedMatchForDetail(match);
    setDetailModalOpen(true);
  };

  if (loading) {
    return <div className="p-20 text-center animate-pulse font-black uppercase text-gray-500">Sincronizando Torneo...</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-2 text-text-main">
            Eliminatorias <span className="text-accent underline decoration-accent/30 underline-offset-8">2026</span>
          </h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /> PRONÓSTICOS DE FASE ACTUAL
          </p>
        </div>
        
        <div className="flex bg-card p-1.5 rounded-2xl border border-white/10 w-full max-w-full md:w-fit shadow-2xl backdrop-blur-xl overflow-x-auto no-scrollbar">
          {phases.map((phase) => {
            const isDisabled = isPhaseTabDisabled(phase.id);
            return (
              <button
                key={phase.id}
                disabled={isDisabled}
                onClick={() => setActivePhase(phase.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] transition-all duration-300 whitespace-nowrap flex items-center gap-1.5",
                  activePhase === phase.id 
                    ? "bg-accent text-black shadow-lg shadow-accent/20 cursor-pointer" 
                    : isDisabled
                      ? "text-gray-700 cursor-not-allowed opacity-40"
                      : "text-gray-500 hover:text-white cursor-pointer"
                )}
              >
                {isDisabled && <Lock size={8} />}
                {phase.label}
              </button>
            );
          })}
        </div>
      </div>

      {activePhase === "GROUPS" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {groupNames.map(gn => {
            const groupMatches = currentMatches.filter(m => {
              const teamA = teams[m.teamAId];
              return teamA?.groupLetter === gn;
            });

            if (groupMatches.length === 0) return null;

            return (
              <GroupCard 
                key={gn} 
                name={gn} 
                matches={groupMatches} 
                teams={teams} 
                predictions={predictions} 
                onSave={savePrediction} 
                isMatchLocked={isMatchLocked}
                onLockTrigger={() => setLockModalOpen(true)}
                onDetailTrigger={handleDetailTrigger}
              />
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {currentMatches.map(m => (
            <MatchCard 
              key={m.id}
              match={m} 
              teams={teams} 
              prediction={predictions[m.id]} 
              onSave={savePrediction}
              isLocked={isMatchLocked(m)}
              onLockTrigger={() => setLockModalOpen(true)}
              onDetailTrigger={handleDetailTrigger}
            />
          ))}
          {currentMatches.length === 0 && !loading && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-500 bg-card border border-dashed border-white/10 rounded-[2.5rem]">
              <AlertCircle size={48} className="mb-4 opacity-20" />
              <p className="font-bold text-lg uppercase italic tracking-tighter">Fase pendiente</p>
              <p className="text-xs">Los partidos serán habilitados llegada la fase.</p>
            </div>
          )}
        </div>
      )}

      {currentMatches.length === 0 && !loading && activePhase === "GROUPS" && (
        <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-500 bg-card border border-dashed border-white/10 rounded-[2rem]">
          <AlertCircle size={48} className="mb-4 opacity-20" />
          <p className="font-bold text-lg uppercase italic tracking-tighter">Fase pendiente</p>
          <p className="text-xs">Los partidos serán habilitados llegada la fase.</p>
        </div>
      )}

      {/* Lock modal warning */}
      <LockModal 
        isOpen={lockModalOpen} 
        onClose={() => setLockModalOpen(false)} 
      />

      {/* Match details and statistics modal */}
      {selectedMatchForDetail && (
        <MatchDetailModal
          isOpen={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedMatchForDetail(null);
          }}
          match={selectedMatchForDetail}
          teams={teams}
        />
      )}
    </div>
  );
}

interface GroupCardProps {
  name: string;
  matches: any[];
  teams: Record<number, any>;
  predictions: Record<number, any>;
  onSave: (id: number, a: number, b: number) => void;
  isMatchLocked: (match: any) => boolean;
  onLockTrigger: () => void;
  onDetailTrigger: (match: any) => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ 
  name, 
  matches, 
  teams, 
  predictions, 
  onSave, 
  isMatchLocked, 
  onLockTrigger, 
  onDetailTrigger 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border-main rounded-[2.5rem] overflow-hidden shadow-2xl"
    >
      <div className="bg-active/20 p-5 border-b border-border-main/50 flex items-center justify-between">
        <h3 className="text-xl font-black italic uppercase tracking-tighter text-accent">GRUPO {name}</h3>
        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{matches.length} PARTIDOS</span>
      </div>
      <div className="p-4 space-y-4">
        {matches.map(m => (
          <MatchRow 
            key={m.id} 
            match={m} 
            teams={teams} 
            prediction={predictions[m.id]} 
            onSave={onSave} 
            isLocked={isMatchLocked(m)}
            onLockTrigger={onLockTrigger}
            onDetailTrigger={onDetailTrigger}
          />
        ))}
      </div>
    </motion.div>
  );
}

interface MatchRowProps {
  match: any;
  teams: Record<number, any>;
  prediction?: any;
  onSave: (id: number, a: number, b: number) => void;
  isLocked: boolean;
  onLockTrigger: () => void;
  onDetailTrigger: (match: any) => void;
}

const MatchRow: React.FC<MatchRowProps> = ({ 
  match, 
  teams, 
  prediction, 
  onSave, 
  isLocked, 
  onLockTrigger, 
  onDetailTrigger 
}) => {
  const [a, setA] = useState(prediction?.predictedScoreA.toString() || "");
  const [b, setB] = useState(prediction?.predictedScoreB.toString() || "");

  useEffect(() => {
    setA(prediction?.predictedScoreA.toString() || "");
    setB(prediction?.predictedScoreB.toString() || "");
  }, [prediction]);

  const handleBlur = () => {
    if (isLocked) {
      onLockTrigger();
      return;
    }
    if (a !== "" && b !== "") {
      onSave(match.id, parseInt(a), parseInt(b));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  const isFinished = match.status === "FINISHED";
  const pts = prediction?.pointsEarned ?? 0;

  // Shading styles based on match outcome
  let cardStyle = "border-border-main bg-active/20";
  let badge = null;

  if (isFinished) {
    if (prediction) {
      const isExactScore = prediction.predictedScoreA === match.scoreA && prediction.predictedScoreB === match.scoreB;
      if (isExactScore) {
        cardStyle = "border-emerald-500/40 bg-emerald-500/10 shadow-lg shadow-emerald-500/5";
        badge = <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full whitespace-nowrap">✨ +{pts} PTS</span>;
      } else if (pts > 0) {
        cardStyle = "border-emerald-500/20 bg-emerald-500/5 shadow-md shadow-emerald-500/5";
        badge = <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">✓ +{pts} PTS</span>;
      } else {
        cardStyle = "border-red-500/20 bg-red-500/5";
        badge = <span className="text-[8px] font-black text-red-400 bg-red-500/10 border border-red-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">✕ 0 PTS</span>;
      }
    } else {
      cardStyle = "border-red-500/20 bg-red-500/5 opacity-60";
      badge = <span className="text-[8px] font-black text-red-400 bg-red-500/10 border border-red-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">✕ 0 PTS</span>;
    }
  } else if (isLocked) {
    cardStyle = "border-border-main bg-active/60 opacity-75";
    badge = <span className="text-[8px] font-black text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full flex items-center gap-1"><Lock size={8} /> CERRADO</span>;
  }

  return (
    <div className={cn("flex items-center gap-3 py-3 px-3 rounded-2xl border transition-all duration-300", cardStyle)}>
      <div className="flex-1 flex items-center gap-2 overflow-hidden">
        <div className="w-7 h-7 flex-shrink-0 rounded-full bg-card overflow-hidden border border-border-main p-0.5 shadow-md">
          {teams[match.teamAId]?.logoUrl ? <img src={teams[match.teamAId].logoUrl} className="w-full h-full object-contain rounded-full" /> : <Shield size={14} className="text-gray-500" />}
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-[10px] font-black uppercase italic truncate text-text-main">{teams[match.teamAId]?.name || 'TBD'}</span>
          {isFinished && (
            <span className="text-[9px] text-gray-500 font-bold">
              Real: {match.scoreA}
              {match.penaltiesScoreA !== null && match.penaltiesScoreA !== undefined && (
                <span className="text-accent font-black"> ({match.penaltiesScoreA})</span>
              )}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 shrink-0">
        <div className="flex items-center gap-1 group/inputs" onClick={() => isLocked && onLockTrigger()}>
          <input 
            type="number" 
            value={a}
            disabled={isLocked}
            onChange={(e) => setA(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="-"
            className="w-9 h-9 bg-active border border-border-main rounded-xl text-center text-[11px] font-black text-text-main focus:outline-none focus:border-accent/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="text-[10px] text-gray-700 font-black">:</span>
          <input 
            type="number" 
            value={b}
            disabled={isLocked}
            onChange={(e) => setB(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="-"
            className="w-9 h-9 bg-active border border-border-main rounded-xl text-center text-[11px] font-black text-text-main focus:outline-none focus:border-accent/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        {badge}
      </div>

      <div className="flex-1 flex items-center justify-end gap-2 overflow-hidden text-right">
        <div className="flex flex-col overflow-hidden text-right items-end">
          <span className="text-[10px] font-black uppercase italic truncate text-text-main">{teams[match.teamBId]?.name || 'TBD'}</span>
          {isFinished && (
            <span className="text-[9px] text-gray-500 font-bold">
              Real: {match.scoreB}
              {match.penaltiesScoreB !== null && match.penaltiesScoreB !== undefined && (
                <span className="text-accent font-black"> ({match.penaltiesScoreB})</span>
              )}
            </span>
          )}
        </div>
        <div className="w-7 h-7 flex-shrink-0 rounded-full bg-card overflow-hidden border border-border-main p-0.5 shadow-md">
          {teams[match.teamBId]?.logoUrl ? <img src={teams[match.teamBId].logoUrl} className="w-full h-full object-contain rounded-full" /> : <Shield size={14} className="text-gray-500" />}
        </div>
      </div>

      {/* Info Details Icon */}
      <button 
        onClick={() => onDetailTrigger(match)}
        className="text-gray-500 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-lg shrink-0 cursor-pointer"
        title="Ver Detalles del Partido"
      >
        <Eye size={12} />
      </button>
    </div>
  );
}
