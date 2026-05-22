export type UserRole = "admin" | "user";

export interface UserProfile {
  uid: string;
  email?: string;
  displayName: string;
  username: string;
  role: UserRole;
  points: number;
  position?: string;
  photoURL?: string;
}

export interface Team {
  id: string;
  name: string;
  region: string;
  group: string; // A-L
  logoUrl?: string;
}

export type MatchPhase = "groups" | "roundOf16" | "quarterfinals" | "semifinals" | "final";
export type MatchStatus = "pending" | "finished";

export interface Match {
  id: string;
  phase: MatchPhase;
  teamAId: string;
  teamBId: string;
  scoreA?: number;
  scoreB?: number;
  status: MatchStatus;
  date: string;
  matchNumber: number;
}

export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  predictedScoreA: number;
  predictedScoreB: number;
  pointsEarned: number;
  isCorrect?: boolean;
}

export interface BonusQuestion {
  id: string;
  question: string;
  correctAnswer?: string;
}

export interface BonusPrediction {
  id: string;
  userId: string;
  questionId: string;
  selectedAnswer: string;
  pointsEarned: number;
}
