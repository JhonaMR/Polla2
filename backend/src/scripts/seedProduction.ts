import { prisma } from '../config/database.js';
import { hashPassword } from '../utils/password.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Slugifier para generar IDs externos de equipos uniformes
const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remover tildes
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
};

const months: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
};

async function seedProduction() {
  try {
    console.log('🌱 Iniciando limpieza profunda y resiembra de producción...');

    // 1. Limpieza de tablas en cascada y reinicio de secuencias en PostgreSQL
    console.log('🧹 Vaciando tablas y reiniciando secuencias...');
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Prediction", "BonusPrediction", "Match", "Team", "BonusQuestion" RESTART IDENTITY CASCADE;`);
    console.log('✓ Tablas vaciadas con éxito.');

    // 2. Reiniciar puntos de usuarios y asegurar usuario Administrador (SOP)
    console.log('👤 Reiniciando puntos de usuarios y validando SOP...');
    await prisma.user.updateMany({
      data: { points: 0 }
    });

    const adminPassword = await hashPassword('2114');
    const admin = await prisma.user.upsert({
      where: { username: 'SOP' },
      update: { points: 0, passwordHash: adminPassword },
      create: {
        uid: uuidv4(),
        username: 'SOP',
        displayName: 'SOPORTE',
        passwordHash: adminPassword,
        role: 'ADMIN',
        points: 0,
      },
    });
    console.log('✓ Usuario admin verificado:', admin.username);

    // 3. Buscar y leer archivo Equipos.txt
    let rootDir = process.cwd();
    // Resolver ruta sin importar si ejecutamos desde raíz o desde carpeta backend
    let equiposPath = path.resolve(rootDir, 'Equipos.txt');
    if (!fs.existsSync(equiposPath)) {
      equiposPath = path.resolve(rootDir, '..', 'Equipos.txt');
    }
    if (!fs.existsSync(equiposPath)) {
      throw new Error(`No se pudo encontrar Equipos.txt en ${process.cwd()} ni en el directorio superior.`);
    }

    console.log(`📄 Leyendo equipos de: ${equiposPath}`);
    const equiposContent = fs.readFileSync(equiposPath, 'utf8');
    const equiposLines = equiposContent.split('\n');

    const mapTeams: Record<string, number> = {};
    let teamsCount = 0;

    for (const line of equiposLines) {
      const cleanLine = line.trim();
      // Ignorar vacías, nombres de grupo
      if (!cleanLine || cleanLine.toLowerCase().startsWith('grupo')) {
        continue;
      }

      // Ejemplo: México, CONCACAF, Grupo A, https://flagcdn.com/w320/mx.png
      const parts = cleanLine.split(',');
      if (parts.length < 3) continue;

      const name = parts[0].trim();
      const region = parts[1].trim();
      const groupText = parts[2].trim(); // Ej: "Grupo A"
      const logoUrl = parts[3] ? parts[3].trim() : null;

      // Obtener letra del grupo (último caracter del string, ej: "Grupo A" -> "A")
      const groupLetter = groupText.charAt(groupText.length - 1).toUpperCase();
      const externalId = slugify(name);

      const team = await prisma.team.create({
        data: {
          externalId,
          name,
          region,
          groupLetter,
          logoUrl
        }
      });

      // Registrar en mapa por nombre en minúscula para emparejar
      mapTeams[name.toLowerCase()] = team.id;
      teamsCount++;
    }

    console.log(`✓ Se crearon ${teamsCount} equipos en la base de datos.`);

    // 4. Buscar y leer archivo Encuentros.txt
    let encuentrosPath = path.resolve(rootDir, 'Encuentros.txt');
    if (!fs.existsSync(encuentrosPath)) {
      encuentrosPath = path.resolve(rootDir, '..', 'Encuentros.txt');
    }
    if (!fs.existsSync(encuentrosPath)) {
      throw new Error(`No se pudo encontrar Encuentros.txt en ${process.cwd()} ni en el directorio superior.`);
    }

    console.log(`📄 Leyendo encuentros de: ${encuentrosPath}`);
    const encuentrosContent = fs.readFileSync(encuentrosPath, 'utf8');
    const encuentrosLines = encuentrosContent.split('\n');

    let matchesCount = 0;

    for (const line of encuentrosLines) {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.toLowerCase().startsWith('fase')) {
        continue;
      }

      // Formato: Partido 1: 11 de junio, 14:00 — México vs. Sudáfrica
      // Nota: El guion puede ser em dash (—) o un guion normal (-)
      let separator = '—';
      if (!cleanLine.includes('—') && cleanLine.includes('-')) {
        separator = '-';
      }

      const mainParts = cleanLine.split(separator);
      if (mainParts.length < 2) continue;

      const leftPart = mainParts[0].trim(); // Ej: "Partido 1: 11 de junio, 14:00"
      const rightPart = mainParts[1].trim(); // Ej: "México vs. Sudáfrica"

      // Parsear izquierda (Número de partido y Fecha)
      const colonIndex = leftPart.indexOf(':');
      if (colonIndex === -1) continue;

      const matchNumText = leftPart.substring(0, colonIndex).replace(/[^0-9]/g, '');
      const matchNumber = parseInt(matchNumText);

      const dateTimeText = leftPart.substring(colonIndex + 1).trim(); // Ej: "11 de junio, 14:00"
      const dateParts = dateTimeText.split(',');
      if (dateParts.length < 2) continue;

      const dayMonthText = dateParts[0].trim(); // Ej: "11 de junio"
      const timeText = dateParts[1].trim(); // Ej: "14:00"

      // Parsear día y mes
      const dmParts = dayMonthText.split(' de ');
      if (dmParts.length < 2) continue;
      const day = parseInt(dmParts[0].trim());
      const monthStr = dmParts[1].trim().toLowerCase();
      const monthVal = months[monthStr];

      if (monthVal === undefined) {
        console.warn(`⚠️ Mes desconocido "${monthStr}" en línea: ${cleanLine}`);
        continue;
      }

      // Parsear hora y minutos
      const timeParts = timeText.split(':');
      if (timeParts.length < 2) continue;
      const hour = parseInt(timeParts[0].trim());
      const minute = parseInt(timeParts[1].trim());

      // Construir fecha en UTC-5 (Hora Colombia). 
      // Al crear un Date con Date.UTC(año, mesIndex, dia, hora, min) guardamos la fecha correcta en UTC.
      // Colombia es UTC-5, por lo que sumamos 5 horas a la hora del texto para pasarla a UTC.
      const utcHour = hour + 5;
      const matchDate = new Date(Date.UTC(2026, monthVal, day, utcHour, minute, 0));

      // Parsear derecha (Equipos)
      // Ej: "México vs. Sudáfrica" o "México vs Sudáfrica"
      let vsSeparator = ' vs. ';
      if (!rightPart.includes(' vs. ') && rightPart.includes(' vs ')) {
        vsSeparator = ' vs ';
      }

      const teamParts = rightPart.split(vsSeparator);
      if (teamParts.length < 2) continue;

      const teamAName = teamParts[0].trim();
      const teamBName = teamParts[1].trim();

      const normalizeTeamName = (name: string): string => {
        const lower = name.toLowerCase().trim();
        if (lower === 'croacia') return 'croatia';
        return lower;
      };

      const teamAId = mapTeams[normalizeTeamName(teamAName)];
      const teamBId = mapTeams[normalizeTeamName(teamBName)];

      if (!teamAId) {
        console.warn(`⚠️ No se encontró ID para el equipo A: "${teamAName}"`);
      }
      if (!teamBId) {
        console.warn(`⚠️ No se encontró ID para el equipo B: "${teamBName}"`);
      }

      await prisma.match.create({
        data: {
          externalId: `match-${matchNumber}`,
          phase: 'GROUPS',
          teamAId: teamAId || null,
          teamBId: teamBId || null,
          matchDate,
          matchNumber,
          status: 'PENDING',
        }
      });

      matchesCount++;
    }

    console.log(`✓ Se crearon ${matchesCount} encuentros de Fase de Grupos en la base de datos.`);

    // 5. Configurar estados de Fase del Torneo
    console.log('⚙️ Inicializando configuraciones de fase...');
    const phases = [
      { phase: 'GROUPS', status: 'OPEN_FOR_PREDICTIONS' },
      { phase: 'ROUND_OF_32', status: 'LOCKED' },
      { phase: 'ROUND_OF_16', status: 'LOCKED' },
      { phase: 'QUARTERFINALS', status: 'LOCKED' },
      { phase: 'SEMIFINALS', status: 'LOCKED' },
      { phase: 'THIRD_PLACE', status: 'LOCKED' },
      { phase: 'FINAL', status: 'LOCKED' },
    ];

    for (const p of phases) {
      await prisma.phaseConfiguration.upsert({
        where: { phase: p.phase as any },
        update: { status: p.status as any },
        create: p as any,
      });
    }
    console.log('✓ Fases del torneo inicializadas (GROUPS abierto, el resto bloqueado).');

    // 6. Preguntas Bonus Iniciales por Defecto
    console.log('🏆 Creando preguntas bonus por defecto...');
    const defaultBonusQuestions = [
      { question: '¿Qué país se coronará Campeón del Mundial 2026?', category: 'Campeón', isActive: true },
      { question: '¿Quién será el Subcampeón del torneo?', category: 'Subcampeón', isActive: true },
      { question: '¿Qué jugador ganará la Bota de Oro (Máximo Goleador)?', category: 'Goleador', isActive: true },
      { question: '¿Quién será galardonado con el Balón de Oro (Mejor Jugador)?', category: 'Mejor Jugador', isActive: true },
      { question: '¿Qué selección será la más goleadora de toda la competencia?', category: 'Equipo Goleador', isActive: true },
    ];

    for (let i = 0; i < defaultBonusQuestions.length; i++) {
      await prisma.bonusQuestion.upsert({
        where: { id: i + 1 },
        update: defaultBonusQuestions[i],
        create: defaultBonusQuestions[i],
      });
    }
    console.log('✓ Preguntas bonus de torneo creadas.');

    // 7. Inicializar Puntos por Defecto
    console.log('⚙️ Inicializando configuración de puntos por defecto...');
    const configPuntos = await prisma.puntos.findFirst();
    if (!configPuntos) {
      await prisma.puntos.create({
        data: {
          acierto: 5,
          aciertoCompleto: 7,
          pregunta: 20
        }
      });
      console.log('✓ Configuración de puntos inicializada (acierto: 5, aciertoCompleto: 7, pregunta: 20).');
    } else {
      console.log('✓ Configuración de puntos ya existe.');
    }

    console.log('✅ Base de datos sembrada e inicializada exitosamente.');
  } catch (err) {
    console.error('❌ Error durante la resiembra de la base de datos:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedProduction();
