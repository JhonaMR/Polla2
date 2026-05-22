# Guía de Integración Frontend-Backend

## 📋 Resumen

Este documento describe cómo integrar el frontend React con el backend Node.js/Express.

## 🔄 Cambios Necesarios en Frontend

### 1. Instalar Dependencias Adicionales

```bash
npm install axios
```

### 2. Crear Servicio API Centralizado

Crear archivo `src/lib/api.ts`:

```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar respuestas y refresh token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);

        // Reintentar request original
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Logout si refresh falla
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### 3. Actualizar AuthContext.tsx

```typescript
import React, { createContext, useContext, useEffect, useState } from "react";
import { UserProfile } from "../types";
import api from "./api";

interface AuthContextType {
  user: { id: number; username: string; displayName: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (email: string, name: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar token al cargar
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const response = await api.get('/auth/verify');
          const userResponse = await api.get('/users/me');
          setProfile(userResponse.data.data);
        }
      } catch (error) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { user, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      setProfile({
        uid: user.id.toString(),
        email: user.email,
        displayName: user.displayName,
        username: user.username,
        role: user.role,
        points: user.points,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const register = async (email: string, name: string, username: string, password: string) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        displayName: name,
        username,
        password,
      });

      const { user, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      setProfile({
        uid: user.id.toString(),
        email: user.email,
        displayName: user.displayName,
        username: user.username,
        role: user.role,
        points: user.points,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setProfile(null);
    }
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
        isAdmin: profile?.role === 'admin',
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

### 4. Crear Servicios para Datos

Crear `src/lib/services.ts`:

```typescript
import api from './api';

export const userService = {
  getProfile: (userId: number) => api.get(`/users/profile/${userId}`),
  getMe: () => api.get('/users/me'),
  getLeaderboard: (limit = 100, offset = 0) =>
    api.get('/users/leaderboard', { params: { limit, offset } }),
  updateProfile: (data: any) => api.put('/users/profile', data),
  getStats: () => api.get('/users/stats'),
};

export const predictionService = {
  create: (data: any) => api.post('/predictions', data),
  update: (id: number, data: any) => api.put(`/predictions/${id}`, data),
  getUserPredictions: (userId: number) => api.get(`/predictions/user/${userId}`),
  getMatchPredictions: (matchId: number) => api.get(`/predictions/match/${matchId}`),
  getUserStats: (userId: number) => api.get(`/predictions/user/${userId}/stats`),
};

export const bonusService = {
  getQuestions: () => api.get('/bonus-questions'),
  createPrediction: (data: any) => api.post('/bonus-predictions', data),
  getUserPredictions: (userId: number) => api.get(`/bonus-predictions/user/${userId}`),
};

export const matchService = {
  getMatches: () => api.get('/matches'),
  getMatch: (id: number) => api.get(`/matches/${id}`),
  getByPhase: (phase: string) => api.get(`/matches/phase/${phase}`),
  getUpcoming: () => api.get('/matches/upcoming'),
  getFinished: () => api.get('/matches/finished'),
};

export const teamService = {
  getTeams: () => api.get('/teams'),
  getTeam: (id: number) => api.get(`/teams/${id}`),
  getByRegion: (region: string) => api.get(`/teams/region/${region}`),
  getByGroup: (group: string) => api.get(`/teams/group/${group}`),
};
```

### 5. Actualizar Componentes

Ejemplo para Dashboard.tsx:

```typescript
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { userService, predictionService } from '../lib/services';

export default function Dashboard() {
  const { profile } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [leaderboardRes, statsRes] = await Promise.all([
          userService.getLeaderboard(),
          predictionService.getUserStats(profile?.uid || ''),
        ]);

        setLeaderboard(leaderboardRes.data.data);
        setStats(statsRes.data.data);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    if (profile) {
      loadData();
    }
  }, [profile]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {/* Renderizar dashboard con datos */}
    </div>
  );
}
```

### 6. Configurar Variables de Entorno

Crear `.env.local`:

```
REACT_APP_API_URL=http://localhost:3001/api
```

## 🚀 Flujo de Ejecución

### Desarrollo Local

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run prisma:migrate
npm run seed
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm install
npm run dev
```

### URLs
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- API: http://localhost:3001/api

## 🔐 Seguridad en Integración

### Headers Recomendados
```typescript
// El cliente debe enviar:
Authorization: Bearer <accessToken>

// El servidor responde con:
{
  "data": { ... },
  "message": "Success"
}
```

### Manejo de Errores
```typescript
try {
  const response = await api.post('/predictions', data);
  // Éxito
} catch (error) {
  if (error.response?.status === 401) {
    // Token expirado - se intenta refresh automáticamente
  } else if (error.response?.status === 400) {
    // Validación fallida
    console.error(error.response.data.messages);
  } else if (error.response?.status === 403) {
    // Acceso denegado
  }
}
```

## 📊 Tipos de Datos Actualizados

Actualizar `src/types.ts`:

```typescript
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  role: 'admin' | 'user';
  points: number;
  position?: string;
  photoURL?: string;
}

export interface Match {
  id: number;
  phase: 'GROUPS' | 'ROUND_OF_16' | 'QUARTERFINALS' | 'SEMIFINALS' | 'FINAL';
  teamAId: number;
  teamBId: number;
  scoreA?: number;
  scoreB?: number;
  status: 'PENDING' | 'FINISHED';
  matchDate: string;
  matchNumber: number;
}

export interface Prediction {
  id: number;
  userId: number;
  matchId: number;
  predictedScoreA: number;
  predictedScoreB: number;
  pointsEarned: number;
  isCorrect?: boolean;
}

// ... resto de tipos
```

## 🧪 Testing de Integración

### Verificar Conexión
```bash
curl http://localhost:3001/api/health
```

### Login Test
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"SOP","password":"Admin123!"}'
```

### Usar Token
```bash
curl -X GET http://localhost:3001/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📝 Checklist de Integración

- [ ] Backend instalado y corriendo en puerto 3001
- [ ] Base de datos PostgreSQL creada y migraciones ejecutadas
- [ ] Frontend instalado con axios
- [ ] Servicio API centralizado creado
- [ ] AuthContext actualizado para usar backend
- [ ] Servicios de datos creados
- [ ] Componentes actualizados para usar servicios
- [ ] Variables de entorno configuradas
- [ ] Login/Register funcionando
- [ ] Predicciones funcionando
- [ ] Leaderboard funcionando
- [ ] Bonus questions funcionando

## 🐛 Troubleshooting

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solución**: Verificar que `FRONTEND_URL` en `.env` del backend sea correcto.

### Token Expirado
```
401 Unauthorized
```
**Solución**: El interceptor debe intentar refresh automáticamente. Si falla, redirigir a login.

### Base de Datos No Conecta
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solución**: Verificar que PostgreSQL esté corriendo y `DATABASE_URL` sea correcto.

### Migraciones Fallidas
```
Error: Migration failed
```
**Solución**: Ejecutar `npm run prisma:migrate` nuevamente o revisar logs.

## 📚 Documentación Adicional

- [Arquitectura Backend](./ARQUITECTURA_BACKEND.md)
- [Backend README](./backend/README.md)
- [API Endpoints](./ARQUITECTURA_BACKEND.md#-api-endpoints)
