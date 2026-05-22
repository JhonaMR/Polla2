# Documento Técnico: Sistema de Mundial 2026 para Polla Mundialista
## Con Análisis de Cambios Necesarios

---

## 1. OBJETIVO DEL SISTEMA

El sistema debe permitir administrar y visualizar un Mundial 2026 completo con:

- Fase de grupos
- Clasificación automática
- Generación automática de llaves
- Eliminación directa
- Pronósticos de usuarios
- Administración manual de partidos
- Visualización dinámica tipo bracket

El sistema debe ser híbrido:

**AUTOMÁTICO + EDITABLE**

La lógica automática nunca debe impedir modificaciones manuales realizadas desde el módulo administrativo.

---

## 2. ESTRUCTURA DEL TORNEO

### Fase de grupos
- 12 grupos
- 4 equipos por grupo
- Cada grupo juega todos contra todos

### Clasifican:
- Primer lugar de cada grupo → 12 equipos
- Segundo lugar de cada grupo → 12 equipos
- Mejores 8 terceros → 8 equipos

### Total clasificados: 32 equipos

---

## 3. FASES DEL TORNEO

```
GROUPS
  ↓
ROUND_OF_32
  ↓
ROUND_OF_16
  ↓
QUARTERFINALS
  ↓
SEMIFINALS
  ↓
THIRD_PLACE
  ↓
FINAL
```

### ⚠️ CAMBIO NECESARIO #1: Agregar Fases Faltantes

**Estado Actual:**
```
enum MatchPhase {
  GROUPS
  ROUND_OF_16
  QUARTERFINALS
  SEMIFINALS
  FINAL
}
```

**Cambio Requerido:**
```
enum MatchPhase {
  GROUPS
  ROUND_OF_32        // ← NUEVO
  ROUND_OF_16
  QUARTERFINALS
  SEMIFINALS
  THIRD_PLACE        // ← NUEVO
  FINAL
}
```

**Ubicación:** `backend/prisma/schema.prisma`

---

## 4. CONCEPTO PRINCIPAL DEL SISTEMA

El sistema funciona como un:

**ÁRBOL DE PARTIDOS**

Cada partido alimenta automáticamente otro partido.

### Ejemplo:
```
Partido 49
  ↓ ganador
Partido 65
  ↓ ganador
Partido 73
  ↓ ganador
Semifinal
```

---

## 5. ESTRUCTURA DE DATOS REQUERIDA

### ⚠️ CAMBIO NECESARIO #2: Extender Modelo Match

**Estado Actual:**
```typescript
model Match {
  id          Int         @id @default(autoincrement())
  externalId  String      @unique
  phase       MatchPhase
  teamAId     Int
  teamBId     Int
  scoreA      Int?
  scoreB      Int?
  status      MatchStatus @default(PENDING)
  matchDate   DateTime
  matchNumber Int
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  teamA       Team        @relation("TeamA", fields: [teamAId], references: [id], onDelete: Cascade)
  teamB       Team        @relation("TeamB", fields: [teamBId], references: [id], onDelete: Cascade)
  predictions Prediction[]
}
```

**Cambio Requerido - Agregar Campos:**
```typescript
model Match {
  id                Int         @id @default(autoincrement())
  externalId        String      @unique
  phase             MatchPhase
  
  // Equipos - Ahora pueden ser NULL para brackets dinámicos
  teamAId           Int?
  teamBId           Int?
  
  scoreA            Int?
  scoreB            Int?
  status            MatchStatus @default(PENDING)
  matchDate         DateTime
  matchNumber       Int
  
  // ← NUEVOS CAMPOS PARA RELACIONES ENTRE PARTIDOS
  winnerTeamId      Int?                    // ID del equipo ganador
  loserTeamId       Int?                    // ID del equipo perdedor
  nextMatchId       Int?                    // ID del siguiente partido
  nextMatchSlot     String?                 // 'A' o 'B' (posición en siguiente partido)
  isManualOverride  Boolean     @default(false)  // Bloquea actualizaciones automáticas
  
  // Información adicional
  stadium           String?
  kickoff           DateTime?
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  // Relaciones
  teamA             Team?       @relation("TeamA", fields: [teamAId], references: [id], onDelete: SetNull)
  teamB             Team?       @relation("TeamB", fields: [teamBId], references: [id], onDelete: SetNull)
  
  // ← NUEVA RELACIÓN AUTO-REFERENCIAL
  nextMatch         Match?      @relation("MatchProgression", fields: [nextMatchId], references: [id], onDelete: SetNull)
  previousMatches   Match[]     @relation("MatchProgression")
  
  predictions       Prediction[]

  @@index([phase])
  @@index([status])
  @@index([matchDate])
  @@index([teamAId])
  @@index([teamBId])
  @@index([nextMatchId])
  @@index([isManualOverride])
}
```

