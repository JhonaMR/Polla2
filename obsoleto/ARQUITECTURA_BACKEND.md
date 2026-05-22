# Arquitectura Backend - FIFA Corporate World Cup Pool

## 📋 Análisis del Proyecto Actual

### Frontend (React + TypeScript)
- **Framework**: React 19 + Vite
- **Autenticación**: Firebase (actualmente) + LocalStorage
- **Estilos**: Tailwind CSS + Motion
- **Componentes principales**:
  - Dashboard: Panel principal con puntuaciones
  - Tournament: Gestión de partidos y predicciones
  - BonusQuestions: Preguntas bonus
  - RegionsView: Vista de regiones
  - AdminPanel: Panel de administración
  - Login: Autenticación

### Tipos de Datos Principales
```typescript
- UserProfile: uid, email, displayName, username, role, points
- Team: id, name, region, group, logoUrl
- Match: id, phase, teamA/B, scores, status, date
- Prediction: id, userId, matchId, predictedScores, pointsEarned
- BonusQuestion: id, question, correctAnswer
- BonusPrediction: id, userId, questionId, selectedAnswer, pointsEarned
```

---

## 🏗️ Arquitectura Backend Propuesta

### Stack Tecnológico
- **Runtime**: Node.js + Express.js
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT (JSON Web Tokens)
- **Validación**: Joi/Zod
- **ORM**: Prisma o TypeORM
- **Seguridad**: bcrypt, helmet, cors, rate-limiting

### Estructura de Carpetas
```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── jwt.ts
│   │   └── env.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── validation.ts
│   │   └── rateLimit.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── teams.ts
│   │   ├── matches.ts
│   │   ├── predictions.ts
│   │   ├── bonusQuestions.ts
│   │   └── admin.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── userController.ts
│   │   ├── teamController.ts
│   │   ├── matchController.ts
│   │   ├── predictionController.ts
│   │   ├── bonusController.ts
│   │   └── adminController.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── userService.ts
│   │   ├── matchService.ts
│   │   ├── predictionService.ts
│   │   └── scoringService.ts
│   ├── models/
│   │   └── (Prisma schemas)
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   └── validators.ts
│   └── server.ts
├── prisma/
│   └── schema.prisma
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🗄️ Esquema de Base de Datos PostgreSQL

### Tablas Principales

#### 1. **users**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  points INTEGER DEFAULT 0,
  position VARCHAR(100),
  photo_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_uid ON users(uid);
```

#### 2. **teams**
```sql
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  region VARCHAR(100) NOT NULL,
  group_letter VARCHAR(1) NOT NULL CHECK (group_letter >= 'A' AND group_letter <= 'L'),
  logo_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teams_region ON teams(region);
CREATE INDEX idx_teams_group ON teams(group_letter);
```

#### 3. **matches**
```sql
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(100) UNIQUE NOT NULL,
  phase VARCHAR(50) NOT NULL CHECK (phase IN ('groups', 'roundOf16', 'quarterfinals', 'semifinals', 'final')),
  team_a_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  team_b_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  score_a INTEGER,
  score_b INTEGER,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'finished')),
  match_date TIMESTAMP NOT NULL,
  match_number INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_matches_phase ON matches(phase);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_team_a ON matches(team_a_id);
CREATE INDEX idx_matches_team_b ON matches(team_b_id);
```

#### 4. **predictions**
```sql
CREATE TABLE predictions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  predicted_score_a INTEGER NOT NULL,
  predicted_score_b INTEGER NOT NULL,
  points_earned INTEGER DEFAULT 0,
  is_correct BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, match_id)
);

CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_predictions_match ON predictions(match_id);
CREATE INDEX idx_predictions_user_match ON predictions(user_id, match_id);
```

#### 5. **bonus_questions**
```sql
CREATE TABLE bonus_questions (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  correct_answer VARCHAR(500) NOT NULL,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bonus_questions_active ON bonus_questions(is_active);
```

#### 6. **bonus_predictions**
```sql
CREATE TABLE bonus_predictions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES bonus_questions(id) ON DELETE CASCADE,
  selected_answer VARCHAR(500) NOT NULL,
  points_earned INTEGER DEFAULT 0,
  is_correct BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, question_id)
);

CREATE INDEX idx_bonus_predictions_user ON bonus_predictions(user_id);
CREATE INDEX idx_bonus_predictions_question ON bonus_predictions(question_id);
```

#### 7. **refresh_tokens**
```sql
CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked BOOLEAN DEFAULT false
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
```

#### 8. **audit_logs**
```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INTEGER,
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

---

## 🔐 Sistema de Autenticación JWT

### Flujo de Autenticación

```
1. Usuario envía credenciales (username/email + password)
   ↓
2. Backend valida credenciales contra BD
   ↓
3. Si válido, genera:
   - Access Token (JWT, 15 minutos)
   - Refresh Token (almacenado en BD, 7 días)
   ↓
4. Cliente almacena tokens en localStorage/sessionStorage
   ↓
5. Cada request incluye Access Token en header Authorization
   ↓
6. Middleware valida token
   ↓
