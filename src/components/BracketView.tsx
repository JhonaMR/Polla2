import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../lib/AuthContext";
import { matchService, predictionService, phaseService } from "../lib/services";
import { Trophy, Shield, Move, Lock, Award } from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from "motion/react";
import MatchDetailModal from "./MatchDetailModal";

// Connector Lines Component (Fork shape)
const ConnectorLines = ({ height, direction = "ltr" }: { height: number, direction?: "ltr" | "rtl", key?: any }) => {
  const topY = height / 4;
  const bottomY = (height / 4) * 3;
  const centerY = height / 2;
  const width = 48;
  const halfX = width / 2;

  const startX = direction === "ltr" ? 0 : width;
  const endX = direction === "ltr" ? width : 0;
  const midX = halfX;

  return (
    <div className="relative pointer-events-none shrink-0" style={{ width, height }}>
      <svg className="absolute inset-0" style={{ width, height }}>
        {/* Top horizontal line */}
        <line x1={startX} y1={topY} x2={midX} y2={topY} stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
        {/* Bottom horizontal line */}
        <line x1={startX} y1={bottomY} x2={midX} y2={bottomY} stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
        {/* Vertical connection line */}
        <line x1={midX} y1={topY} x2={midX} y2={bottomY} stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
        {/* Center outgoing line */}
        <line x1={midX} y1={centerY} x2={endX} y2={centerY} stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      </svg>
    </div>
  );
};

// Straight Connector Line Component
const StraightLine = ({ height, direction = "ltr" }: { height: number, direction?: "ltr" | "rtl" }) => {
  const width = 48;
  return (
    <div className="relative pointer-events-none shrink-0" style={{ width, height }}>
      <svg className="absolute inset-0" style={{ width, height }}>
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      </svg>
    </div>
  );
};

