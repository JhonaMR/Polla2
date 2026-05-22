import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/AuthContext";
import { adminService, matchService, bonusService, phaseService } from "../lib/services";
import { Plus, Save, Trophy, Trash2, Edit2, ShieldAlert, ListChecks, Check, Lock, Unlock, Play, CheckCircle2, RefreshCw, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

const normalizeStr = (s: string) => 
  (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function AdminPanel() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<"teams" | "matches" | "results" | "bonus" | "users" | "phases" | "points">("teams");

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
          <TabButton active={activeTab === "users"} label="Usuarios" onClick={() => setActiveTab("users")} />
          <TabButton active={activeTab === "phases"} label="Fases" onClick={() => setActiveTab("phases")} />
          <TabButton active={activeTab === "points"} label="Puntos" onClick={() => setActiveTab("points")} />
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
        {activeTab === "users" && <UserManager />}
        {activeTab === "phases" && <PhaseManager />}
        {activeTab === "points" && <PointsManager />}
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
        active ? "bg-accent text-black shadow-lg shadow-accent/20" : "text-gray-500 hover:text-text-main"
      )}
    >
      {label}
    </button>
  );
}

// 1. Team Manager
function TeamManager() {
  const [teams, setTeams] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [group, setGroup] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredTeams = teams.filter(t => 
    normalizeStr(t.name).includes(normalizeStr(searchQuery)) ||
    normalizeStr(t.region).includes(normalizeStr(searchQuery))
  );
  const countryNames: string[] = Array.from(new Set(teams.map(t => (t.name || "") as string)));
  const suggestions = countryNames.filter(c => normalizeStr(c).includes(normalizeStr(searchQuery)) && normalizeStr(c) !== normalizeStr(searchQuery));

  const refresh = async () => {
    try {
      const res = await adminService.getTeams();
      setTeams(res.data.data || []);
    } catch (err) {
      console.error('Error loading teams:', err);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminService.updateTeam(editingId, { 
          name, 
          region, 
          groupLetter: group.toUpperCase(), 
          logoUrl: logoUrl || null 
        });
      } else {
        await adminService.createTeam({ name, region, group: group.toUpperCase(), logoUrl });
      }
      cancelEdit();
      refresh();
    } catch (err) {
      console.error('Error saving team:', err);
    }
  };

  const handleEdit = (team: any) => {
    setEditingId(team.id);
    setName(team.name);
    setRegion(team.region);
    setGroup(team.groupLetter || team.group || "");
    setLogoUrl(team.logoUrl || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName(""); setRegion(""); setGroup(""); setLogoUrl("");
  };

  const deleteTeam = async (id: number) => {
    if (!confirm('¿Eliminar este equipo?')) return;
    try {
      await adminService.deleteTeam(id);
      refresh();
    } catch (err) {
      console.error('Error deleting team:', err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="bg-card border border-white/10 rounded-[2.5rem] p-8 h-fit sticky top-24 shadow-2xl">
        <h3 className="text-lg font-black italic uppercase tracking-tighter mb-6 flex items-center gap-2">
          {editingId ? <Edit2 size={20} className="text-accent" /> : <Plus size={20} className="text-accent" />}
          {editingId ? "Editar Equipo" : "Nuevo Equipo"}
        </h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <AdminInput label="Nombre del Equipo" value={name} onChange={setName} placeholder="Ej. Argentina" />
          <AdminInput label="Región" value={region} onChange={setRegion} placeholder="Ej. COMNEBOL" />
          <AdminInput label="Grupo (A-L)" value={group} onChange={setGroup} placeholder="Ej. A" />
          <AdminInput label="Logo URL" value={logoUrl} onChange={setLogoUrl} placeholder="Ej. https://svgbox.net/..." />
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-accent text-black font-black uppercase italic tracking-widest py-4 rounded-xl shadow-lg shadow-accent/10 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4">
              {editingId ? "Actualizar" : "Guardar"} Equipo
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
        <div className="flex justify-between items-center mb-6 relative">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">Equipos Cargados ({filteredTeams.length})</h3>
          <div className="relative w-64">
            <input 
              type="text" 
              placeholder="Buscar país..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full bg-active border border-white/5 rounded-xl py-2 pl-4 pr-8 text-xs text-text-main focus:outline-none focus:border-accent/40 placeholder:text-gray-600 transition-all font-bold"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-text-main text-xs"
              >
                ✕
              </button>
            )}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 max-h-40 overflow-y-auto bg-active border border-white/10 rounded-xl shadow-2xl backdrop-blur-md no-scrollbar">
                {suggestions.map(name => (
                  <div 
                    key={name}
                    onMouseDown={() => {
                      setSearchQuery(name);
                      setShowSuggestions(false);
                    }}
                    className="px-4 py-2 hover:bg-white/10 cursor-pointer font-bold text-xs text-text-main transition-colors"
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredTeams.map(team => (
            <div key={team.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
              <div className="w-12 h-12 bg-card border border-white/5 rounded-xl flex items-center justify-center p-2">
                {team.logoUrl ? <img src={team.logoUrl} className="w-full h-full object-contain" /> : <Trophy size={16} />}
              </div>
              <div className="flex-1">
                <p className="font-black italic uppercase text-xs leading-none mb-1">{team.name}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{team.region} • <span className="text-accent">GRUPO {team.groupLetter || team.group}</span></p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => handleEdit(team)} className="p-2 text-gray-500 hover:text-blue-400 transition-all" title="Editar">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => deleteTeam(team.id)} className="p-2 text-gray-500 hover:text-red-500 transition-all" title="Eliminar">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 2. Match Fixture
function MatchFixture() {
  const [teams, setTeams] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [phase, setPhase] = useState("GROUPS");
  const [matchNumber, setMatchNumber] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredMatches = matches.filter(m => {
    const tA = teams.find(t => t.id === m.teamAId)?.name || "";
    const tB = teams.find(t => t.id === m.teamBId)?.name || "";
    return normalizeStr(tA).includes(normalizeStr(searchQuery)) || 
           normalizeStr(tB).includes(normalizeStr(searchQuery));
  });
  const countryNames: string[] = Array.from(new Set(teams.map(t => (t.name || "") as string)));
  const suggestions = countryNames.filter(c => normalizeStr(c).includes(normalizeStr(searchQuery)) && normalizeStr(c) !== normalizeStr(searchQuery));

  const [teamASearch, setTeamASearch] = useState("");
  const [teamBSearch, setTeamBSearch] = useState("");
  const [showTeamADropdown, setShowTeamADropdown] = useState(false);
  const [showTeamBDropdown, setShowTeamBDropdown] = useState(false);

  const refresh = async () => {
    try {
      const [teamsRes, matchesRes] = await Promise.all([
        adminService.getTeams(),
        matchService.getMatches(),
      ]);
      setTeams(teamsRes.data.data || []);
      setMatches(matchesRes.data.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        phase,
        teamAId: teamAId ? parseInt(teamAId, 10) : null,
        teamBId: teamBId ? parseInt(teamBId, 10) : null,
        matchDate: matchDate ? new Date(matchDate).toISOString() : new Date().toISOString(),
        matchNumber: parseInt(matchNumber, 10),
      };

      if (editingId) {
        await adminService.updateMatch(editingId, payload);
      } else {
        await adminService.createMatch({
          ...payload,
          externalId: `match-${Date.now()}`
        });
      }
      cancelEdit();
      refresh();
    } catch (err) {
      console.error('Error saving match:', err);
    }
  };

  const handleEdit = (m: any) => {
    setEditingId(m.id);
    setPhase(m.phase);
    setMatchNumber(m.matchNumber.toString());
    setTeamAId(m.teamAId ? m.teamAId.toString() : "");
    setTeamBId(m.teamBId ? m.teamBId.toString() : "");
    setMatchDate(m.matchDate ? new Date(m.matchDate).toISOString().slice(0, 16) : "");

    const tA = teams.find(t => t.id === m.teamAId);
    const tB = teams.find(t => t.id === m.teamBId);
    setTeamASearch(tA ? `${tA.name} (G:${tA.groupLetter || tA.group})` : "");
    setTeamBSearch(tB ? `${tB.name} (G:${tB.groupLetter || tB.group})` : "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setMatchNumber(""); setTeamAId(""); setTeamBId(""); setMatchDate("");
    setPhase("GROUPS");
    setTeamASearch(""); setTeamBSearch("");
    setShowTeamADropdown(false); setShowTeamBDropdown(false);
  };

  const phases = [
    { id: "GROUPS", label: "Fase de Grupos" },
    { id: "ROUND_OF_32", label: "Dieciseisavos (R32)" },
    { id: "ROUND_OF_16", label: "Octavos (R16)" },
    { id: "QUARTERFINALS", label: "Cuartos" },
    { id: "SEMIFINALS", label: "Semifinal" },
    { id: "THIRD_PLACE", label: "Tercer Puesto" },
    { id: "FINAL", label: "Gran Final" }
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
            <select value={phase} onChange={(e) => setPhase(e.target.value)} className="w-full bg-active border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-accent/40 font-bold text-xs uppercase italic tracking-widest">
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
          <div className="space-y-1 relative">
             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Equipo A</label>
             <input 
               type="text" 
               value={teamASearch} 
               onChange={(e) => {
                 setTeamASearch(e.target.value);
                 setShowTeamADropdown(true);
                 if (!e.target.value) setTeamAId("");
               }}
               onFocus={() => setShowTeamADropdown(true)}
               onBlur={() => {
                 setTimeout(() => setShowTeamADropdown(false), 200);
               }}
               placeholder="Buscar Equipo A..."
               className="w-full bg-active border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-accent/40 font-bold text-xs"
             />
             {showTeamADropdown && (
               <div className="absolute z-50 w-full mt-1 max-h-40 overflow-y-auto bg-active border border-white/10 rounded-xl shadow-2xl backdrop-blur-md no-scrollbar">
                 <div 
                   className="px-4 py-2 hover:bg-white/5 cursor-pointer font-bold text-xs text-gray-500"
                   onMouseDown={() => {
                     setTeamAId("");
                     setTeamASearch("");
                   }}
                 >
                   Seleccionar (TBD)...
                 </div>
                 {teams
                   .filter(t => t.name.toLowerCase().includes(teamASearch.toLowerCase()))
                   .sort((a,b) => a.name.localeCompare(b.name))
                   .map(t => (
                     <div 
                       key={t.id} 
                       className="px-4 py-2 hover:bg-white/10 cursor-pointer font-bold text-xs flex justify-between items-center"
                       onMouseDown={() => {
                         setTeamAId(t.id.toString());
                         setTeamASearch(`${t.name} (G:${t.groupLetter || t.group})`);
                       }}
                     >
                       <span>{t.name}</span>
                       <span className="text-[9px] text-accent uppercase tracking-widest">G:{t.groupLetter || t.group}</span>
                     </div>
                   ))}
               </div>
             )}
          </div>
          <div className="space-y-1 relative">
             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Equipo B</label>
             <input 
               type="text" 
               value={teamBSearch} 
               onChange={(e) => {
                 setTeamBSearch(e.target.value);
                 setShowTeamBDropdown(true);
                 if (!e.target.value) setTeamBId("");
               }}
               onFocus={() => setShowTeamBDropdown(true)}
               onBlur={() => {
                 setTimeout(() => setShowTeamBDropdown(false), 200);
               }}
               placeholder="Buscar Equipo B..."
               className="w-full bg-active border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-accent/40 font-bold text-xs"
             />
             {showTeamBDropdown && (
               <div className="absolute z-50 w-full mt-1 max-h-40 overflow-y-auto bg-active border border-white/10 rounded-xl shadow-2xl backdrop-blur-md no-scrollbar">
                 <div 
                   className="px-4 py-2 hover:bg-white/5 cursor-pointer font-bold text-xs text-gray-500"
                   onMouseDown={() => {
                     setTeamBId("");
                     setTeamBSearch("");
                   }}
                 >
                   Seleccionar (TBD)...
                 </div>
                 {teams
                   .filter(t => t.name.toLowerCase().includes(teamBSearch.toLowerCase()))
                   .sort((a,b) => a.name.localeCompare(b.name))
                   .map(t => (
                     <div 
                       key={t.id} 
                       className="px-4 py-2 hover:bg-white/10 cursor-pointer font-bold text-xs flex justify-between items-center"
                       onMouseDown={() => {
                         setTeamBId(t.id.toString());
                         setTeamBSearch(`${t.name} (G:${t.groupLetter || t.group})`);
                       }}
                     >
                       <span>{t.name}</span>
                       <span className="text-[9px] text-accent uppercase tracking-widest">G:{t.groupLetter || t.group}</span>
                     </div>
                   ))}
               </div>
             )}
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
        <div className="flex justify-between items-center mb-6 relative">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">
            Fixture Actual ({filteredMatches.length})
          </h3>
          <div className="relative w-64">
            <input 
              type="text" 
              placeholder="Buscar por país..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full bg-active border border-white/5 rounded-xl py-2 pl-4 pr-8 text-xs text-text-main focus:outline-none focus:border-accent/40 placeholder:text-gray-600 transition-all font-bold"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-text-main text-xs"
              >
                ✕
              </button>
            )}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 max-h-40 overflow-y-auto bg-active border border-white/10 rounded-xl shadow-2xl backdrop-blur-md no-scrollbar">
                {suggestions.map(name => (
                  <div 
                    key={name}
                    onMouseDown={() => {
                      setSearchQuery(name);
                      setShowSuggestions(false);
                    }}
                    className="px-4 py-2 hover:bg-white/10 cursor-pointer font-bold text-xs text-text-main transition-colors"
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-3">
          {filteredMatches.map(m => (
            <div key={m.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-600">#{m.matchNumber}</span>
                <span className="text-[8px] font-black text-gray-700 uppercase tracking-tighter italic">
                  {new Date(m.matchDate).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })} • {new Date(m.matchDate).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              </div>
              <div className="flex-1 flex justify-center items-center gap-4 px-4 overflow-hidden">
                <div className="flex items-center justify-end gap-2 flex-1 min-w-0">
                  {teams.find(t => t.id === m.teamAId)?.logoUrl && (
                    <img 
                      src={teams.find(t => t.id === m.teamAId)?.logoUrl} 
                      className="w-4 h-4 object-contain flex-shrink-0" 
                      alt="" 
                    />
                  )}
                  <span className="font-black italic uppercase text-[10px] text-right truncate">
                    {teams.find(t => t.id === m.teamAId)?.name || 'TBD'}
                  </span>
                </div>
                <span className="text-[8px] text-gray-700 font-black">VS</span>
                <div className="flex items-center justify-start gap-2 flex-1 min-w-0">
                  <span className="font-black italic uppercase text-[10px] text-left truncate">
                    {teams.find(t => t.id === m.teamBId)?.name || 'TBD'}
                  </span>
                  {teams.find(t => t.id === m.teamBId)?.logoUrl && (
                    <img 
                      src={teams.find(t => t.id === m.teamBId)?.logoUrl} 
                      className="w-4 h-4 object-contain flex-shrink-0" 
                      alt="" 
                    />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                  m.status === "FINISHED" ? "bg-white/5 border-white/10 text-gray-500" : "bg-accent/10 border-accent/20 text-accent"
                )}>
                  {m.phase}
                </div>
                <button onClick={() => handleEdit(m)} className="p-2 text-gray-500 hover:text-blue-400 transition-all" title="Editar">
                  <Edit2 size={14} />
                </button>
                {m.status === "PENDING" && (
                  <button onClick={() => {
                    if (confirm('¿Eliminar este partido?')) {
                      adminService.deleteMatch(m.id).then(() => refresh()).catch(err => console.error(err));
                    }
                  }} className="p-2 text-gray-500 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100" title="Eliminar">
                    <Trash2 size={14} />
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
  const [matches, setMatches] = useState<any[]>([]);
  const [finishedMatches, setFinishedMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<Record<number, any>>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredPending = matches.filter(m => {
    const tA = teams[m.teamAId]?.name || "";
    const tB = teams[m.teamBId]?.name || "";
    return normalizeStr(tA).includes(normalizeStr(searchQuery)) || 
           normalizeStr(tB).includes(normalizeStr(searchQuery));
  });

  const filteredFinished = finishedMatches.filter(m => {
    const tA = teams[m.teamAId]?.name || "";
    const tB = teams[m.teamBId]?.name || "";
    return normalizeStr(tA).includes(normalizeStr(searchQuery)) || 
           normalizeStr(tB).includes(normalizeStr(searchQuery));
  });

  const countryNames: string[] = Array.from(new Set(Object.values(teams).map((t: any) => (t.name || "") as string)));
  const suggestions = countryNames.filter(c => normalizeStr(c).includes(normalizeStr(searchQuery)) && normalizeStr(c) !== normalizeStr(searchQuery));

  const refresh = async () => {
    try {
      const matchesRes = await matchService.getMatches();
      const all = matchesRes.data.data || [];
      setMatches(all.filter(m => m.status === "PENDING"));
      setFinishedMatches(all.filter(m => m.status === "FINISHED"));

      const teamsMap: Record<number, any> = {};
      all.forEach((m: any) => {
        if (m.teamA) teamsMap[m.teamA.id] = m.teamA;
        if (m.teamB) teamsMap[m.teamB.id] = m.teamB;
      });
      setTeams(teamsMap);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const setFinalResult = async (matchId: number, a: number, b: number) => {
    try {
      await adminService.finishMatch(matchId, { scoreA: a, scoreB: b });
      refresh();
    } catch (err) {
      console.error('Error finishing match:', err);
    }
  };

  const deleteResult = async (matchId: number) => {
    try {
      await adminService.revertMatch(matchId);
      refresh();
    } catch (err) {
      console.error('Error reverting match:', err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-card border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">Resultados Pendientes</h3>
          <div className="relative w-64">
            <input 
              type="text" 
              placeholder="Buscar por país..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full bg-active border border-white/5 rounded-xl py-2 pl-4 pr-8 text-xs text-text-main focus:outline-none focus:border-accent/40 placeholder:text-gray-600 transition-all font-bold"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-text-main text-xs"
              >
                ✕
              </button>
            )}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 max-h-40 overflow-y-auto bg-active border border-white/10 rounded-xl shadow-2xl backdrop-blur-md no-scrollbar">
                {suggestions.map(name => (
                  <div 
                    key={name}
                    onMouseDown={() => {
                      setSearchQuery(name);
                      setShowSuggestions(false);
                    }}
                    className="px-4 py-2 hover:bg-white/10 cursor-pointer font-bold text-xs text-text-main transition-colors"
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPending.map(m => (
            <ResultRow key={m.id} match={m} teams={teams} onSave={setFinalResult} />
          ))}
          {filteredPending.length === 0 && <p className="text-gray-600 py-32 text-center col-span-full font-black uppercase italic tracking-tighter text-xl opacity-40">No hay partidos pendientes</p>}
        </div>
      </div>

      <div className="bg-card border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
        <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500 mb-8 flex items-center gap-2">Resultados Publicados (Corrección)</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredFinished.map(m => (
            <ResultRow key={m.id} match={m} teams={teams} onSave={setFinalResult} onDelete={deleteResult} />
          ))}
          {filteredFinished.length === 0 && <p className="text-gray-600 py-32 text-center col-span-full font-black uppercase italic tracking-tighter text-xl opacity-40">Sin resultados publicados</p>}
        </div>
      </div>
    </div>
  );
}

interface ResultRowProps {
  match: any;
  teams: Record<number, any>;
  onSave: (id: number, a: number, b: number) => void;
  onDelete?: (id: number) => void;
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
          {onDelete && match.status === "FINISHED" && (
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
        <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
          {teams[match.teamAId]?.logoUrl && (
            <img 
              src={teams[match.teamAId].logoUrl} 
              className="w-4 h-4 object-contain flex-shrink-0" 
              alt="" 
            />
          )}
          <span className="font-black uppercase italic text-[10px] truncate">
            {teams[match.teamAId]?.name || 'TBD'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input type="number" value={a} onChange={(e) => setA(e.target.value)} className="w-10 h-10 bg-black/60 border border-white/10 rounded-xl text-center font-black text-accent focus:border-accent/40 outline-none text-sm" />
          <span className="text-gray-700 font-bold">:</span>
          <input type="number" value={b} onChange={(e) => setB(e.target.value)} className="w-10 h-10 bg-black/60 border border-white/10 rounded-xl text-center font-black text-accent focus:border-accent/40 outline-none text-sm" />
        </div>
        <div className="flex-1 flex items-center justify-start gap-2 min-w-0">
          <span className="font-black uppercase italic text-[10px] truncate">
            {teams[match.teamBId]?.name || 'TBD'}
          </span>
          {teams[match.teamBId]?.logoUrl && (
            <img 
              src={teams[match.teamBId].logoUrl} 
              className="w-4 h-4 object-contain flex-shrink-0" 
              alt="" 
            />
          )}
        </div>
      </div>
      <button onClick={handleSave} className="w-full bg-accent text-black font-black uppercase italic py-3 rounded-xl shadow-lg shadow-accent/10 hover:scale-[1.02] active:scale-[0.98] transition-all text-[9px] tracking-widest mt-2 overflow-hidden flex items-center justify-center gap-2">
         {match.status === "FINISHED" ? "ACTUALIZAR RESULTADO" : "PUBLICAR RESULTADO"} <Check size={14} />
      </button>
    </div>
  );
}

interface UserAnswerRowProps {
  prediction: any;
  onSave: (predId: number, newAnswer: string) => Promise<void>;
}

const UserAnswerRow: React.FC<UserAnswerRowProps> = ({ prediction, onSave }) => {
  const [val, setVal] = useState(prediction.selectedAnswer || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(prediction.id, val);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
      <td className="py-2.5 px-4 font-bold text-xs text-text-main">
        {prediction.user?.displayName || `@${prediction.user?.username}`}
      </td>
      <td className="py-2.5 px-4">
        <div className="flex gap-2 items-center">
          <input 
            type="text" 
            value={val} 
            onChange={(e) => setVal(e.target.value)}
            className="flex-1 bg-active border border-border-main rounded-lg px-3 py-1.5 text-xs text-text-main focus:outline-none focus:border-accent/40"
          />
          <button 
            onClick={handleSave} 
            disabled={saving || val === prediction.selectedAnswer}
            className={cn(
              "p-2 rounded-lg transition-all",
              val === prediction.selectedAnswer 
                ? "text-gray-600 bg-white/5 cursor-not-allowed" 
                : "text-accent bg-accent/10 hover:bg-accent hover:text-black"
            )}
          >
            {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
          </button>
        </div>
      </td>
      <td className="py-2.5 px-4 text-center">
        <span className={cn(
          "inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase",
          prediction.isCorrect ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
        )}>
          {prediction.isCorrect ? `${prediction.pointsEarned} Pts` : "0 Pts"}
        </span>
      </td>
    </tr>
  );
};

// 4. Bonus Manager
function BonusManager() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [qText, setQText] = useState("");
  const [category, setCategory] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [selectedQuestionForAnswers, setSelectedQuestionForAnswers] = useState<any | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);

  const refresh = async () => {
    try {
      const res = await bonusService.getQuestions();
      setQuestions(res.data.data || []);
    } catch (err) {
      console.error('Error loading questions:', err);
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        question: qText,
        category: category || null,
        correctAnswer: correctAnswer || null
      };

      if (editingId) {
        await adminService.updateBonusQuestion(editingId, payload);
      } else {
        await adminService.createBonusQuestion(payload);
      }
      cancelEdit();
      refresh();
    } catch (err) {
      console.error('Error saving question:', err);
    }
  };

  const handleEdit = (q: any) => {
    setEditingId(q.id);
    setQText(q.question);
    setCategory(q.category || "");
    setCorrectAnswer(q.correctAnswer || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setQText("");
    setCategory("");
    setCorrectAnswer("");
  };

  const deleteQuestion = async (qId: number) => {
    if (!confirm('¿Eliminar esta pregunta bonus?')) return;
    try {
      await adminService.deleteBonusQuestion(qId);
      refresh();
    } catch (err) {
      console.error('Error deleting question:', err);
    }
  };

  const handleOpenAnswersModal = async (q: any) => {
    setSelectedQuestionForAnswers(q);
    setLoadingPredictions(true);
    try {
      const res = await adminService.getBonusPredictions(q.id);
      setPredictions(res.data.data || []);
    } catch (err) {
      console.error("Error loading predictions:", err);
    } finally {
      setLoadingPredictions(false);
    }
  };

  const handleSavePrediction = async (predId: number, newAnswer: string) => {
    try {
      await adminService.updateBonusPrediction(predId, { selectedAnswer: newAnswer });
      setPredictions(prev => prev.map(p => p.id === predId ? { ...p, selectedAnswer: newAnswer } : p));
      refresh();
    } catch (err) {
      console.error("Error saving prediction:", err);
      alert("Error al actualizar la respuesta");
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedQuestionForAnswers(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-card border border-white/10 rounded-[2.5rem] p-8 h-fit shadow-2xl sticky top-24">
        <h3 className="text-lg font-black italic uppercase tracking-tighter mb-6 flex items-center gap-2">
          {editingId ? <Edit2 size={20} className="text-accent" /> : <Plus size={20} className="text-accent" />}
          {editingId ? "Editar Pregunta" : "Pregunta Bonus"}
        </h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <AdminInput label="Pregunta" value={qText} onChange={setQText} placeholder="Ej. ¿Quién será el campeón del torneo?" />
          <AdminInput label="Categoría" value={category} onChange={setCategory} placeholder="Ej. Fase de Grupos / Campeón" />
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Respuesta Oficial (Opcional)</label>
            <input 
              type="text" 
              value={correctAnswer} 
              onChange={(e) => setCorrectAnswer(e.target.value)}
              placeholder="Ej. Argentina"
              className="w-full bg-active border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-accent/40 transition-all font-bold text-sm placeholder:text-gray-700"
            />
          </div>
          <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest px-2">Las preguntas bonus otorgan 5 puntos al acertar. Si se asigna la respuesta oficial, los puntos se calcularán automáticamente.</p>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-accent text-black font-black uppercase italic tracking-widest py-4 rounded-xl shadow-lg shadow-accent/10 mt-4">
              {editingId ? "Actualizar" : "Publicar"} Pregunta
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="bg-active border border-white/10 text-gray-400 font-black uppercase tracking-widest py-4 px-6 rounded-xl mt-4">
                X
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-card border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-6">Preguntas Activas ({questions.length})</h3>
        <div className="space-y-6 max-h-[600px] overflow-y-auto">
          {questions.map(q => (
            <div key={q.id} className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-4 shadow-inner group hover:border-white/10 transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className="text-[8px] font-black uppercase tracking-wider text-gray-600 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{q.category || 'General'}</span>
                  <p className="text-xs font-black uppercase italic text-accent mt-2 leading-relaxed">{q.question}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => handleEdit(q)}
                    className="p-1.5 text-gray-500 hover:text-blue-400 transition-all"
                    title="Editar"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => deleteQuestion(q.id)}
                    className="p-1.5 text-gray-500 hover:text-red-500 transition-all"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              
              <button 
                onClick={() => handleOpenAnswersModal(q)}
                className="w-full bg-active hover:bg-active/85 text-text-main font-black uppercase text-[9px] tracking-widest py-2 rounded-xl transition-all border border-border-main"
              >
                Ver/Editar Respuestas de Usuarios
              </button>

              {q.correctAnswer && <p className="text-[8px] font-black uppercase text-green-500 text-right">RESUELTO Y PUNTOS ASIGNADOS ({q.correctAnswer})</p>}
            </div>
          ))}
        </div>
      </div>

      {selectedQuestionForAnswers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-4xl bg-card border border-white/10 rounded-[2.5rem] p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <button 
              onClick={() => setSelectedQuestionForAnswers(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-text-main font-black text-lg p-2"
            >
              ✕
            </button>
            <h3 className="text-base font-black italic uppercase tracking-tighter mb-2 text-accent">Respuestas de Usuarios</h3>
            <p className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-wider leading-relaxed">
              Pregunta: {selectedQuestionForAnswers.question}
            </p>

            <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
              {loadingPredictions ? (
                <div className="text-center py-20 text-gray-500 font-bold uppercase tracking-wider text-xs">Cargando respuestas...</div>
              ) : predictions.length === 0 ? (
                <div className="text-center py-20 text-gray-500 font-bold uppercase tracking-wider text-xs">Ningún usuario ha respondido aún</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      <th className="py-2 px-4">Usuario</th>
                      <th className="py-2 px-4">Respuesta Pronosticada</th>
                      <th className="py-2 px-4 text-center">Estado/Puntos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map(pred => (
                      <UserAnswerRow 
                        key={pred.id} 
                        prediction={pred} 
                        onSave={handleSavePrediction} 
                      />
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 5. User Manager
function UserManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit User States
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<"ADMIN" | "USER">("USER");
  const [editIsActive, setEditIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const res = await adminService.getAllUsers(100, 0);
      setUsers(res.data.data?.users || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading users:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedUserForEdit(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleStartEdit = (user: any) => {
    setSelectedUserForEdit(user);
    setEditUsername(user.username || "");
    setEditDisplayName(user.displayName || "");
    setEditPassword(""); // Blank by default to not modify it unless desired
    setEditRole(user.role || "USER");
    setEditIsActive(user.isActive ?? true);
    setError(null);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;

    const trimmedUsername = editUsername.trim();
    const trimmedDisplayName = editDisplayName.trim();

    if (!trimmedUsername) {
      setError("El código de 3 letras es requerido");
      return;
    }
    if (trimmedUsername.length !== 3) {
      setError("El código de usuario debe tener exactamente 3 letras");
      return;
    }
    if (!trimmedDisplayName) {
      setError("El nombre es requerido");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: any = {
        username: trimmedUsername.toUpperCase(),
        displayName: trimmedDisplayName.toUpperCase(),
        role: editRole,
        isActive: editIsActive,
      };
      if (editPassword.trim() !== "") {
        payload.password = editPassword.trim();
      }
      await adminService.updateUser(selectedUserForEdit.id, payload);
      setSelectedUserForEdit(null);
      refresh();
    } catch (err: any) {
      console.error("Error updating user:", err);
      const errMsg = err.response?.data?.message || "Error al actualizar el usuario";
      setError(errMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-500 font-black">Cargando usuarios...</div>;
  }

  return (
    <div className="bg-card border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
      <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-6">Usuarios del Sistema ({users.length})</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-4 font-bold text-xs uppercase text-gray-500">Posición</th>
              <th className="text-left py-3 px-4 font-bold text-xs uppercase text-gray-500">Usuario</th>
              <th className="text-left py-3 px-4 font-bold text-xs uppercase text-gray-500">Nombre</th>
              <th className="text-right py-3 px-4 font-bold text-xs uppercase text-gray-500">Puntos</th>
              <th className="text-center py-3 px-4 font-bold text-xs uppercase text-gray-500">Rol</th>
              <th className="text-center py-3 px-4 font-bold text-xs uppercase text-gray-500">Estado</th>
              <th className="text-center py-3 px-4 font-bold text-xs uppercase text-gray-500">Creado</th>
              <th className="text-center py-3 px-4 font-bold text-xs uppercase text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 px-4">
                  <span className="font-black text-accent">#{index + 1}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-bold">@{user.username}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-gray-400">{user.displayName}</span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="font-black text-accent">{user.points}</span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={cn(
                    "inline-block px-3 py-1 rounded-full text-xs font-bold",
                    user.role === 'ADMIN' ? "bg-yellow-500/10 text-yellow-400" : "bg-blue-500/10 text-blue-400"
                  )}>
                    {user.role === 'ADMIN' ? 'Admin' : 'Usuario'}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={cn(
                    "inline-block px-3 py-1 rounded-full text-xs font-bold",
                    user.isActive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                  )}>
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="py-3 px-4 text-center text-[10px] text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString('es-CO')}
                </td>
                <td className="py-3 px-4 text-center">
                  <button 
                    onClick={() => handleStartEdit(user)}
                    className="bg-accent hover:bg-accent/80 text-black font-black uppercase text-[10px] tracking-wider py-1.5 px-3.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 mx-auto hover:scale-[1.05] active:scale-[0.95]"
                  >
                    <Edit2 size={10} />
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUserForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-card border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative max-h-[90vh] flex flex-col overflow-y-auto">
            <button 
              onClick={() => setSelectedUserForEdit(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-text-main font-black text-lg p-2"
            >
              ✕
            </button>
            <h3 className="text-lg font-black italic uppercase tracking-tighter mb-2 text-accent flex items-center gap-2">
              <Edit2 size={20} />
              Editar Usuario
            </h3>
            <p className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-wider">
              Modifique los datos de acceso y el perfil del usuario.
            </p>

            {error && (
              <div className="mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4">
              <AdminInput 
                label="Código de 3 letras" 
                value={editUsername} 
                onChange={setEditUsername} 
                placeholder="Ej. ABC" 
              />
              <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest px-1">
                El identificador del usuario en el sistema. Debe tener exactamente 3 letras.
              </p>

              <AdminInput 
                label="Nombre Completo" 
                value={editDisplayName} 
                onChange={setEditDisplayName} 
                placeholder="Ej. JUAN PEREZ" 
              />

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nuevo PIN de Acceso</label>
                <input 
                  type="text" 
                  value={editPassword} 
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Dejar en blanco para no cambiar"
                  className="w-full bg-active border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-accent/40 transition-all font-bold text-sm placeholder:text-gray-700"
                />
              </div>
              <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest px-1">
                Por seguridad, el PIN actual está encriptado. Escriba un nuevo PIN para cambiarlo.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Tipo de Usuario (Rol)</label>
                  <select 
                    value={editRole} 
                    onChange={(e) => setEditRole(e.target.value as "ADMIN" | "USER")}
                    className="w-full bg-active border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-accent/40 transition-all font-bold text-sm text-text-main"
                  >
                    <option value="USER">Usuario Regular</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Estado de Cuenta</label>
                  <select 
                    value={editIsActive ? "true" : "false"} 
                    onChange={(e) => setEditIsActive(e.target.value === "true")}
                    className="w-full bg-active border border-white/5 rounded-xl py-3 px-4 focus:outline-none focus:border-accent/40 transition-all font-bold text-sm text-text-main"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button 
                  type="button" 
                  onClick={() => setSelectedUserForEdit(null)}
                  className="flex-1 bg-active border border-white/10 hover:bg-white/10 text-gray-400 font-black uppercase tracking-widest py-4 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 bg-accent text-black font-black uppercase italic tracking-widest py-4 rounded-xl shadow-lg shadow-accent/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={14} /> Guardar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PhaseManager() {
  const [phases, setPhases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingGroups, setProcessingGroups] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchPhases = async () => {
    try {
      setLoading(true);
      const res = await phaseService.getPhases();
      setPhases(res.data.data || []);
    } catch (err) {
      console.error("Error loading phases:", err);
      setMessage({ text: "Error al cargar las fases de la competencia", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhases();
  }, []);

  const handleStatusChange = async (phase: string, newStatus: string) => {
    try {
      await phaseService.updatePhaseStatus(phase, newStatus);
      setMessage({ text: `Estado de la fase ${getPhaseName(phase)} actualizado a ${getStatusName(newStatus)}`, type: "success" });
      
      // Update local state
      setPhases(prev => prev.map(p => p.phase === phase ? { ...p, status: newStatus } : p));
    } catch (err: any) {
      console.error("Error updating phase status:", err);
      const errMsg = err.response?.data?.message || "Error al actualizar el estado de la fase";
      setMessage({ text: errMsg, type: "error" });
    }
  };

  const handleProcessGroups = async () => {
    if (!window.confirm("¿Está seguro de procesar la fase de grupos? Esto calculará las posiciones de todos los grupos y generará los emparejamientos para los Dieciseisavos de Final. Esta acción no se puede deshacer fácilmente.")) {
      return;
    }
    try {
      setProcessingGroups(true);
      setMessage(null);
      const res = await phaseService.processGroups();
      setMessage({ text: res.data.message || "Fase de grupos procesada con éxito y Round of 32 generado.", type: "success" });
      await fetchPhases();
    } catch (err: any) {
      console.error("Error processing groups:", err);
      const errMsg = err.response?.data?.message || "Error al procesar la clasificación de grupos y generar el bracket";
      setMessage({ text: errMsg, type: "error" });
    } finally {
      setProcessingGroups(false);
    }
  };

  const getPhaseName = (p: string) => {
    switch (p) {
      case "GROUPS": return "Fase de Grupos";
      case "ROUND_OF_32": return "Dieciseisavos de Final";
      case "ROUND_OF_16": return "Octavos de Final";
      case "QUARTERFINALS": return "Cuartos de Final";
      case "SEMIFINALS": return "Semifinales";
      case "THIRD_PLACE": return "Tercer Puesto";
      case "FINAL": return "Final";
      default: return p;
    }
  };

  const getStatusName = (s: string) => {
    switch (s) {
      case "LOCKED": return "Bloqueado";
      case "OPEN_FOR_PREDICTIONS": return "Abierto";
      case "LIVE": return "En Vivo";
      case "FINISHED": return "Finalizado";
      default: return s;
    }
  };

  const getStatusBadgeClass = (s: string) => {
    switch (s) {
      case "LOCKED":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      case "OPEN_FOR_PREDICTIONS":
        return "bg-green-500/10 text-green-400 border border-green-500/20";
      case "LIVE":
        return "bg-orange-500/10 text-orange-400 border border-orange-500/20 animate-pulse";
      case "FINISHED":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-500 font-black">Cargando configuración de fases...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* List of phases */}
      <div className="lg:col-span-2 bg-card border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
        <div>
          <h3 className="text-lg font-black italic uppercase tracking-tighter mb-2 flex items-center gap-2">
            <ListChecks size={20} className="text-accent" /> Control de Fases del Torneo
          </h3>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-6">
            Gestione la disponibilidad de predicciones y el estado de cada fase en tiempo real.
          </p>
        </div>

        {message && (
          <div className={cn(
            "p-4 rounded-2xl border text-xs font-bold uppercase tracking-wider flex items-start gap-3",
            message.type === "success" 
              ? "bg-green-500/10 border-green-500/20 text-green-400" 
              : "bg-red-500/10 border-red-500/20 text-red-400"
          )}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">{message.text}</div>
            <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-white font-black text-sm">×</button>
          </div>
        )}

        <div className="space-y-4">
          {phases.map((p) => (
            <div key={p.id} className="p-5 bg-white/5 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-white/10 transition-all">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-black italic uppercase text-sm tracking-tight text-text-main">
                    {getPhaseName(p.phase)}
                  </h4>
                  <span className={cn("px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider", getStatusBadgeClass(p.status))}>
                    {getStatusName(p.status)}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  Código DB: <span className="text-gray-400">{p.phase}</span>
                </p>
              </div>

              {/* Status Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleStatusChange(p.phase, "LOCKED")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all",
                    p.status === "LOCKED"
                      ? "bg-red-500/20 border-red-500/30 text-red-400 cursor-default"
                      : "bg-black/20 border-white/5 text-gray-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400"
                  )}
                  disabled={p.status === "LOCKED"}
                >
                  <Lock size={12} /> Bloquear
                </button>
                <button
                  onClick={() => handleStatusChange(p.phase, "OPEN_FOR_PREDICTIONS")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all",
                    p.status === "OPEN_FOR_PREDICTIONS"
                      ? "bg-green-500/20 border-green-500/30 text-green-400 cursor-default"
                      : "bg-black/20 border-white/5 text-gray-400 hover:bg-green-500/10 hover:border-green-500/20 hover:text-green-400"
                  )}
                  disabled={p.status === "OPEN_FOR_PREDICTIONS"}
                >
                  <Unlock size={12} /> Habilitar
                </button>
                <button
                  onClick={() => handleStatusChange(p.phase, "LIVE")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all",
                    p.status === "LIVE"
                      ? "bg-orange-500/20 border-orange-500/30 text-orange-400 cursor-default"
                      : "bg-black/20 border-white/5 text-gray-400 hover:bg-orange-500/10 hover:border-orange-500/20 hover:text-orange-400"
                  )}
                  disabled={p.status === "LIVE"}
                >
                  <Play size={12} /> En Vivo
                </button>
                <button
                  onClick={() => handleStatusChange(p.phase, "FINISHED")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all",
                    p.status === "FINISHED"
                      ? "bg-blue-500/20 border-blue-500/30 text-blue-400 cursor-default"
                      : "bg-black/20 border-white/5 text-gray-400 hover:bg-blue-500/10 hover:border-blue-500/20 hover:text-blue-400"
                  )}
                  disabled={p.status === "FINISHED"}
                >
                  <CheckCircle2 size={12} /> Finalizar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operations Panel */}
      <div className="bg-card border border-white/10 rounded-[2.5rem] p-8 h-fit shadow-2xl space-y-6">
        <div>
          <h3 className="text-lg font-black italic uppercase tracking-tighter mb-2 flex items-center gap-2">
            <RefreshCw size={20} className="text-accent" /> Operaciones Globales
          </h3>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
            Ejecutar procesos automáticos de bracket y avance.
          </p>
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/5 p-5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-accent">Procesar Fase de Grupos</h4>
          <p className="text-[10px] text-gray-400 leading-relaxed font-bold uppercase tracking-wider">
            Calcula la tabla de clasificados finales de la fase de grupos. Determina los 32 equipos que avanzan e inicializa automáticamente los emparejamientos del fixture de la Ronda de 32 (Dieciseisavos).
          </p>
          <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl p-3 text-[9px] font-bold uppercase tracking-wider leading-normal">
            ⚠️ ADVERTENCIA: Asegúrese de que todos los partidos de la Fase de Grupos tengan resultados ingresados y estén finalizados antes de proceder.
          </div>
          <button
            onClick={handleProcessGroups}
            disabled={processingGroups}
            className="w-full bg-accent text-black font-black uppercase italic tracking-widest py-4 rounded-xl shadow-lg shadow-accent/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            <RefreshCw size={14} className={cn("animate-spin", !processingGroups && "hidden")} />
            {processingGroups ? "Procesando..." : "Generar Bracket R32"}
          </button>
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

// 6. Points Manager
function PointsManager() {
  const [acierto, setAcierto] = useState<string>("5");
  const [aciertoCompleto, setAciertoCompleto] = useState<string>("7");
  const [pregunta, setPregunta] = useState<string>("20");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchPointsConfig = async () => {
    try {
      setLoading(true);
      const res = await adminService.getPointsConfig();
      const config = res.data.data;
      if (config) {
        setAcierto(config.acierto.toString());
        setAciertoCompleto(config.aciertoCompleto.toString());
        setPregunta(config.pregunta.toString());
      }
    } catch (err) {
      console.error("Error loading points config:", err);
      setMessage({ text: "Error al cargar la configuración de puntos", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPointsConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        acierto: parseInt(acierto, 10),
        aciertoCompleto: parseInt(aciertoCompleto, 10),
        pregunta: parseInt(pregunta, 10),
      };
      if (isNaN(payload.acierto) || isNaN(payload.aciertoCompleto) || isNaN(payload.pregunta)) {
        throw new Error("Todos los valores deben ser números válidos");
      }
      await adminService.updatePointsConfig(payload);
      setMessage({ text: "Configuración de puntos actualizada correctamente", type: "success" });
    } catch (err: any) {
      console.error("Error saving points config:", err);
      const errMsg = err.response?.data?.message || err.message || "Error al actualizar la configuración";
      setMessage({ text: errMsg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-500 font-black">Cargando configuración de puntos...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto bg-card border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
      <div className="mb-6">
        <h3 className="text-lg font-black italic uppercase tracking-tighter mb-2 flex items-center gap-2">
          <Trophy size={20} className="text-accent" /> Configuración de Puntos
        </h3>
        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
          Ajuste dinámicamente los puntos otorgados por cada tipo de acierto y predicción de bonus.
        </p>
      </div>

      {message && (
        <div className={cn(
          "mb-6 p-4 rounded-2xl border text-xs font-bold uppercase tracking-wider flex items-start gap-3",
          message.type === "success" 
            ? "bg-green-500/10 border-green-500/20 text-green-400" 
            : "bg-red-500/10 border-red-500/20 text-red-400"
        )}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">{message.text}</div>
          <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-white font-black text-sm">×</button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-4">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
            <AdminInput 
              label="Acierto Simple (Ganador o Empate)" 
              value={acierto} 
              onChange={setAcierto} 
              placeholder="Ej. 5" 
            />
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest px-1">
              Puntos por predecir correctamente el ganador o el empate, sin acertar los goles exactos.
            </p>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
            <AdminInput 
              label="Acierto Completo (Marcador Exacto)" 
              value={aciertoCompleto} 
              onChange={setAciertoCompleto} 
              placeholder="Ej. 7" 
            />
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest px-1">
              Puntos otorgados cuando se acierta exactamente la cantidad de goles de ambos equipos.
            </p>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
            <AdminInput 
              label="Pregunta Bonus" 
              value={pregunta} 
              onChange={setPregunta} 
              placeholder="Ej. 20" 
            />
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest px-1">
              Puntos otorgados al acertar la respuesta correcta oficial en las preguntas bonus.
            </p>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="w-full bg-accent text-black font-black uppercase italic tracking-widest py-4 rounded-xl shadow-lg shadow-accent/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
        >
          {saving ? (
            <>
              <RefreshCw size={14} className="animate-spin" /> Guardando...
            </>
          ) : (
            <>
              <Save size={14} /> Guardar Configuración
            </>
          )}
        </button>
      </form>
    </div>
  );
}
