# 🚀 Guía de Ejecución - Sistema PickEm

## Requisitos Previos

1. **Node.js** (v20 o superior)
2. **PostgreSQL** (corriendo en puerto 5433)
3. **npm** (incluido con Node.js)

## Pasos de Configuración Inicial

### 1. Inicializar la Base de Datos

Ejecuta el script de inicialización de la BD:

**Windows:**
```bash
cd backend
init-db.bat
```

**Linux/Mac:**
```bash
cd backend
./init-db.sh
```

Este script:
- Crea la base de datos `PickEm`
- Crea todas las tablas necesarias
- Inserta datos iniciales (equipos, partidos, preguntas bonus)
- Crea usuario admin: **SOP** / **2114**

### 2. Iniciar el Sistema Completo

Ejecuta un único comando para iniciar Backend y Frontend:

**Windows:**
```bash
start-all.bat
```

**Linux/Mac:**
```bash
./start-all.sh
```

Esto abrirá:
- **Backend** en `http://localhost:3001` (nueva ventana)
- **Frontend** en `http://localhost:3000` (ventana actual)

## Acceso al Sistema

### Credenciales de Prueba

- **Usuario:** SOP
- **Contraseña:** 2114
- **Rol:** ADMIN

### URLs Importantes

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api
- **Health Check:** http://localhost:3001/api/health

## Estructura de Carpetas

```
Polla/
├── backend/              # API REST (Node.js + Express)
│   ├── src/
│   │   ├── controllers/  # Lógica de negocio
│   │   ├── routes/       # Definición de rutas
│   │   ├── services/     # Servicios
│   │   ├── middleware/   # Middlewares
│   │   └── utils/        # Utilidades
│   ├── prisma/           # Esquema de BD
│   ├── .env              # Variables de entorno
│   └── package.json
├── src/                  # Frontend (React + TypeScript)
│   ├── components/       # Componentes React
│   ├── lib/              # Librerías y servicios
│   └── types.ts          # Tipos TypeScript
├── start-all.bat         # Inicia Backend + Frontend (Windows)
├── start-all.sh          # Inicia Backend + Frontend (Linux/Mac)
└── package.json
```

## Configuración de Puertos

- **Frontend:** 3000
- **Backend:** 3001
- **PostgreSQL:** 5433

Si necesitas cambiar los puertos, edita:
- Frontend: `vite.config.ts`
- Backend: `backend/.env` (PORT=3001)
- PostgreSQL: Configura en tu instalación de PostgreSQL

## Solución de Problemas

### PostgreSQL no está disponible
```
Error: PostgreSQL no está corriendo en puerto 5433
```
**Solución:** Inicia PostgreSQL en tu sistema operativo

### Puerto ya está en uso
```
Error: listen EADDRINUSE: address already in use :::3001
```
**Solución:** Cambia el puerto en `backend/.env` o cierra la aplicación que usa ese puerto

### Dependencias no instaladas
```
Error: Cannot find module 'express'
```
**Solución:** Ejecuta `npm install` en la carpeta correspondiente (backend o raíz)

## Desarrollo

### Instalar dependencias manualmente

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
npm install
```

### Compilar TypeScript

**Backend:**
```bash
cd backend
npm run build
```

### Ejecutar linter

**Backend:**
```bash
cd backend
npm run lint
```

## Endpoints Principales

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/refresh` - Refrescar token
- `POST /api/auth/logout` - Cerrar sesión

### Equipos
- `GET /api/teams` - Obtener todos los equipos
- `GET /api/teams/:id` - Obtener equipo por ID

### Partidos
- `GET /api/matches` - Obtener todos los partidos
- `GET /api/matches/:id` - Obtener partido por ID

### Predicciones
- `POST /api/predictions` - Crear predicción
- `GET /api/predictions` - Obtener mis predicciones

### Preguntas Bonus
- `GET /api/bonus-questions` - Obtener preguntas bonus
- `POST /api/bonus-questions/:id/answer` - Responder pregunta

## Notas Importantes

- El sistema usa JWT para autenticación
- Los tokens de acceso expiran en 15 minutos
- Los tokens de refresco expiran en 7 días
- Las contraseñas se almacenan con bcrypt
- Todos los datos se validan en el backend

