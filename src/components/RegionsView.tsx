import React, { useEffect, useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { teamService } from "../lib/services";
import { motion } from "motion/react";
import { AlertCircle, Shield } from "lucide-react";

export default function RegionsView() {
  const { profile } = useAuth();
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const teamsRes = await teamService.getTeams();
        setTeams(teamsRes.data.data || []);
      } catch (err: any) {
        console.error('Error loading teams:', err);
        setError(err.response?.data?.error || 'Error loading teams');
      } finally {
        setLoading(false);
      }
    };

    if (profile) {
      loadData();
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-2xl text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 font-bold">{error}</p>
        </div>
      </div>
    );
  }

  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const regions = [
    { code: 'UEFA', name: 'Europa (UEFA)' },
    { code: 'CONMEBOL', name: 'Sudamérica (CONMEBOL)' },
    { code: 'CAF', name: 'África (CAF)' },
    { code: 'AFC', name: 'Asia (AFC)' },
    { code: 'CONCACAF', name: 'Norte y Centroamérica (CONCACAF)' },
    { code: 'OFC', name: 'Oceanía (OFC)' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-2xl border border-border-main">
        <h1 className="text-2xl font-black uppercase mb-2 text-text-main">Equipos por Región</h1>
        <p className="text-sm text-text-muted">
          Visualiza los equipos organizados por región
        </p>
      </div>

      {/* Por Región */}
      <div className="space-y-4">
        <h2 className="text-xl font-black uppercase text-text-main">Por Región</h2>
        <div className="space-y-4">
          {regions.map((region) => {
            const regionTeams = teams.filter(t => t.region === region.code);
            if (regionTeams.length === 0) return null;

            return (
              <motion.div
                key={region.code}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card p-6 rounded-2xl border border-border-main"
              >
                <h3 className="text-lg font-black text-accent mb-4">{region.name}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {regionTeams.map((team) => (
                    <div
                      key={team.id}
                      className="bg-active p-3 rounded-xl border border-border-main/50 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-card border border-border-main flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-sm">
                        {team.logoUrl ? (
                          <img src={team.logoUrl} className="w-full h-full object-contain rounded-full" />
                        ) : (
                          <Shield size={14} className="text-text-muted" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-text-main truncate">{team.name}</p>
                        <p className="text-xs text-text-muted">Grupo {team.groupLetter}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Total Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card p-6 rounded-2xl border border-border-main"
      >
        <h2 className="text-lg font-black uppercase mb-4 text-text-main">Estadísticas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-active p-4 rounded-xl text-center">
            <p className="text-xs text-text-muted font-bold uppercase">Total Equipos</p>
            <p className="text-2xl font-black text-accent mt-2">{teams.length}</p>
          </div>
          <div className="bg-active p-4 rounded-xl text-center">
            <p className="text-xs text-text-muted font-bold uppercase">Grupos</p>
            <p className="text-2xl font-black text-accent mt-2">{groups.length}</p>
          </div>
          <div className="bg-active p-4 rounded-xl text-center">
            <p className="text-xs text-text-muted font-bold uppercase">Regiones</p>
            <p className="text-2xl font-black text-accent mt-2">
              {new Set(teams.map(t => t.region)).size}
            </p>
          </div>
          <div className="bg-active p-4 rounded-xl text-center">
            <p className="text-xs text-text-muted font-bold uppercase">Promedio/Grupo</p>
            <p className="text-2xl font-black text-accent mt-2">
              {(teams.length / groups.length).toFixed(1)}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
