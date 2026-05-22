import React, { useEffect, useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { storage } from "../lib/storage";
import { Match, Prediction, Team, MatchPhase } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Shield, ChevronRight, Check, X, AlertCircle, Group } from "lucide-react";
import { cn } from "../lib/utils";

export default function Tournament() {
  const { profile } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [activePhase, setActivePhase] = useState<MatchPhase>("groups");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      const teamsList = storage.getTeams();
      const teamsMap: Record<string, Team> = {};
      teamsList.forEach(t => teamsMap[t.id] = t);
      setTeams(teamsMap);

      const matchesList = storage.getMatches();
      setMatches(matchesList.sort((a, b) => a.matchNumber - b.matchNumber));

      if (profile) {
        const predsList = storage.getPredictions(profile.uid);
        const predsMap: Record<string, Prediction> = {};
        predsList.forEach(p => predsMap[p.matchId] = p);
        setPredictions(predsMap);
      }
      setLoading(false);
    };

    loadData();
    // Simulate real-time by checking every 2 seconds if needed, or just rely on manual trigger
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, [profile]);

  const savePrediction = async (matchId: string, scoreA: number, scoreB: number) => {
    if (!profile) return;
    const predId = `${profile.uid}_${matchId}`;
    const prediction: Prediction = {
      id: predId,
      userId: profile.uid,
      matchId: matchId,
      predictedScoreA: scoreA,
      predictedScoreB: scoreB,
      pointsEarned: 0
    };
    storage.savePrediction(prediction);
    // Local update
    setPredictions(prev => ({ ...prev, [matchId]: prediction }));
  };

  const phases: { id: MatchPhase, label: string }[] = [
    { id: "groups", label: "Grupos" },
    { id: "roundOf16", label: "R16" },
    { id: "quarterfinals", label: "Cuartos" },
    { id: "semifinals", label: "Semifinal" },
    { id: "final", label: "Final" }
  ];

  const currentMatches = matches.filter(m => m.phase === activePhase);

  // Grouping for Group Stage
  const groupNames = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  
  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Eliminatorias <span className="text-accent underline decoration-accent/30 underline-offset-8">2026</span></h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /> PRONÓSTICOS DE FASE ACTUAL
          </p>
        </div>
        
        <div className="flex bg-card p-1.5 rounded-2xl border border-white/10 w-fit shadow-2xl backdrop-blur-xl overflow-x-auto no-scrollbar">
          {phases.map((phase) => (
            <button
              key={phase.id}
              onClick={() => setActivePhase(phase.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] transition-all duration-300 whitespace-nowrap",
                activePhase === phase.id 
                  ? "bg-accent text-black shadow-lg shadow-accent/20" 
                  : "text-gray-500 hover:text-white"
              )}
            >
              {phase.label}
            </button>
          ))}
        </div>
      </div>

      {activePhase === "groups" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {groupNames.map(gn => {
            const groupMatches = currentMatches.filter(m => {
              const teamA = teams[m.teamAId];
              return teamA?.group === gn;
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
              />
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {currentMatches.map(m => (
             <MatchCard 
               key={m.id} 
               match={m} 
               teams={teams} 
               prediction={predictions[m.id]} 
               onSave={savePrediction} 
             />
           ))}
        </div>
      )}

      {currentMatches.length === 0 && !loading && (
        <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-500 bg-card border border-dashed border-white/10 rounded-[2rem]">
          <AlertCircle size={48} className="mb-4 opacity-20" />
          <p className="font-bold text-lg uppercase italic tracking-tighter">Fase pendiente</p>
          <p className="text-xs">Los partidos serán habilitados llegada la fase.</p>
        </div>
      )}
    </div>
  );
}

interface GroupCardProps {
  name: string;
  matches: Match[];
  teams: Record<string, Team>;
  predictions: Record<string, Prediction>;
  onSave: (id: string, a: number, b: number) => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ name, matches, teams, predictions, onSave }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
    >
      <div className="bg-active/20 p-5 border-b border-white/5 flex items-center justify-between">
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
          />
        ))}
      </div>
    </motion.div>
  );
}

interface MatchRowProps {
  match: Match;
  teams: Record<string, Team>;
  prediction?: Prediction;
  onSave: (id: string, a: number, b: number) => void;
}