**Ubicación:** `backend/prisma/schema.prisma`

**Migración SQL Requerida:**
```sql
-- Agregar columnas nuevas a tabla matches
ALTER TABLE "Match" ADD COLUMN "winnerTeamId" INTEGER;
ALTER TABLE "Match" ADD COLUMN "loserTeamId" INTEGER;
ALTER TABLE "Match" ADD COLUMN "nextMatchId" INTEGER;
ALTER TABLE "Match" ADD COLUMN "nextMatchSlot" VARCHAR(1);
ALTER TABLE "Match" ADD COLUMN "isManualOverride" BOOLEAN DEFAULT false;
ALTER TABLE "Match" ADD COLUMN "stadium" VARCHAR(255);
ALTER TABLE "Match" ADD COLUMN "kickoff" TIMESTAMP;

-- Hacer teamAId y teamBId opcionales
ALTER TABLE "Match" ALTER COLUMN "teamAId" DROP NOT NULL;
ALTER TABLE "Match" ALTER COLUMN "teamBId" DROP NOT NULL;

-- Agregar índices
CREATE INDEX "Match_nextMatchId_idx" ON "Match"("nextMatchId");
CREATE INDEX "Match_isManualOverride_idx" ON "Match"("isManualOverride");

-- Agregar constraint de clave foránea
ALTER TABLE "Match" ADD CONSTRAINT "Match_nextMatchId_fkey" 
  FOREIGN KEY ("nextMatchId") REFERENCES "Match"("id") ON DELETE SET NULL;
```

---

## 6. ENUM DE FASES

```typescript
enum MatchPhase {
  GROUPS,
  ROUND_OF_32,
  ROUND_OF_16,
  QUARTERFINALS,
  SEMIFINALS,
  THIRD_PLACE,
  FINAL
}
```

---

## 7. CLASIFICACIÓN DESDE GRUPOS

### Regla general

Después de finalizar todos los grupos:

1. Se calculan posiciones
2. Se ordenan terceros
3. Se seleccionan los mejores 8 terceros
4. Se generan automáticamente los cruces

### ⚠️ CAMBIO NECESARIO #3: Crear Servicio de Clasificación

**Nuevo archivo:** `backend/src/services/classificationService.ts`

```typescript
interface ClassificationResult {
  firstPlaces: Team[];      // 12 equipos
  secondPlaces: Team[];     // 12 equipos
  thirdPlaces: Team[];      // 8 mejores terceros
}

interface GroupStanding {
  team: Team;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: number;
}

export class ClassificationService {
  // Calcular posiciones de cada grupo
  async calculateGroupStandings(groupLetter: string): Promise<GroupStanding[]>
  
  // Obtener clasificados de todos los grupos
  async getQualifiedTeams(): Promise<ClassificationResult>
  
  // Seleccionar mejores 8 terceros
  async selectBestThirdPlaces(): Promise<Team[]>
}
```

---

## 8. GENERACIÓN AUTOMÁTICA DE CRUCES

El sistema debe:

1. Identificar clasificados
2. Generar emparejamientos
3. Llenar automáticamente los partidos
4. Mantener relaciones entre partidos

### ⚠️ CAMBIO NECESARIO #4: Crear Servicio de Generación de Brackets

**Nuevo archivo:** `backend/src/services/bracketService.ts`

```typescript
export class BracketService {
  // Generar todos los cruces desde Round of 32 hasta Final
  async generateBracket(): Promise<void>
  
  // Generar Round of 32 (16 partidos)
  private async generateRoundOf32(qualifiedTeams: Team[]): Promise<void>
  
  // Generar Round of 16 (8 partidos)
  private async generateRoundOf16(): Promise<void>
  
  // Generar Quarterfinals (4 partidos)
  private async generateQuarterfinals(): Promise<void>
  
  // Generar Semifinals (2 partidos) + Third Place
  private async generateSemifinals(): Promise<void>
  
  // Generar Final
  private async generateFinal(): Promise<void>
}
```

