import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/AuthContext";
import { storage } from "../lib/storage";
import { Team, Match, MatchPhase, UserProfile, BonusQuestion } from "../types";
import { Plus, Save, Trophy, Trash2, Edit2, ShieldAlert, ListChecks, Check } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

export default function AdminPanel() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<"teams" | "matches" | "results" | "bonus">("teams");

  if (!isAdmin) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center p-8">
        <ShieldAlert className="text-red-500 w-20 h-20 mb-6 animate-pulse" />
        <h1 className="text-3xl font-black mb-2 uppercase italic tracking-tighter">Acceso Restringido</h1>
        <p className="text-gray-500 max-w-sm text-xs font-bold uppercase tracking-widest leading-relaxed">
          SOLO EL USUARIO <span className="text-accent underline decoration-accent/30 decoration-2 underline-offset-4">SOP</span> PUEDE ACCEDER A ESTE PANEL PARA GESTIONAR LA COPA.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Central <span className="text-accent">Soporte</span></h1>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">Gestión de Competencia Season 2026</p>
        </div>

        <div className="flex bg-card p-1.5 rounded-2xl border border-white/10 w-fit shadow-2xl backdrop-blur-xl overflow-x-auto no-scrollbar">
          <TabButton active={activeTab === "teams"} label="Equipos" onClick={() => setActiveTab("teams")} />
          <TabButton active={activeTab === "matches"} label="Fixture" onClick={() => setActiveTab("matches")} />
          <TabButton active={activeTab === "results"} label="Resultados" onClick={() => setActiveTab("results")} />
          <TabButton active={activeTab === "bonus"} label="Bonus" onClick={() => setActiveTab("bonus")} />
        </div>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === "teams" && <TeamManager />}
        {activeTab === "matches" && <MatchFixture />}
        {activeTab === "results" && <ResultsInput />}
        {activeTab === "bonus" && <BonusManager />}
      </motion.div>
    </div>
  );
}

function TabButton({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
        active ? "bg-accent text-black shadow-lg shadow-accent/20" : "text-gray-500 hover:text-white"
      )}
    >
      {label}
    </button>
  );
}

