import type { MonthlyProgress, RunGoal, UserProfile, WeeklyStats, Workout } from "@/types";

export const mockProfile: UserProfile = {
  id: "user_001",
  name: "Alex Rivera",
  weeklyGoalKm: 15,
  weeklyGoalWorkouts: 3,
  unitSystem: "metric",
  joinedDate: "2026-01-15",
  totalRunsAllTime: 42,
  totalDistanceAllTime: 187.4,
  currentStreak: 5,
  longestStreak: 12,
  level: "Beginner",
};

export const mockWorkouts: Workout[] = [
  {
    id: "w_001",
    date: "2026-06-01T07:30:00Z",
    distanceKm: 3.2,
    durationSeconds: 1920,
    pace: 6.0,
    calories: 256,
    notes: "Felt great this morning!",
    mood: "great",
    route: "Park Loop",
  },
  {
    id: "w_002",
    date: "2026-05-30T18:15:00Z",
    distanceKm: 2.8,
    durationSeconds: 1764,
    pace: 6.3,
    calories: 224,
    notes: "A bit tired from work",
    mood: "okay",
    route: "Neighborhood",
  },
  {
    id: "w_003",
    date: "2026-05-28T06:45:00Z",
    distanceKm: 4.1,
    durationSeconds: 2460,
    pace: 5.98,
    calories: 328,
    notes: "Personal best distance!",
    mood: "great",
    route: "River Trail",
  },
  {
    id: "w_004",
    date: "2026-05-26T17:00:00Z",
    distanceKm: 2.5,
    durationSeconds: 1650,
    pace: 6.6,
    calories: 200,
    mood: "good",
    route: "Park Loop",
  },
  {
    id: "w_005",
    date: "2026-05-24T08:00:00Z",
    distanceKm: 3.5,
    durationSeconds: 2100,
    pace: 6.0,
    calories: 280,
    notes: "Steady pace throughout",
    mood: "good",
    route: "City Streets",
  },
  {
    id: "w_006",
    date: "2026-05-22T07:15:00Z",
    distanceKm: 2.0,
    durationSeconds: 1380,
    pace: 6.9,
    calories: 160,
    mood: "tough",
    route: "Neighborhood",
  },
  {
    id: "w_007",
    date: "2026-05-19T18:30:00Z",
    distanceKm: 3.8,
    durationSeconds: 2280,
    pace: 6.0,
    calories: 304,
    notes: "Evening run, great weather",
    mood: "great",
    route: "Park Loop",
  },
  {
    id: "w_008",
    date: "2026-05-17T07:00:00Z",
    distanceKm: 3.0,
    durationSeconds: 1920,
    pace: 6.4,
    calories: 240,
    mood: "good",
    route: "River Trail",
  },
];

export const mockWeeklyStats: WeeklyStats[] = [
  {
    weekLabel: "May 19",
    totalDistanceKm: 9.8,
    totalDurationSeconds: 5940,
    workoutCount: 3,
    avgPace: 6.07,
  },
  {
    weekLabel: "May 26",
    totalDistanceKm: 11.4,
    totalDurationSeconds: 6810,
    workoutCount: 4,
    avgPace: 6.22,
  },
  {
    weekLabel: "Jun 2",
    totalDistanceKm: 6.0,
    totalDurationSeconds: 3684,
    workoutCount: 2,
    avgPace: 6.15,
  },
];

export const mockMonthlyProgress: MonthlyProgress[] = [
  {
    month: "Jan 2026",
    totalDistanceKm: 18.2,
    totalWorkouts: 7,
    totalDurationSeconds: 11340,
    avgPacePerKm: 6.88,
    longestRunKm: 3.5,
  },
  {
    month: "Feb 2026",
    totalDistanceKm: 24.6,
    totalWorkouts: 9,
    totalDurationSeconds: 14760,
    avgPacePerKm: 6.64,
    longestRunKm: 4.0,
  },
  {
    month: "Mar 2026",
    totalDistanceKm: 31.0,
    totalWorkouts: 11,
    totalDurationSeconds: 18420,
    avgPacePerKm: 6.48,
    longestRunKm: 4.5,
  },
  {
    month: "Apr 2026",
    totalDistanceKm: 38.4,
    totalWorkouts: 13,
    totalDurationSeconds: 22560,
    avgPacePerKm: 6.30,
    longestRunKm: 5.0,
  },
  {
    month: "May 2026",
    totalDistanceKm: 45.5,
    totalWorkouts: 15,
    totalDurationSeconds: 26580,
    avgPacePerKm: 6.12,
    longestRunKm: 5.8,
  },
  {
    month: "Jun 2026",
    totalDistanceKm: 6.0,
    totalWorkouts: 2,
    totalDurationSeconds: 3684,
    avgPacePerKm: 6.14,
    longestRunKm: 3.2,
  },
];

export const mockGoals: RunGoal[] = [
  {
    id: "goal_001",
    title: "Run a 5K",
    targetKm: 5.0,
    currentKm: 4.1,
    deadline: "2026-06-30",
    completed: false,
  },
  {
    id: "goal_002",
    title: "Weekly 15km",
    targetKm: 15,
    currentKm: 6.0,
    deadline: "2026-06-07",
    completed: false,
  },
  {
    id: "goal_003",
    title: "Run 100km total",
    targetKm: 100,
    currentKm: 187.4,
    deadline: "2026-12-31",
    completed: true,
  },
];

export function formatPace(paceMinPerKm: number): string {
  const mins = Math.floor(paceMinPerKm);
  const secs = Math.round((paceMinPerKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getThisWeekWorkouts(workouts: Workout[]): Workout[] {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return workouts.filter((w) => new Date(w.date) >= weekStart);
}

export function getWeeklyDistance(workouts: Workout[]): number {
  return getThisWeekWorkouts(workouts).reduce((sum, w) => sum + w.distanceKm, 0);
}
