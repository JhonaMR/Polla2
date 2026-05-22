-- Conectar a la BD PickEm
\c "PickEm"

-- Insertar usuario admin (contraseña: 2114 hasheada con bcrypt)
-- Hash: $2a$10$/C.D60LfwB0PzBoWdaC6xeHKot1IWvA80xide4vFzn5gPo6uXzjRy (2114)
INSERT INTO "User" ("uid", "username", "displayName", "passwordHash", "role", "points", "isActive", "createdAt", "updatedAt")
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'SOP',
  'SOPORTE',
  '$2a$10$/C.D60LfwB0PzBoWdaC6xeHKot1IWvA80xide4vFzn5gPo6uXzjRy',
  'ADMIN',
  0,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT ("username") DO NOTHING;

-- Insertar equipos
INSERT INTO "Team" ("externalId", "name", "region", "groupLetter", "createdAt", "updatedAt") VALUES
('team-arg', 'Argentina', 'South America', 'A', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('team-fra', 'France', 'Europe', 'A', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('team-ger', 'Germany', 'Europe', 'B', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('team-bra', 'Brazil', 'South America', 'B', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('team-esp', 'Spain', 'Europe', 'C', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('team-eng', 'England', 'Europe', 'C', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('team-ned', 'Netherlands', 'Europe', 'D', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('team-bel', 'Belgium', 'Europe', 'D', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("externalId") DO NOTHING;

-- Insertar partidos de ejemplo
INSERT INTO "Match" ("externalId", "phase", "teamAId", "teamBId", "matchDate", "matchNumber", "status", "createdAt", "updatedAt")
SELECT 
  'match-1',
  'GROUPS',
  (SELECT "id" FROM "Team" WHERE "externalId" = 'team-arg'),
  (SELECT "id" FROM "Team" WHERE "externalId" = 'team-fra'),
  '2026-06-15 20:00:00',
  1,
  'PENDING',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Match" WHERE "externalId" = 'match-1');

INSERT INTO "Match" ("externalId", "phase", "teamAId", "teamBId", "matchDate", "matchNumber", "status", "createdAt", "updatedAt")
SELECT 
  'match-2',
  'GROUPS',
  (SELECT "id" FROM "Team" WHERE "externalId" = 'team-ger'),
  (SELECT "id" FROM "Team" WHERE "externalId" = 'team-bra'),
  '2026-06-16 20:00:00',
  2,
  'PENDING',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Match" WHERE "externalId" = 'match-2');

-- Insertar preguntas bonus
INSERT INTO "BonusQuestion" ("question", "correctAnswer", "category", "isActive", "createdAt", "updatedAt") VALUES
('¿Cuál será el máximo goleador del torneo?', 'Mbappé', 'Top Scorer', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('¿Cuál será el equipo con más goles?', 'Argentina', 'Team Stats', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('¿Cuántos goles habrá en la final?', '3', 'Final Stats', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
