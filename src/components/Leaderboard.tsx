import React, { useEffect, useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { userService } from "../lib/services";
import { Trophy, Search, Percent, CheckCircle2, User, ChevronUp, ChevronDown, Award } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import UserHistoryModal from "./UserHistoryModal";

export default function Leaderboard() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<any | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await userService.getLeaderboard(100, 0);
      setUsers(res.data.data || []);
    } catch (err) {
      console.error("[LEADERBOARD] Error loading leaderboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = users.filter((u) =>
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats summaries
  const totalParticipants = users.length;
  const topScore = users.length > 0 ? users[0].points : 0;
  const userRankIndex = users.findIndex((u) => u.id === parseInt(profile?.uid || "0"));
  const userRank = userRankIndex !== -1 ? userRankIndex + 1 : "--";
  const userPoints = profile?.points || 0;

  return (
    <div className="p-4 md:p-8 space-y-6 flex flex-col min-h-[85vh]">
      {/* Header Title & Summary Cards */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-text-main">
            Tabla de <span className="text-accent">Clasificación</span>
          </h1>
          <p className="text-text-muted text-xs font-bold uppercase tracking-widest mt-1">
            Posiciones y estadísticas de efectividad en tiempo real
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full lg:w-auto">
          <div className="bg-card border border-border-main rounded-2xl p-4 flex flex-col justify-center min-w-[140px] shadow-lg relative overflow-hidden group">
            <div className="absolute right-2 bottom-2 text-text-muted/10 group-hover:scale-110 transition-transform duration-300">
              <User size={40} />
            </div>
            <span className="text-[9px] font-black uppercase text-text-muted tracking-wider">Participantes</span>
            <span className="text-xl font-black italic text-text-main mt-1">{totalParticipants}</span>
          </div>

          <div className="bg-card border border-border-main rounded-2xl p-4 flex flex-col justify-center min-w-[140px] shadow-lg relative overflow-hidden group">
            <div className="absolute right-2 bottom-2 text-accent/5 group-hover:scale-110 transition-transform duration-300">
              <Trophy size={40} />
            </div>
            <span className="text-[9px] font-black uppercase text-accent tracking-wider">Puntaje Máximo</span>
            <span className="text-xl font-black italic text-accent mt-1">{topScore} PTS</span>
          </div>

          <div className="col-span-2 md:col-span-1 bg-card border border-accent/20 rounded-2xl p-4 flex flex-col justify-center min-w-[140px] shadow-lg relative overflow-hidden group bg-gradient-to-br from-accent/5 to-transparent">
            <div className="absolute right-2 bottom-2 text-accent/10 group-hover:scale-110 transition-transform duration-300">
              <Award size={40} />
            </div>
            <span className="text-[9px] font-black uppercase text-accent tracking-wider">Tu Posición</span>
            <span className="text-xl font-black italic text-text-main mt-1">
              #{userRank} <span className="text-xs text-text-muted font-bold uppercase">({userPoints} PTS)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Board Container */}
      <div className="flex-1 bg-card rounded-[2.5rem] border border-border-main p-6 flex flex-col overflow-hidden shadow-2xl relative">
        <div className="absolute -left-20 -top-20 w-64 h-64 bg-accent/5 blur-[100px] rounded-full pointer-events-none" />
        
        {/* Actions bar (Search) */}
        <div className="flex items-center justify-between gap-4 mb-6 shrink-0 relative z-10">
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors" size={16} />
            <input
              type="text"
              placeholder="Buscar jugador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-active border border-border-main rounded-2xl py-3 pl-11 pr-4 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-text-muted transition-all"
            />
          </div>
        </div>

        {/* Table wrapper */}
        <div className="flex-1 overflow-x-auto overflow-y-auto rounded-2xl border border-border-main bg-active/20 pr-1 scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-border-main text-[9px] font-black uppercase text-text-muted tracking-wider">
                <th className="py-4 px-6 text-center w-20">Puesto</th>
                <th className="py-4 px-6">Jugador</th>
                <th className="py-4 px-6 text-center w-36">Pronósticos Totales</th>
                <th className="py-4 px-6 text-center w-36">Pronósticos Acertados</th>
                <th className="py-4 px-6 w-56">Efectividad (Winrate %)</th>
                <th className="py-4 px-6 text-right w-32">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-gray-600 text-xs font-black uppercase tracking-widest animate-pulse">
                    Cargando posiciones oficiales...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-gray-500 text-xs font-black uppercase tracking-widest italic">
                    Sin resultados en la clasificación
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, index) => {
                  const rank = index + 1;
                  const isTop1 = rank === 1;
                  const isTop2 = rank === 2;
                  const isTop3 = rank === 3;
                  const isUser = u.id === parseInt(profile?.uid || "0");
                  
                  const totalPreds = u.stats?.totalPredictions ?? 0;
                  const correctPreds = u.stats?.correctPredictions ?? 0;
                  const winRate = u.stats?.winRate ?? 0;

                  // Render color class for winrate progress bar
                  let progressColor = "bg-red-500 shadow-red-500/20";
                  let textColor = "text-red-400";
                  if (winRate >= 70) {
                    progressColor = "bg-accent shadow-accent/20";
                    textColor = "text-accent";
                  } else if (winRate >= 40) {
                    progressColor = "bg-yellow-500 shadow-yellow-500/20";
                    textColor = "text-yellow-500";
                  }

                  return (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.02, 0.5) }}
                      className={cn(
                        "border-b border-border-main transition-colors duration-300",
                        isUser 
                          ? "bg-active hover:bg-active/85" 
                          : isTop1 
                          ? "bg-accent/5 hover:bg-accent/10" 
                          : "hover:bg-active/40"
                      )}
                    >
                      {/* Rank Position */}
                      <td className="py-3 px-6 text-center">
                        <div className="flex items-center justify-center">
                          {isTop1 ? (
                            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-black text-xs shadow-lg shadow-yellow-500/20" title="1er Lugar">
                              1
                            </span>
                          ) : isTop2 ? (
                            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center text-black font-black text-xs shadow-lg shadow-slate-500/20" title="2do Lugar">
                              2
                            </span>
                          ) : isTop3 ? (
                            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-amber-700/20" title="3er Lugar">
                              3
                            </span>
                          ) : (
                            <span className="text-[10px] font-black text-gray-500">
                              {rank.toString().padStart(2, "0")}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Display name and username */}
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          {/* Avatar / Profile Initials */}
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] border border-border-main shrink-0",
                            isUser ? "bg-accent text-black font-black" : "bg-active text-text-main"
                          )}>
                            {u.displayName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "CA"}
                          </div>
                          <div 
                            onClick={() => setSelectedUserForHistory(u)}
                            className="cursor-pointer group/name"
                            title={`Ver historial de ${u.displayName}`}
                          >
                            <span className={cn(
                              "text-xs font-bold flex items-center gap-1.5 group-hover/name:text-accent group-hover/name:underline transition-colors duration-200",
                              isUser ? "text-accent font-black" : "text-text-main"
                            )}>
                              {u.displayName}
                              {isUser && <span className="text-[8px] font-black bg-accent/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider text-accent leading-none">Tú</span>}
                            </span>
                            <span className="text-[9px] text-text-muted font-bold block tracking-tighter uppercase leading-tight group-hover/name:text-accent/80 transition-colors duration-200">
                              @{u.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Total predictions count */}
                      <td className="py-3 px-6 text-center text-xs font-bold text-gray-400">
                        {totalPreds}
                      </td>

                      {/* Correct predictions count */}
                      <td className="py-3 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-gray-400">
                          <CheckCircle2 size={13} className="text-emerald-500" />
                          <span>{correctPreds}</span>
                        </div>
                      </td>

                      {/* Winrate progress bar & value */}
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-active rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full rounded-full transition-all duration-500 shadow-[0_0_10px]", progressColor)} 
                              style={{ width: `${winRate}%` }} 
                              />
                          </div>
                          <span className={cn("text-[10px] font-mono font-black shrink-0 w-12 text-right", textColor)}>
                            {winRate}%
                          </span>
                        </div>
                      </td>

                      {/* Total points */}
                      <td className="py-3 px-6 text-right">
                        <span className={cn(
                          "text-sm font-mono font-black italic tracking-tight",
                          isUser ? "text-accent" : "text-text-main"
                        )}>
                          {u.points} PTS
                        </span>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <UserHistoryModal
        isOpen={!!selectedUserForHistory}
        onClose={() => setSelectedUserForHistory(null)}
        user={selectedUserForHistory}
      />
    </div>
  );
}
