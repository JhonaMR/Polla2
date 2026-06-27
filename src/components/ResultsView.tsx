import React, { useEffect, useState } from "react";
import { Shield, ArrowRight, Eye, Calendar, Award } from "lucide-react";
import { motion } from "motion/react";
import { matchService } from "../lib/services";
import { cn } from "../lib/utils";
import MatchElectionsModal from "./MatchElectionsModal";

export default function ResultsView() {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await matchService.getMatches();
      const allMatches = res.data.data || [];

      // Filter matches that have both teams defined (not TBD)
      const definedMatches = allMatches.filter(
        (m: any) => m.teamAId !== null && m.teamBId !== null
      );

      // Sort by matchNumber ascending
      definedMatches.sort((a: any, b: any) => a.matchNumber - b.matchNumber);

      setMatches(definedMatches);
    } catch (err) {
      console.error("Error loading matches:", err);
      setError("Error al cargar los encuentros.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-6 flex flex-col min-h-[85vh]">
      {/* Header Title & Subtitle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-text-main">
            Resultados de la <span className="text-accent">Polla</span>
          </h1>
          <p className="text-text-muted text-xs font-bold uppercase tracking-widest mt-1">
            Encuentros oficiales, marcadores y elecciones de los participantes
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 bg-card rounded-[2.5rem] border border-border-main p-6 flex flex-col overflow-hidden shadow-2xl relative">
        <div className="absolute -left-20 -top-20 w-64 h-64 bg-accent/5 blur-[100px] rounded-full pointer-events-none" />

        {/* Table wrapper */}
        <div className="flex-1 overflow-x-auto overflow-y-auto rounded-2xl border border-border-main bg-active/20 pr-1 scrollbar-thin">
          {loading ? (
            <div className="py-20 text-center text-text-muted text-xs font-black uppercase tracking-widest animate-pulse">
              Cargando resultados oficiales...
            </div>
          ) : error ? (
            <div className="py-20 text-center text-red-500 text-xs font-black uppercase tracking-widest">
              {error}
            </div>
          ) : matches.length === 0 ? (
            <div className="py-20 text-center text-text-muted text-xs font-black uppercase tracking-widest italic">
              No hay partidos definidos disponibles en este momento.
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-active/85 border-b border-border-main/80 text-[13px] font-black italic bold uppercase tracking-tight text-text-main/90 shadow-sm">
                  <th className="py-3.5 px-6 text-center w-20 rounded-l-2xl">Partido</th>
                  <th className="py-3.5 px-6 text-center">Encuentro</th>
                  <th className="py-3.5 px-6 text-center pr-24 w-52">Marcador Real</th>
                  <th className="py-3.5 px-6 text-center w-60 rounded-r-2xl">Acción</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m, index) => {
                  const isFinished = m.status === "FINISHED";
                  const teamA = m.teamA;
                  const teamB = m.teamB;

                  return (
                    <motion.tr
                      key={m.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.015, 0.4) }}
                      onClick={() => setSelectedMatch(m)}
                      className={cn(
                        "border-b border-border-main transition-all duration-300 cursor-pointer",
                        isFinished
                          ? "hover:bg-active/40"
                          : "opacity-75 bg-active/5 hover:opacity-95 hover:bg-active/20"
                      )}
                    >
                      {/* Match Number */}
                      <td className="py-2.5 px-6 text-center">
                        <span className="text-[10px] font-black text-text-muted bg-active/50 border border-border-main/50 px-2.5 py-1 rounded-lg">
                          #{m.matchNumber}
                        </span>
                      </td>

                      {/* Match matchup with flags in between names */}
                      <td className="py-2.5 px-6">
                        <div className="flex items-center gap-2.5 font-black uppercase text-sm tracking-tight italic">
                          {/* Team A Name */}
                          <span className="w-[42%] text-right truncate text-text-main">
                            {teamA?.name || "TBD"}
                          </span>

                          {/* Flags in the middle */}
                          <div className="flex items-center justify-center gap-1.5 shrink-0 w-[16%]">
                            <div className="w-8 h-8 rounded-full bg-card border border-border-main flex items-center justify-center p-0.5 overflow-hidden shadow-md">
                              {teamA?.logoUrl ? (
                                <img src={teamA.logoUrl} className="w-full h-full object-contain rounded-full" alt="" />
                              ) : (
                                <Shield size={14} className="text-text-muted" />
                              )}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-card border border-border-main flex items-center justify-center p-0.5 overflow-hidden shadow-md">
                              {teamB?.logoUrl ? (
                                <img src={teamB.logoUrl} className="w-full h-full object-contain rounded-full" alt="" />
                              ) : (
                                <Shield size={14} className="text-text-muted" />
                              )}
                            </div>
                          </div>

                          {/* Team B Name */}
                          <span className="w-[42%] text-left truncate text-text-main">
                            {teamB?.name || "TBD"}
                          </span>
                        </div>
                      </td>

                      {/* Match Real Marker */}
                      <td className="py-2.5 px-6 text-center pr-24">
                        {isFinished ? (
                          <span className="font-mono font-black text-xs bg-active px-3.5 py-1.5 rounded-xl border border-border-main text-text-main">
                            {m.scoreA} - {m.scoreB}
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                            Pendiente
                          </span>
                        )}
                      </td>

                      {/* Action button */}
                      <td className="py-2.5 px-6 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Avoid triggering row onClick twice
                            setSelectedMatch(m);
                          }}
                          className="px-4 py-2 bg-accent text-black font-black text-[9px] uppercase tracking-widest rounded-xl transition-all shadow shadow-accent/15 hover:scale-105 hover:bg-accent/90 active:scale-95 cursor-pointer flex items-center gap-1.5 mx-auto"
                        >
                          <Eye size={11} />
                          <span>Ver elecciones</span>
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Match Elections Modal */}
      <MatchElectionsModal
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        match={selectedMatch}
      />
    </div>
  );
}
