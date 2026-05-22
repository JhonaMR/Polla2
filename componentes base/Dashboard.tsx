import React, { useEffect, useState } from "react";
import { storage } from "../lib/storage";
import { UserProfile, Match, Team } from "../types";
import { Search, Trophy, Medal, Star, ChevronDown, ChevronRight, Shield, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { useAuth } from "../lib/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<UserProfile[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      const usersData = storage.getUsers();
      const playersList = Object.values(usersData)
        .sort((a, b) => b.points - a.points);
      setPlayers(playersList);

      const matchesList = storage.getMatches();
      setMatches(matchesList.filter(m => m.status === "pending").sort((a, b) => a.matchNumber - b.matchNumber));

      const teamsList = storage.getTeams();
      const tMap: Record<string, Team> = {};
      teamsList.forEach(t => tMap[t.id] = t);
      setTeams(tMap);

      setLoading(false);
    };

    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredPlayers = players.filter(player => 
    player.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const today = new Date().toISOString().split('T')[0];
  const allMatches = storage.getMatches();
  const predictions = profile ? storage.getPredictions(profile.uid) : [];
  const predsMap = predictions.reduce((acc, p) => ({ ...acc, [p.matchId]: p }), {} as Record<string, any>);

  const matchesOfToday = allMatches.filter(m => m.date.startsWith(today));
  const upcomingMatches = allMatches
    .filter(m => m.status === "pending" && !m.date.startsWith(today))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:h-[calc(100vh-180px)] overflow-hidden">
      {/* Search & Leaderboard (Bento Card - Left Column) */}
      <div className="md:col-span-4 lg:col-span-3 bg-card rounded-3xl border border-white/10 p-6 flex flex-col overflow-hidden shadow-2xl">
        <div className="mb-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-accent transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Buscar jugador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-active border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all"
            />
          </div>
        </div>

        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4">Tabla de Clasificación</h2>
        
        <div className="flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-hide">
          {loading ? (
            <div className="p-8 text-center text-gray-600 text-xs font-bold animate-pulse">CARGANDO REPLAY...</div>
          ) : filteredPlayers.length === 0 ? (
            <div className="p-8 text-center text-gray-600 text-xs font-bold uppercase italic">Sin resultados</div>
          ) : (
            filteredPlayers.map((player, index) => {
              const isTop = index === 0;
              const isUser = player.uid === profile?.uid;
              return (
                <motion.div 
                  key={player.uid}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl transition-all group cursor-default border",
                    isTop 
                      ? "bg-accent/10 border-accent/20" 
                      : isUser ? "bg-white/10 border-white/20" : "bg-white/5 hover:bg-active border-transparent hover:border-white/10"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn("text-[10px] font-black w-4", isTop ? "text-accent" : "text-gray-600")}>
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                    <div>
                      <p className={cn("text-xs font-bold leading-tight", isTop ? "text-accent" : "text-white")}>
                        {player.displayName}
                      </p>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">
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
      <div className="md:col-span-8 lg:col-span-6 bg-card rounded-3xl border border-white/10 p-8 flex flex-col relative overflow-hidden group shadow-2xl">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-accent/5 blur-[100px] rounded-full group-hover:bg-accent/10 transition-colors" />
        
        <div className="flex justify-between items-start mb-8 relative z-10">
          <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none mb-2">Resumen de <span className="text-accent underline decoration-accent/30 underline-offset-4">Temporada</span></h2>
            <p className="text-gray-400 text-xs font-bold tracking-widest flex items-center gap-2 uppercase">
               <Star size={12} className="text-yellow-500" /> EL MUNDIAL DE LOS 48 EQUIPOS
            </p>
          </div>
          <div className="bg-active px-4 py-2 rounded-xl border border-white/5 text-right">
             <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Tu Posición</span>
             <span className="text-xl font-black italic text-white flex items-center gap-2">
                #{players.findIndex(p => p.uid === profile?.uid) + 1 || '--'} 
                <ChevronRight size={14} className="text-accent" />
             </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center relative z-10 w-full overflow-y-auto scrollbar-hide py-4">
           {matchesOfToday.length > 0 ? (
             <div className="w-full space-y-6">
                <div className="text-center space-y-1">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-accent animate-pulse">Partidos del Día</h3>
                  <p className="text-gray-500 text-[8px] font-bold uppercase tracking-widest">{new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                   {matchesOfToday.map(m => {
                     const tA = teams[m.teamAId];
                     const tB = teams[m.teamBId];
                     const p = predsMap[m.id];
                     return (
                       <div key={m.id} onClick={() => navigate("/tournament")} className="bg-white/5 border border-white/5 p-4 rounded-3xl flex items-center justify-between gap-4 cursor-pointer hover:bg-white/10 transition-all group">
                          <div className="flex flex-col items-center gap-1 flex-1">
                             <div className="w-10 h-10 rounded-full bg-card border border-white/10 flex items-center justify-center p-1.5 overflow-hidden shadow-xl group-hover:scale-110 transition-transform">
                                {tA?.logoUrl ? <img src={tA.logoUrl} className="w-full h-full object-contain rounded-full" /> : <Shield size={16} className="text-gray-700" />}
                             </div>
                             <span className="text-[8px] font-black uppercase truncate w-16 text-center">{tA?.name}</span>
                          </div>
                          
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                               <span className="text-xs font-black text-accent">{p?.predictedScoreA ?? '-'}</span>
                               <span className="text-[9px] text-gray-700">:</span>
                               <span className="text-xs font-black text-accent">{p?.predictedScoreB ?? '-'}</span>
                            </div>
                            <span className="text-[7px] font-black uppercase text-gray-600 tracking-tighter">{m.phase}</span>
                          </div>

                          <div className="flex flex-col items-center gap-1 flex-1">
                             <div className="w-10 h-10 rounded-full bg-card border border-white/10 flex items-center justify-center p-1.5 overflow-hidden shadow-xl group-hover:scale-110 transition-transform">
                                {tB?.logoUrl ? <img src={tB.logoUrl} className="w-full h-full object-contain rounded-full" /> : <Shield size={16} className="text-gray-700" />}
                             </div>
                             <span className="text-[8px] font-black uppercase truncate w-16 text-center">{tB?.name}</span>
                          </div>
                       </div>
                     );
                   })}
                </div>
                <button 
                  onClick={() => navigate("/tournament")}
                  className="bg-accent text-black font-black text-[10px] uppercase tracking-[0.2em] py-4 px-8 rounded-2xl shadow-xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all w-full"
                >
                   MODIFICAR PRONÓSTICOS
                </button>
             </div>
           ) : upcomingMatches.length > 0 ? (
             <div className="w-full space-y-6">
                <div className="text-center space-y-1">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Próximos Partidos</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                   {upcomingMatches.map(m => {
                     const tA = teams[m.teamAId];
                     const tB = teams[m.teamBId];
                     const mDate = new Date(m.date);
                     return (
                       <div key={m.id} onClick={() => navigate("/tournament")} className="bg-white/5 border border-white/5 p-3 rounded-2xl flex items-center justify-between gap-4 cursor-pointer hover:bg-white/10 transition-all">
                          <div className="flex items-center gap-2 flex-1">
                             <div className="w-8 h-8 rounded-full bg-card border border-white/10 flex items-center justify-center p-1 overflow-hidden">
                                {tA?.logoUrl ? <img src={tA.logoUrl} className="w-full h-full object-contain rounded-full" /> : <Shield size={14} className="text-gray-700" />}
                             </div>
                             <span className="text-[9px] font-black uppercase truncate">{tA?.name}</span>
                          </div>
                          <div className="text-center px-4">
                             <p className="text-[7px] font-black text-gray-600 uppercase tracking-tighter">{m.phase}</p>
                             <p className="text-[9px] font-black italic text-accent">{mDate.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })} {mDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-1 justify-end">
                             <span className="text-[9px] font-black uppercase truncate">{tB?.name}</span>
                             <div className="w-8 h-8 rounded-full bg-card border border-white/10 flex items-center justify-center p-1 overflow-hidden">
                                {tB?.logoUrl ? <img src={tB.logoUrl} className="w-full h-full object-contain rounded-full" /> : <Shield size={14} className="text-gray-700" />}
                             </div>
                          </div>
                       </div>
                     );
                   })}
                </div>
                <button 
                  onClick={() => navigate("/tournament")}
                  className="bg-accent text-black font-black text-[10px] uppercase tracking-[0.2em] py-4 px-8 rounded-2xl shadow-xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all w-full"
                >
                   REALIZAR PREDICCIÓN
                </button>
             </div>
           ) : (
             <div className="text-center space-y-4 opacity-40">
                <AlertCircle size={64} className="mx-auto text-gray-600" />
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Fixture Pendiente</h3>
                <p className="text-[10px] font-black uppercase tracking-widest">Soporte habilitará los partidos pronto</p>
             </div>
           )}
        </div>
      </div>

      {/* Mini Stat Cards (Bento Right Column) */}
      <div className="md:col-span-12 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
        {/* Bonus Highlights */}
        <div className="bg-card rounded-3xl border border-white/10 p-6 shadow-xl flex flex-col">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-6">Bonus Active</h2>
          <div className="space-y-4 flex-1">
             <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
               Las preguntas bonus otorgarán puntos masivos al final del torneo.
             </p>
             <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-center py-8">
                <Trophy size={24} className="mx-auto text-yellow-600 mb-2 opacity-50" />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">¿Quién será el campeón?</p>
             </div>
          </div>
          <button 
            onClick={() => navigate("/bonus")}
            className="w-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black text-[9px] py-3 rounded-xl uppercase tracking-widest hover:bg-blue-500/20 transition-all mt-4"
          >
             Ver Preguntas Bonus
          </button>
        </div>

        {/* Regional Stats */}
        <div className="bg-card rounded-3xl border border-white/10 p-6 shadow-xl flex flex-col justify-between">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Total Teams</h2>
             <span className="text-xs font-black italic">48</span>
           </div>
           <div className="grid grid-cols-2 gap-2">
              {[
                { r: 'UEFA', c: 16 },
                { r: 'CONM', c: 6 },
                { r: 'AFC', c: 8 },
                { r: 'CAF', c: 9 },
                { r: 'CONC', c: 6 },
                { r: 'OFC', c: 1 },
              ].map(item => (
                <div key={item.r} className="bg-white/5 p-2 rounded-xl border border-white/5">
                   <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">{item.r}</p>
                   <p className="text-xs font-black italic">{item.c}</p>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