### Estructura de Cruces Completa

```
ROUND OF 32 → ROUND OF 16
49 → 65A
50 → 65B

51 → 66A
52 → 66B

53 → 67A
54 → 67B

55 → 68A
56 → 68B

57 → 69A
58 → 69B

59 → 70A
60 → 70B

61 → 71A
62 → 71B

63 → 72A
64 → 72B

ROUND OF 16 → QUARTERFINALS
65 → 73A
66 → 73B

67 → 74A
68 → 74B

69 → 75A
70 → 75B

71 → 76A
72 → 76B

QUARTERFINALS → SEMIFINALS
73 → 77A
74 → 77B

75 → 78A
76 → 78B

SEMIFINALS → FINAL
77 → 79A
78 → 79B

SEMIFINALS → THIRD PLACE
77 loser → 80A
78 loser → 80B

FINAL
Partido 79

TERCER PUESTO
Partido 80
```

---

## 9. LÓGICA DE AVANCE

Cuando un partido termina:

1. Se determina ganador
2. Se guarda `winnerTeamId`
3. El ganador avanza automáticamente
4. Se llena el siguiente partido

### ⚠️ CAMBIO NECESARIO #5: Crear Servicio de Avance Automático

**Nuevo archivo:** `backend/src/services/matchProgressionService.ts`

```typescript
export class MatchProgressionService {
  // Procesar resultado de un partido
  async processMatchResult(matchId: number, winnerTeamId: number): Promise<void>
  
  // Actualizar siguiente partido con ganador
  private async updateNextMatch(
    currentMatch: Match,
    winnerTeamId: number
  ): Promise<void>
  
  // Validar que no sea manual override
  private canAutoUpdate(match: Match): boolean
  
  // Generar partido de tercer lugar si es semifinal
  private async handleThirdPlaceGeneration(match: Match): Promise<void>
}
```

### Ejemplo de Avance

```typescript
// Partido actual
{
  id: 49,
  nextMatchId: 65,
  nextMatchSlot: 'A',
  winnerTeamId: null,
  isManualOverride: false
}

// Si gana Brasil (teamId: 5)
// El sistema automáticamente:
// 1. Actualiza: match.winnerTeamId = 5
// 2. Busca: match.nextMatchId = 65
// 3. Actualiza: match65.teamAId = 5 (porque nextMatchSlot = 'A')
// 4. Marca: match65.status = 'PENDING' (si ambos equipos están listos)
```

---

## 10. REGLA FUNDAMENTAL

**AUTOMATIZACIÓN NO SIGNIFICA BLOQUEO**

El sistema debe generar automáticamente las llaves.

**PERO:**

El administrador puede modificar cualquier partido manualmente.

---

## 11. SISTEMA DE MANUAL OVERRIDE

Cada partido debe soportar:

```typescript
isManualOverride: boolean
```

### ⚠️ CAMBIO NECESARIO #6: Endpoints Admin para Override

**Nuevos endpoints en:** `backend/src/routes/admin.ts`

```typescript
// Modificar partido con override
PUT /api/admin/matches/:id/override
{
  teamAId?: number
  teamBId?: number
  scoreA?: number
  scoreB?: number
  winnerTeamId?: number
  stadium?: string
  kickoff?: Date
  isManualOverride: boolean
}

// Regenerar brackets
POST /api/admin/brackets/regenerate

// Desbloquear partido
PUT /api/admin/matches/:id/unlock

// Bloquear partido
PUT /api/admin/matches/:id/lock
```

---

## 12. COMPORTAMIENTO DEL OVERRIDE

Si:
```
isManualOverride === false
```

El sistema puede actualizar automáticamente el partido.

Si:
```
isManualOverride === true
```

El sistema NO debe sobrescribir:

- Equipos
- Horarios
- Estadios
- Resultados

Aunque cambie la lógica automática.

### ⚠️ CAMBIO NECESARIO #7: Validación en Actualización Automática

**Modificar:** `backend/src/services/matchProgressionService.ts`

