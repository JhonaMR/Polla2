import React, { useEffect, useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { bonusService } from "../lib/services";
import { Star, CheckCircle2, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import LockModal from "./LockModal";

export default function BonusQuestions() {
  const { profile } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [lockModalOpen, setLockModalOpen] = useState(false);

  // Dynamic points config
  const [pointsConfig, setPointsConfig] = useState<any>({ acierto: 5, aciertoCompleto: 7, pregunta: 20 });

  // Comparison panel states
  const [activeCompareId, setActiveCompareId] = useState<number | null>(null);
  const [comparePredictions, setComparePredictions] = useState<any[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareSearch, setCompareSearch] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [questionsRes, pointsRes] = await Promise.all([
          bonusService.getQuestions(),
          bonusService.getPointsConfig(),
        ]);

        setQuestions(questionsRes.data.data || []);
        if (pointsRes.data.data) {
          setPointsConfig(pointsRes.data.data);
        }

        if (profile?.uid) {
          const predsRes = await bonusService.getUserPredictions(parseInt(profile.uid));
          const pMap: Record<number, any> = {};
          (predsRes.data.data || []).forEach((p: any) => {
            pMap[p.questionId] = p;
          });
          setPredictions(pMap);
        }
        setLoading(false);
      } catch (err: any) {
        console.error('[BONUS] Error loading data:', err);
        setLoading(false);
      }
    };

    if (profile) {
      loadData();
    }
  }, [profile]);

  // Fetch predictions for comparison when comparison is activated
  useEffect(() => {
    if (activeCompareId === null) {
      setComparePredictions([]);
      return;
    }

    const fetchCompareData = async () => {
      setCompareLoading(true);
      try {
        const res = await bonusService.getPredictions(activeCompareId);
        setComparePredictions(res.data.data || []);
      } catch (err) {
        console.error("[BONUS] Error fetching comparison predictions:", err);
      } finally {
        setCompareLoading(false);
      }
    };

    fetchCompareData();
  }, [activeCompareId]);

  // Close panel on ESC key
  useEffect(() => {
    if (activeCompareId === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveCompareId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeCompareId]);

  const savePrediction = async (qId: number, answer: string) => {
    if (!profile) return;
    try {
      await bonusService.createPrediction({
        questionId: qId,
        selectedAnswer: answer,
      });
      setPredictions(prev => ({ ...prev, [qId]: { questionId: qId, selectedAnswer: answer } }));
    } catch (err: any) {
      console.error('[BONUS] Error saving prediction:', err);
      if (
        err.response?.status === 400 ||
        err.response?.data?.error?.includes("bloqueada") ||
        err.response?.data?.message?.includes("bloqueada") ||
        err.message?.includes("bloqueada")
      ) {
        setLockModalOpen(true);
      }

      // Re-fetch predictions from backend to revert text input
      if (profile?.uid) {
        try {
          const predsRes = await bonusService.getUserPredictions(parseInt(profile.uid));
          const pMap: Record<number, any> = {};
          (predsRes.data.data || []).forEach((p: any) => {
            pMap[p.questionId] = p;
          });
          setPredictions(pMap);
        } catch (fetchErr) {
          console.error('[BONUS] Error reloading predictions after failed save:', fetchErr);
        }
      }
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse font-black uppercase text-text-muted">Sincronizando Bonus...</div>;

  return (
    <div className={cn(
      "p-4 md:p-8 space-y-12 mx-auto transition-all duration-300",
      activeCompareId !== null ? "max-w-8xl" : "max-w-8xl"
    )}>
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-text-main">
          Premios <span className="text-accent underline underline-offset-8 decoration-accent/30">Especiales</span>
        </h1>
        <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em]">
          Predicciones a largo plazo • {pointsConfig.pregunta} Puntos por Acierto
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start relative">
        {/* Left Column: Questions */}
        <div className={cn(
          "w-full transition-all duration-300",
          activeCompareId !== null ? "lg:w-[60%]" : "lg:w-full"
        )}>
          <div className="grid grid-cols-1 gap-6">
            {questions.map(q => {
              const prediction = predictions[q.id];
              const isResolved = !!q.correctAnswer;

              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border-main rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group"
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
                      <h3 className="text-xl font-black italic uppercase tracking-tight text-text-main mb-1">{q.question}</h3>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Selecciona una de las opciones oficiales</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <input
                        type="text"
                        disabled={isResolved}
                        value={predictions[q.id]?.selectedAnswer || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPredictions(prev => ({
                            ...prev,
                            [q.id]: {
                              ...prev[q.id],
                              questionId: q.id,
                              selectedAnswer: val
                            }
                          }));
                        }}
                        placeholder="Escribe tu predicción..."
                        onBlur={(e) => savePrediction(q.id, e.target.value)}
                        className={cn(
                          "flex-1 bg-active border rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest focus:outline-none transition-all text-text-main",
                          isResolved ? "border-border-main/50 opacity-50 cursor-not-allowed" : "border-border-main focus:border-accent/40 focus:ring-1 focus:ring-accent/20"
                        )}
                      />
                      {!isResolved && (
                        <div className="bg-accent/10 border border-accent/20 px-4 flex items-center justify-center rounded-2xl text-accent">
                          <CheckCircle2 size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 px-2">
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                        Su respuesta se guardará automáticamente al salir del campo
                      </p>
                      <button
                        onClick={() => {
                          setCompareSearch("");
                          setActiveCompareId(activeCompareId === q.id ? null : q.id);
                        }}
                        className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-3.5 py-2 rounded-xl border transition-all cursor-pointer shadow-sm",
                          activeCompareId === q.id
                            ? "bg-accent text-black border-accent hover:bg-accent/90"
                            : "bg-active border-border-main text-text-main hover:bg-active/85"
                        )}
                      >
                        {activeCompareId === q.id ? "Cerrar Comparativa" : "Comparar Respuestas"}
                      </button>
                    </div>
                  </div>

                  {isResolved && (
                    <div className="mt-8 pt-8 border-t border-border-main flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-2 h-2 rounded-full", prediction?.selectedAnswer?.toLowerCase() === q.correctAnswer?.toLowerCase() ? "bg-accent" : "bg-red-500")} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                          Respuesta Oficial: <span className="text-text-main font-bold">{q.correctAnswer}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={cn("text-2xl font-black italic", prediction?.selectedAnswer?.toLowerCase() === q.correctAnswer?.toLowerCase() ? "text-accent" : "text-text-muted")}>
                          {prediction?.selectedAnswer?.toLowerCase() === q.correctAnswer?.toLowerCase() ? `+${pointsConfig.pregunta}` : "0"}
                        </span>
                        <p className="text-[8px] font-black uppercase text-text-muted tracking-tighter">Puntos Ganados</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}

            {questions.length === 0 && (
              <div className="py-32 flex flex-col items-center justify-center text-text-muted border border-dashed border-border-main rounded-[3rem]">
                <Trophy size={64} className="mb-4 opacity-20" />
                <p className="text-xl font-black italic uppercase tracking-tighter">Sin Preguntas Bonus</p>
                <p className="text-[10px] font-black uppercase tracking-widest">Soporte publicará estas preguntas pronto</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Comparative predictions drawer */}
        <AnimatePresence>
          {activeCompareId !== null && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full lg:w-[37%] bg-card border border-border-main rounded-[2.5rem] p-6 shadow-2xl sticky top-4 max-h-[calc(100vh-160px)] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[9px] font-black text-text-muted uppercase tracking-widest leading-none">Comparativa</span>
                  <h3 className="text-base font-black uppercase tracking-tight text-text-main mt-1">
                    Respuestas de Usuarios
                  </h3>
                </div>
                <button
                  onClick={() => setActiveCompareId(null)}
                  className="text-text-muted hover:text-text-main transition-colors p-2 hover:bg-active rounded-full cursor-pointer"
                >
                  <span className="text-xs font-bold font-mono">X</span>
                </button>
              </div>

              <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-4 leading-relaxed bg-active/40 p-3.5 rounded-2xl border border-border-main/50">
                {questions.find(q => q.id === activeCompareId)?.question}
              </p>

              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Filtrar por usuario..."
                  value={compareSearch}
                  onChange={(e) => setCompareSearch(e.target.value)}
                  className="w-full bg-active border border-border-main rounded-xl py-2.5 px-3.5 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-text-muted transition-all"
                />
              </div>

              {/* Predictions List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                {compareLoading ? (
                  <div className="p-8 text-center text-xs font-bold text-text-muted animate-pulse uppercase">Cargando respuestas...</div>
                ) : comparePredictions.length === 0 ? (
                  <div className="p-8 text-center text-xs font-bold text-text-muted uppercase italic">Nadie ha respondido aún</div>
                ) : (
                  comparePredictions
                    .filter(p =>
                      p.user?.displayName?.toLowerCase().includes(compareSearch.toLowerCase()) ||
                      p.user?.username?.toLowerCase().includes(compareSearch.toLowerCase())
                    )
                    .map((p) => {
                      const currentQuestion = questions.find(q => q.id === activeCompareId);
                      const isCorrect = currentQuestion?.correctAnswer
                        ? p.selectedAnswer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase()
                        : null;
                      return (
                        <div
                          key={p.id}
                          className={cn(
                            "flex items-center justify-between p-3.5 rounded-xl border transition-all text-xs",
                            isCorrect === true
                              ? "bg-accent/10 border-accent/30"
                              : isCorrect === false
                                ? "bg-red-500/10 border-red-500/20"
                                : "bg-active border-border-main/50"
                          )}
                        >
                          <div>
                            <p className="font-bold text-text-main leading-tight">{p.user?.displayName}</p>
                            <p className="text-[9px] font-bold text-text-muted uppercase tracking-tighter mt-0.5">{p.user?.username}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={cn("font-mono font-black uppercase tracking-widest text-sm", isCorrect === true ? "text-accent" : isCorrect === false ? "text-red-500" : "text-text-main")}>
                              {p.selectedAnswer}
                            </p>
                            {isCorrect !== null && (
                              <p className="text-[8px] font-bold text-text-muted uppercase mt-0.5">
                                {isCorrect ? `+${pointsConfig.pregunta} pts` : "0 pts"}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <LockModal
        isOpen={lockModalOpen}
        onClose={() => setLockModalOpen(false)}
      />
    </div>
  );
}
