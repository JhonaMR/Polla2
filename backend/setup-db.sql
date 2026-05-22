-- =========================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS Y TABLAS: PickEm
-- =========================================================

-- Este script inicializa todo el esquema de la base de datos.
-- Elimina las tablas y enums existentes para realizar una instalación limpia.

-- 1. ELIMINACIÓN DE TABLAS Y TIPOS EXISTENTES
DROP TABLE IF EXISTS "AuditLog" CASCADE;
DROP TABLE IF EXISTS "RefreshToken" CASCADE;
DROP TABLE IF EXISTS "BonusPrediction" CASCADE;
DROP TABLE IF EXISTS "BonusQuestion" CASCADE;
DROP TABLE IF EXISTS "Prediction" CASCADE;
DROP TABLE IF EXISTS "PhaseConfiguration" CASCADE;
DROP TABLE IF EXISTS "Match" CASCADE;
DROP TABLE IF EXISTS "Team" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Puntos" CASCADE;

DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "MatchPhase" CASCADE;
DROP TYPE IF EXISTS "MatchStatus" CASCADE;
DROP TYPE IF EXISTS "PhaseStatus" CASCADE;

-- 2. CREACIÓN DE ENUMS (CREATE TYPE)
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');
CREATE TYPE "MatchPhase" AS ENUM ('GROUPS', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTERFINALS', 'SEMIFINALS', 'THIRD_PLACE', 'FINAL');
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'FINISHED');
CREATE TYPE "PhaseStatus" AS ENUM ('LOCKED', 'OPEN_FOR_PREDICTIONS', 'LIVE', 'FINISHED');

-- 3. FUNCIÓN AUXILIAR PARA ACTUALIZAR TIMESTAMP "updatedAt"
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==========================================
-- 4. CREACIÓN DE TABLAS
-- ==========================================

-- Tabla: User
CREATE TABLE "User" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "uid" VARCHAR(255) NOT NULL UNIQUE,
    "username" VARCHAR(255) NOT NULL UNIQUE,
    "displayName" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "points" INTEGER NOT NULL DEFAULT 0,
    "position" VARCHAR(100),
    "photoUrl" VARCHAR(500),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3)
);

-- Tabla: Team
CREATE TABLE "Team" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "externalId" VARCHAR(100) NOT NULL UNIQUE,
    "name" VARCHAR(255) NOT NULL,
    "region" VARCHAR(100) NOT NULL,
    "groupLetter" CHAR(1) NOT NULL,
    "logoUrl" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Match
CREATE TABLE "Match" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "externalId" VARCHAR(100) NOT NULL UNIQUE,
    "phase" "MatchPhase" NOT NULL,
    "teamAId" INTEGER,
    "teamBId" INTEGER,
    "scoreA" INTEGER,
    "scoreB" INTEGER,
    "status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
    "matchDate" TIMESTAMP(3) NOT NULL,
    "matchNumber" INTEGER NOT NULL,
    "winnerTeamId" INTEGER,
    "loserTeamId" INTEGER,
    "nextMatchId" INTEGER,
    "nextMatchSlot" VARCHAR(50),
    "isManualOverride" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Match_teamAId_fkey" FOREIGN KEY ("teamAId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_teamBId_fkey" FOREIGN KEY ("teamBId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_winnerTeamId_fkey" FOREIGN KEY ("winnerTeamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_loserTeamId_fkey" FOREIGN KEY ("loserTeamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_nextMatchId_fkey" FOREIGN KEY ("nextMatchId") REFERENCES "Match" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla: PhaseConfiguration
CREATE TABLE "PhaseConfiguration" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "phase" "MatchPhase" NOT NULL UNIQUE,
    "status" "PhaseStatus" NOT NULL DEFAULT 'LOCKED',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Prediction
CREATE TABLE "Prediction" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "matchId" INTEGER NOT NULL,
    "predictedScoreA" INTEGER NOT NULL,
    "predictedScoreB" INTEGER NOT NULL,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Prediction_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: BonusQuestion
CREATE TABLE "BonusQuestion" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "correctAnswer" VARCHAR(500),
    "category" VARCHAR(100),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: BonusPrediction
CREATE TABLE "BonusPrediction" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "selectedAnswer" VARCHAR(500) NOT NULL,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "BonusPrediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BonusPrediction_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "BonusQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: RefreshToken
CREATE TABLE "RefreshToken" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "token" VARCHAR(500) NOT NULL UNIQUE,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: AuditLog
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "userId" INTEGER,
    "action" VARCHAR(100) NOT NULL,
    "entityType" VARCHAR(100),
    "entityId" INTEGER,
    "changes" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla: Puntos
CREATE TABLE "Puntos" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "acierto" INTEGER NOT NULL DEFAULT 5,
    "aciertoCompleto" INTEGER NOT NULL DEFAULT 7,
    "pregunta" INTEGER NOT NULL DEFAULT 20,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 5. CREACIÓN DE ÍNDICES REQUERIDOS
-- ==========================================

-- Índices: User
CREATE INDEX "User_username_idx" ON "User"("username");
CREATE INDEX "User_uid_idx" ON "User"("uid");

-- Índices: Team
CREATE INDEX "Team_region_idx" ON "Team"("region");
CREATE INDEX "Team_groupLetter_idx" ON "Team"("groupLetter");

-- Índices: Match
CREATE INDEX "Match_phase_idx" ON "Match"("phase");
CREATE INDEX "Match_status_idx" ON "Match"("status");
CREATE INDEX "Match_matchDate_idx" ON "Match"("matchDate");
CREATE INDEX "Match_teamAId_idx" ON "Match"("teamAId");
CREATE INDEX "Match_teamBId_idx" ON "Match"("teamBId");
CREATE INDEX "Match_nextMatchId_idx" ON "Match"("nextMatchId");
CREATE INDEX "Match_isManualOverride_idx" ON "Match"("isManualOverride");

-- Índices y Restricciones Únicas: Prediction
CREATE UNIQUE INDEX "Prediction_userId_matchId_key" ON "Prediction"("userId", "matchId");
CREATE INDEX "Prediction_userId_idx" ON "Prediction"("userId");
CREATE INDEX "Prediction_matchId_idx" ON "Prediction"("matchId");

-- Índices: BonusQuestion
CREATE INDEX "BonusQuestion_isActive_idx" ON "BonusQuestion"("isActive");

-- Índices y Restricciones Únicas: BonusPrediction
CREATE UNIQUE INDEX "BonusPrediction_userId_questionId_key" ON "BonusPrediction"("userId", "questionId");
CREATE INDEX "BonusPrediction_userId_idx" ON "BonusPrediction"("userId");
CREATE INDEX "BonusPrediction_questionId_idx" ON "BonusPrediction"("questionId");

-- Índices: RefreshToken
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

-- Índices: AuditLog
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- ==========================================
-- 6. CREACIÓN DE DISPARADORES (TRIGGERS) PARA MODTIME
-- ==========================================

CREATE TRIGGER update_user_modtime BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_team_modtime BEFORE UPDATE ON "Team" FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_match_modtime BEFORE UPDATE ON "Match" FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_phase_config_modtime BEFORE UPDATE ON "PhaseConfiguration" FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_prediction_modtime BEFORE UPDATE ON "Prediction" FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_bonus_question_modtime BEFORE UPDATE ON "BonusQuestion" FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_bonus_prediction_modtime BEFORE UPDATE ON "BonusPrediction" FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_puntos_modtime BEFORE UPDATE ON "Puntos" FOR EACH ROW EXECUTE FUNCTION update_modified_column();