```typescript
private canAutoUpdate(match: Match): boolean {
  // Si está marcado como manual override, NO actualizar
  if (match.isManualOverride) {
    console.log(`[MATCH ${match.id}] Manual override activo, no actualizar automáticamente`);
    return false;
  }
  return true;
}

async updateNextMatch(currentMatch: Match, winnerTeamId: number): Promise<void> {
  if (!this.canAutoUpdate(currentMatch)) {
    return; // No hacer nada si está en override
  }
  
  // Proceder con actualización automática
  // ...
}
```

---

## 13. EJEMPLO DE CASO REAL

### Ejemplo FIFA:

- Cambio de estadio
- Cambio de horario
- Sanción
- Reorganización de llave
- Repetición de partido

El administrador debe poder modificar todo manualmente.

### Flujo de Ejemplo:

```
1. Admin accede a Partido 49
2. Marca: isManualOverride = true
3. Cambia: stadium = "Estadio Azteca"
4. Cambia: kickoff = "2026-06-15 20:00"
5. Guarda cambios

Resultado:
- El sistema NO sobrescribirá estos cambios
- Aunque se regeneren brackets
- Aunque cambien resultados de otros partidos
```

---

## 14. PARTIDOS DE ELIMINACIÓN

### ROUND OF 32

- 16 partidos
- Cada 2 partidos generan 1 partido de ROUND_OF_16

### ROUND OF 16

- 8 partidos
- Cada 2 partidos generan 1 partido de QUARTERFINALS

### QUARTERFINALS

- 4 partidos
- Cada 2 partidos generan 1 partido de SEMIFINALS

### SEMIFINALS

- 2 partidos
- Generan 1 FINAL
- Generan 1 THIRD_PLACE

---

## 15. RELACIÓN ENTRE PARTIDOS

### Ejemplo

```
49 y 50
  ↓
65
```

Eso significa:

- ganador 49 → slot A de 65
- ganador 50 → slot B de 65

---

## 16. REGLA DE EMPATES

En eliminación directa:

**NO puede existir empate final**

Debe existir:

- Tiempo extra
- Penales

### ⚠️ CAMBIO NECESARIO #8: Validación de Empates

**Modificar:** `backend/src/middleware/validation.ts`

```typescript
export function validateEliminationMatch(scoreA: number, scoreB: number, phase: MatchPhase): boolean {
  const eliminationPhases = [
    'ROUND_OF_32',
    'ROUND_OF_16',
    'QUARTERFINALS',
    'SEMIFINALS',
    'THIRD_PLACE',
    'FINAL'
  ];
  
  if (eliminationPhases.includes(phase) && scoreA === scoreB) {
    throw new Error('En fases de eliminación no puede haber empate. Debe haber ganador (tiempo extra/penales)');
  }
  
  return true;
}
```

---

## 17. REGLAS DE FRONTEND

El módulo de predicciones NO debe mostrar listas simples.

Debe mostrarse como:

**BRACKET VISUAL**

### ⚠️ CAMBIO NECESARIO #9: Nuevo Componente de Bracket Visual

**Nuevo archivo:** `frontend/src/components/BracketVisualization.tsx`

```typescript
interface BracketMatch {
  id: number
  matchNumber: number
  teamA?: Team
  teamB?: Team
  scoreA?: number
  scoreB?: number
  nextMatchId?: number
  nextMatchSlot?: 'A' | 'B'
  status: MatchStatus
}

interface BracketColumn {
  phase: MatchPhase
  matches: BracketMatch[]
}

export function BracketVisualization({ 
  matches: Match[],
  predictions: Record<number, Prediction>,
  onSave: (matchId: number, scoreA: number, scoreB: number) => void
}): JSX.Element
```

**Características:**
- Mostrar columnas de fases
- Conectar partidos con líneas
- Mostrar "TBD" para equipos pendientes
- Actualizar dinámicamente cuando hay resultados
- Permitir predicciones interactivas

---

## 18. VISUALIZACIÓN ESPERADA

El layout debe mostrar:

```
ROUND_OF_32 | ROUND_OF_16 | QUARTERFINALS | SEMIFINALS | FINAL
```

En forma de:

**LLAVES**

### Ejemplo Visual:

