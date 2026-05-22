import React, { useEffect } from "react";
import { X, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LockModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function LockModal({ isOpen, onClose, message = "Su elección está bloqueada, no es posible editar su elección para este encuentro." }: LockModalProps) {
  // Listen for ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-card border border-white/10 rounded-[2.5rem] w-full max-w-md p-8 relative overflow-hidden shadow-2xl z-10"
          >
            {/* Ambient glows inside the modal */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button X */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
            >
              <X size={18} />
            </button>

            {/* Content */}
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Lock Icon Wrapper */}
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-3xl flex items-center justify-center shadow-lg shadow-red-500/5">
                <Lock size={28} />
              </div>

              {/* Title */}
              <div className="space-y-2">
                <h3 className="text-xl font-black italic uppercase tracking-tight text-white">
                  Elección Bloqueada
                </h3>
                <p className="text-gray-500 text-[9px] font-black tracking-widest uppercase">
                  TIEMPO LÍMITE ALCANZADO
                </p>
              </div>

              {/* Message */}
              <p className="text-gray-300 text-sm font-semibold leading-relaxed">
                {message}
              </p>

              {/* Confirm button */}
              <button
                onClick={onClose}
                className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.15em] rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Entendido
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
