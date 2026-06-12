import React from "react";
import { HelpCircle, Lock, Trophy, Award, Star, Info } from "lucide-react";

export default function Rules() {
  return (
    <div className="p-4 md:p-8 space-y-8 max-w-4xl mx-auto overflow-y-auto lg:h-[calc(100vh-140px)] scrollbar-hide pb-16">
      {/* Header Bento Title */}
      <div className="bg-card border border-border-main rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-accent/5 blur-[100px] rounded-full group-hover:bg-accent/10 transition-colors" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center shadow-lg text-accent">
            <HelpCircle size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-text-main leading-none mb-1.5">
              ¿Cómo <span className="text-accent underline decoration-accent/30 underline-offset-4">Jugar</span>?
            </h1>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em]">
              Reglas oficiales y sistema de puntuación de la polla 2026
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sección 1: Pronósticos de Partidos */}
        <div className="bg-card border border-border-main rounded-[2.5rem] p-6 shadow-2xl flex flex-col justify-between md:col-span-2">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-xl flex items-center justify-center">
                <Lock size={16} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-text-main italic">
                1. Pronósticos y Cierre de Elecciones
              </h3>
            </div>
            
            <div className="h-px bg-border-main w-full" />
            
            <div className="space-y-3 text-xs text-text-muted font-bold leading-relaxed uppercase tracking-wider">
              <p>
                • Puedes realizar y modificar tus pronósticos en la sección de <span className="text-accent">"Eliminatorias"</span>.
              </p>
              <p>
                • Tienes la libertad de <span className="text-text-main">llenar todo el fixture del torneo de una sola vez</span> si así lo prefieres, asegurando tu participación en partidos futuros.
              </p>
              <p>
                • <span className="text-red-500">Cierre Individual:</span> Las elecciones se bloquean para cada partido individualmente exactamente <span className="text-text-main">15 minutos antes</span> de la hora oficial programada para su inicio. 
              </p>
              <p>
                • Una vez cerrado el tiempo para un encuentro, ya no se podrán guardar ni modificar los marcadores pronosticados para ese partido bajo ninguna circunstancia.
              </p>
            </div>
          </div>
        </div>

        {/* Sección 2: Sistema de Puntos por Fase */}
        <div className="bg-card border border-border-main rounded-[2.5rem] p-6 shadow-2xl flex flex-col justify-between md:col-span-2">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl flex items-center justify-center">
                <Trophy size={16} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-text-main italic">
                2. Sistema de Puntos por Fase
              </h3>
            </div>
            
            <div className="h-px bg-border-main w-full" />
            
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest leading-relaxed">
              Los puntos acumulados dependen de la precisión de tu predicción y aumentan de valor en las fases decisivas del torneo:
            </p>

            <div className="border border-white/5 rounded-2xl overflow-hidden bg-active/25 w-full">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-white/10 text-[9px] font-black text-gray-500 uppercase tracking-widest bg-active/40">
                    <th className="py-3 px-4">Fase del Torneo</th>
                    <th className="py-3 px-4 text-center">Acierto Simple (Ganador/Empate)</th>
                    <th className="py-3 px-4 text-center">Acierto Completo (Marcador Exacto)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-bold uppercase text-[9px] tracking-wider">
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-text-main italic">Fase de Grupos</td>
                    <td className="py-3 px-4 text-center text-accent">2 Puntos</td>
                    <td className="py-3 px-4 text-center text-accent">5 Puntos</td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-text-main italic">Eliminatorias directas <br /><span className="text-[8px] text-text-muted font-bold">(R32, Octavos y Cuartos)</span></td>
                    <td className="py-3 px-4 text-center text-accent">5 Puntos</td>
                    <td className="py-3 px-4 text-center text-accent">8 Puntos</td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-text-main italic">Semifinal, Tercer Puesto y Gran Final</td>
                    <td className="py-3 px-4 text-center text-accent">5 Puntos</td>
                    <td className="py-3 px-4 text-center text-accent">10 Puntos</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sección 3: Preguntas Bonus */}
        <div className="bg-card border border-border-main rounded-[2.5rem] p-6 shadow-2xl flex flex-col justify-between md:col-span-2">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl flex items-center justify-center">
                <Award size={16} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-text-main italic">
                3. Preguntas Bonus
              </h3>
            </div>
            
            <div className="h-px bg-border-main w-full" />
            
            <div className="space-y-3 text-xs text-text-muted font-bold leading-relaxed uppercase tracking-wider">
              <p>
                • En la sección <span className="text-accent">"Bonus"</span> encontrarás preguntas adicionales sobre acontecimientos globales del torneo (ej: quién será el goleador, equipos que avanzarán, etc.).
              </p>
              <p>
                • Cada acierto en una pregunta bonus te otorga <span className="text-text-main">20 puntos adicionales</span>.
              </p>
              <p>
                • <span className="text-yellow-500">Cómputo al Final:</span> Estos puntos son sumamente valiosos y pueden decidir el podio de la polla. Se calcularán y se sumarán a tu puntaje total global al finalizar por completo el torneo, una vez que el administrador configure las respuestas correctas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Footnote */}
      <div className="bg-active/20 border border-border-main p-4 rounded-2xl flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-text-muted">
        <Info size={16} className="text-accent flex-shrink-0" />
        <p>Asegúrate de revisar constantemente la tabla de clasificación y de ingresar tus predicciones a tiempo. ¡Buena suerte!</p>
      </div>
    </div>
  );
}
