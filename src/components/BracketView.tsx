import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../lib/AuthContext";
import { matchService, predictionService } from "../lib/services";
import { Trophy, Shield, HelpCircle, Move, CheckCircle2 } from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from "motion/react";

export default function BracketView() {
  const { profile } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<Record<number, any>>({});
  const [teams, setTeams] = useState<Record<number, any>>({});
  const [mode, setMode] = useState<"user" | "real">("user");
  const [zoom, setZoom] = useState(1.0);
  const [loading, setLoading] = useState(true);

  // Drag state
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const loadData = async () => {
    try {
      setLoading(true);
      const matchesRes = await matchService.getMatches();
      const matchesList = matchesRes.data.data || [];
      setMatches(matchesList.sort((a: any, b: any) => a.matchNumber - b.matchNumber));

      // Build teams mapping
      const teamsMap: Record<number, any> = {};
      matchesList.forEach((m: any) => {
        if (m.teamA) teamsMap[m.teamA.id] = m.teamA;
        if (m.teamB) teamsMap[m.teamB.id] = m.teamB;
      });
      setTeams(teamsMap);

      if (profile?.uid) {
        const predsRes = await predictionService.getUserPredictions(parseInt(profile.uid));
        const predsMap: Record<number, any> = {};
        (predsRes.data.data || []).forEach((p: any) => {
          predsMap[p.matchId] = p;
        });
        setPredictions(predsMap);
      }
      setLoading(false);
    } catch (err) {
      console.error("[BRACKET_VIEW] Error loading data:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      loadData();
    }
  }, [profile]);

  // Center scroll horizontally initially
  useEffect(() => {
    if (!loading && containerRef.current) {
      const container = containerRef.current;
      // Scroll to center horizontally and vertically
      container.scrollLeft = (container.scrollWidth - container.clientWidth) / 4;
      container.scrollTop = (container.scrollHeight - container.clientHeight) / 2;
    }
  }, [loading]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setStartY(e.pageY - containerRef.current.offsetTop);
    setScrollLeft(containerRef.current.scrollLeft);
    setScrollTop(containerRef.current.scrollTop);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const y = e.pageY - containerRef.current.offsetTop;
    const walkX = (x - startX) * 1.5;
    const walkY = (y - startY) * 1.5;
    containerRef.current.scrollLeft = scrollLeft - walkX;
    containerRef.current.scrollTop = scrollTop - walkY;
  };

  const stopDragging = () => {
    setIsDragging(false);
  };

  if (loading) {
    return <div className="p-20 text-center animate-pulse font-black uppercase text-gray-500">Cargando árbol de llaves...</div>;
  }

  // Filter matches for each phase
  const r32 = matches.filter(m => m.phase === "ROUND_OF_32").sort((a, b) => a.matchNumber - b.matchNumber);
  const r16 = matches.filter(m => m.phase === "ROUND_OF_16").sort((a, b) => a.matchNumber - b.matchNumber);
  const qf = matches.filter(m => m.phase === "QUARTERFINALS").sort((a, b) => a.matchNumber - b.matchNumber);
  const sf = matches.filter(m => m.phase === "SEMIFINALS").sort((a, b) => a.matchNumber - b.matchNumber);
  const final = matches.filter(m => m.phase === "FINAL").sort((a, b) => a.matchNumber - b.matchNumber);
  const third = matches.filter(m => m.phase === "THIRD_PLACE").sort((a, b) => a.matchNumber - b.matchNumber);

  const rounds = [
    { title: "Dieciseisavos (R32)", matches: r32 },
    { title: "Octavos (R16)", matches: r16 },
    { title: "Cuartos de Final", matches: qf },
    { title: "Semifinales", matches: sf },
    { title: "Finales", matches: [...final, ...third] }
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 flex flex-col h-[85vh]">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-text-main">
            Árbol <span className="text-accent">Visualizer</span>
          </h1>
          <p className="text-text-muted text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mt-1">
            <Move size={12} className="text-accent animate-pulse" /> Haz clic y arrastra con el mouse para navegar
          </p>
        </div>

        {/* Toggle Mode */}
        <div className="flex bg-card p-1.5 rounded-2xl border border-border-main w-fit shadow-2xl backdrop-blur-xl shrink-0">
          <button
            onClick={() => setMode("user")}
            className={cn(
              "px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300",
              mode === "user" ? "bg-accent text-black shadow-lg shadow-accent/20" : "text-text-muted hover:text-text-main"
            )}
          >
            Mi Pronóstico
          </button>
          <button
            onClick={() => setMode("real")}
            className={cn(
              "px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300",
              mode === "real" ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-text-muted hover:text-text-main"
            )}
          >
            Torneo Real
          </button>
        </div>
      </div>

      {/* Interactive Draggable Canvas Wrapper */}
      <div className="relative flex-1 w-full overflow-hidden bg-black/40 border border-white/10 rounded-[2.5rem] shadow-inner">
        {/* Zoom Controls Overlay */}
        <div className="absolute bottom-6 right-6 flex items-center bg-card/90 border border-border-main p-1.5 rounded-2xl shadow-2xl backdrop-blur-xl gap-1 z-20">
          <button 
            onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))} 
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-active transition-all text-sm font-black text-text-muted hover:text-text-main cursor-pointer"
            title="Alejar (Zoom -)"
          >
            -
          </button>
          <div className="px-2 flex items-center justify-center text-[10px] font-mono font-black text-accent min-w-[44px]">
            {Math.round(zoom * 100)}%
          </div>
          <button 
            onClick={() => setZoom(prev => Math.min(prev + 0.1, 1.5))} 
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-active transition-all text-sm font-black text-text-muted hover:text-text-main cursor-pointer"
            title="Acercar (Zoom +)"
          >
            +
          </button>
          <div className="h-4 w-px bg-border-main mx-1" />
          <button 
            onClick={() => setZoom(1.0)} 
            className="px-3 h-8 flex items-center justify-center rounded-xl hover:bg-active transition-all text-[9px] font-black uppercase text-text-muted hover:text-text-main cursor-pointer"
            title="Restablecer"
          >
            100%
          </button>
        </div>

        {/* Draggable Canvas */}
        <div 
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
          className={cn(
            "w-full h-full overflow-auto select-none no-scrollbar p-8",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
        >
          {/* Full Bracket Grid */}
          <div 
            style={{ transform: `scale(${zoom})`, transformOrigin: "left top" }}
            className="flex gap-16 min-w-max h-[1450px] items-stretch pr-8"
          >
            {rounds.map((round, colIdx) => (
              <div key={colIdx} className="w-64 shrink-0 flex flex-col justify-between h-full">
                {/* Round header */}
                <div className="text-center bg-card border border-white/5 py-2.5 rounded-xl shadow-md mb-4 shrink-0">
                  <span className="text-[9px] font-black uppercase text-accent tracking-[0.2em]">{round.title}</span>
                </div>

                {/* Col of games - justify-around auto aligns brackets vertically! */}
                <div className="flex-1 flex flex-col justify-around py-4">
                  {round.matches.map((m) => (
                    <div key={m.id} className="relative py-2">
                      <MiniMatchCard 
                        match={m} 
                        teams={teams} 
                        prediction={predictions[m.id]} 
                        mode={mode} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MiniMatchCardProps {
  match: any;
  teams: Record<number, any>;
  prediction?: any;
  mode: "user" | "real";
}

function MiniMatchCard({ match, teams, prediction, mode }: MiniMatchCardProps) {
  const teamA = teams[match.teamAId];
  const teamB = teams[match.teamBId];

  let scoreA: string | number = "-";
  let scoreB: string | number = "-";
  let isFinished = false;
  let winnerId: number | null = null;

  if (mode === "user") {
    if (prediction) {
      scoreA = prediction.predictedScoreA;
      scoreB = prediction.predictedScoreB;
      // Simple logic to predict simulated winner
      if (scoreA > scoreB) winnerId = match.teamAId;
      else if (scoreB > scoreA) winnerId = match.teamBId;
    }
  } else {
    isFinished = match.status === "FINISHED";
    if (isFinished) {
      scoreA = match.scoreA ?? "-";
      scoreB = match.scoreB ?? "-";
      winnerId = match.winnerTeamId;
    }
  }

  // Points indicator (only in my predictions mode if finished)
  const isMatchFinishedReal = match.status === "FINISHED";
  const points = prediction?.pointsEarned ?? 0;
  let pointsBadge = null;
  if (mode === "user" && isMatchFinishedReal) {
    if (points === 10) {
      pointsBadge = <span className="absolute -top-2.5 right-3 text-[7px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">+10 PTS</span>;
    } else if (points === 5) {
      pointsBadge = <span className="absolute -top-2.5 right-3 text-[7px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/10 px-1.5 py-0.5 rounded-full">+5 PTS</span>;
    } else {
      pointsBadge = <span className="absolute -top-2.5 right-3 text-[7px] font-black text-red-400 bg-red-500/10 border border-red-500/10 px-1.5 py-0.5 rounded-full">0 PTS</span>;
    }
  }

  return (
    <div className={cn(
      "relative bg-card/90 border border-white/10 rounded-2xl p-3 flex flex-col gap-1.5 w-64 shadow-xl transition-all duration-300 hover:border-accent/30 hover:scale-[1.02]",
      isFinished && "border-emerald-500/20"
    )}>
      {pointsBadge}
      
      {/* Match Identifier */}
      <span className="text-[7px] font-black text-gray-600 tracking-wider uppercase leading-none block">
        Partido M#{match.matchNumber} {match.phase === "THIRD_PLACE" ? "• 3er Lugar" : ""}
      </span>

      {/* Team A row */}
      <div className={cn(
        "flex items-center justify-between py-0.5",
        winnerId && winnerId === match.teamAId ? "text-accent font-black" : "text-text-muted",
        winnerId && winnerId !== match.teamAId && "opacity-40"
      )}>
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-5 h-5 rounded-full bg-active flex items-center justify-center p-0.5 border border-border-main shrink-0">
            {teamA?.logoUrl ? <img src={teamA.logoUrl} className="w-full h-full object-contain rounded-full" /> : <Shield size={10} />}
          </div>
          <span className="text-[10px] uppercase truncate font-bold tracking-tight">{teamA?.name || "TBD"}</span>
        </div>
        <span className="text-[10px] font-black px-1.5">{scoreA}</span>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/5 w-full" />

      {/* Team B row */}
      <div className={cn(
        "flex items-center justify-between py-0.5",
        winnerId && winnerId === match.teamBId ? "text-accent font-black" : "text-text-muted",
        winnerId && winnerId !== match.teamBId && "opacity-40"
      )}>
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-5 h-5 rounded-full bg-active flex items-center justify-center p-0.5 border border-border-main shrink-0">
            {teamB?.logoUrl ? <img src={teamB.logoUrl} className="w-full h-full object-contain rounded-full" /> : <Shield size={10} />}
          </div>
          <span className="text-[10px] uppercase truncate font-bold tracking-tight">{teamB?.name || "TBD"}</span>
        </div>
        <span className="text-[10px] font-black px-1.5">{scoreB}</span>
      </div>
    </div>
  );
}
