# 🚀 Inicio Rápido - Sistema Integrado

## ✅ Cambios Realizados

### Backend
- ✅ Removido campo `email` del esquema
- ✅ Actualizado a solo: `username`, `displayName`, `password`, `role`
- ✅ Actualizado AuthService para usar solo username/password
- ✅ Actualizado validadores
- ✅ Actualizado JWT payload
- ✅ Actualizado script de seed

### Frontend
- ✅ Creado servicio API centralizado (`src/lib/api.ts`)
- ✅ Creado servicios de datos (`src/lib/services.ts`)
- ✅ Actualizado AuthContext para usar backend
- ✅ Actualizado componente Login
- ✅ Agregado axios a dependencias
- ✅ Creado `.env.local` con URL del API

---

## 📋 Pasos para Empezar

### 1️⃣ Instalar PostgreSQL (si no lo tienes)

**Windows**:
- Descargar desde: https://www.postgresql.org/download/windows/
- Instalar con contraseña para usuario `postgres`
- Recordar el puerto (por defecto 5432)

### 2️⃣ Crear Base de Datos

```bash
# Abrir pgAdmin o usar psql
createdb polla_db
```

### 3️⃣ Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Crear archivo .env (ya existe .env.example)
# Editar .env si es necesario:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/polla_db

# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Seed de datos iniciales
npm run seed
```

### 4️⃣ Iniciar Backend

```bash
# En carpeta backend
npm run dev

# Deberías ver:
# ✓ Database connected successfully
# ✓ Server running on http://localhost:3001
```

### 5️⃣ Instalar Frontend

```bash
# En raíz del proyecto (otra terminal)
npm install

# Instalar axios
npm install axios
```

### 6️⃣ Iniciar Frontend

```bash
# En raíz del proyecto
npm run dev

# Deberías ver:
# ✓ Local: http://localhost:3000
```

### 7️⃣ Probar Login

1. Abrir http://localhost:3000
2. Login con:
   - **Usuario**: SOP
   - **Contraseña**: Admin123!

---

## 🧪 Verificación Rápida

### Backend Health Check
```bash
curl http://localhost:3001/api/health
# Respuesta: {"status":"ok","timestamp":"..."}
```

### Test Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"SOP","password":"Admin123!"}'

# Respuesta: tokens y datos del usuario
```

### Test Perfil (con token)
```bash
# Reemplazar YOUR_TOKEN con el token del login
curl -X GET http://localhost:3001/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Respuesta: datos del usuario
```

---

## 📁 Estructura de Archivos Nuevos

```
Polla/
├── src/
│   ├── lib/
│   │   ├── api.ts              ✨ NUEVO - Cliente API
│   │   ├── services.ts         ✨ NUEVO - Servicios de datos
│   │   ├── AuthContext.tsx     ✏️ ACTUALIZADO
│   │   └── ...
│   ├── components/
│   │   ├── Login.tsx           ✏️ ACTUALIZADO
│   │   └── ...
│   └── ...
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/           ✏️ ACTUALIZADO (sin email)
│   │   ├── utils/              ✏️ ACTUALIZADO
│   │   └── server.ts
│   ├── prisma/
│   │   └── schema.prisma       ✏️ ACTUALIZADO (sin email)
│   ├── .env.example
│   └── package.json
├── .env.local                  ✨ NUEVO
├── package.json                ✏️ ACTUALIZADO (axios)
└── ...
```

---

## 🔑 Credenciales de Prueba

### Usuario Admin
- **Username**: SOP
- **Password**: Admin123!

### Crear Nuevo Usuario
1. En login, click en "Registro"
2. Llenar:
   - Nombre: Tu nombre
   - Usuario: Tu usuario (mín 3 caracteres)
   - Contraseña: Mín 8 caracteres, mayúscula, minúscula, número, símbolo

---

## 🐛 Troubleshooting

### Error: "connect ECONNREFUSED"
```
❌ PostgreSQL no está corriendo

✅ Soluciones:
1. Iniciar PostgreSQL
2. Verificar DATABASE_URL en backend/.env
3. Crear BD: createdb polla_db
```

### Error: "CORS error"
```
❌ Frontend no puede conectar a backend

✅ Soluciones:
1. Verificar backend está en puerto 3001
2. Verificar VITE_API_URL en .env.local
3. Verificar FRONTEND_URL en backend/.env
4. Reiniciar ambos servidores
```

### Error: "Invalid credentials"
```
❌ Usuario o contraseña incorrectos

✅ Soluciones:
1. Verificar usuario existe: npm run prisma:studio
2. Verificar contraseña es correcta
3. Crear nuevo usuario en registro
```

### Error: "Migration failed"
```
❌ Migraciones no se ejecutaron

✅ Soluciones:
1. Eliminar BD: dropdb polla_db
2. Crear BD: createdb polla_db
3. Ejecutar: npm run prisma:migrate
4. Ejecutar: npm run seed
```

---

## 📊 Flujo de Datos

```
Frontend (React)
    ↓
axios request con token
    ↓
Backend (Express)
    ↓
Middleware: Validar JWT
    ↓
Controller → Service → Prisma
    ↓
PostgreSQL
    ↓
Response JSON
    ↓
Frontend actualiza estado
```

---

## 🎯 Próximos Pasos

1. ✅ Backend corriendo
2. ✅ Frontend corriendo
3. ✅ Login funcionando
4. ⏭️ Crear partidos de prueba
5. ⏭️ Hacer predicciones
6. ⏭️ Probar sistema de puntuación
7. ⏭️ Explorar panel de admin

---

## 📞 Comandos Útiles

### Backend
```bash
cd backend

# Desarrollo
npm run dev

# Ver BD en UI
npm run prisma:studio

# Ejecutar migraciones
npm run prisma:migrate

# Seed de datos
npm run seed

# Build
npm run build

# Producción
npm run start
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
psql -U postgres -d polla_db

# Listar tablas
\dt

# Ver esquema
\d users

# Salir
\q
```

---

## ✨ Características Implementadas

- ✅ Autenticación JWT sin email
- ✅ Contraseñas hasheadas con bcrypt
- ✅ Refresh tokens revocables
- ✅ Rate limiting
- ✅ CORS configurado
- ✅ Validación de entrada
- ✅ Manejo de errores
- ✅ Auditoría de acciones
- ✅ Integración frontend-backend
- ✅ Servicios de datos centralizados

---

## 🚀 ¡Listo para Empezar!

Sigue los pasos 1-7 y tendrás el sistema completamente funcional.

**Tiempo estimado**: 10-15 minutos

**Versión**: 1.0.0  
**Fecha**: 2026-05-20  
**Estado**: ✅ Listo para usar
