import React, { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { motion } from "motion/react";
import { Trophy, Key, User, ChevronRight } from "lucide-react";

export default function Login() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!isLogin && name.trim().length === 0) {
      setError("INGRESE SU NOMBRE.");
      return;
    }
    if (username.length !== 3) {
      setError("EL CÓDIGO DEBE SER DE 3 LETRAS.");
      return;
    }
    if (pin.length !== 3 || !/^\d+$/.test(pin)) {
      setError("EL PIN DEBE SER DE 3 DÍGITOS NUMÉRICOS.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(username, pin);
      } else {
        await register(name, username, pin);
      }
    } catch (err: any) {
      setError(err.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-sm bg-card p-10 rounded-[3rem] border border-white/10 shadow-2xl relative z-10 backdrop-blur-xl"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-accent to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-accent/20">
            <Trophy className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Corporate <span className="text-accent">Pool</span></h1>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">Season 2026</p>
        </div>

        <div className="flex bg-active p-1.5 rounded-2xl border border-white/5 mb-8 shadow-inner">
          <button 
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${isLogin ? "bg-accent text-black shadow-lg shadow-accent/20" : "text-gray-500 hover:text-white"}`}
          >
            Ingresar
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${!isLogin ? "bg-accent text-black shadow-lg shadow-accent/20" : "text-gray-500 hover:text-white"}`}
          >
            Registro
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-accent transition-colors" size={18} />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-active border border-white/5 rounded-2xl py-5 pl-12 pr-4 text-xs font-bold focus:outline-none focus:border-accent/40 transition-all placeholder:text-gray-700"
                placeholder="NOMBRE COMPLETO"
                required
              />
            </div>
          )}

          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-accent transition-colors" size={18} />
            <input 
              type="text" 
              maxLength={3}
              value={username}
              onChange={(e) => setUsername(e.target.value.toUpperCase())}
              className="w-full bg-active border border-white/5 rounded-2xl py-5 pl-12 pr-4 text-xl font-black italic tracking-widest text-accent focus:outline-none focus:border-accent/40 transition-all placeholder:text-gray-700 placeholder:italic placeholder:font-normal placeholder:text-[10px] placeholder:tracking-widest"
              placeholder="CÓDIGO (3 LETRAS)"
              required
            />
          </div>

          <div className="relative group">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-accent transition-colors" size={18} />
            <input 
              type="password" 
              maxLength={3}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="w-full bg-active border border-white/5 rounded-2xl py-5 pl-12 pr-4 text-xl font-black italic tracking-[1em] text-accent focus:outline-none focus:border-accent/40 transition-all placeholder:text-gray-700 placeholder:italic placeholder:font-normal placeholder:text-[10px] placeholder:tracking-normal"
              placeholder="PIN (3 DÍGITOS)"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center px-4 leading-relaxed">
              {error}
            </p>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-accent text-black font-black uppercase italic tracking-widest py-5 rounded-2xl shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
          >
            {loading ? "VALIDANDO..." : isLogin ? "INGRESAR AL SISTEMA" : "CREAR CUENTA"}
            {!loading && <ChevronRight size={18} />}
          </button>
        </form>

        <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
              Usuario de prueba: <span className="text-accent">AAA</span> / PIN: <span className="text-accent">123</span><br/>
              Soporte: <span className="text-yellow-500">SOP</span> / PIN: <span className="text-yellow-500">123</span>
            </p>
        </div>

        <p className="mt-8 text-center text-[9px] text-gray-700 font-bold uppercase tracking-[0.3em]">
           SECURE GATEWAY • © 2026
        </p>
      </motion.div>
    </div>
  );
}
