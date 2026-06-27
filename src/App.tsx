import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { auth } from "./lib/firebase";
import {
  Trophy,
  Map,
  LayoutDashboard,
  Settings,
  User as UserIcon,
  LogOut,
  ChevronRight,
  ClipboardList,
  Sun,
  Moon,
  Menu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import Dashboard from "./components/Dashboard";
import Tournament from "./components/Tournament";
import BracketView from "./components/BracketView";
import Leaderboard from "./components/Leaderboard";
import BonusQuestions from "./components/BonusQuestions";
import RegionsView from "./components/RegionsView";
import AdminPanel from "./components/AdminPanel";
import Login from "./components/Login";
import Rules from "./components/Rules";
import ResultsView from "./components/ResultsView";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { profile, isAdmin, logout } = useAuth();

  // Estado para controlar el menú lateral
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Estado para controlar el tema (light o dark) con persistencia
  const [theme, setTheme] = React.useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "dark";
  });

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className="min-h-screen bg-transparent text-text-main font-sans flex flex-col px-4 pb-4 pt-1.5 overflow-x-hidden transition-colors duration-500">
      {/* Header Navigation - Bento Style */}
      <header className="flex items-center justify-between mb-3 bg-card py-2.5 px-4 rounded-2xl border border-border-main shadow-xl backdrop-blur-md sticky top-1.5 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="w-10 h-10 bg-gradient-to-br from-accent to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-accent/20 text-white hover:opacity-90 transition-opacity cursor-pointer focus:outline-none"
            title="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-black tracking-tighter italic uppercase">
            Polla mundialista <span className="text-accent">Plow</span>
          </h1>
        </div>

        <nav className="hidden md:flex gap-6 text-xs font-bold tracking-widest uppercase items-center">
          <NavLink to="/" label="Inicio" />
          <NavLink to="/tournament" label="Pronósticos" />
          <NavLink to="/bracket" label="Llaves" />
          <NavLink to="/leaderboard" label="Clasificación" />
          <NavLink to="/results" label="Resultados" />
          <NavLink to="/bonus" label="Bonus" />
          <NavLink to="/regions" label="Grupos" />
          <NavLink to="/rules" label="Cómo Jugar" />
          {isAdmin && <NavLink to="/admin" label="Soporte" className="text-yellow-500" />}
        </nav>

        <div className="flex items-center gap-3">
          {/* Boton Toggle Modo Claro/Oscuro */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl bg-active border border-border-main flex items-center justify-center text-text-main hover:bg-white/10 hover:border-accent/40 transition-all cursor-pointer shadow-md"
            title={theme === "dark" ? "Activar Modo Claro" : "Activar Modo Oscuro"}
          >
            {theme === "dark" ? (
              <Sun size={18} className="text-yellow-400 animate-pulse" />
            ) : (
              <Moon size={18} className="text-indigo-600" />
            )}
          </button>

          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold">{profile?.displayName}</p>
            <p className="text-[10px] text-accent font-black uppercase tracking-tighter italic">#{profile?.points || 0} PTS</p>
          </div>
          <div className="group relative">
            <div className="w-10 h-10 rounded-full bg-active border-2 border-border-main overflow-hidden cursor-pointer hover:border-accent/50 transition-all">
              <div className="w-full h-full flex items-center justify-center font-black text-xs">
                {profile?.displayName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CA'}
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="absolute right-0 top-12 bg-card border border-border-main rounded-xl p-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-xs font-bold flex items-center gap-2 hover:bg-red-500/10 hover:text-red-500"
            >
              <LogOut size={14} /> Salir
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            />
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-card border-r border-border-main z-50 p-6 flex flex-col shadow-2xl overflow-y-auto"
            >
              {/* Header inside Sidebar */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-border-main">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-accent to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-black text-sm italic uppercase tracking-tighter">
                    Menú <span className="text-accent"></span>
                  </span>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="w-8 h-8 rounded-lg bg-active border border-border-main flex items-center justify-center text-text-main hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Navigation Links inside Sidebar */}
              <nav className="flex flex-col gap-2 text-sm font-bold tracking-widest uppercase flex-1">
                <SidebarNavLink to="/" label="Inicio" onClick={() => setIsSidebarOpen(false)} />
                <SidebarNavLink to="/tournament" label="Pronósticos" onClick={() => setIsSidebarOpen(false)} />
                <SidebarNavLink to="/bracket" label="Llaves" onClick={() => setIsSidebarOpen(false)} />
                <SidebarNavLink to="/leaderboard" label="Clasificación" onClick={() => setIsSidebarOpen(false)} />
                <SidebarNavLink to="/results" label="Resultados" onClick={() => setIsSidebarOpen(false)} />
                <SidebarNavLink to="/bonus" label="Bonus" onClick={() => setIsSidebarOpen(false)} />
                <SidebarNavLink to="/regions" label="Grupos" onClick={() => setIsSidebarOpen(false)} />
                <SidebarNavLink to="/rules" label="Cómo Jugar" onClick={() => setIsSidebarOpen(false)} />
                {isAdmin && (
                  <SidebarNavLink
                    to="/admin"
                    label="Soporte"
                    className="text-yellow-500"
                    onClick={() => setIsSidebarOpen(false)}
                  />
                )}
              </nav>

              {/* Logout & Profile section at bottom of Sidebar */}
              <div className="mt-auto pt-6 border-t border-border-main flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-active border-2 border-border-main overflow-hidden flex items-center justify-center font-black text-xs">
                    {profile?.displayName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CA'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold">{profile?.displayName}</p>
                    <p className="text-[10px] text-accent font-black uppercase tracking-tighter italic">#{profile?.points || 0} PTS</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    logout();
                  }}
                  className="w-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-xl py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <LogOut size={16} /> Cerrar Sesión
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={window.location.pathname}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex-1"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Bar - Bento Style */}
      <footer className="mt-4 flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-card rounded-2xl border border-border-main gap-2 shadow-md">
        <p className="text-[10px] text-text-muted font-medium uppercase tracking-widest">© 2026 FIFA Corporate World Cup Pool • Yersi logistics v 1.0.1</p>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">Live Updates On</span>
          </div>
          <span className="text-[9px] text-text-muted font-bold uppercase">{window.location.pathname.replace("/", "") || "DASHBOARD"} STATUS: ACTIVE</span>
        </div>
      </footer>
    </div>
  );
};

