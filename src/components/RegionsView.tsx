import React, { useEffect, useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { teamService, matchService } from "../lib/services";
import { motion } from "motion/react";
import { AlertCircle, Shield, Check, X } from "lucide-react";

export default function RegionsView() {
  const { profile } = useAuth();
  const [teams, setTeams] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vista por defecto: posiciones (as requested: "Esta sería la vista por defecto al entrar a la sección de Grupos")
  const [viewMode, setViewMode] = useState<"positions" | "regions">("positions");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [teamsRes, matchesRes] = await Promise.all([
          teamService.getTeams(),
          matchService.getMatches()
        ]);

        setTeams(teamsRes.data.data || []);
        setMatches(matchesRes.data.data || []);
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(err.response?.data?.error || 'Error loading groups and standings data');
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

  // Cálculo de estadísticas por equipo
  const calculatedTeams = teams.map(team => {
    const teamMatches = matches.filter(m =>
      m.phase === 'GROUPS' &&
      (m.teamAId === team.id || m.teamBId === team.id)
    );

    let pj = 0;
    let pg = 0;
    let pe = 0;
    let pp = 0;
    let ga = 0;
    let gc = 0;

    teamMatches.forEach(m => {
      // Un partido cuenta si está terminado o tiene resultados válidos
      if (m.status === 'FINISHED' && m.scoreA !== null && m.scoreB !== null) {
        pj++;
        const isTeamA = m.teamAId === team.id;
        const teamScore = isTeamA ? m.scoreA : m.scoreB;
        const oppScore = isTeamA ? m.scoreB : m.scoreA;

        ga += teamScore;
        gc += oppScore;

        if (teamScore > oppScore) {
          pg++;
        } else if (teamScore < oppScore) {
          pp++;
        } else {
          pe++;
        }
      }
    });

    const dg = ga - gc;
    const pu = pg * 3 + pe * 1;

    // Obtener los 3 partidos correspondientes a la fase de grupos ordenados cronológicamente
    const sortedMatches = [...teamMatches].sort((a, b) => {
      if (a.matchNumber !== b.matchNumber) return a.matchNumber - b.matchNumber;
      return new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime();
    });

    // Rellenamos hasta 3 slots de partidos
    const formMatches = [];
    for (let i = 0; i < 3; i++) {
      formMatches.push(sortedMatches[i] || null);
    }

    return {
      ...team,
      pj,
      pg,
      pe,
      pp,
      ga,
      gc,
      dg,
      pu,
      formMatches
    };
  });

  const getGroupTeams = (groupLetter: string) => {
    return calculatedTeams
      .filter(t => t.groupLetter === groupLetter)
      .sort((a, b) => {
        if (b.pu !== a.pu) return b.pu - a.pu;
        if (b.dg !== a.dg) return b.dg - a.dg;
        if (b.ga !== a.ga) return b.ga - a.ga;
        return a.name.localeCompare(b.name);
      });
  };

  const activeGroups = groups.filter(g => calculatedTeams.some(t => t.groupLetter === g));

  const renderFormCircle = (match: any, teamId: number) => {
    if (!match || match.status !== 'FINISHED' || match.scoreA === null || match.scoreB === null) {
      // No lo ha jugado: fondo gris
      return (
        <div
          key={match?.id || Math.random()}
          className="w-5 h-5 flex items-center justify-center rounded-full bg-neutral-700/50 border border-neutral-600 text-[10px] text-neutral-400 font-bold"
          title="Partido pendiente / sin resultado"
        >
          •
        </div>
      );
    }

    const isTeamA = match.teamAId === teamId;
    const teamScore = isTeamA ? match.scoreA : match.scoreB;
    const oppScore = isTeamA ? match.scoreB : match.scoreA;

    if (teamScore > oppScore) {
      // Ganó: fondo verde, chulito
      return (
        <div
          key={match.id}
          className="w-5 h-5 flex items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white font-black"
          title={`Ganó ${teamScore}-${oppScore}`}
        >
          ✓
        </div>
      );
    } else if (teamScore < oppScore) {
      // Perdió: fondo rojo, X
      return (
        <div
          key={match.id}
          className="w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-black"
          title={`Perdió ${teamScore}-${oppScore}`}
        >
          ✕
        </div>
      );
    } else {
      // Empató: fondo amarillo, guión
      return (
        <div
          key={match.id}
          className="w-5 h-5 flex items-center justify-center rounded-full bg-amber-500 text-[10px] text-black font-black"
          title={`Empató ${teamScore}-${oppScore}`}
        >
          -
        </div>
      );
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Banner Superior Bento */}
      <div className="bg-card p-6 rounded-2xl border border-border-main flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xl">
        <div>
          <h1 className="text-2xl font-black uppercase mb-1 text-text-main tracking-tighter">
            {viewMode === 'positions' ? "Posiciones de Grupos" : "Equipos por Región"}
          </h1>
          <p className="text-xs text-text-muted font-semibold uppercase tracking-wider">
            {viewMode === 'positions'
              ? "Tabla de posiciones en tiempo real para la Fase de Grupos"
              : "Visualiza los equipos organizados por región"
            }
          </p>
        </div>
        <button
          onClick={() => setViewMode(viewMode === 'positions' ? 'regions' : 'positions')}
          className="px-5 py-2.5 bg-accent hover:bg-accent/80 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-accent/25 shrink-0 self-start md:self-auto"
        >
          {viewMode === 'positions' ? 'Ver equipos por región' : 'Ver Posiciones'}
        </button>
      </div>

      {viewMode === 'positions' ? (
        /* Vista de Posiciones (Default) */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {activeGroups.map(groupLetter => {
            const groupTeams = getGroupTeams(groupLetter);
            return (
              <motion.div
                key={groupLetter}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card p-5 rounded-2xl border border-border-main shadow-lg"
              >
                <div className="border-b border-border-main/50 pb-3 mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-black text-accent tracking-tighter uppercase italic">
                    Grupo {groupLetter}
                  </h2>
                  <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest">
                    Fase de Grupos
                  </span>
                </div>

                <div className="overflow-x-auto w-full no-scrollbar">
                  <table className="w-full text-left border-collapse text-[11px] font-bold uppercase tracking-wider">
                    <thead>
                      <tr className="border-b border-border-main/30 text-text-muted text-[9px] tracking-widest">
                        <th className="py-2 px-1 text-center w-6">#</th>
                        <th className="py-2 px-2 text-left">Equipo</th>
                        <th className="py-2 px-1 text-center w-8">PJ</th>
                        <th className="py-2 px-1 text-center w-8">PG</th>
                        <th className="py-2 px-1 text-center w-8">PE</th>
                        <th className="py-2 px-1 text-center w-8">PP</th>
                        <th className="py-2 px-1 text-center w-8" title="Goles a Favor">GA</th>
                        <th className="py-2 px-1 text-center w-8" title="Goles en Contra">GC</th>
                        <th className="py-2 px-1 text-center w-8" title="Diferencia de Goles">DG</th>
                        <th className="py-2 px-2 text-center w-10 text-accent">PU</th>
                        <th className="py-2 px-2 text-center w-24">Encuentros</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-main/20">
                      {groupTeams.map((team, idx) => (
                        <tr key={team.id} className="hover:bg-active/20 transition-colors">
                          <td className="py-3 px-1 text-center text-text-muted font-black">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-2 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-active border border-border-main flex items-center justify-center p-0.5 shrink-0 overflow-hidden shadow-sm">
                              {team.logoUrl ? (
                                <img src={team.logoUrl} className="w-full h-full object-contain rounded-full" />
                              ) : (
                                <Shield size={10} className="text-text-muted" />
                              )}
                            </div>
                            <span className="truncate max-w-[120px] sm:max-w-[150px] font-black text-text-main">
                              {team.name}
                            </span>
                          </td>
                          <td className="py-3 px-1 text-center font-medium text-text-muted">{team.pj}</td>
                          <td className="py-3 px-1 text-center font-medium text-text-muted">{team.pg}</td>
                          <td className="py-3 px-1 text-center font-medium text-text-muted">{team.pe}</td>
                          <td className="py-3 px-1 text-center font-medium text-text-muted">{team.pp}</td>
                          <td className="py-3 px-1 text-center font-medium text-text-muted">{team.ga}</td>
                          <td className="py-3 px-1 text-center font-medium text-text-muted">{team.gc}</td>
                          <td className={`py-3 px-1 text-center font-bold ${team.dg > 0 ? 'text-emerald-500' : team.dg < 0 ? 'text-red-500' : 'text-text-muted'}`}>
                            {team.dg > 0 ? `+${team.dg}` : team.dg}
                          </td>
                          <td className="py-3 px-2 text-center font-black text-accent text-xs">{team.pu}</td>
                          <td className="py-3 px-2">
                            <div className="flex items-center justify-center gap-1">
                              {team.formMatches.map((m: any) => renderFormCircle(m, team.id))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Vista original por Región */
        <div className="space-y-4">
          <div className="space-y-4">
            {regions.map((region) => {
              const regionTeams = teams.filter(t => t.region === region.code);
              if (regionTeams.length === 0) return null;

              return (
                <motion.div
                  key={region.code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card p-6 rounded-2xl border border-border-main shadow-lg"
                >
                  <h3 className="text-lg font-black text-accent mb-4 uppercase italic tracking-tighter">{region.name}</h3>
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
      )}

      {/* Estadísticas de pie de página */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card p-6 rounded-2xl border border-border-main shadow-lg"
      >
        <h2 className="text-lg font-black uppercase mb-4 text-text-main tracking-tighter">Estadísticas del Torneo</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-active p-4 rounded-xl text-center">
            <p className="text-xs text-text-muted font-bold uppercase">Total Equipos</p>
            <p className="text-2xl font-black text-accent mt-2">{teams.length}</p>
          </div>
          <div className="bg-active p-4 rounded-xl text-center">
            <p className="text-xs text-text-muted font-bold uppercase">Grupos</p>
            <p className="text-2xl font-black text-accent mt-2">{activeGroups.length}</p>
          </div>
          <div className="bg-active p-4 rounded-xl text-center">
            <p className="text-xs text-text-muted font-bold uppercase">Partidos Jugados</p>
            <p className="text-2xl font-black text-accent mt-2">
              {matches.filter(m => m.phase === 'GROUPS' && m.status === 'FINISHED').length}
            </p>
          </div>
          <div className="bg-active p-4 rounded-xl text-center">
            <p className="text-xs text-text-muted font-bold uppercase">Promedio Goles</p>
            <p className="text-2xl font-black text-accent mt-2">
              {(() => {
                const finishedGroupMatches = matches.filter(m => m.phase === 'GROUPS' && m.status === 'FINISHED' && m.scoreA !== null && m.scoreB !== null);
                if (finishedGroupMatches.length === 0) return "0.0";
                const totalGoals = finishedGroupMatches.reduce((acc, m) => acc + (m.scoreA || 0) + (m.scoreB || 0), 0);
                return (totalGoals / finishedGroupMatches.length).toFixed(2);
              })()}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
