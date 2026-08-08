import { Category, DailyRecord, BookProgress, WorkoutStepUp, WorkoutRestSchedule } from '../types';
import { calculateBookProgressForDate } from './bookProgress';
import { calculateWorkoutTargetForDate, isWorkoutProgressRestDay, isWorkoutGlobalRestDay } from './workoutProgress';

export interface CategoryAchievementStatus {
  isRest: boolean;
  targetVal: number | null;
  actualVal: number | null;
  isAchieved: boolean;
  hasActivity: boolean; // whether there is a plan target, an actual entry, or rest day
}

/**
 * Calculates target value and achievement status for a category on a specific date.
 */
export function getCategoryAchievement(
  cat: Category,
  dateStr: string,
  record: DailyRecord | undefined,
  bookProgresses: Record<string, BookProgress> = {},
  workoutStepUps: Record<string, WorkoutStepUp> = {},
  workoutRestSchedule?: WorkoutRestSchedule,
  records: Record<string, DailyRecord> = {}
): CategoryAchievementStatus {
  const item = record?.items?.[cat.id];
  const isWorkoutCategory = cat.type === 'workout' || cat.name.toLowerCase().includes('workout') || cat.name.includes('筋トレ');

  // Rest day checks
  const stepUp = workoutStepUps[cat.id];
  const isAutoRestStepUp = stepUp ? isWorkoutProgressRestDay(dateStr, stepUp) : false;
  const isAutoRestGlobal = isWorkoutCategory && workoutRestSchedule ? isWorkoutGlobalRestDay(dateStr, workoutRestSchedule) : false;
  const isRest = Boolean(item?.isRest || isAutoRestStepUp || isAutoRestGlobal);

  if (isRest) {
    return {
      isRest: true,
      targetVal: null,
      actualVal: null,
      isAchieved: true,
      hasActivity: true,
    };
  }

  // 1. Target Value calculation
  const progress = bookProgresses[cat.id];
  const calc = progress ? calculateBookProgressForDate(dateStr, progress, records) : null;
  const stepUpTarget = stepUp ? calculateWorkoutTargetForDate(dateStr, stepUp, records) : null;

  let targetVal: number | null = null;
  if (item?.planValue !== undefined && item?.planValue !== null && !isNaN(Number(item.planValue))) {
    targetVal = Number(item.planValue);
  } else if (calc && calc.targetPages > 0) {
    targetVal = calc.targetPages;
  } else if (stepUpTarget !== null && stepUpTarget > 0) {
    targetVal = stepUpTarget;
  }

  // 2. Actual Value calculation
  let actualVal: number | null = null;
  if (item?.actualValue !== undefined && item?.actualValue !== null && !isNaN(Number(item.actualValue))) {
    actualVal = Number(item.actualValue);
  }

  // 3. Achievement determination
  let isAchieved = false;
  let hasActivity = false;

  if (targetVal !== null && targetVal > 0) {
    hasActivity = true;
    if (actualVal !== null && actualVal >= targetVal) {
      isAchieved = true;
    }
  } else if (actualVal !== null && actualVal > 0) {
    hasActivity = true;
    isAchieved = true; // Logged actual progress without a prior fixed target counts as achievement
  }

  return {
    isRest: false,
    targetVal,
    actualVal,
    isAchieved,
    hasActivity,
  };
}

/**
 * Calculates total and completed items for a section on a date.
 */
export function getSectionStats(
  sectionId: string,
  dateStr: string,
  record: DailyRecord | undefined,
  categories: Category[],
  bookProgresses: Record<string, BookProgress> = {},
  workoutStepUps: Record<string, WorkoutStepUp> = {},
  workoutRestSchedule?: WorkoutRestSchedule,
  records: Record<string, DailyRecord> = {}
): { total: number; completed: number } {
  const relevantCats = categories.filter(c => c.type === sectionId);
  let total = 0;
  let completed = 0;

  relevantCats.forEach(cat => {
    const status = getCategoryAchievement(cat, dateStr, record, bookProgresses, workoutStepUps, workoutRestSchedule, records);
    if (status.hasActivity) {
      total += 1;
      if (status.isAchieved) {
        completed += 1;
      }
    }
  });

  return { total, completed };
}