const NavLink = ({ to, label, className = "" }: { to: string, label: string, className?: string }) => {
  const isActive = window.location.pathname === to;
  return (
    <Link
      to={to}
      className={`relative py-1 transition-all group ${isActive
        ? "text-accent"
        : "text-text-muted hover:text-text-main"
        } ${className}`}
    >
      <span className="relative z-10">{label}</span>
      {isActive && (
        <motion.div
          layoutId="nav-underline"
          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent rounded-full"
        />
      )}
    </Link>
  );
};

const SidebarNavLink = ({
  to,
  label,
  className = "",
  onClick
}: {
  to: string;
  label: string;
  className?: string;
  onClick: () => void;
}) => {
  const isActive = window.location.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center px-4 py-3 rounded-xl transition-all ${isActive
        ? "bg-active text-accent border-l-4 border-accent font-black"
        : "text-text-muted hover:text-text-main hover:bg-white/5"
        } ${className}`}
    >
      <span>{label}</span>
    </Link>
  );
};

const LoadingScreen = () => (
  <div className="h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-accent text-sm font-bold uppercase tracking-widest">Verificando sesión...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <Layout>{children}</Layout>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/tournament" element={<ProtectedRoute><Tournament /></ProtectedRoute>} />
          <Route path="/bracket" element={<ProtectedRoute><BracketView /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute><ResultsView /></ProtectedRoute>} />
          <Route path="/bonus" element={<ProtectedRoute><BonusQuestions /></ProtectedRoute>} />
          <Route path="/regions" element={<ProtectedRoute><RegionsView /></ProtectedRoute>} />
          <Route path="/rules" element={<ProtectedRoute><Rules /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