```
Round of 32          Round of 16          Quarterfinals
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ Brasil      │      │             │      │             │
│ 2 - 1       │──────│ Brasil      │      │             │
│ México      │      │ 1 - 0       │──────│ Brasil      │
└─────────────┘      │ Japón       │      │ 2 - 1       │
                     └─────────────┘      │ Francia     │
┌─────────────┐      ┌─────────────┐      └─────────────┘
│ Japón       │      │             │
│ 3 - 0       │──────│ Japón       │
│ Corea       │      │ 2 - 1       │
└─────────────┘      │ Alemania    │
                     └─────────────┘
```

---

## 19. COMPORTAMIENTO VISUAL

Los encuentros deben llenarse automáticamente conforme existan ganadores.

### Flujo:

1. Usuario ve "TBD vs TBD" en Round of 16
2. Termina partido de Round of 32
3. Sistema actualiza automáticamente
4. Usuario ve "Brasil vs TBD" en Round of 16
5. Termina otro partido
6. Usuario ve "Brasil vs Japón" en Round of 16

---

## 20. EQUIPOS PENDIENTES

Si aún no existe clasificado:

Mostrar:
- **TBD** (To Be Determined)
- O: **Por definir**

### Ejemplo:

```
TBD vs TBD
(Esperando resultados de Round of 32)
```

---

## 21. ORDEN DEL BRACKET

El orden visual debe respetar el árbol de partidos.

### Ejemplo:

```
P49 y P50 alimentan P65

Visualmente deben estar conectados:

P49 ──┐
      ├──→ P65
P50 ──┘
```

---

## 22. EL FRONTEND NUNCA DEBE HARDCODEAR EQUIPOS

### ❌ Incorrecto:

```typescript
const matches = [
  { teamA: 'Brasil', teamB: 'Argentina', ... },
  { teamA: 'Francia', teamB: 'Alemania', ... }
]
```

### ✅ Correcto:

```typescript
const matches = [
  { 
    teamAId: winnerOf(49),  // Dinámico
    teamBId: winnerOf(50),  // Dinámico
    nextMatchId: 65,
    nextMatchSlot: 'A'
  }
]
```

---

## 23. REGLAS DEL MÓDULO ADMINISTRATIVO

El módulo administrativo debe permitir:

- ✅ Editar equipos
- ✅ Cambiar horarios
- ✅ Cambiar estadio
- ✅ Modificar marcador
- ✅ Modificar ganador
- ✅ Mover partido de fase
- ✅ Bloquear partido
- ✅ Desbloquear partido
- ✅ Rehacer cruces

### ⚠️ CAMBIO NECESARIO #10: Expandir AdminPanel

**Modificar:** `frontend/src/components/AdminPanel.tsx`

Agregar secciones:

```typescript
// 1. Gestión de Clasificación
<ClassificationManager />

// 2. Gestión de Brackets
<BracketManager />

// 3. Edición de Partidos
<MatchEditor />

// 4. Control de Override
<OverrideControl />

// 5. Regeneración de Cruces
<BracketRegeneration />
```

---

## 24. EL ADMINISTRADOR SIEMPRE TIENE PRIORIDAD

La lógica automática nunca debe sobreescribir cambios manuales.

### Validación Crítica:

```typescript
async updateMatchResult(matchId: number, scoreA: number, scoreB: number) {
  const match = await db.match.findUnique({ where: { id: matchId } });
  
  // VALIDACIÓN CRÍTICA
  if (match.isManualOverride) {
    throw new Error('Este partido está en modo manual. No se puede actualizar automáticamente.');
  }
  
  // Proceder con actualización
  await this.processMatchResult(matchId, scoreA, scoreB);
}
```

---

## 25. SISTEMA DE SINCRONIZACIÓN

Cuando termina un partido:

1. Actualizar ganador
2. Actualizar siguiente partido
3. Actualizar bracket frontend
4. Actualizar predicciones

### ⚠️ CAMBIO NECESARIO #11: Crear Servicio de Sincronización

**Nuevo archivo:** `backend/src/services/syncService.ts`

```typescript
export class SyncService {
  // Sincronizar cambios de un partido a todo el sistema
  async syncMatchUpdate(matchId: number): Promise<void> {
    // 1. Obtener partido
    const match = await this.getMatch(matchId);
    
    // 2. Actualizar siguiente partido si aplica
    if (match.nextMatchId && !match.isManualOverride) {
      await this.updateNextMatch(match);
    }
    
    // 3. Notificar a clientes WebSocket
    await this.notifyClients(match);
    
    // 4. Actualizar caché de predicciones
    await this.updatePredictionCache(match);
  }
}
```

