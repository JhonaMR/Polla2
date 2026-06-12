import React, { useEffect, useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { userService, matchService, predictionService } from "../lib/services";
import { Search, Trophy, Star, ChevronRight, Shield, AlertCircle, Award } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import LockModal from "./LockModal";

interface MatchCountdownCardProps {
  match: any;
  teams: Record<string, any>;
}

interface TodayMatchRowProps {
  match: any;
  teams: Record<string, any>;
  prediction?: any;
  onSave: (matchId: number, scoreA: number, scoreB: number) => Promise<void>;
  onLockTrigger: () => void;
}

function TodayMatchRow({ match, teams, prediction, onSave, onLockTrigger }: TodayMatchRowProps) {
  const [a, setA] = useState(prediction?.predictedScoreA?.toString() || "");
  const [b, setB] = useState(prediction?.predictedScoreB?.toString() || "");
  const navigate = useNavigate();

  useEffect(() => {
    setA(prediction?.predictedScoreA?.toString() || "");
    setB(prediction?.predictedScoreB?.toString() || "");
  }, [prediction]);

  const isFinished = match.status === "FINISHED";
  const isLocked = (() => {
    if (isFinished) return true;
    const kickoff = new Date(match.matchDate);
    return kickoff.getTime() - Date.now() < 15 * 60 * 1000;
  })();

  const handleBlur = () => {
    if (isLocked) {
      onLockTrigger();
      return;
    }
    if (a !== "" && b !== "") {
      onSave(match.id, parseInt(a, 10), parseInt(b, 10));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  const tA = teams[match.teamAId];
  const tB = teams[match.teamBId];

  return (
    <div 
      onClick={() => navigate("/tournament")} 
      className="bg-active/60 border border-border-main/80 p-5 rounded-[2rem] flex items-center justify-between gap-6 cursor-pointer hover:bg-active hover:scale-[1.02] hover:border-accent/30 transition-all duration-300 shadow-lg hover:shadow-xl group"
    >
       <div className="flex items-center gap-4 flex-1 overflow-hidden">
          <div className="w-12 h-12 rounded-full bg-card border border-border-main flex items-center justify-center p-1.5 overflow-hidden shadow-md shrink-0 group-hover:scale-110 transition-transform duration-300">
             {tA?.logoUrl ? <img src={tA.logoUrl} className="w-full h-full object-contain rounded-full" /> : <Shield size={18} className="text-text-muted" />}
          </div>
          <span className="text-sm font-black uppercase italic tracking-tight truncate text-text-main">{tA?.name}</span>
       </div>
       
       <div className="flex flex-col items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5 bg-card px-3 py-2 rounded-xl border border-border-main shadow-inner">
             <input 
               type="number" 
               value={a}
               disabled={isLocked}
               onChange={(e) => setA(e.target.value)}
               onBlur={handleBlur}
               onKeyDown={handleKeyDown}
               placeholder="-"
               className="w-8 h-8 bg-active border border-border-main rounded-lg text-center text-xs font-black text-text-main focus:outline-none focus:border-accent/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
             />
             <span className="text-xs text-text-muted font-bold">:</span>
             <input 
               type="number" 
               value={b}
               disabled={isLocked}
               onChange={(e) => setB(e.target.value)}
               onBlur={handleBlur}
               onKeyDown={handleKeyDown}
               placeholder="-"
               className="w-8 h-8 bg-active border border-border-main rounded-lg text-center text-xs font-black text-text-main focus:outline-none focus:border-accent/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
             />
          </div>
          {isFinished ? (
            <span className="text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap">
              Real: {match.scoreA} - {match.scoreB}
            </span>
          ) : (
            <span className="text-[8px] font-black uppercase text-text-muted tracking-widest">{match.phase}</span>
          )}
       </div>

       <div className="flex items-center gap-4 flex-1 justify-end overflow-hidden">
          <span className="text-sm font-black uppercase italic tracking-tight truncate text-text-main text-right">{tB?.name}</span>
          <div className="w-12 h-12 rounded-full bg-card border border-border-main flex items-center justify-center p-1.5 overflow-hidden shadow-md shrink-0 group-hover:scale-110 transition-transform duration-300">
             {tB?.logoUrl ? <img src={tB.logoUrl} className="w-full h-full object-contain rounded-full" /> : <Shield size={18} className="text-text-muted" />}
          </div>
       </div>
    </div>
  );
}

function BonusTimerBanner() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState<string>("CALCULANDO...");
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    const deadline = new Date('2026-06-15T23:59:59-05:00').getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = deadline - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft("CERRADO");
        return;
      }

      const secs = Math.floor((diff / 1000) % 60);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      let str = "";
      if (days > 0) {
        str += `${days}d `;
      }
      str += `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
      setTimeLeft(str);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn(
      "w-full mt-6 p-4 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0",
      isExpired 
        ? "bg-red-500/5 border-red-500/10 text-red-500/80" 
        : "bg-yellow-500/5 border-yellow-500/10 shadow-lg shadow-yellow-500/5 text-yellow-500/80"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border",
          isExpired ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
        )}>
          <Award size={16} />
        </div>
        <div className="text-left">
          <p className="text-[10px] font-black uppercase tracking-widest text-text-main leading-tight">
            {isExpired ? "Respuestas de preguntas bloqueadas." : "Recuerda responder tus preguntas bonus antes de:"}
          </p>
          {!isExpired && (
            <p className="font-mono text-[10px] font-black text-yellow-400 mt-1 uppercase tracking-wider animate-pulse">
              Tiempo restante: {timeLeft}
            </p>
          )}
        </div>
      </div>

      {!isExpired && (
        <button
          onClick={() => navigate("/bonus")}
          className="bg-yellow-500 text-black font-black text-[9px] uppercase tracking-widest py-2.5 px-4 rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md shadow-yellow-500/10 whitespace-nowrap"
        >
          Responder Bonus
        </button>
      )}
    </div>
  );
}

function MatchCountdownCard({ match, teams }: MatchCountdownCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>("CALCULANDO...");

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const limitTime = new Date(match.matchDate).getTime() - 15 * 60 * 1000;
      const diff = limitTime - now;

      if (diff <= 0) {
        setTimeLeft("CERRADO");
        return;
      }

      const secs = Math.floor((diff / 1000) % 60);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      let str = "";
      if (days > 0) {
        str += `${days}d `;
      }
      str += `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
      setTimeLeft(str);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [match]);

  const teamA = teams[match.teamAId];
  const teamB = teams[match.teamBId];

  return (
    <div className="bg-active border border-border-main p-4 rounded-2xl text-center py-4 space-y-3">
      <p className="text-[8px] text-text-muted font-bold uppercase tracking-widest leading-none">
        Próximo Partido a Bloquear
      </p>
      <div className="flex items-center justify-center gap-2">
        <span className="text-[10px] font-black uppercase text-accent truncate max-w-[80px]">
          {teamA?.name || "TBD"}
        </span>
        <span className="text-[8px] text-text-muted font-black">VS</span>
        <span className="text-[10px] font-black uppercase text-accent truncate max-w-[80px]">
          {teamB?.name || "TBD"}
        </span>
      </div>
      
      <div className="h-px bg-border-main w-full" />
      
      <div className={cn(
        "font-mono text-base font-black tracking-wider py-1 px-3 rounded-xl inline-block",
        timeLeft === "CERRADO" ? "text-red-500 bg-red-500/10" : "text-yellow-500 bg-yellow-500/10 animate-pulse"
      )}>
        {timeLeft}
      </div>
      <p className="text-[7px] text-text-muted font-black uppercase tracking-wider">
        Elecciones se cierran 15m antes
      </p>
    </div>
  );
}

