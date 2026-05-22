# Guía de Instalación Rápida

## ⚡ Setup en 10 Minutos

### Paso 1: Preparar PostgreSQL

```bash
# Windows (si tienes PostgreSQL instalado)
# Abrir pgAdmin o usar psql

# Crear base de datos
createdb polla_db

# O en pgAdmin:
# 1. Click derecho en "Databases"
# 2. Create > Database
# 3. Nombre: polla_db
```

### Paso 2: Configurar Backend

```bash
# Navegar a carpeta backend
cd backend

# Instalar dependencias
npm install

# Crear archivo .env
copy .env.example .env

# Editar .env (cambiar DATABASE_URL si es necesario)
# DATABASE_URL=postgresql://postgres:password@localhost:5432/polla_db
```

### Paso 3: Ejecutar Migraciones

```bash
# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Seed de datos iniciales
npm run seed
```

### Paso 4: Iniciar Backend

```bash
# Terminal 1 - Backend
npm run dev

# Deberías ver:
# ✓ Database connected successfully
# ✓ Server running on http://localhost:3001
```

### Paso 5: Configurar Frontend

```bash
# Terminal 2 - Frontend (en raíz del proyecto)
npm install

# Crear .env.local
echo REACT_APP_API_URL=http://localhost:3001/api > .env.local

# Iniciar frontend
npm run dev

# Deberías ver:
# ✓ Local: http://localhost:3000
```

### Paso 6: Probar Login

1. Abrir http://localhost:3000
2. Login con:
   - **Username**: SOP
   - **Password**: Admin123!

---

## 🔧 Troubleshooting Rápido

### Error: "connect ECONNREFUSED"
```
❌ Error: connect ECONNREFUSED 127.0.0.1:5432

✅ Solución:
1. Verificar que PostgreSQL esté corriendo
2. Verificar DATABASE_URL en .env
3. Crear la BD: createdb polla_db
```

### Error: "CORS error"
```
❌ Error: Access to XMLHttpRequest blocked by CORS

✅ Solución:
1. Verificar que backend esté corriendo en puerto 3001
2. Verificar FRONTEND_URL en backend/.env
3. Reiniciar backend
```

### Error: "Migration failed"
```
❌ Error: Migration failed

✅ Solución:
1. Eliminar BD: dropdb polla_db
2. Crear BD: createdb polla_db
3. Ejecutar migraciones: npm run prisma:migrate
```

### Error: "Invalid token"
```
❌ Error: Invalid or expired token

✅ Solución:
1. Limpiar localStorage en navegador
2. Hacer logout y login nuevamente
3. Verificar JWT_SECRET en .env
```

---

## 📋 Checklist de Verificación

### Backend
- [ ] PostgreSQL corriendo
- [ ] BD `polla_db` creada
- [ ] `npm install` completado
- [ ] `.env` configurado
- [ ] Migraciones ejecutadas
- [ ] Seed ejecutado
- [ ] `npm run dev` corriendo en puerto 3001
- [ ] `GET http://localhost:3001/api/health` retorna 200

### Frontend
- [ ] `npm install` completado
- [ ] `.env.local` configurado
- [ ] `npm run dev` corriendo en puerto 3000
- [ ] Página de login visible
- [ ] Login con SOP/Admin123! funciona

---

## 🧪 Pruebas Rápidas

### Test 1: Health Check
```bash
curl http://localhost:3001/api/health
# Respuesta esperada: {"status":"ok","timestamp":"..."}
```

### Test 2: Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"SOP","password":"Admin123!"}'

# Respuesta esperada: token de acceso y refresh
```

### Test 3: Obtener Perfil
```bash
# Reemplazar YOUR_TOKEN con el token del login anterior
curl -X GET http://localhost:3001/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Respuesta esperada: datos del usuario SOP
```

---

## 📁 Estructura de Carpetas Esperada

```
Polla/
├── src/                          # Frontend React
│   ├── components/
│   ├── lib/
│   ├── App.tsx
│   └── main.tsx
├── backend/                      # Backend Node.js
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   ├── .env
│   └── .env.example
├── ARQUITECTURA_BACKEND.md
├── INTEGRACION_FRONTEND_BACKEND.md
├── RESUMEN_EJECUTIVO.md
├── GUIA_INSTALACION_RAPIDA.md
├── package.json
└── README.md
```

---

## 🚀 Comandos Útiles

### Backend
```bash
# Desarrollo
npm run dev

# Build
npm run build

# Producción
npm run start

# Ver BD en UI
npm run prisma:studio

# Ejecutar migraciones
npm run prisma:migrate

# Seed de datos
npm run seed

# Verificar tipos
npm run lint
```

### Frontend
```bash
# Desarrollo
npm run dev

# Build
npm run build

# Preview
npm run preview

# Lint
npm run lint
```

### PostgreSQL (Windows)
```bash
# Conectar a BD
psql -U postgres -d polla_db

# Listar tablas
\dt

# Ver esquema de tabla
\d users

# Salir
\q
```

---

## 📊 Datos de Prueba

### Usuario Admin
- **Username**: SOP
- **Password**: Admin123!
- **Email**: soporte@polla.local
- **Role**: ADMIN

### Equipos de Ejemplo
- Argentina (Grupo A)
- France (Grupo A)
- Germany (Grupo B)
- Brazil (Grupo B)
- Spain (Grupo C)
- England (Grupo C)
- Netherlands (Grupo D)
- Belgium (Grupo D)

### Preguntas Bonus de Ejemplo
1. ¿Cuál será el máximo goleador del torneo?
2. ¿Cuál será el equipo con más goles?
3. ¿Cuántos goles habrá en la final?

---

## 🔐 Seguridad Básica

### Cambiar Contraseña Admin
```bash
# En backend, ejecutar:
npm run prisma:studio

# Buscar usuario SOP
# Cambiar passwordHash (requiere hash con bcrypt)
```

### Cambiar JWT_SECRET
```bash
# En backend/.env
JWT_SECRET=your-new-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-new-refresh-secret-min-32-chars

# Reiniciar backend
```

---

## 📞 Soporte Rápido

### Problema: No puedo conectar a BD
```
1. Verificar PostgreSQL está corriendo
2. Verificar DATABASE_URL en .env
3. Ejecutar: createdb polla_db
4. Ejecutar: npm run prisma:migrate
```

### Problema: Frontend no conecta a backend
```
1. Verificar backend está corriendo en puerto 3001
2. Verificar REACT_APP_API_URL en .env.local
3. Verificar FRONTEND_URL en backend/.env
4. Limpiar cache del navegador
```

### Problema: Login no funciona
```
1. Verificar usuario SOP existe: npm run prisma:studio
2. Verificar contraseña es Admin123!
3. Verificar JWT_SECRET en backend/.env
4. Reiniciar backend
```

---

## ✅ Verificación Final

Cuando todo esté funcionando, deberías poder:

1. ✅ Acceder a http://localhost:3000
2. ✅ Ver página de login
3. ✅ Login con SOP/Admin123!
4. ✅ Ver dashboard con ranking
5. ✅ Ver predicciones
6. ✅ Ver preguntas bonus
7. ✅ Ver panel de admin

---

## 🎉 ¡Listo!

Si llegaste aquí, tu sistema está completamente funcional. 

**Próximos pasos**:
1. Crear más usuarios de prueba
2. Crear partidos de prueba
3. Hacer predicciones
4. Probar sistema de puntuación
5. Explorar panel de admin

---

**Versión**: 1.0.0  
**Última actualización**: 2026-05-20  
**Estado**: ✅ Listo para usar
