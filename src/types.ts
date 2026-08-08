export type Mode = 'plan' | 'actual';

export type SectionColor = 'indigo' | 'amber' | 'emerald' | 'rose' | 'sky' | 'violet' | 'teal' | 'fuchsia' | 'orange';

export type Section = {
  id: string;
  name: string;
  color: SectionColor | string;
};

export type SectionTitles = {
  study: string;
  workout: string;
};

export type Category = {
  id: string;
  name: string;
  type: string; // section id (e.g. 'study', 'workout', or custom section id)
};

export type RecordItem = {
  categoryId: string;
  planValue: number | null;
  actualValue: number | null;
  isRest: boolean; // applicable mostly for workout
  description?: string;
};

export type Assignment = {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  isCompleted: boolean;
};

/** 時間付き1件のGeneral Plan予定 */
export type GeneralPlanItem = {
  id: string;
  time: string;  // "HH:MM" or "" (all-day)
  text: string;
};

export type DailyRecord = {
  date: string; // YYYY-MM-DD
  generalPlan: GeneralPlanItem[]; // was: string
  items: Record<string, RecordItem>; // keyed by categoryId
  hasAssignments: boolean;
  notes?: string;
};

export type BookProgress = {
  categoryId: string;
  bookName: string;
  startPage: number;
  endPage: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
};

export type WorkoutStepUp = {
  categoryId: string;
  startValue: number;
  targetValue: number;
  durationDays: number;
  startDate: string; // YYYY-MM-DD
  restInterval?: number; // 0: None, 1: 1 day training / 1 day rest, etc.
};

/** Workout全体のグローバル休息日スケジュール */
export type WorkoutRestSchedule = {
  id: 'global'; // singleton
  startDate: string;         // YYYY-MM-DD: いつから適用するか
  restInterval: number;      // 0=なし, 1=1日おき, 2=2日おき, ...
  fixedWeekdays: number[];   // 0=日曜 〜 6=土曜 の固定休息曜日
};

/** 長期目標 */
export type LongTermGoal = {
  id: string;
  title: string;
  targetDate?: string; // YYYY-MM-DD
  isCompleted: boolean;
};
