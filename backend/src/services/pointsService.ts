import { prisma } from '../config/database.js';

export const pointsService = {
  async getConfig() {
    let config = await prisma.puntos.findFirst();
    if (!config) {
      config = await prisma.puntos.create({
        data: { acierto: 5, aciertoCompleto: 7, pregunta: 20 }
      });
    }
    return config;
  },
  async updateConfig(acierto: number, aciertoCompleto: number, pregunta: number) {
    const config = await this.getConfig();
    return prisma.puntos.update({
      where: { id: config.id },
      data: { acierto, aciertoCompleto, pregunta }
    });
  },
  getPointsForMatch(phase: string, predictedA: number, predictedB: number, actualA: number, actualB: number) {
    let pointsEarned = 0;
    let isCorrect = false;

    let aciertoCompleto = 8;
    let acierto = 5;

    if (phase === 'GROUPS') {
      aciertoCompleto = 5;
      acierto = 2;
    } else if (phase === 'SEMIFINALS' || phase === 'FINAL' || phase === 'THIRD_PLACE') {
      aciertoCompleto = 10;
      acierto = 5;
    }

    if (predictedA === actualA && predictedB === actualB) {
      pointsEarned = aciertoCompleto;
      isCorrect = true;
    } else if (
      (predictedA > predictedB && actualA > actualB) ||
      (predictedA < predictedB && actualA < actualB) ||
      (predictedA === predictedB && actualA === actualB)
    ) {
      pointsEarned = acierto;
      isCorrect = true;
    }

    return { pointsEarned, isCorrect };
  }
};
