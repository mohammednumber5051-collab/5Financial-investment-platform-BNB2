export interface Workout {
  id: string;
  date: string;
  distanceKm: number;
  durationSeconds: number;
  pace: number;
  calories: number;
  notes?: string;
  mood: "great" | "good" | "okay" | "tough";
  route?: string;
}

export interface WeeklyStats {
  weekLabel: string;
  totalDistanceKm: number;
  totalDurationSeconds: number;
  workoutCount: number;
  avgPace: number;
}

export interface MonthlyProgress {
  month: string;
  totalDistanceKm: number;
  totalWorkouts: number;
  totalDurationSeconds: number;
  avgPacePerKm: number;
  longestRunKm: number;
}

export interface UserProfile {
  id: string;
  name: string;
  weeklyGoalKm: number;
  weeklyGoalWorkouts: number;
  unitSystem: "metric" | "imperial";
  joinedDate: string;
  totalRunsAllTime: number;
  totalDistanceAllTime: number;
  currentStreak: number;
  longestStreak: number;
  level: "Beginner" | "Intermediate" | "Advanced";
}

export interface RunGoal {
  id: string;
  title: string;
  targetKm: number;
  currentKm: number;
  deadline: string;
  completed: boolean;
}

export type MoodType = Workout["mood"];
