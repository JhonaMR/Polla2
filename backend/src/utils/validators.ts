import Joi from 'joi';

export const schemas = {
  // Auth
  register: Joi.object({
    username: Joi.string().alphanum().min(1).max(30).required(),
    displayName: Joi.string().min(1).max(100).required(),
    password: Joi.string().min(1).required(),
  }),

  login: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required(),
  }),

  // Predictions
  createPrediction: Joi.object({
    matchId: Joi.number().integer().required(),
    predictedScoreA: Joi.number().integer().min(0).required(),
    predictedScoreB: Joi.number().integer().min(0).required(),
  }),

  updatePrediction: Joi.object({
    predictedScoreA: Joi.number().integer().min(0),
    predictedScoreB: Joi.number().integer().min(0),
  }),

  // Bonus Predictions
  createBonusPrediction: Joi.object({
    questionId: Joi.number().integer().required(),
    selectedAnswer: Joi.string().required(),
  }),

  // Admin - Matches
  createMatch: Joi.object({
    externalId: Joi.string().required(),
    phase: Joi.string().valid('GROUPS', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTERFINALS', 'SEMIFINALS', 'THIRD_PLACE', 'FINAL').required(),
    teamAId: Joi.number().integer().required(),
    teamBId: Joi.number().integer().required(),
    matchDate: Joi.date().required(),
    matchNumber: Joi.number().integer().required(),
  }),

  updateMatch: Joi.object({
    scoreA: Joi.number().integer().min(0),
    scoreB: Joi.number().integer().min(0),
    status: Joi.string().valid('PENDING', 'FINISHED'),
    winnerTeamId: Joi.number().integer().min(1).optional().allow(null),
    loserTeamId: Joi.number().integer().min(1).optional().allow(null),
    penaltiesScoreA: Joi.number().integer().min(0).optional().allow(null),
    penaltiesScoreB: Joi.number().integer().min(0).optional().allow(null),
  }),

  // Admin - Bonus Questions
  createBonusQuestion: Joi.object({
    question: Joi.string().required(),
    correctAnswer: Joi.string().allow('', null).optional(),
    category: Joi.string().allow('', null).optional(),
  }),

  updateBonusQuestion: Joi.object({
    question: Joi.string().optional(),
    correctAnswer: Joi.string().allow('', null).optional(),
    category: Joi.string().allow('', null).optional(),
    isActive: Joi.boolean().optional(),
  }),

  // Admin - Teams
  createTeam: Joi.object({
    externalId: Joi.string().required(),
    name: Joi.string().required(),
    region: Joi.string().required(),
    groupLetter: Joi.string().length(1).required(),
    logoUrl: Joi.string().uri().allow('', null).optional(),
  }),

  updateTeam: Joi.object({
    name: Joi.string().optional(),
    region: Joi.string().optional(),
    groupLetter: Joi.string().length(1).optional(),
    logoUrl: Joi.string().uri().allow('', null).optional(),
  }),
};

export function validate(schema: Joi.Schema, data: any) {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const messages = error.details.map(detail => detail.message);
    throw new ValidationError(messages);
  }

  return value;
}

export class ValidationError extends Error {
  constructor(public messages: string[]) {
    super('Validation error');
    this.name = 'ValidationError';
  }
}