---

## 26. REGLA IMPORTANTE DE SEGURIDAD

Nunca actualizar automáticamente un partido si:

```
isManualOverride === true
```

### Implementación:

```typescript
// En TODOS los servicios que actualicen partidos
if (match.isManualOverride) {
  logger.warn(`[SECURITY] Intento de actualizar partido ${match.id} con override activo`);
  return; // No hacer nada
}
```

---

## 27. ALGORITMO GENERAL

### Flujo completo

```
1. Fase de grupos termina
   ↓
2. Se calculan clasificados
   ↓
3. Se generan cruces (Round of 32)
   ↓
4. Usuarios hacen predicciones
   ↓
5. Partidos terminan
   ↓
6. Ganadores avanzan automáticamente
   ↓
7. Bracket se actualiza
   ↓
8. Semifinales generan final y tercer puesto
   ↓
9. Campeón
```

---

## 28. OBJETIVO FINAL DEL SISTEMA

El sistema debe comportarse como:

**UN MOTOR DINÁMICO DE TORNEO**

No como una lista estática de partidos.

Toda la lógica debe depender de:

- Relaciones entre partidos
- Ganadores
- Flujo de clasificación
- Árbol de eliminación

Nunca de equipos escritos manualmente en frontend.

---

## RESUMEN DE CAMBIOS NECESARIOS

| # | Cambio | Ubicación | Complejidad | Esfuerzo |
|---|--------|-----------|-------------|----------|
| 1 | Agregar fases ROUND_OF_32 y THIRD_PLACE | schema.prisma | Baja | 30 min |
| 2 | Extender modelo Match con campos de relación | schema.prisma | Media | 1 hora |
| 3 | Crear ClassificationService | backend/src/services | Media | 4 horas |
| 4 | Crear BracketService | backend/src/services | Media | 6 horas |
| 5 | Crear MatchProgressionService | backend/src/services | Media | 4 horas |
| 6 | Agregar endpoints admin para override | backend/src/routes | Baja | 2 horas |
| 7 | Validación de override en actualizaciones | backend/src/services | Baja | 1 hora |
| 8 | Validación de empates en eliminación | backend/src/middleware | Baja | 1 hora |
| 9 | Crear BracketVisualization component | frontend/src/components | Alta | 10 horas |
| 10 | Expandir AdminPanel | frontend/src/components | Media | 6 horas |
| 11 | Crear SyncService | backend/src/services | Media | 3 horas |
| **TOTAL** | | | **Media** | **38 horas** |

---

## ORDEN RECOMENDADO DE IMPLEMENTACIÓN

### Fase 1: Base de Datos (2 horas)
1. Cambio #1: Agregar fases
2. Cambio #2: Extender modelo Match
3. Crear y ejecutar migración

### Fase 2: Servicios Backend (17 horas)
4. Cambio #3: ClassificationService
5. Cambio #4: BracketService
6. Cambio #5: MatchProgressionService
7. Cambio #11: SyncService
8. Cambio #7: Validación de override
9. Cambio #8: Validación de empates

### Fase 3: API Admin (2 horas)
10. Cambio #6: Endpoints admin

### Fase 4: Frontend (16 horas)
11. Cambio #9: BracketVisualization
12. Cambio #10: AdminPanel expandido

### Fase 5: Testing (1 hora)
13. Tests de flujo completo
14. Tests de override
15. Tests de sincronización

---

## CONSIDERACIONES IMPORTANTES

### ⚠️ Riesgos

- Migración de datos existentes
- Cambios significativos en la BD
- Necesita testing exhaustivo de cascadas
- El override manual debe estar bien documentado

### ✅ Ventajas

- Sistema profesional y escalable
- Automatización reduce errores
- Experiencia de usuario superior
- Fácil de mantener y extender
- Cumple con estándares de torneos reales

### 🔄 Rollback Plan

Si algo falla:
1. Revertir migración de BD
2. Mantener código anterior en rama
3. Usar feature flags para activar gradualmente

---

## CONCLUSIÓN

La implementación es **completamente viable**. El documento propone una arquitectura sólida y bien pensada. El esfuerzo estimado es de **38 horas** (aproximadamente 1 semana de desarrollo full-time).

El resultado será un sistema robusto, profesional y escalable que cumple con los estándares de torneos mundiales reales.
