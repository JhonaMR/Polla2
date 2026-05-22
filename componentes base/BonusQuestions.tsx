import React, { useEffect, useState } from "react";
import { storage } from "../lib/storage";
import { useAuth } from "../lib/AuthContext";
import { BonusQuestion, BonusPrediction } from "../types";
import { Star, CheckCircle2, Circle, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

export default function BonusQuestions() {
  const { profile } = useAuth();
  const [questions, setQuestions] = useState<BonusQuestion[]>([]);
  const [predictions, setPredictions] = useState<Record<string, BonusPrediction>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      const qs = storage.getBonusQuestions();
      setQuestions(qs);

      if (profile) {
        const preds = storage.getBonusPredictions(profile.uid);
        const pMap: Record<string, BonusPrediction> = {};
        preds.forEach(p => pMap[p.questionId] = p);
        setPredictions(pMap);
      }
      setLoading(false);
    };
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [profile]);

  const savePrediction = (qId: string, answer: string) => {
    if (!profile) return;
    const predId = `${profile.uid}_${qId}`;
    const p: BonusPrediction = {
      id: predId,
      userId: profile.uid,
      questionId: qId,
      selectedAnswer: answer,
      pointsEarned: 0
    };
    storage.saveBonusPrediction(p);
    setPredictions(prev => ({ ...prev, [qId]: p }));
  };

  if (loading) return <div className="p-20 text-center animate-pulse font-black uppercase text-gray-500">Sincronizando Bonus...</div>;

  return (
    <div className="p-4 md:p-8 space-y-12 max-w-4xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black italic uppercase italic tracking-tighter">Premios <span className="text-accent underline underline-offset-8 decoration-accent/30">Especiales</span></h1>
        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">Predicciones a largo plazo • 50 Puntos por Acierto</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {questions.map(q => {
          const prediction = predictions[q.id];
          const isResolved = !!q.correctAnswer;

          return (
            <motion.div 
              key={q.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-white/10 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden group"
            >
              {isResolved && (
                <div className="absolute top-6 right-6">
                   <div className="bg-accent/10 border border-accent/20 px-3 py-1 rounded-full text-[8px] font-black uppercase text-accent tracking-widest flex items-center gap-2">
                     <CheckCircle2 size={12} /> RESUELTO
                   </div>
                </div>
              )}

              <div className="flex items-start gap-4 mb-8">
                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent shrink-0 border border-accent/20">
                   <Star size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-black italic uppercase tracking-tight text-white mb-1">{q.question}</h3>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Selecciona una de las opciones oficiales</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <input
                    type="text"
                    disabled={isResolved}
                    defaultValue={prediction?.selectedAnswer || ""}
                    placeholder="Escribe tu predicción..."
                    onBlur={(e) => savePrediction(q.id, e.target.value)}
                    className={cn(
                      "flex-1 bg-active border rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest focus:outline-none transition-all",
                      isResolved ? "border-white/5 opacity-50 cursor-not-allowed" : "border-white/10 focus:border-accent/40 focus:ring-1 focus:ring-accent/20"
                    )}
                  />
                  {!isResolved && (
                    <div className="bg-accent/10 border border-accent/20 px-4 flex items-center justify-center rounded-2xl text-accent">
                      <CheckCircle2 size={20} />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest px-2">Su respuesta se guardará automáticamente al salir del campo</p>
              </div>

              {isResolved && (
                <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full", prediction?.selectedAnswer?.toLowerCase() === q.correctAnswer?.toLowerCase() ? "bg-accent" : "bg-red-500")} />
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                        Respuesta Oficial: <span className="text-white">{q.correctAnswer}</span>
                      </p>
                   </div>
                   <div className="text-right">
                      <span className={cn("text-2xl font-black italic", prediction?.selectedAnswer?.toLowerCase() === q.correctAnswer?.toLowerCase() ? "text-accent" : "text-gray-800")}>
                        {prediction?.selectedAnswer?.toLowerCase() === q.correctAnswer?.toLowerCase() ? "+50" : "0"}
                      </span>
                      <p className="text-[8px] font-black uppercase text-gray-600 tracking-tighter">Puntos Ganados</p>
                   </div>
                </div>
              )}
            </motion.div>
          );
        })}

        {questions.length === 0 && (
          <div className="py-32 flex flex-col items-center justify-center text-gray-600 border border-dashed border-white/10 rounded-[3rem]">
             <Trophy size={64} className="mb-4 opacity-20" />
             <p className="text-xl font-black italic uppercase tracking-tighter">Sin Preguntas Bonus</p>
             <p className="text-[10px] font-black uppercase tracking-widest">Soporte publicará estas preguntas pronto</p>
          </div>
        )}
      </div>
    </div>
  );
}