// 1. Team Manager
function TeamManager() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [group, setGroup] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const refresh = () => setTeams(storage.getTeams());

  useEffect(() => {
    refresh();
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `team-${Date.now()}`;
    storage.saveTeam({ id, name, region, group: group.toUpperCase(), logoUrl });
    setName(""); setRegion(""); setGroup(""); setLogoUrl("");
    refresh();
  };

  const deleteTeam = (id: string) => {
    // In a real app we'd have a delete method. Here we can just filter it out.
    const current = storage.getTeams();
    const updated = current.filter(t => t.id !== id);
    localStorage.setItem("polla_teams", JSON.stringify(updated));
    refresh();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="bg-card border border-white/10 rounded-[2.5rem] p-8 h-fit sticky top-24 shadow-2xl">
        <h3 className="text-lg font-black italic uppercase tracking-tighter mb-6 flex items-center gap-2"><Plus size={20} className="text-accent" /> Nuevo Equipo</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <AdminInput label="Nombre del Equipo" value={name} onChange={setName} placeholder="Ej. Argentina" />
          <AdminInput label="Región" value={region} onChange={setRegion} placeholder="Ej. COMNEBOL" />
          <AdminInput label="Grupo (A-L)" value={group} onChange={setGroup} placeholder="Ej. A" />
          <AdminInput label="Logo URL" value={logoUrl} onChange={setLogoUrl} placeholder="Ej. https://svgbox.net/..." />
          <button type="submit" className="w-full bg-accent text-black font-black uppercase italic tracking-widest py-4 rounded-xl shadow-lg shadow-accent/10 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4">Guardar Equipo</button>
        </form>
      </div>
      <div className="lg:col-span-2 bg-card border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">Equipos Cargados ({teams.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {teams.map(team => (
            <div key={team.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
              <div className="w-12 h-12 bg-card border border-white/5 rounded-xl flex items-center justify-center p-2">
                {team.logoUrl ? <img src={team.logoUrl} className="w-full h-full object-contain" /> : <Trophy size={16} />}
              </div>
              <div className="flex-1">
                <p className="font-black italic uppercase text-xs leading-none mb-1">{team.name}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{team.region} • <span className="text-accent">GRUPO {team.group}</span></p>
              </div>
              <button onClick={() => deleteTeam(team.id)} className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-500 transition-all">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 2. Match Fixture
function MatchFixture() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [phase, setPhase] = useState<MatchPhase>("groups");
  const [matchNumber, setMatchNumber] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const refresh = () => setMatches(storage.getMatches());

  useEffect(() => {
    setTeams(storage.getTeams());
    refresh();
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingId || `match-${matchNumber}`;
    const newMatch: Match = {
      id,
      phase,
      teamAId,
      teamBId,
      status: "pending",
      date: matchDate || new Date().toISOString(),
      matchNumber: parseInt(matchNumber)
    };
    storage.saveMatch(newMatch);
    cancelEdit();
    refresh();
  };

  const handleEdit = (m: Match) => {
    setEditingId(m.id);
    setPhase(m.phase);
    setMatchNumber(m.matchNumber.toString());
    setTeamAId(m.teamAId);
    setTeamBId(m.teamBId);
    setMatchDate(m.date);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setMatchNumber(""); setTeamAId(""); setTeamBId(""); setMatchDate("");
    setPhase("groups");
  };

  const phases: { id: MatchPhase, label: string }[] = [
    { id: "groups", label: "Fase de Grupos" },
    { id: "roundOf16", label: "Round of 16" },
    { id: "quarterfinals", label: "Cuartos" },
    { id: "semifinals", label: "Semifinal" },
    { id: "final", label: "Gran Final" }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="bg-card border border-white/10 rounded-[2.5rem] p-8 h-fit sticky top-24 shadow-2xl">
        <h3 className="text-lg font-black italic uppercase tracking-tighter mb-6 flex items-center gap-2">
          {editingId ? <Edit2 size={20} className="text-accent" /> : <Plus size={20} className="text-accent" />}
          {editingId ? "Editar Partido" : "Programar Partido"}
        </h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Fase</label>
            <select value={phase} onChange={(e) => setPhase(e.target.value as MatchPhase)} className="w-full bg-active border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-accent/40 font-bold text-xs uppercase italic tracking-widest">
              {phases.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <AdminInput label="Número de Partido" value={matchNumber} onChange={setMatchNumber} placeholder="Ej. 1" />
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Fecha y Hora</label>
            <input 
              type="datetime-local" 
              value={matchDate} 
              onChange={(e) => setMatchDate(e.target.value)}
              className="w-full bg-active border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-accent/40 font-bold text-xs"
            />
          </div>
          <div className="space-y-1">
             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Equipo A</label>
             <select value={teamAId} onChange={(e) => setTeamAId(e.target.value)} className="w-full bg-active border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-accent/40 font-bold text-xs">
                <option value="">Seleccionar...</option>
                {teams.sort((a,b) => a.name.localeCompare(b.name)).map(t => <option key={t.id} value={t.id}>{t.name} (G:{t.group})</option>)}
             </select>
          </div>
          <div className="space-y-1">
             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Equipo B</label>
             <select value={teamBId} onChange={(e) => setTeamBId(e.target.value)} className="w-full bg-active border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-accent/40 font-bold text-xs">
                <option value="">Seleccionar...</option>
                {teams.sort((a,b) => a.name.localeCompare(b.name)).map(t => <option key={t.id} value={t.id}>{t.name} (G:{t.group})</option>)}
             </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-accent text-black font-black uppercase italic tracking-widest py-4 rounded-xl shadow-lg shadow-accent/10 mt-4">
              {editingId ? "Actualizar" : "Crear"} Partido
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="bg-active border border-white/10 text-gray-400 font-black uppercase tracking-widest py-4 px-6 rounded-xl mt-4">
                X
              </button>
            )}
          </div>
        </form>
      </div>
      <div className="lg:col-span-2 bg-card border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-6">Fixture Actual ({matches.length})</h3>
        <div className="space-y-3">
          {matches.map(m => (
            <div key={m.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group transition-all">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-600">#{m.matchNumber}</span>
                <span className="text-[8px] font-black text-gray-700 uppercase tracking-tighter italic">
                  {new Date(m.date).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })} • {new Date(m.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              </div>
              <div className="flex-1 flex justify-center items-center gap-4 px-4 overflow-hidden">
                <span className="font-black italic uppercase text-[10px] text-right truncate flex-1">{teams.find(t => t.id === m.teamAId)?.name || 'TBD'}</span>
                <span className="text-[8px] text-gray-700 font-black">VS</span>
                <span className="font-black italic uppercase text-[10px] text-left truncate flex-1">{teams.find(t => t.id === m.teamBId)?.name || 'TBD'}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                  m.status === "finished" ? "bg-white/5 border-white/10 text-gray-500" : "bg-accent/10 border-accent/20 text-accent"
                )}>
                  {m.phase}
                </div>
                {m.status === "pending" && (
                  <button onClick={() => handleEdit(m)} className="p-2 text-gray-500 hover:text-accent transition-all opacity-0 group-hover:opacity-100">
                    <Edit2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 3. Results Input
function ResultsInput() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [finishedMatches, setFinishedMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Record<string, Team>>({});

  const refresh = () => {
    const teamsList = storage.getTeams();
    const tMap: Record<string, Team> = {};
    teamsList.forEach(d => tMap[d.id] = d);
    setTeams(tMap);
    const all = storage.getMatches();
    setMatches(all.filter(m => m.status === "pending"));
    setFinishedMatches(all.filter(m => m.status === "finished"));
  };

  useEffect(() => {
    refresh();
  }, []);

  const setFinalResult = (matchId: string, a: number, b: number) => {
    const matches = storage.getMatches();
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    // If it was already finished, we need to subtract old points first if we want full correction
    // For simplicity in this local storage version, we'll just overwrite and user should manually adjust or we can just add the difference.
    // Let's implement basic correction: subtract old points then add new.
    
    const predictions = storage.getPredictions();
    const users = storage.getUsers();

    if (match.status === "finished") {
       // Revert points
       predictions.filter(p => p.matchId === matchId).forEach(pred => {
          Object.values(users).forEach(u => {
            if (u.uid === pred.userId) {
              u.points -= pred.pointsEarned || 0;
              storage.updateUser(u);
            }
          });
       });
    }

    match.scoreA = a;
    match.scoreB = b;
    match.status = "finished";
    storage.saveMatch(match);

    predictions.filter(p => p.matchId === matchId).forEach(pred => {
      let pts = 0;
      if (pred.predictedScoreA === a && pred.predictedScoreB === b) pts = 10; // Pleno
      else if ((a > b && pred.predictedScoreA > pred.predictedScoreB) || 
               (b > a && pred.predictedScoreB > pred.predictedScoreA) || 
               (a === b && pred.predictedScoreA === pred.predictedScoreB)) pts = 5; // Tendencia
      else pts = 1; // Participación

      pred.pointsEarned = pts;
      pred.isCorrect = pts === 10;
      storage.savePrediction(pred);

      Object.values(users).forEach(u => {
        if (u.uid === pred.userId) {
          u.points += pts;
          storage.updateUser(u);
        }
      });
    });

    refresh();
  };

  const deleteResult = (matchId: string) => {
    const matches = storage.getMatches();
    const match = matches.find(m => m.id === matchId);
    if (!match || match.status !== "finished") return;

    const predictions = storage.getPredictions();
    const users = storage.getUsers();

    // Revert points
    predictions.filter(p => p.matchId === matchId).forEach(pred => {
      Object.values(users).forEach(u => {
        if (u.uid === pred.userId) {
          u.points -= pred.pointsEarned || 0;
          storage.updateUser(u);
        }
      });
      // Reset prediction earned points
      pred.pointsEarned = 0;
      pred.isCorrect = false;
      storage.savePrediction(pred);
    });

    // Reset match status
    match.status = "pending";
    match.scoreA = undefined;
    match.scoreB = undefined;
    storage.saveMatch(match);

    refresh();
  };

  return (
    <div className="space-y-12">
      <div className="bg-card border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-8 flex items-center gap-2">Resultados Pendientes</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {matches.map(m => (
            <ResultRow key={m.id} match={m} teams={teams} onSave={setFinalResult} />
          ))}
          {matches.length === 0 && <p className="text-gray-600 py-32 text-center col-span-full font-black uppercase italic tracking-tighter text-xl opacity-40">No hay partidos pendientes</p>}
        </div>
      </div>

      <div className="bg-card border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
        <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500 mb-8 flex items-center gap-2">Resultados Publicados (Corrección)</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {finishedMatches.map(m => (
            <ResultRow key={m.id} match={m} teams={teams} onSave={setFinalResult} onDelete={deleteResult} />
          ))}
          {finishedMatches.length === 0 && <p className="text-gray-600 py-32 text-center col-span-full font-black uppercase italic tracking-tighter text-xl opacity-40">Sin resultados publicados</p>}
        </div>
      </div>
    </div>
  );
}

interface ResultRowProps {
  match: Match;
  teams: Record<string, Team>;
  onSave: (id: string, a: number, b: number) => void;
  onDelete?: (id: string) => void;
}

const ResultRow: React.FC<ResultRowProps> = ({ match, teams, onSave, onDelete }) => {
  const [a, setA] = useState(match.scoreA?.toString() || "");
  const [b, setB] = useState(match.scoreB?.toString() || "");

  const handleSave = () => {
    if (a !== "" && b !== "") onSave(match.id, parseInt(a), parseInt(b));
  };

  return (
    <div className="p-6 bg-active/40 rounded-[2rem] border border-white/5 flex flex-col gap-4 group hover:border-white/10 transition-all shadow-inner">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest leading-none">M#{match.matchNumber}</span>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-black text-accent uppercase italic tracking-widest">{match.phase}</span>
          {onDelete && match.status === "finished" && (
            <button 
              onClick={() => onDelete(match.id)}
              className="p-1 px-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all transform hover:scale-105 active:scale-95"
              title="Eliminar resultado y devolver a pendientes"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-center font-black uppercase italic text-[10px] truncate">{teams[match.teamAId]?.name || 'TBD'}</div>
        <div className="flex items-center gap-2">
          <input type="number" value={a} onChange={(e) => setA(e.target.value)} className="w-10 h-10 bg-black/60 border border-white/10 rounded-xl text-center font-black text-accent focus:border-accent/40 outline-none text-sm" />
          <span className="text-gray-700 font-bold">:</span>
          <input type="number" value={b} onChange={(e) => setB(e.target.value)} className="w-10 h-10 bg-black/60 border border-white/10 rounded-xl text-center font-black text-accent focus:border-accent/40 outline-none text-sm" />
        </div>
        <div className="flex-1 text-center font-black uppercase italic text-[10px] truncate">{teams[match.teamBId]?.name || 'TBD'}</div>
      </div>
      <button onClick={handleSave} className="w-full bg-accent text-black font-black uppercase italic py-3 rounded-xl shadow-lg shadow-accent/10 hover:scale-[1.02] active:scale-[0.98] transition-all text-[9px] tracking-widest mt-2 overflow-hidden flex items-center justify-center gap-2">
         {match.status === "finished" ? "ACTUALIZAR RESULTADO" : "PUBLICAR RESULTADO"} <Check size={14} />
      </button>
    </div>
  );
}

// 4. Bonus Manager
function BonusManager() {
  const [questions, setQuestions] = useState<BonusQuestion[]>([]);
  const [qText, setQText] = useState("");

  const refresh = () => setQuestions(storage.getBonusQuestions());

  useEffect(() => { refresh(); }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `bonus-${Date.now()}`;
    storage.saveBonusQuestion({
      id,
      question: qText,
    });
    setQText(""); 
    refresh();
  };

  const setCorrectResult = (qId: string, answer: string) => {
    const qs = storage.getBonusQuestions();
    const q = qs.find(item => item.id === qId);
    if (!q) return;

    // Correction logic: remove old points if it was already resolved
    const bonusPreds = storage.getBonusPredictions();
    const users = storage.getUsers();

    if (q.correctAnswer) {
      bonusPreds.filter(p => p.questionId === qId).forEach(pred => {
        if (pred.selectedAnswer === q.correctAnswer) {
          Object.values(users).forEach(u => {
            if (u.uid === pred.userId) {
              u.points -= 50;
              storage.updateUser(u);
            }
          });
        }
      });
    }

    q.correctAnswer = answer;
    storage.saveBonusQuestion(q);

    bonusPreds.filter(p => p.questionId === qId).forEach(pred => {
      if (pred.selectedAnswer === answer) {
        pred.pointsEarned = 50;
        storage.saveBonusPrediction(pred);

        Object.values(users).forEach(u => {
          if (u.uid === pred.userId) {
            u.points += 50;
            storage.updateUser(u);
          }
        });
      } else {
        pred.pointsEarned = 0;
        storage.saveBonusPrediction(pred);
      }
    });

    refresh();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-card border border-white/10 rounded-[2.5rem] p-8 h-fit shadow-2xl">
        <h3 className="text-lg font-black italic uppercase tracking-tighter mb-6 flex items-center gap-2"><Plus size={20} className="text-accent" /> Pregunta Bonus</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <AdminInput label="Pregunta" value={qText} onChange={setQText} placeholder="Ej. ¿Quién será el campeón?" />
          <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest px-2">Las preguntas bonus otorgan 50 puntos al acertar.</p>
          <button type="submit" className="w-full bg-accent text-black font-black uppercase italic tracking-widest py-4 rounded-xl shadow-lg shadow-accent/10 mt-4">Publicar Pregunta</button>
        </form>
      </div>

      <div className="bg-card border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-6">Preguntas Activas</h3>
        <div className="space-y-6">
          {questions.map(q => (
            <div key={q.id} className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-4 shadow-inner">
              <p className="text-xs font-black uppercase italic text-accent">{q.question}</p>
              
              <div className="space-y-2">
                 <label className="text-[8px] font-black uppercase text-gray-500 tracking-widest">Respuesta Oficial</label>
                 <div className="flex gap-2">
                    <input 
                      type="text" 
                      defaultValue={q.correctAnswer || ""}
                      placeholder="Ingrese respuesta..."
                      onBlur={(e) => setCorrectResult(q.id, e.target.value)}
                      className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-[10px] font-black text-white focus:outline-none focus:border-accent/40"
                    />
                 </div>
              </div>

              {q.correctAnswer && <p className="text-[8px] font-black uppercase text-green-500 text-right">RESUELTO Y PUNTOS ASIGNADOS</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminInput({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{label}</label>
      <input 
        type="text" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-active border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-accent/40 transition-all font-bold text-sm placeholder:text-gray-700"
      />
    </div>
  );
}
