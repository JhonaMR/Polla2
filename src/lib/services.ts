import api from './api';

export const userService = {
  getProfile: (userId: number) => api.get(`/users/profile/${userId}`),
  getMe: () => api.get('/users/me'),
  getLeaderboard: (limit = 100, offset = 0) =>
    api.get('/users/leaderboard', { params: { limit, offset } }),
  updateProfile: (data: any) => api.put('/users/profile', data),
  getStats: () => api.get('/users/stats'),
};

export const predictionService = {
  create: (data: any) => api.post('/predictions', data),
  update: (id: number, data: any) => api.put(`/predictions/${id}`, data),
  getUserPredictions: (userId: number) => api.get(`/predictions/user/${userId}`),
  getMatchPredictions: (matchId: number) => api.get(`/predictions/match/${matchId}`),
  getUserStats: (userId: number) => api.get(`/predictions/user/${userId}/stats`),
};

export const bonusService = {
  getQuestions: () => api.get('/bonus-questions'),
  createPrediction: (data: any) => api.post('/bonus-questions/predictions', data),
  getUserPredictions: (userId: number) => api.get(`/bonus-questions/user/${userId}`),
  createQuestion: (data: any) => api.post('/admin/bonus-questions', data),
  resolveQuestion: (questionId: number, data: any) =>
    api.put(`/admin/bonus-questions/${questionId}`, data),
  getPredictions: (questionId: number) => api.get(`/bonus-questions/${questionId}/predictions`),
  getPointsConfig: () => api.get('/bonus-questions/points/config'),
};

export const phaseService = {
  getPhases: () => api.get('/phases'),
  updatePhaseStatus: (phase: string, status: string) => api.put(`/phases/${phase}`, { status }),
  processGroups: () => api.post('/phases/process-groups'),
};

export const matchService = {
  getMatches: () => api.get('/matches'),
  getMatch: (id: number) => api.get(`/matches/${id}`),
  getByPhase: (phase: string) => api.get(`/matches/phase/${phase}`),
  getUpcoming: () => api.get('/matches/upcoming'),
  getFinished: () => api.get('/matches/finished'),
};

export const teamService = {
  getTeams: () => api.get('/teams'),
  getTeam: (id: number) => api.get(`/teams/${id}`),
  getByRegion: (region: string) => api.get(`/teams/region/${region}`),
  getByGroup: (group: string) => api.get(`/teams/group/${group}`),
};

export const adminService = {
  // Users
  getAllUsers: (limit = 100, offset = 0) =>
    api.get('/admin/users', { params: { limit, offset } }),
  updateUser: (userId: number, data: any) =>
    api.put(`/admin/users/${userId}`, data),

  // Teams
  getTeams: () => api.get('/admin/teams'),
  createTeam: (data: any) => api.post('/admin/teams', data),
  deleteTeam: (teamId: number) => api.delete(`/admin/teams/${teamId}`),
  updateTeam: (teamId: number, data: any) => api.put(`/admin/teams/${teamId}`, data),

  // Matches
  createMatch: (data: any) => api.post('/admin/matches', data),
  updateMatch: (matchId: number, data: any) =>
    api.put(`/admin/matches/${matchId}`, data),
  deleteMatch: (matchId: number) =>
    api.delete(`/admin/matches/${matchId}`),
  finishMatch: (matchId: number, data: any) =>
    api.put(`/admin/matches/${matchId}/finish`, data),
  revertMatch: (matchId: number) =>
    api.put(`/admin/matches/${matchId}/revert`, {}),

  // Bonus Questions
  createBonusQuestion: (data: any) => api.post('/admin/bonus-questions', data),
  getBonusQuestions: () => api.get('/admin/bonus-questions'),
  updateBonusQuestion: (questionId: number, data: any) =>
    api.put(`/admin/bonus-questions/${questionId}`, data),
  deleteBonusQuestion: (questionId: number) =>
    api.delete(`/admin/bonus-questions/${questionId}`),

  // Bonus Predictions
  getBonusPredictions: (questionId: number) =>
    api.get(`/admin/bonus-questions/${questionId}/predictions`),
  updateBonusPrediction: (predictionId: number, data: any) =>
    api.put(`/admin/bonus-predictions/${predictionId}`, data),
  deleteBonusPrediction: (predictionId: number) =>
    api.delete(`/admin/bonus-predictions/${predictionId}`),

  // Scoring
  calculateScores: () => api.post('/admin/calculate-scores', {}),

  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard-stats'),

  // Points Config
  getPointsConfig: () => api.get('/admin/points-config'),
  updatePointsConfig: (data: { acierto: number; aciertoCompleto: number; pregunta: number }) =>
    api.put('/admin/points-config', data),
};