export default function Dashboard() {

  const { profile } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<any[]>([]);
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<Record<string, any>>({});
  const [predictions, setPredictions] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [nextMatchesToPredict, setNextMatchesToPredict] = useState<any[]>([]);
  const [lockModalOpen, setLockModalOpen] = useState(false);

  const savePrediction = async (matchId: number, scoreA: number, scoreB: number) => {
    if (!profile) return;
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
      
      // Reload predictions from API to sync state
      const predsRes = await predictionService.getUserPredictions(parseInt(profile.uid));
      const predsMap: Record<string, any> = {};
      (predsRes.data.data || []).forEach((p: any) => {
        predsMap[p.matchId] = p;
      });
      setPredictions(predsMap);
    } catch (err: any) {
      console.error('[DASHBOARD] Error saving prediction:', err);
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


  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [leaderboardRes, matchesRes] = await Promise.all([
          userService.getLeaderboard(100, 0),
          matchService.getMatches(),
        ]);

        setPlayers(leaderboardRes.data.data || []);
        setAllMatches(matchesRes.data.data || []);

        // Build teams map
        const teamsMap: Record<string, any> = {};
        (matchesRes.data.data || []).forEach((m: any) => {
          if (m.teamA) teamsMap[m.teamA.id] = m.teamA;
          if (m.teamB) teamsMap[m.teamB.id] = m.teamB;
        });
        setTeams(teamsMap);

        // Load user predictions
        if (profile?.uid) {
          const predsRes = await predictionService.getUserPredictions(parseInt(profile.uid));
          const predsMap: Record<string, any> = {};
          (predsRes.data.data || []).forEach((p: any) => {
            predsMap[p.matchId] = p;
          });
          setPredictions(predsMap);
        }
      } catch (err: any) {
        console.error('[DASHBOARD] Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (profile) {
      loadData();
    }
  }, [profile]);

  // Obtener los próximos 2 partidos pendientes a bloquear (con elecciones abiertas)
  useEffect(() => {
    if (allMatches.length === 0) return;

    const pending = allMatches
      .filter((m) => {
        if (m.status !== "PENDING") return false;
        const limitTime = new Date(m.matchDate).getTime() - 15 * 60 * 1000;
        return limitTime > Date.now();
      })
      .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());

    setNextMatchesToPredict(pending.slice(0, 2));
  }, [allMatches]);

  // Obtener los 5 equipos más victoriosos
  const getTopVictoriousTeams = () => {
    const stats: Record<number, { wins: number; losses: number; id: number }> = {};

    Object.keys(teams).forEach((idStr) => {
      const id = parseInt(idStr);
      stats[id] = { id, wins: 0, losses: 0 };
    });

    allMatches.forEach((m) => {
      if (m.status === "FINISHED") {
        if (m.winnerTeamId) {
          if (!stats[m.winnerTeamId]) stats[m.winnerTeamId] = { id: m.winnerTeamId, wins: 0, losses: 0 };
          stats[m.winnerTeamId].wins += 1;
        }
        if (m.loserTeamId) {
          if (!stats[m.loserTeamId]) stats[m.loserTeamId] = { id: m.loserTeamId, wins: 0, losses: 0 };
          stats[m.loserTeamId].losses += 1;
        }
      }
    });

    return Object.values(stats)
      .map((s) => ({
        ...s,
        team: teams[s.id],
      }))
      .filter((item) => item.team)
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return a.losses - b.losses;
      })
      .slice(0, 5);
  };

  const topWinners = getTopVictoriousTeams();

  const filteredPlayers = players.filter(player => 
    player.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todayLocal = new Date();
  const matchesOfToday = allMatches.filter(m => {
    const mDate = new Date(m.matchDate);
    return mDate.getDate() === todayLocal.getDate() &&
           mDate.getMonth() === todayLocal.getMonth() &&
           mDate.getFullYear() === todayLocal.getFullYear();
  });

  const upcomingMatches = allMatches
    .filter(m => {
      if (m.status !== "PENDING") return false;
      const mDate = new Date(m.matchDate);
      const isToday = mDate.getDate() === todayLocal.getDate() &&
                      mDate.getMonth() === todayLocal.getMonth() &&
                      mDate.getFullYear() === todayLocal.getFullYear();
      return !isToday && mDate.getTime() > Date.now();
    })
    .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:h-[calc(100vh-140px)] overflow-hidden">
      <LockModal isOpen={lockModalOpen} onClose={() => setLockModalOpen(false)} />
      {/* Search & Leaderboard (Bento Card - Left Column) */}
      <div className="md:col-span-4 lg:col-span-3 bg-card rounded-3xl border border-border-main p-6 flex flex-col overflow-hidden shadow-2xl">
        <div className="mb-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Buscar jugador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-active border border-border-main rounded-xl py-3 pl-11 pr-4 text-sm text-text-main focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-text-muted transition-all"
            />
          </div>
        </div>

        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-4">Tabla de Clasificación</h2>
        
        <div className="flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-hide">
          {loading ? (
            <div className="p-8 text-center text-gray-600 text-xs font-bold animate-pulse">CARGANDO REPLAY...</div>
          ) : filteredPlayers.length === 0 ? (
            <div className="p-8 text-center text-gray-600 text-xs font-bold uppercase italic">Sin resultados</div>
          ) : (
            filteredPlayers.map((player, index) => {
              const isTop = index === 0;
              const isUser = player.id === parseInt(profile?.uid || '0');
              return (
                <motion.div 
                  key={player.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl transition-all group cursor-default border",
                    isTop 
                      ? "bg-accent/10 border-accent/20" 
                      : isUser ? "bg-active border-border-main" : "bg-card hover:bg-active border-border-main/20 hover:border-border-main"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn("text-[10px] font-black w-4", isTop ? "text-accent" : "text-text-muted")}>
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                    <div>
                      <p className={cn("text-xs font-bold leading-tight", isTop ? "text-accent" : "text-text-main")}>
                        {player.displayName}
                      </p>
                      <p className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">
                        {player.username}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-black text-accent">{player.points}</span>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Feature Area (Bento Card - Center Column) */}
      <div className="md:col-span-8 lg:col-span-6 bg-card rounded-3xl border border-border-main p-8 flex flex-col relative overflow-hidden group shadow-2xl">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-accent/5 blur-[100px] rounded-full group-hover:bg-accent/10 transition-colors" />
        
        <div className="flex justify-between items-start mb-8 relative z-10">
          <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none mb-1.5 text-text-main">
              Resumen de <span className="text-accent underline decoration-accent/30 underline-offset-4">Temporada</span>
            </h2>
            <p className="text-text-muted text-xs font-bold tracking-widest flex items-center gap-2 uppercase">
               <Star size={12} className="text-yellow-500 fill-yellow-500" /> Copa del Mundo 2026
            </p>
          </div>
          <div className="bg-active px-4 py-2.5 rounded-xl border border-border-main text-right">
             <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted block mb-0.5">Tu Posición</span>
             <span className="text-lg font-black italic text-text-main flex items-center gap-1.5 justify-end">
                #{players.findIndex(p => p.id === parseInt(profile?.uid || '0')) + 1 || '--'} 
                <ChevronRight size={14} className="text-accent" />
             </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center relative z-10 w-full overflow-y-auto scrollbar-hide py-2">
           {matchesOfToday.length > 0 ? (
              <div className="w-full space-y-6">
                 <div className="text-center space-y-1">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-accent animate-pulse">Partidos de Hoy</h3>
                   <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider">
                     {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                   </p>
                 </div>
                 
                 <div className="grid grid-cols-1 gap-4 w-full">
                    {matchesOfToday.map(m => (
                      <TodayMatchRow 
                        key={m.id} 
                        match={m} 
                        teams={teams} 
                        prediction={predictions[m.id]} 
                        onSave={savePrediction} 
                        onLockTrigger={() => setLockModalOpen(true)} 
                      />
                    ))}
                 </div>
                 <button 
                   onClick={() => navigate("/tournament")}
                   className="bg-accent text-black font-black text-[10px] uppercase tracking-[0.2em] py-4 px-8 rounded-2xl shadow-xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all w-full cursor-pointer"
                 >
                    MODIFICAR PRONÓSTICOS
                 </button>
              </div>
           ) : upcomingMatches.length > 0 ? (
              <div className="w-full space-y-6">
                 <div className="text-center space-y-1">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted tracking-widest">Próximos Partidos</h3>
                 </div>
                 
                 <div className="grid grid-cols-1 gap-4 w-full">
                    {upcomingMatches.map(m => {
                      const tA = teams[m.teamAId];
                      const tB = teams[m.teamBId];
                      const mDate = new Date(m.matchDate);
                      return (
                        <div 
                          key={m.id} 
                          onClick={() => navigate("/tournament")} 
                          className="bg-active/60 border border-border-main/80 p-5 rounded-[2rem] flex items-center justify-between gap-6 cursor-pointer hover:bg-active hover:scale-[1.02] hover:border-accent/30 transition-all duration-300 shadow-lg hover:shadow-xl group"
                        >
                           <div className="flex items-center gap-4 flex-1 overflow-hidden">
                              <div className="w-12 h-12 rounded-full bg-card border border-border-main flex items-center justify-center p-1.5 overflow-hidden shadow-md shrink-0 group-hover:scale-110 transition-transform duration-300">
                                 {tA?.logoUrl ? <img src={tA.logoUrl} className="w-full h-full object-contain rounded-full" /> : <Shield size={18} className="text-text-muted" />}
                              </div>
                              <span className="text-sm font-black uppercase italic tracking-tight truncate text-text-main">{tA?.name}</span>
                           </div>
                           
                           <div className="text-center px-4 shrink-0 flex flex-col items-center">
                              <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">{m.phase}</p>
                              <p className="text-[10px] font-black italic text-accent tracking-wider bg-card border border-border-main px-3 py-1.5 rounded-xl shadow-inner whitespace-nowrap">
                                {mDate.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })} • {mDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })}
                              </p>
                           </div>
                           
                           <div className="flex items-center gap-4 flex-1 justify-end overflow-hidden">
                              <span className="text-sm font-black uppercase italic tracking-tight truncate text-text-main text-right">{tB?.name}</span>
                              <div className="w-12 h-12 rounded-full bg-card border border-border-main flex items-center justify-center p-1.5 overflow-hidden shadow-md shrink-0 group-hover:scale-110 transition-transform duration-300">
                                 {tB?.logoUrl ? <img src={tB.logoUrl} className="w-full h-full object-contain rounded-full" /> : <Shield size={18} className="text-text-muted" />}
                              </div>
                           </div>
                        </div>
                      );
                    })}
                 </div>
                 <button 
                   onClick={() => navigate("/tournament")}
                   className="bg-accent text-black font-black text-[10px] uppercase tracking-[0.2em] py-4 px-8 rounded-2xl shadow-xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all w-full cursor-pointer"
                 >
                    REALIZAR PREDICCIÓN
                 </button>
              </div>
           ) : (
              <div className="text-center space-y-4 opacity-40">
                 <AlertCircle size={64} className="mx-auto text-gray-600" />
                 <h3 className="text-2xl font-black italic uppercase tracking-tighter text-text-main">Fixture Pendiente</h3>
                 <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Soporte habilitará los partidos pronto</p>
              </div>
           )}
           <BonusTimerBanner />
        </div>
      </div>

      {/* Mini Stat Cards (Bento Right Column) */}
      <div className="md:col-span-12 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
        {/* Cierre de Elecciones / Cuenta Regresiva */}
        <div className="bg-card rounded-3xl border border-border-main p-6 shadow-xl flex flex-col justify-between">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-4">Cierre de Elecciones</h2>
          <div className="space-y-4 flex-1 flex flex-col justify-center">
              {nextMatchesToPredict.length > 0 ? (
                <div className="space-y-3 w-full">
                  {nextMatchesToPredict.map((match) => (
                    <MatchCountdownCard key={match.id} match={match} teams={teams} />
                  ))}
                </div>
              ) : (
                <div className="bg-active border border-border-main p-4 rounded-2xl text-center py-8">
                  <AlertCircle size={20} className="mx-auto text-red-500 mb-2 opacity-50" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Elecciones Cerradas</p>
                  <p className="text-[8px] text-text-muted font-bold uppercase tracking-widest mt-1">No hay partidos pendientes</p>
                </div>
              )}
          </div>
          <button 
            onClick={() => navigate("/tournament")}
            className="w-full bg-blue-500/10 border border-blue-500/20 text-blue-500 font-black text-[9px] py-3 rounded-xl uppercase tracking-widest hover:bg-blue-500/20 transition-all mt-4"
          >
             Realizar Predicciones
          </button>
        </div>

        {/* Top Victorious Teams */}
        <div className="bg-card rounded-3xl border border-border-main p-6 shadow-xl flex flex-col justify-between">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 font-black">Equipos Más Victoriosos</h2>
           </div>
           
           <div className="space-y-3 flex-1 flex flex-col justify-center">
             {loading ? (
               <div className="text-center text-xs font-bold text-text-muted animate-pulse uppercase">Cargando estadísticas...</div>
             ) : topWinners.length === 0 ? (
               <div className="text-center py-4 text-xs font-bold text-text-muted uppercase italic">Sin partidos jugados</div>
             ) : (
               topWinners.map((w, idx) => (
                 <div key={w.id} className="flex items-center justify-between bg-active hover:bg-active/85 border border-border-main p-2 rounded-xl transition-all">
                   <div className="flex items-center gap-2">
                     <span className="text-[9px] font-mono font-black text-text-muted">
                       {(idx + 1).toString().padStart(2, '0')}
                     </span>
                     <div className="w-6 h-6 rounded-full bg-card border border-border-main flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                       {w.team?.logoUrl ? (
                         <img src={w.team.logoUrl} className="w-full h-full object-contain rounded-full" alt={w.team.name} />
                       ) : (
                         <Shield size={10} className="text-text-muted" />
                       )}
                     </div>
                     <span className="text-xs font-bold text-emerald-500 uppercase truncate max-w-[85px]">
                       {w.team?.name}
                     </span>
                   </div>
                   
                   <div className="flex items-center gap-2 font-mono text-[9px] font-black shrink-0">
                     <span className="text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">{w.wins} V</span>
                     <span className="text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">{w.losses} D</span>
                   </div>
                 </div>
               ))
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
