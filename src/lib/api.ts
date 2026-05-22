import axios, { AxiosInstance, AxiosError } from 'axios';

// @ts-ignore
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3002/api') as string;

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
}, (error) => {
  console.error('[API] Error en request:', error);
  return Promise.reject(error);
});

// Interceptor para manejar respuestas y refresh token
api.interceptors.response.use(
  (response) => {
    console.log('[API] Response exitosa:', response.config.url);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    console.error('[API] Error en response:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
    });

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log('[API] Token expirado, intentando refresh...');
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data.data;
        console.log('[API] Token refrescado exitosamente');
        localStorage.setItem('accessToken', accessToken);

        // Reintentar request original
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('[API] Error refrescando token:', refreshError);
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