7. Si token expirado, cliente usa Refresh Token para obtener nuevo Access Token
```

### Estructura JWT

**Access Token Payload:**
```json
{
  "sub": "user_id",
  "username": "username",
  "role": "user",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Refresh Token Payload:**
```json
{
  "sub": "user_id",
  "type": "refresh",
  "iat": 1234567890,
  "exp": 1234654290
}
```

---

## 📡 API Endpoints

### Autenticación

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
POST   /api/auth/verify
```

### Usuarios

```
GET    /api/users/me
GET    /api/users/profile/:userId
GET    /api/users/leaderboard
PUT    /api/users/profile
GET    /api/users/stats
```

### Equipos

```
GET    /api/teams
GET    /api/teams/:id
GET    /api/teams/region/:region
GET    /api/teams/group/:group
```

### Partidos

```
GET    /api/matches
GET    /api/matches/:id
GET    /api/matches/phase/:phase
GET    /api/matches/upcoming
GET    /api/matches/finished
```

### Predicciones

```
POST   /api/predictions
GET    /api/predictions/user/:userId
GET    /api/predictions/match/:matchId
PUT    /api/predictions/:id
GET    /api/predictions/user/:userId/stats
```

### Preguntas Bonus

```
GET    /api/bonus-questions
GET    /api/bonus-questions/:id
POST   /api/bonus-predictions
GET    /api/bonus-predictions/user/:userId
PUT    /api/bonus-predictions/:id
```

### Admin

```
POST   /api/admin/matches
PUT    /api/admin/matches/:id
POST   /api/admin/bonus-questions
PUT    /api/admin/bonus-questions/:id
DELETE /api/admin/bonus-questions/:id
POST   /api/admin/calculate-scores
GET    /api/admin/audit-logs
GET    /api/admin/users
PUT    /api/admin/users/:id/role
```

---

## 🔒 Seguridad

### Medidas Implementadas

1. **Contraseñas**
   - Hash con bcrypt (salt rounds: 10)
   - Validación de fortaleza
   - Nunca se almacenan en texto plano

2. **JWT**
   - Tokens firmados con HS256
   - Expiración corta para Access Token
   - Refresh Token almacenado en BD (revocable)

3. **Middleware**
   - Validación de JWT en cada request protegido
   - Rate limiting (100 requests/15 min por IP)
   - CORS configurado
   - Helmet para headers de seguridad

4. **Validación**
   - Validación de entrada en todos los endpoints
   - Sanitización de datos
   - Prevención de SQL injection (ORM)

5. **Auditoría**
   - Registro de acciones importantes
   - IP y User-Agent capturados
   - Cambios registrados en JSONB

---

## 📦 Dependencias Backend

```json
{
  "dependencies": {
    "express": "^4.21.2",
    "prisma": "^5.x.x",
    "@prisma/client": "^5.x.x",
    "jsonwebtoken": "^9.1.2",
    "bcryptjs": "^2.4.3",
    "joi": "^17.11.0",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.5",
    "dotenv": "^16.3.1",
    "pg": "^8.11.3",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.6",
    "@types/jsonwebtoken": "^9.0.7",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0",
    "ts-node": "^10.9.2"
  }
}
```

---

## 🚀 Configuración de Entorno

### .env.example
```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/polla_db

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Server
NODE_ENV=development
PORT=3001
API_URL=http://localhost:3001

# CORS
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🔄 Integración Frontend-Backend

### Cambios en Frontend

1. **AuthContext.tsx** - Actualizar para usar JWT
```typescript
// Cambiar de Firebase a API backend
const login = async (username: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const { accessToken, refreshToken } = await response.json();
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  // ... resto del código
};
```

2. **API Client** - Crear servicio centralizado
```typescript
// src/lib/api.ts
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Intentar refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      // ... lógica de refresh
    }
    return Promise.reject(error);
  }
);
```

---

## 📊 Scoring System

### Puntuación de Predicciones

```
Predicción correcta (resultado exacto): 10 puntos
Predicción correcta (ganador correcto): 5 puntos
Predicción incorrecta: 0 puntos

Bonus Questions:
Respuesta correcta: 5 puntos
Respuesta incorrecta: 0 puntos
```

### Cálculo Automático

```typescript
// Después de que un partido finaliza:
1. Obtener todas las predicciones del partido
2. Comparar con resultado real
3. Calcular puntos según reglas
4. Actualizar puntos del usuario
5. Registrar en audit_logs
```

---

## 🧪 Testing

### Endpoints a Probar

```bash
# Autenticación
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"Pass123!"}'

curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"Pass123!"}'

# Usuarios
curl -X GET http://localhost:3001/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Predicciones
curl -X POST http://localhost:3001/api/predictions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"matchId":1,"predictedScoreA":2,"predictedScoreB":1}'
```

---

## 📝 Próximos Pasos

1. ✅ Crear base de datos PostgreSQL
2. ✅ Configurar Prisma ORM
3. ✅ Implementar autenticación JWT
4. ✅ Crear controllers y services
5. ✅ Implementar validación
6. ✅ Agregar rate limiting y seguridad
7. ✅ Crear tests
8. ✅ Documentar API (Swagger/OpenAPI)
9. ✅ Desplegar en producción

---

## 📚 Referencias

- [Express.js Documentation](https://expressjs.com/)
- [Prisma ORM](https://www.prisma.io/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [OWASP Security Guidelines](https://owasp.org/)