const MatchRow: React.FC<MatchRowProps> = ({ match, teams, prediction, onSave }) => {
  const [a, setA] = useState(prediction?.predictedScoreA.toString() || "");
  const [b, setB] = useState(prediction?.predictedScoreB.toString() || "");

  const handleBlur = () => {
    if (a !== "" && b !== "") {
      onSave(match.id, parseInt(a), parseInt(b));
    }
  };

  const isFinished = match.status === "finished";

  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors px-2 rounded-xl">
      <div className="flex-1 flex items-center gap-2 overflow-hidden">
        <div className="w-6 h-6 flex-shrink-0 rounded-full bg-card overflow-hidden border border-white/10 p-0.5">
          <img src={teams[match.teamAId]?.logoUrl} className="w-full h-full object-contain rounded-full" />
        </div>
        <span className="text-[10px] font-black uppercase italic truncate">{teams[match.teamAId]?.name}</span>
      </div>

      <div className="flex items-center gap-1 group/inputs">
        <input 
          type="number" 
          value={a}
          disabled={isFinished}
          onChange={(e) => setA(e.target.value)}
          onBlur={handleBlur}
          placeholder="-"
          className="w-9 h-9 bg-black/60 border border-white/10 rounded-xl text-center text-[10px] font-black text-accent focus:outline-none focus:border-accent/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-[10px] text-gray-700 font-black">:</span>
        <input 
          type="number" 
          value={b}
          disabled={isFinished}
          onChange={(e) => setB(e.target.value)}
          onBlur={handleBlur}
          placeholder="-"
          className="w-9 h-9 bg-black/60 border border-white/10 rounded-xl text-center text-[10px] font-black text-accent focus:outline-none focus:border-accent/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>

      <div className="flex-1 flex items-center justify-end gap-2 overflow-hidden text-right">
        <span className="text-[10px] font-black uppercase italic truncate">{teams[match.teamBId]?.name}</span>
        <div className="w-6 h-6 flex-shrink-0 rounded-full bg-card overflow-hidden border border-white/10 p-0.5">
          <img src={teams[match.teamBId]?.logoUrl} className="w-full h-full object-contain rounded-full" />
        </div>
      </div>
    </div>
  );
}

interface MatchCardProps {
  match: Match;
  teams: Record<string, Team>;
  prediction?: Prediction;
  onSave: (id: string, a: number, b: number) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ 
  match, 
  teams, 
  prediction, 
  onSave 
}) => {
  const [scoreA, setScoreA] = useState<string>(prediction?.predictedScoreA.toString() || "");
  const [scoreB, setScoreB] = useState<string>(prediction?.predictedScoreB.toString() || "");
  
  const teamA = teams[match.teamAId];
  const teamB = teams[match.teamBId];

  const handleSave = () => {
    if (scoreA !== "" && scoreB !== "") {
      onSave(match.id, parseInt(scoreA), parseInt(scoreB));
    }
  };

  const isFinished = match.status === "finished";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "bg-card border border-white/10 rounded-[2.5rem] p-6 transition-all duration-500 relative overflow-hidden shadow-2xl",
        isFinished && "opacity-80"
      )}
    >
      <div className="flex justify-between items-center mb-6">
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">M#{match.matchNumber}</span>
        <div className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-[8px] font-black uppercase tracking-widest text-accent">
          {isFinished ? "Finalizado" : "Eliminación Directa"}
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <TeamPredictRow team={teamA} score={scoreA} setScore={setScoreA} disabled={isFinished} />
        <TeamPredictRow team={teamB} score={scoreB} setScore={setScoreB} disabled={isFinished} />
      </div>

      <button 
        onClick={handleSave}
        disabled={isFinished}
        className="w-full py-3 bg-accent text-black font-black text-[9px] uppercase tracking-[0.15em] rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/20 disabled:opacity-50"
      >
        {isFinished ? "RESULTADO FINALIZADO" : "GUARDAR PRONÓSTICO"}
      </button>
    </motion.div>
  );
}

function TeamPredictRow({ team, score, setScore, disabled }: { team?: Team, score: string, setScore: (v: string) => void, disabled: boolean }) {
  return (
    <div className="flex items-center gap-4 bg-active/40 p-3 rounded-2xl border border-white/5 hover:border-white/10 transition-all shadow-inner">
      <div className="w-12 h-12 rounded-full bg-card border border-white/10 flex items-center justify-center p-1.5 overflow-hidden shadow-2xl">
        {team?.logoUrl ? <img src={team.logoUrl} className="w-full h-full object-contain rounded-full" /> : <Shield size={20} className="text-gray-700" />}
      </div>
      <p className="flex-1 text-sm font-black uppercase tracking-tight truncate italic">{team?.name || 'TBD'}</p>
      <input 
        type="number" 
        value={score}
        disabled={disabled}
        onChange={(e) => setScore(e.target.value)}
        className="w-12 h-12 bg-black/60 border border-white/10 rounded-xl text-center text-base font-black text-accent focus:outline-none focus:border-accent/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        placeholder="-"
      />
    </div>
  );
}
