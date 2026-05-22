# Polla Backend API

Backend API para FIFA Corporate World Cup Pool - Sistema de predicciones de fútbol con autenticación JWT y base de datos PostgreSQL.

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js 18+
- PostgreSQL 12+
- npm o yarn

### Instalación

1. **Clonar el repositorio**
```bash
cd backend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` con tus valores:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/polla_db
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

4. **Crear base de datos PostgreSQL**
```bash
createdb polla_db
```

5. **Ejecutar migraciones de Prisma**
```bash
npm run prisma:migrate
```

6. **Seed de datos iniciales (opcional)**
```bash
npm run seed
```

7. **Iniciar servidor en desarrollo**
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3001`

## 📦 Scripts Disponibles

```bash
npm run dev              # Iniciar servidor en modo desarrollo
npm run build            # Compilar TypeScript
npm run start            # Iniciar servidor compilado
npm run prisma:generate  # Generar cliente Prisma
npm run prisma:migrate   # Ejecutar migraciones
npm run prisma:studio    # Abrir Prisma Studio
npm run lint             # Verificar tipos TypeScript
npm run seed             # Seed de datos iniciales
```

## 🏗️ Estructura del Proyecto

```
backend/
├── src/
│   ├── config/           # Configuración (DB, JWT, env)
│   ├── middleware/       # Middleware (auth, error, validation)
│   ├── routes/           # Rutas de API
│   ├── controllers/      # Controladores
│   ├── services/         # Lógica de negocio
│   ├── utils/            # Utilidades (JWT, password, validators)
│   ├── scripts/          # Scripts (seed)
│   └── server.ts         # Punto de entrada
├── prisma/
│   └── schema.prisma     # Esquema de BD
├── .env.example          # Variables de entorno ejemplo
├── package.json
├── tsconfig.json
└── README.md
```

## 🔐 Autenticación JWT

### Flujo de Login

```
POST /api/auth/login
{
  "username": "SOP",
  "password": "Admin123!"
}

Response:
{
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Usar Token en Requests

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3001/api/users/me
```

### Refrescar Token

```
POST /api/auth/refresh
{
  "refreshToken": "eyJhbGc..."
}

Response:
{
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGc..."
  }
}
```

## 📡 Endpoints Principales

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refrescar token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify` - Verificar token

### Usuarios
- `GET /api/users/me` - Obtener perfil actual
- `GET /api/users/profile/:userId` - Obtener perfil de usuario
- `GET /api/users/leaderboard` - Obtener ranking
- `PUT /api/users/profile` - Actualizar perfil
- `GET /api/users/stats` - Obtener estadísticas

### Predicciones
- `POST /api/predictions` - Crear predicción
- `PUT /api/predictions/:id` - Actualizar predicción
- `GET /api/predictions/user/:userId` - Obtener predicciones del usuario
- `GET /api/predictions/match/:matchId` - Obtener predicciones del partido
- `GET /api/predictions/user/:userId/stats` - Obtener estadísticas de predicciones

## 🧪 Testing de Endpoints

### Registrar Usuario
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "testuser",
    "displayName": "Test User",
    "password": "Password123!"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "SOP",
    "password": "Admin123!"
  }'
```

### Obtener Perfil
```bash
curl -X GET http://localhost:3001/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Crear Predicción
```bash
curl -X POST http://localhost:3001/api/predictions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": 1,
    "predictedScoreA": 2,
    "predictedScoreB": 1
  }'
```

## 🗄️ Base de Datos

### Tablas Principales
- `users` - Usuarios del sistema
- `teams` - Equipos de fútbol
- `matches` - Partidos
- `predictions` - Predicciones de usuarios
- `bonus_questions` - Preguntas bonus
- `bonus_predictions` - Respuestas a preguntas bonus
- `refresh_tokens` - Tokens de refresco
- `audit_logs` - Registro de auditoría

### Ver Esquema
```bash
npm run prisma:studio
```

## 🔒 Seguridad

### Implementado
- ✅ Contraseñas hasheadas con bcrypt
- ✅ JWT con expiración
- ✅ Refresh tokens revocables
- ✅ Rate limiting
- ✅ CORS configurado
- ✅ Helmet para headers de seguridad
- ✅ Validación de entrada
- ✅ Auditoría de acciones

### Mejores Prácticas
- Nunca compartir JWT_SECRET
- Usar HTTPS en producción
- Rotar secrets regularmente
- Monitorear audit logs
- Implementar 2FA para admin

## 📊 Scoring System

### Puntuación de Predicciones
- **Resultado exacto**: 10 puntos
- **Ganador correcto**: 5 puntos
- **Incorrecto**: 0 puntos

### Preguntas Bonus
- **Respuesta correcta**: 5 puntos
- **Respuesta incorrecta**: 0 puntos

## 🚀 Deployment

### Producción
```bash
npm run build
npm run start
```

### Variables de Entorno Producción
```env
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:prod_password@prod_host:5432/polla_db
JWT_SECRET=your-production-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-production-refresh-secret-min-32-chars
FRONTEND_URL=https://yourdomain.com
```

## 📝 Logs

Los logs se guardan en la consola. Para producción, considerar:
- Winston para logging
- Sentry para error tracking
- DataDog para monitoring

## 🤝 Contribuir

1. Crear rama feature: `git checkout -b feature/nueva-feature`
2. Commit cambios: `git commit -am 'Add nueva feature'`
3. Push a rama: `git push origin feature/nueva-feature`
4. Crear Pull Request

## 📄 Licencia

MIT

## 📞 Soporte

Para soporte, contactar a: soporte@polla.local

## 🔗 Enlaces Útiles

- [Express.js Documentation](https://expressjs.com/)
- [Prisma ORM](https://www.prisma.io/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
