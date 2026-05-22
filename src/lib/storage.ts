import { Team, Match, Prediction, BonusQuestion, BonusPrediction, UserProfile } from "../types";

const KEYS = {
  TEAMS: "polla_teams",
  MATCHES: "polla_matches",
  PREDICTIONS: "polla_predictions",
  BONUS_QUESTIONS: "polla_bonus_questions",
  BONUS_PREDICTIONS: "polla_bonus_predictions",
  USERS: "polla_users_db", // Shared with AuthContext
};

const get = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const set = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const storage = {
  getTeams: () => get<Team[]>(KEYS.TEAMS, []),
  saveTeam: (team: Team) => {
    const teams = storage.getTeams();
    const index = teams.findIndex(t => t.id === team.id);
    if (index >= 0) teams[index] = team;
    else teams.push(team);
    set(KEYS.TEAMS, teams);
  },

  getMatches: () => get<Match[]>(KEYS.MATCHES, []),
  saveMatch: (match: Match) => {
    const matches = storage.getMatches();
    const index = matches.findIndex(m => m.id === match.id);
    if (index >= 0) matches[index] = match;
    else matches.push(match);
    set(KEYS.MATCHES, matches);
  },

  getPredictions: (userId?: string) => {
    const all = get<Prediction[]>(KEYS.PREDICTIONS, []);
    return userId ? all.filter(p => p.userId === userId) : all;
  },
  savePrediction: (prediction: Prediction) => {
    const preds = get<Prediction[]>(KEYS.PREDICTIONS, []);
    const index = preds.findIndex(p => p.id === prediction.id);
    if (index >= 0) preds[index] = prediction;
    else preds.push(prediction);
    set(KEYS.PREDICTIONS, preds);
  },

  getBonusQuestions: () => get<BonusQuestion[]>(KEYS.BONUS_QUESTIONS, []),
  saveBonusQuestion: (q: BonusQuestion) => {
    const qs = storage.getBonusQuestions();
    const index = qs.findIndex(item => item.id === q.id);
    if (index >= 0) qs[index] = q;
    else qs.push(q);
    set(KEYS.BONUS_QUESTIONS, qs);
  },

  getBonusPredictions: (userId?: string) => {
    const all = get<BonusPrediction[]>(KEYS.BONUS_PREDICTIONS, []);
    return userId ? all.filter(p => p.userId === userId) : all;
  },
  saveBonusPrediction: (p: BonusPrediction) => {
    const preds = get<BonusPrediction[]>(KEYS.BONUS_PREDICTIONS, []);
    const index = preds.findIndex(item => item.id === p.id);
    if (index >= 0) preds[index] = p;
    else preds.push(p);
    set(KEYS.BONUS_PREDICTIONS, preds);
  },

  getUsers: () => get<Record<string, UserProfile & { pin: string }>>(KEYS.USERS, {}),
  updateUser: (user: UserProfile & { pin: string }) => {
    const users = storage.getUsers();
    users[user.username] = user;
    set(KEYS.USERS, users);
  }
};
