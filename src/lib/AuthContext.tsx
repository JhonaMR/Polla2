import React, { createContext, useContext, useEffect, useState } from "react";
import { UserProfile } from "../types";
import api from "./api";

interface AuthContextType {
  user: { id: number; username: string; displayName: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (name: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setAuthError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  error: null,
  isAdmin: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  clearError: () => {},
  setAuthError: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar token al cargar
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          console.log('[AUTH] Verificando token guardado...');
          const response = await api.get('/users/me');
          const userData = response.data.data;
          console.log('[AUTH] Token válido, usuario:', userData.username);
          setProfile({
            uid: userData.id.toString(),
            displayName: userData.displayName,
            username: userData.username,
            role: userData.role,
            points: userData.points,
            position: userData.position,
            photoURL: userData.photoUrl,
          });
        } else {
          console.log('[AUTH] No hay token guardado');
        }
      } catch (error: any) {
        console.error('[AUTH] Error verificando token:', error.message);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setError(null); // No mostrar error en verificación inicial
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setError(null);
      console.log('[AUTH] Intentando login con usuario:', username);
      const response = await api.post('/auth/login', { username, password });
      const { user, accessToken, refreshToken } = response.data.data;

      console.log('[AUTH] Login exitoso, guardando tokens...');
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      const profileData: UserProfile = {
        uid: user.id.toString(),
        displayName: user.displayName,
        username: user.username,
        role: user.role,
        points: user.points,
      };

      setProfile(profileData);
      console.log('[AUTH] Perfil actualizado, usuario autenticado');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Login failed';
      console.error('[AUTH] Error en login:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const register = async (name: string, username: string, password: string) => {
    try {
      setError(null);
      console.log('[AUTH] Intentando registro con usuario:', username);
      const response = await api.post('/auth/register', {
        displayName: name,
        username,
        password,
      });

      const { user, accessToken, refreshToken } = response.data.data;

      console.log('[AUTH] Registro exitoso, guardando tokens...');
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      const profileData: UserProfile = {
        uid: user.id.toString(),
        displayName: user.displayName,
        username: user.username,
        role: user.role,
        points: user.points,
      };

      setProfile(profileData);
      console.log('[AUTH] Perfil actualizado, usuario registrado');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
      console.error('[AUTH] Error en registro:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      console.log('[AUTH] Iniciando logout...');
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('[AUTH] Error en logout:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setProfile(null);
      setError(null);
      console.log('[AUTH] Logout completado');
    }
  };

  const clearError = () => {
    setError(null);
  };

  const setAuthError = (errorMsg: string | null) => {
    setError(errorMsg);
  };

  return (
    <AuthContext.Provider
      value={{
        user: profile
          ? {
              id: parseInt(profile.uid),
              username: profile.username,
              displayName: profile.displayName,
            }
          : null,
        profile,
        loading,
        error,
        isAdmin: profile?.role === 'ADMIN',
        login,
        register,
        logout,
        clearError,
        setAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