export default function BracketView() {
  const { profile } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<Record<number, any>>({});
  const [phaseConfigs, setPhaseConfigs] = useState<any[]>([]);
  const [teams, setTeams] = useState<Record<number, any>>({});
  const [mode, setMode] = useState<"user" | "real">("user");
  const [zoom, setZoom] = useState(0.85);
  const [loading, setLoading] = useState(true);

  // Modal detail states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedMatchForDetail, setSelectedMatchForDetail] = useState<any>(null);

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
      const [matchesRes, phasesRes] = await Promise.all([
        matchService.getMatches(),
        phaseService.getPhases()
      ]);

      const matchesList = matchesRes.data.data || [];
      setMatches(matchesList.sort((a: any, b: any) => a.matchNumber - b.matchNumber));
      setPhaseConfigs(phasesRes.data.data || []);

      // Build teams map
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
      container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
      container.scrollTop = (container.scrollHeight - container.clientHeight) / 2;
    }
  }, [loading]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Avoid dragging when clicking inside inputs
    if ((e.target as HTMLElement).tagName === "INPUT") return;
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
    const walkX = (x - startX) * 1.3;
    const walkY = (y - startY) * 1.3;
    containerRef.current.scrollLeft = scrollLeft - walkX;
    containerRef.current.scrollTop = scrollTop - walkY;
  };

  const stopDragging = () => {
    setIsDragging(false);
  };

  const isMatchLocked = (match: any) => {
    if (match.status === "FINISHED") return true;

    const config = phaseConfigs.find(c => c.phase === match.phase);
    if (config && config.status !== 'OPEN_FOR_PREDICTIONS') {
      return true;
    }

    const kickoff = new Date(match.matchDate);
    const fifteenMinutes = 15 * 60 * 1000;
    if (kickoff.getTime() - Date.now() < fifteenMinutes) {
      return true;
    }

    return false;
  };

  const savePrediction = async (matchId: number, scoreA: number, scoreB: number) => {
    if (!profile) return;
    const targetMatch = matches.find(m => m.id === matchId);
    if (targetMatch && isMatchLocked(targetMatch)) {
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
      const predsRes = await predictionService.getUserPredictions(parseInt(profile.uid));
      const predsMap: Record<number, any> = {};
      (predsRes.data.data || []).forEach((p: any) => {
        predsMap[p.matchId] = p;
      });
      setPredictions(predsMap);
    } catch (err) {
      console.error('[BRACKET_VIEW] Error saving prediction:', err);
    }
  };

  const handleCardClick = (match: any) => {
    setSelectedMatchForDetail(match);
    setDetailModalOpen(true);
  };

  if (loading) {
    return <div className="p-20 text-center animate-pulse font-black uppercase text-gray-500">Cargando árbol clasificatorio...</div>;
  }

  const getMatch = (num: number) => matches.find(m => m.matchNumber === num);

  // Helper to determine champion team
  const getChampion = () => {
    const finalMatch = getMatch(104);
    if (!finalMatch) return null;

    if (mode === "real") {
      if (finalMatch.status === "FINISHED" && finalMatch.winnerTeamId) {
        return finalMatch.winnerTeamId === finalMatch.teamAId ? finalMatch.teamA : finalMatch.teamB;
      }
    } else {
      const pred = predictions[finalMatch.id];
      if (pred) {
        if (pred.predictedScoreA > pred.predictedScoreB) return finalMatch.teamA;
        if (pred.predictedScoreB > pred.predictedScoreA) return finalMatch.teamB;
      }
    }
    return null;
  };

  // Helper to determine third place team
  const getBronzeWinner = () => {
    const thirdMatch = getMatch(103);
    if (!thirdMatch) return null;

    if (mode === "real") {
      if (thirdMatch.status === "FINISHED" && thirdMatch.winnerTeamId) {
        return thirdMatch.winnerTeamId === thirdMatch.teamAId ? thirdMatch.teamA : thirdMatch.teamB;
      }
    } else {
      const pred = predictions[thirdMatch.id];
      if (pred) {
        if (pred.predictedScoreA > pred.predictedScoreB) return thirdMatch.teamA;
        if (pred.predictedScoreB > pred.predictedScoreA) return thirdMatch.teamB;
      }
    }
    return null;
  };

  const championTeam = getChampion();
  const bronzeWinnerTeam = getBronzeWinner();

  // Mathematical height definitions for perfect alignments
  const r32CellHeight = 110; // Slightly increased spacing to have a light gap between cards
  const r16CellHeight = r32CellHeight * 2;
  const qfCellHeight = r16CellHeight * 2;
  const sfCellHeight = qfCellHeight * 2;

  // Total canvas dimensions (unscaled)
  const canvasWidth = 2600;
  const canvasHeight = 980; // Adjusted height for 110px spacing

  return (
    <div className="px-0 py-4 md:p-8 space-y-6 flex flex-col h-[88vh]">
      {/* Header controls */}
      <div className="px-4 md:px-0 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-text-main">
            Árbol <span className="text-accent underline decoration-accent/30 underline-offset-8">Clasificatorio 2026</span>
          </h1>
          <p className="text-text-muted text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mt-1">
            <Move size={12} className="text-accent animate-pulse" /> Arrastra el lienzo para moverte • Guarda marcadores directamente
          </p>
        </div>

        {/* Toggle Mode */}
        <div className="flex bg-card p-1.5 rounded-2xl border border-border-main w-fit shadow-2xl backdrop-blur-xl shrink-0">
          <button
            onClick={() => setMode("user")}
            className={cn(
              "px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer",
              mode === "user" ? "bg-accent text-black shadow-lg shadow-accent/20" : "text-text-muted hover:text-text-main"
            )}
          >
            Mi Pronóstico
          </button>
          <button
            onClick={() => setMode("real")}
            className={cn(
              "px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer",
              mode === "real" ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-text-muted hover:text-text-main"
            )}
          >
            Torneo Real
          </button>
        </div>
      </div>

      {/* Canvas Wrapper */}
      <div className="relative flex-1 w-full overflow-hidden bg-black/40 border-y border-x-0 md:border border-white/10 rounded-2xl md:rounded-[2.5rem] shadow-inner">

        {/* Zoom Controls Overlay */}
        <div className="absolute bottom-6 right-6 flex items-center bg-card/90 border border-border-main p-1.5 rounded-2xl shadow-2xl backdrop-blur-xl gap-1 z-20">
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.05, 0.4))}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-active transition-all text-sm font-black text-text-muted hover:text-text-main cursor-pointer"
            title="Alejar (Zoom -)"
          >
            -
          </button>
          <div className="px-2 flex items-center justify-center text-[10px] font-mono font-black text-accent min-w-[44px]">
            {Math.round(zoom * 100)}%
          </div>
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.05, 1.2))}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-active transition-all text-sm font-black text-text-muted hover:text-text-main cursor-pointer"
            title="Acercar (Zoom +)"
          >
            +
          </button>
          <div className="h-4 w-px bg-border-main mx-1" />
          <button
            onClick={() => setZoom(0.85)}
            className="px-3 h-8 flex items-center justify-center rounded-xl hover:bg-active transition-all text-[9px] font-black uppercase text-text-muted hover:text-text-main cursor-pointer"
            title="Restablecer"
          >
            85%
          </button>
        </div>

        {/* Draggable Canvas container */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
          className={cn(
            "w-full h-full overflow-auto select-none no-scrollbar p-6",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
        >
          {/* Sized Container to ensure scrollbar handles zoomed dimensions correctly */}
          <div
            style={{
              width: `${canvasWidth * zoom}px`,
              height: `${canvasHeight * zoom}px`,
              position: "relative"
            }}
          >
            {/* Scaled viewport via left top origin */}
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "left top",
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`,
                position: "absolute",
                left: 0,
                top: 0
              }}
              className="flex flex-col"
            >

              {/* Phase Headers Row (Uniform, fixed top row) */}
              <div className="flex w-full mb-6 bg-card border border-border-main/40 py-3.5 rounded-2xl text-center shrink-0 shadow-lg backdrop-blur-md">
                <div className="w-[240px]"><span className="text-[9px] font-black uppercase text-accent tracking-[0.2em]">Dieciseisavos (Izq)</span></div>
                <div className="w-[48px]" />
                <div className="w-[240px]"><span className="text-[9px] font-black uppercase text-accent tracking-[0.2em]">Octavos (Izq)</span></div>
                <div className="w-[48px]" />
                <div className="w-[240px]"><span className="text-[9px] font-black uppercase text-accent tracking-[0.2em]">Cuartos (Izq)</span></div>
                <div className="w-[48px]" />
                <div className="w-[240px]"><span className="text-[9px] font-black uppercase text-accent tracking-[0.2em]">Semifinal 1</span></div>
                <div className="w-[48px]" />
                <div className="w-[300px]"><span className="text-[10px] font-black uppercase text-text-main tracking-[0.35em] italic">Mundial 2026</span></div>
                <div className="w-[48px]" />
                <div className="w-[240px]"><span className="text-[9px] font-black uppercase text-accent tracking-[0.2em]">Semifinal 2</span></div>
                <div className="w-[48px]" />
                <div className="w-[240px]"><span className="text-[9px] font-black uppercase text-accent tracking-[0.2em]">Cuartos (Der)</span></div>
                <div className="w-[48px]" />
                <div className="w-[240px]"><span className="text-[9px] font-black uppercase text-accent tracking-[0.2em]">Octavos (Der)</span></div>
                <div className="w-[48px]" />
                <div className="w-[240px]"><span className="text-[9px] font-black uppercase text-accent tracking-[0.2em]">Dieciseisavos (Der)</span></div>
              </div>

              {/* Tournament Tree Columns Grid */}
              <div className="flex flex-1 items-stretch">

                {/* ================= LEFT SIDE TREE ================= */}
                {/* 1. Left R32 matches */}
                <div className="w-[240px] shrink-0 flex flex-col justify-start">
                  {[74, 77, 73, 75, 83, 84, 81, 82].map(num => (
                    <div key={num} className="flex items-center justify-center" style={{ height: r32CellHeight }}>
                      <BracketMatchCard
                        match={getMatch(num)}
                        prediction={predictions[getMatch(num)?.id]}
                        mode={mode}
                        isLocked={isMatchLocked(getMatch(num))}
                        onSave={savePrediction}
                        onCardClick={handleCardClick}
                      />
                    </div>
                  ))}
                </div>

                {/* Left Connector 1 (R32 -> R16) */}
                <div className="w-[48px] shrink-0 flex flex-col justify-start">
                  {[1, 2, 3, 4].map(i => (
                    <ConnectorLines key={i} height={r16CellHeight} direction="ltr" />
                  ))}
                </div>

                {/* 2. Left R16 matches */}
                <div className="w-[240px] shrink-0 flex flex-col justify-start">
                  {[89, 90, 93, 94].map(num => (
                    <div key={num} className="flex items-center justify-center" style={{ height: r16CellHeight }}>
                      <BracketMatchCard
                        match={getMatch(num)}
                        prediction={predictions[getMatch(num)?.id]}
                        mode={mode}
                        isLocked={isMatchLocked(getMatch(num))}
                        onSave={savePrediction}
                        onCardClick={handleCardClick}
                      />
                    </div>
                  ))}
                </div>

                {/* Left Connector 2 (R16 -> QF) */}
                <div className="w-[48px] shrink-0 flex flex-col justify-start">
                  {[1, 2].map(i => (
                    <ConnectorLines key={i} height={qfCellHeight} direction="ltr" />
                  ))}
                </div>

                {/* 3. Left QF matches */}
                <div className="w-[240px] shrink-0 flex flex-col justify-start">
                  {[97, 98].map(num => (
                    <div key={num} className="flex items-center justify-center" style={{ height: qfCellHeight }}>
                      <BracketMatchCard
                        match={getMatch(num)}
                        prediction={predictions[getMatch(num)?.id]}
                        mode={mode}
                        isLocked={isMatchLocked(getMatch(num))}
                        onSave={savePrediction}
                        onCardClick={handleCardClick}
                      />
                    </div>
                  ))}
                </div>

                {/* Left Connector 3 (QF -> SF) */}
                <div className="w-[48px] shrink-0 flex flex-col justify-start">
                  <ConnectorLines height={sfCellHeight} direction="ltr" />
                </div>

                {/* 4. Left SF match */}
                <div className="w-[240px] shrink-0 flex flex-col justify-start">
                  <div className="flex items-center justify-center" style={{ height: sfCellHeight }}>
                    <BracketMatchCard
                      match={getMatch(101)}
                      prediction={predictions[getMatch(101)?.id]}
                      mode={mode}
                      isLocked={isMatchLocked(getMatch(101))}
                      onSave={savePrediction}
                      onCardClick={handleCardClick}
                    />
                  </div>
                </div>

                {/* Left Connector 4 (SF -> Center) */}
                <div className="w-[48px] shrink-0 flex flex-col justify-start">
                  <StraightLine height={sfCellHeight} direction="ltr" />
                </div>


                {/* ================= CENTER COLUMN (TROPHY, FINALS, CHAMPIONS) ================= */}
                <div className="w-[300px] shrink-0 flex flex-col items-center justify-center gap-5 relative">

                  {/* World Champion container (Top) */}
                  <div className="w-60 bg-card border-2 border-yellow-500 rounded-3xl p-3 flex flex-col items-center justify-center shadow-xl shadow-yellow-500/5 min-h-[90px] relative overflow-hidden z-10">
                    <div className="absolute inset-0 bg-yellow-500/10 pointer-events-none z-0" />
                    <div className="relative z-10 flex flex-col items-center justify-center w-full">
                      <div className="absolute top-0 right-0">
                        <Trophy className="w-4 h-4 text-yellow-500 animate-bounce" />
                      </div>
                      <span className="text-[7px] font-black text-yellow-500 uppercase tracking-widest mb-1.5">Campeón Mundial</span>
                      {championTeam ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-8 h-8 rounded-full bg-active border border-yellow-500/30 flex items-center justify-center p-0.5 overflow-hidden">
                            {championTeam.logoUrl ? (
                              <img src={championTeam.logoUrl} className="w-full h-full object-contain rounded-full" />
                            ) : (
                              <Shield size={12} className="text-yellow-500" />
                            )}
                          </div>
                          <span className="text-[10px] font-black uppercase italic text-white tracking-tight">{championTeam.name}</span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider">TBD</span>
                      )}
                    </div>
                  </div>

                  {/* World Cup Trophy & Mundial Logo */}
                  <div className="flex flex-col items-center gap-2">
                    {/* Slightly larger World Cup Trophy */}
                    <div className="w-44 h-64 flex items-center justify-center relative">
                      <img
                        src="/trophy.png"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const fallback = parent.querySelector('.fallback-trophy');
                            if (fallback) fallback.classList.remove('hidden');
                          }
                        }}
                        className="w-full h-full object-contain drop-shadow-[0_12px_24px_rgba(234,179,8,0.25)]"
                        alt="Copa del Mundo"
                      />
                      <div className="fallback-trophy hidden flex flex-col items-center gap-2 text-yellow-500 opacity-60">
                        <Trophy size={72} className="animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">Cargar trophy.png</span>
                      </div>
                    </div>

                    {/* FIFA Logo */}
                    <div className="w-36 h-10 flex items-center justify-center relative">
                      <img
                        src="/logo-mundial.png"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const fallback = parent.querySelector('.fallback-logo');
                            if (fallback) fallback.classList.remove('hidden');
                          }
                        }}
                        className="w-full h-full object-contain"
                        alt="FIFA World Cup 2026"
                      />
                      <div className="fallback-logo hidden text-text-muted text-[10px] font-black tracking-widest uppercase text-center">
                        FIFA WORLD CUP 2026
                      </div>
                    </div>
                  </div>

                  {/* Grand Final (M104) Card */}
                  <div className="w-60 relative z-10">
                    <div className="text-center mb-1">
                      <span className="text-[7px] font-black uppercase text-accent tracking-[0.2em]">Gran Final (M104)</span>
                    </div>
                    <BracketMatchCard
                      match={getMatch(104)}
                      prediction={predictions[getMatch(104)?.id]}
                      mode={mode}
                      isLocked={isMatchLocked(getMatch(104))}
                      onSave={savePrediction}
                      onCardClick={handleCardClick}
                    />
                  </div>

                  {/* Third Place (M103) Card */}
                  <div className="w-60 relative z-10">
                    <div className="text-center mb-1">
                      <span className="text-[7px] font-black uppercase text-text-muted tracking-[0.2em]">3er Lugar (M103)</span>
                    </div>
                    <BracketMatchCard
                      match={getMatch(103)}
                      prediction={predictions[getMatch(103)?.id]}
                      mode={mode}
                      isLocked={isMatchLocked(getMatch(103))}
                      onSave={savePrediction}
                      onCardClick={handleCardClick}
                    />
                  </div>

                  {/* Bronze Winner Box (Bottom) */}
                  <div className="w-60 bg-card border border-amber-600/30 rounded-2xl p-2.5 flex flex-col items-center justify-center shadow-lg min-h-[75px] relative overflow-hidden z-10">
                    <div className="absolute inset-0 bg-amber-600/10 pointer-events-none z-0" />
                    <div className="relative z-10 flex flex-col items-center justify-center w-full">
                      <div className="absolute top-0 right-0">
                        <Award className="w-4 h-4 text-amber-600" />
                      </div>
                      <span className="text-[7px] font-black text-amber-600 uppercase tracking-widest mb-1.5">Tercer Lugar</span>
                      {bronzeWinnerTeam ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-active border border-amber-600/20 flex items-center justify-center p-0.5 overflow-hidden">
                            {bronzeWinnerTeam.logoUrl ? (
                              <img src={bronzeWinnerTeam.logoUrl} className="w-full h-full object-contain rounded-full" />
                            ) : (
                              <Shield size={10} className="text-amber-600" />
                            )}
                          </div>
                          <span className="text-[10px] font-black uppercase italic text-white tracking-tight">{bronzeWinnerTeam.name}</span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider">TBD</span>
                      )}
                    </div>
                  </div>

                </div>


                {/* ================= RIGHT SIDE TREE ================= */}
                {/* Right Connector 4 (Center <- SF) */}
                <div className="w-[48px] shrink-0 flex flex-col justify-start">
                  <StraightLine height={sfCellHeight} direction="rtl" />
                </div>

                {/* 4. Right SF match */}
                <div className="w-[240px] shrink-0 flex flex-col justify-start">
                  <div className="flex items-center justify-center" style={{ height: sfCellHeight }}>
                    <BracketMatchCard
                      match={getMatch(102)}
                      prediction={predictions[getMatch(102)?.id]}
                      mode={mode}
                      isLocked={isMatchLocked(getMatch(102))}
                      onSave={savePrediction}
                      onCardClick={handleCardClick}
                    />
                  </div>
                </div>

                {/* Right Connector 3 (SF <- QF) */}
                <div className="w-[48px] shrink-0 flex flex-col justify-start">
                  <ConnectorLines height={sfCellHeight} direction="rtl" />
                </div>

                {/* 3. Right QF matches */}
                <div className="w-[240px] shrink-0 flex flex-col justify-start">
                  {[99, 100].map(num => (
                    <div key={num} className="flex items-center justify-center" style={{ height: qfCellHeight }}>
                      <BracketMatchCard
                        match={getMatch(num)}
                        prediction={predictions[getMatch(num)?.id]}
                        mode={mode}
                        isLocked={isMatchLocked(getMatch(num))}
                        onSave={savePrediction}
                        onCardClick={handleCardClick}
                      />
                    </div>
                  ))}
                </div>

                {/* Right Connector 2 (QF <- R16) */}
                <div className="w-[48px] shrink-0 flex flex-col justify-start">
                  {[1, 2].map(i => (
                    <ConnectorLines key={i} height={qfCellHeight} direction="rtl" />
                  ))}
                </div>

                {/* 2. Right R16 matches */}
                <div className="w-[240px] shrink-0 flex flex-col justify-start">
                  {[91, 92, 95, 96].map(num => (
                    <div key={num} className="flex items-center justify-center" style={{ height: r16CellHeight }}>
                      <BracketMatchCard
                        match={getMatch(num)}
                        prediction={predictions[getMatch(num)?.id]}
                        mode={mode}
                        isLocked={isMatchLocked(getMatch(num))}
                        onSave={savePrediction}
                        onCardClick={handleCardClick}
                      />
                    </div>
                  ))}
                </div>

                {/* Right Connector 1 (R16 <- R32) */}
                <div className="w-[48px] shrink-0 flex flex-col justify-start">
                  {[1, 2, 3, 4].map(i => (
                    <ConnectorLines key={i} height={r16CellHeight} direction="rtl" />
                  ))}
                </div>

                {/* 1. Right R32 matches */}
                <div className="w-[240px] shrink-0 flex flex-col justify-start">
                  {[76, 78, 79, 80, 86, 88, 85, 87].map(num => (
                    <div key={num} className="flex items-center justify-center" style={{ height: r32CellHeight }}>
                      <BracketMatchCard
                        match={getMatch(num)}
                        prediction={predictions[getMatch(num)?.id]}
                        mode={mode}
                        isLocked={isMatchLocked(getMatch(num))}
                        onSave={savePrediction}
                        onCardClick={handleCardClick}
                      />
                    </div>
                  ))}
                </div>

              </div>

            </div>
          </div>
        </div>
      </div>

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

interface BracketMatchCardProps {
  match: any;
  prediction?: any;
  mode: "user" | "real";
  isLocked: boolean;
  onSave: (id: number, scoreA: number, scoreB: number) => void;
  onCardClick: (match: any) => void;
}

function BracketMatchCard({ match, prediction, mode, isLocked, onSave, onCardClick }: BracketMatchCardProps) {
  if (!match) return null;

  const teamA = match.teamA;
  const teamB = match.teamB;

  // Local inputs state
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  useEffect(() => {
    if (mode === "user" && prediction) {
      setA(prediction.predictedScoreA.toString());
      setB(prediction.predictedScoreB.toString());
    } else if (mode === "real" && match.status === "FINISHED") {
      setA((match.scoreA ?? "").toString());
      setB((match.scoreB ?? "").toString());
    } else {
      setA("");
      setB("");
    }
  }, [prediction, match, mode]);

  const handleBlur = () => {
    if (mode !== "user" || isLocked) return;
    if (a !== "" && b !== "") {
      onSave(match.id, parseInt(a), parseInt(b));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent modal from opening when clicking inputs
    if ((e.target as HTMLElement).tagName === "INPUT") return;
    onCardClick(match);
  };

  // Helper to determine TBD / Group placeholders
  const getPlaceholderName = (matchNumber: number, slot: 'A' | 'B'): string => {
    const placeholders: Record<number, { A: string; B: string }> = {
      73: { A: "2A", B: "2B" },
      74: { A: "1E", B: "Mejor 3° ABCDF" },
      75: { A: "1F", B: "2C" },
      76: { A: "1C", B: "2F" },
      77: { A: "1I", B: "Mejor 3° CDFGH" },
      78: { A: "2E", B: "2I" },
      79: { A: "1A", B: "Mejor 3° CEFHI" },
      80: { A: "1L", B: "Mejor 3° EHIJK" },
      81: { A: "1D", B: "Mejor 3° AEHIJ" },
      82: { A: "1G", B: "Mejor 3° BEFIJ" },
      83: { A: "2K", B: "2L" },
      84: { A: "1H", B: "2J" },
      85: { A: "1B", B: "Mejor 3° EFGIJ" },
      86: { A: "1J", B: "2H" },
      87: { A: "1K", B: "Mejor 3° DEIJL" },
      88: { A: "2D", B: "2G" },
      89: { A: "Ganador M74", B: "Ganador M77" },
      90: { A: "Ganador M73", B: "Ganador M75" },
      91: { A: "Ganador M76", B: "Ganador M78" },
      92: { A: "Ganador M79", B: "Ganador M80" },
      93: { A: "Ganador M83", B: "Ganador M84" },
      94: { A: "Ganador M81", B: "Ganador M82" },
      95: { A: "Ganador M86", B: "Ganador M88" },
      96: { A: "Ganador M85", B: "Ganador M87" },
      97: { A: "Ganador M89", B: "Ganador M90" },
      98: { A: "Ganador M93", B: "Ganador M94" },
      99: { A: "Ganador M91", B: "Ganador M92" },
      100: { A: "Ganador M95", B: "Ganador M96" },
      101: { A: "Ganador M97", B: "Ganador M98" },
      102: { A: "Ganador M99", B: "Ganador M100" },
      103: { A: "Perdedor M101", B: "Perdedor M102" },
      104: { A: "Ganador M101", B: "Ganador M102" }
    };
    return placeholders[matchNumber]?.[slot] || "TBD";
  };

  // Determine styling based on prediction outcome
  let cardStyle = "bg-card border-white/10";
  let winnerId: number | null = null;
  let tintClass = "";

  if (mode === "user") {
    if (prediction) {
      const predScoreA = prediction.predictedScoreA;
      const predScoreB = prediction.predictedScoreB;
      if (predScoreA > predScoreB) winnerId = match.teamAId;
      else if (predScoreB > predScoreA) winnerId = match.teamBId;
    }

    if (match.status === "FINISHED") {
      const realWinner = match.winnerTeamId;
      if (winnerId && realWinner && winnerId === realWinner) {
        cardStyle = "bg-card border-emerald-500/40 shadow-lg shadow-emerald-500/5";
        tintClass = "bg-emerald-500/10";
      } else if (winnerId) {
        cardStyle = "bg-card border-red-500/40";
        tintClass = "bg-red-500/10";
      }
    }
  } else {
    if (match.status === "FINISHED") {
      winnerId = match.winnerTeamId;
      cardStyle = "bg-card border-emerald-500/20";
      tintClass = "bg-emerald-500/5";
    }
  }

  const isLockedOrReal = isLocked || mode === "real";

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "relative border rounded-2xl px-3 py-1.5 flex flex-col gap-0.5 w-60 shadow-xl transition-all duration-300 hover:scale-[1.015] cursor-pointer",
        cardStyle
      )}
    >
      {/* Dynamic Tint Overlay */}
      {tintClass && (
        <div className={cn("absolute inset-0 pointer-events-none rounded-2xl z-0", tintClass)} />
      )}

      {/* Match number */}
      <div className="flex items-center justify-between text-[7px] font-black text-gray-500 tracking-wider uppercase leading-none mb-0.5 relative z-10">
        <span>Partido M#{match.matchNumber}</span>
        {isLocked && mode === "user" && <Lock size={7} className="text-yellow-500" />}
      </div>

      {/* Team A row */}
      <div className={cn(
        "flex items-center justify-between py-0 relative z-10",
        winnerId && winnerId === match.teamAId ? "text-accent font-black" : "text-text-muted",
        winnerId && winnerId !== match.teamAId && "opacity-45"
      )}>
        <div className="flex items-center gap-1.5 overflow-hidden">
          <div className="w-7 h-7 rounded-full bg-active flex items-center justify-center p-0.5 border border-border-main shrink-0 overflow-hidden">
            {teamA?.logoUrl ? (
              <img src={teamA.logoUrl} className="w-full h-full object-contain rounded-full" />
            ) : (
              <Shield size={13} />
            )}
          </div>
          <span className="text-xs uppercase truncate font-black tracking-tight">
            {teamA?.name || getPlaceholderName(match.matchNumber, 'A')}
          </span>
          {mode === "real" && match.penaltiesScoreA !== null && match.penaltiesScoreA !== undefined && (
            <span className="text-[10px] text-accent font-black shrink-0 ml-1">({match.penaltiesScoreA})</span>
          )}
        </div>
        <input
          type="number"
          value={a}
          disabled={isLockedOrReal}
          onChange={(e) => setA(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="-"
          className="w-8 h-8 bg-active border border-border-main/50 rounded-lg text-center text-xs font-black text-text-main focus:outline-none focus:border-accent/40 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        />
      </div>

      {/* Divider */}
      <div className="h-px bg-white/5 w-full my-0.5" />

      {/* Team B row */}
      <div className={cn(
        "flex items-center justify-between py-0",
        winnerId && winnerId === match.teamBId ? "text-accent font-black" : "text-text-muted",
        winnerId && winnerId !== match.teamBId && "opacity-45"
      )}>
        <div className="flex items-center gap-1.5 overflow-hidden">
          <div className="w-7 h-7 rounded-full bg-active flex items-center justify-center p-0.5 border border-border-main shrink-0 overflow-hidden">
            {teamB?.logoUrl ? (
              <img src={teamB.logoUrl} className="w-full h-full object-contain rounded-full" />
            ) : (
              <Shield size={13} />
            )}
          </div>
          <span className="text-xs uppercase truncate font-black tracking-tight">
            {teamB?.name || getPlaceholderName(match.matchNumber, 'B')}
          </span>
          {mode === "real" && match.penaltiesScoreB !== null && match.penaltiesScoreB !== undefined && (
            <span className="text-[10px] text-accent font-black shrink-0 ml-1">({match.penaltiesScoreB})</span>
          )}
        </div>
        <input
          type="number"
          value={b}
          disabled={isLockedOrReal}
          onChange={(e) => setB(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="-"
          className="w-8 h-8 bg-active border border-border-main/50 rounded-lg text-center text-xs font-black text-text-main focus:outline-none focus:border-accent/40 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        />
      </div>
    </div>
  );
}
