# 🚀 Ejecutar Sistema PickEm Localmente

## 📋 Requisitos

- PostgreSQL 12+ instalado en puerto 5555
- Node.js 18+
- npm o yarn

## 🔧 Paso 1: Crear Base de Datos

### Opción A: Usando pgAdmin (GUI)

1. Abrir pgAdmin
2. Click derecho en "Servers" → "Register" → "Server"
3. Nombre: `localhost:5555`
4. Host: `localhost`
5. Port: `5555`
6. Username: `postgres`
7. Password: `postgres`
8. Click derecho en "Databases" → "Create" → "Database"
9. Nombre: `PickEm`
10. Click "Save"

### Opción B: Usando psql (Terminal)

```bash
# Conectar a PostgreSQL
psql -U postgres -h localhost -p 5555

# Crear BD
CREATE DATABASE "PickEm";

# Salir
\q
```

## 📊 Paso 2: Crear Tablas

### Opción A: Ejecutar SQL desde pgAdmin

1. Abrir pgAdmin
2. Conectar a servidor `localhost:5555`
3. Seleccionar BD `PickEm`
4. Click en "Query Tool"
5. Copiar contenido de `backend/setup-db.sql`
6. Pegar en Query Tool
7. Click "Execute"

### Opción B: Ejecutar desde terminal

```bash
# Conectar a la BD y ejecutar script
psql -U postgres -h localhost -p 5555 -d PickEm -f backend/setup-db.sql
```

## 🔐 Paso 3: Generar Hash de Contraseña

```bash
cd backend

# Instalar dependencias si no lo has hecho
npm install

# Generar hash
node generate-hash.js

# Copiar el hash generado
```

## 📝 Paso 4: Insertar Datos Iniciales

1. Abrir `backend/seed-data.sql`
2. Reemplazar `$2a$10$YourHashedPasswordHere123456789012345678901234567890` con el hash generado
3. Ejecutar el script en pgAdmin o terminal:

```bash
psql -U postgres -h localhost -p 5555 -d PickEm -f backend/seed-data.sql
```

## 🎯 Paso 5: Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# El archivo .env ya está configurado con:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5555/PickEm
# PORT=3001

# Iniciar backend
npm run dev
```

**Deberías ver:**
```
✓ Database connected successfully
✓ Server running on http://localhost:3001
✓ Environment: development
✓ Frontend URL: http://localhost:3000
```

## 🎨 Paso 6: Configurar Frontend

```bash
# En otra terminal, en raíz del proyecto
npm install

# El archivo .env.local ya está configurado con:
# VITE_API_URL=http://localhost:3001/api

# Iniciar frontend
npm run dev
```

**Deberías ver:**
```
✓ Local: http://localhost:3000
```

## 🔑 Paso 7: Acceder al Sistema

1. Abrir http://localhost:3000
2. Login con:
   - **Usuario**: SOP
   - **Contraseña**: Admin123!

## ✅ Verificación

### Health Check Backend
```bash
curl http://localhost:3001/api/health
# Respuesta: {"status":"ok","timestamp":"..."}
```

### Test Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"SOP","password":"Admin123!"}'
```

### Ver BD en pgAdmin
1. Abrir pgAdmin
2. Conectar a `localhost:5555`
3. Seleccionar BD `PickEm`
4. Expandir "Schemas" → "public" → "Tables"
5. Ver todas las tablas creadas

## 🐛 Troubleshooting

### Error: "connect ECONNREFUSED 127.0.0.1:5555"
```
❌ PostgreSQL no está corriendo en puerto 5555

✅ Soluciones:
1. Verificar que PostgreSQL esté instalado
2. Iniciar PostgreSQL en puerto 5555
3. Verificar DATABASE_URL en backend/.env
```

### Error: "database PickEm does not exist"
```
❌ BD no fue creada

✅ Soluciones:
1. Crear BD: CREATE DATABASE "PickEm";
2. Ejecutar setup-db.sql
3. Ejecutar seed-data.sql
```

### Error: "CORS error"
```
❌ Frontend no puede conectar a backend

✅ Soluciones:
1. Verificar backend está en puerto 3001
2. Verificar VITE_API_URL en .env.local
3. Reiniciar ambos servidores
```

### Error: "Invalid credentials"
```
❌ Usuario o contraseña incorrectos

✅ Soluciones:
1. Verificar usuario SOP existe en BD
2. Verificar hash de contraseña en seed-data.sql
3. Crear nuevo usuario en registro
```

## 📊 Estructura de Datos

### Usuario Admin
- **Username**: SOP
- **Password**: Admin123!
- **Role**: ADMIN

### Equipos (8 de ejemplo)
- Argentina (Grupo A)
- France (Grupo A)
- Germany (Grupo B)
- Brazil (Grupo B)
- Spain (Grupo C)
- England (Grupo C)
- Netherlands (Grupo D)
- Belgium (Grupo D)

### Partidos (2 de ejemplo)
- Argentina vs France (Grupos)
- Germany vs Brazil (Grupos)

### Preguntas Bonus (3 de ejemplo)
- ¿Cuál será el máximo goleador del torneo?
- ¿Cuál será el equipo con más goles?
- ¿Cuántos goles habrá en la final?

## 🎯 Funcionalidades Disponibles

- ✅ Login/Registro
- ✅ Dashboard con ranking
- ✅ Predicciones de partidos
- ✅ Preguntas bonus
- ✅ Estadísticas de usuario
- ✅ Leaderboard en tiempo real

## 📱 URLs Importantes

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health
- **pgAdmin**: http://localhost:5050 (si está instalado)

## 🔄 Flujo de Datos

```
Frontend (React)
    ↓
axios request con JWT
    ↓
Backend (Express)
    ↓
Middleware: Validar JWT
    ↓
Controller → Service → Prisma
    ↓
PostgreSQL (PickEm)
    ↓
Response JSON
    ↓
Frontend actualiza estado
```

## 📝 Comandos Útiles

### Backend
```bash
cd backend

# Desarrollo
npm run dev

# Build
npm run build

# Producción
npm run start

# Ver BD en UI
npm run prisma:studio
```

### Frontend
```bash
# Desarrollo
npm run dev

# Build
npm run build

# Preview
npm run preview
```

### PostgreSQL
```bash
# Conectar a BD
psql -U postgres -h localhost -p 5555 -d PickEm

# Listar tablas
\dt

# Ver esquema de tabla
\d "User"

# Salir
\q
```

## ✨ Próximos Pasos

1. ✅ Crear BD PickEm
2. ✅ Crear tablas
3. ✅ Insertar datos iniciales
4. ✅ Iniciar backend
5. ✅ Iniciar frontend
6. ⏭️ Crear más usuarios
7. ⏭️ Crear más partidos
8. ⏭️ Hacer predicciones
9. ⏭️ Probar sistema de puntuación

## 🎉 ¡Listo!

El sistema está completamente funcional y listo para usar localmente.

**Tiempo estimado**: 15-20 minutos

**Versión**: 1.0.0  
**Fecha**: 2026-05-20  
**Estado**: ✅ Listo para ejecutar
