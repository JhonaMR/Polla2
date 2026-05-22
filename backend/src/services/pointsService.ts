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
  }
};
