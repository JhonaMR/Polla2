import React, { useEffect, useState } from "react";
import { storage } from "../lib/storage";
import { Team } from "../types";
import { Map, Shield, Globe } from "lucide-react";
import { motion } from "motion/react";

export default function RegionsView() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      setTeams(storage.getTeams());
      setLoading(false);
    };
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const regions = Array.from(new Set(teams.map(t => t.region)));

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Distribución <span className="text-blue-500 underline decoration-blue-500/30 underline-offset-8">Global</span></h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2">
             <Globe size={14} className="text-blue-500" /> EQUIPOS PARTICIPANTES POR REGIÓN
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-600 font-black uppercase tracking-widest text-xs animate-pulse">Detectando Coordenadas...</div>
      ) : (
        <div className="space-y-16">
          {regions.map(region => (
            <section key={region}>
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-blue-500 bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20">{region}</h2>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-blue-500/30 to-transparent" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {teams.filter(t => t.region === region).map((team, idx) => (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="group bg-card border border-white/10 rounded-[2rem] p-6 hover:border-blue-500/50 transition-all shadow-xl hover:shadow-blue-500/5 relative overflow-hidden"
                  >
                    <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-blue-500/5 blur-[40px] rounded-full group-hover:bg-blue-500/10 transition-all" />
                    
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-14 h-14 bg-active rounded-2xl flex items-center justify-center p-3 border border-white/5 group-hover:bg-blue-500/20 transition-all shadow-inner">
                        {team.logoUrl ? (
                          <img src={team.logoUrl} className="w-full h-full object-contain" />
                        ) : (
                          <Shield size={24} className="text-gray-700" />
                        )}
                      </div>
                      <div>
                        <p className="font-black italic uppercase tracking-tighter text-lg leading-tight group-hover:text-blue-400 transition-colors">{team.name}</p>
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 bg-black/20 px-2.5 py-1 rounded-lg border border-white/5">
                           GRUPO {team.group || "?"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
