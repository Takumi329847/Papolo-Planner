import { parseISO, isBefore, isEqual, addDays, format, differenceInCalendarDays, getDay } from 'date-fns';
import { WorkoutStepUp, WorkoutRestSchedule, DailyRecord } from '../types';

/**
 * Workout全体のグローバル休息日スケジュールに基づいて、指定日が休息日かどうかを判定。
 * - fixedWeekdays: 曜日固定休息（0=日曜〜6=土曜）
 * - restInterval: 周期的休息（0=なし, 1=1日おき...）
 */
export function isWorkoutGlobalRestDay(dateStr: string, schedule: WorkoutRestSchedule): boolean {
  const dateObj = parseISO(dateStr);
  const startObj = parseISO(schedule.startDate);

  // 開始日より前は休息日ではない
  if (isBefore(dateObj, startObj)) return false;

  // 固定曜日チェック
  if (schedule.fixedWeekdays.length > 0) {
    const dow = getDay(dateObj); // 0=Sun, 6=Sat
    if (schedule.fixedWeekdays.includes(dow)) return true;
  }

  // 周期的休息チェック
  if (schedule.restInterval > 0) {
    const diff = differenceInCalendarDays(dateObj, startObj);
    return (diff % (schedule.restInterval + 1)) === schedule.restInterval;
  }

  return false;
}

export function isWorkoutProgressRestDay(dateStr: string, stepUp: WorkoutStepUp): boolean {
  if (!stepUp.restInterval || stepUp.restInterval <= 0) {
    return false;
  }
  const targetDateObj = parseISO(dateStr);
  const startDateObj = parseISO(stepUp.startDate);
  const diff = differenceInCalendarDays(targetDateObj, startDateObj);
  if (diff < 0) {
    return false;
  }
  return (diff % (stepUp.restInterval + 1)) === stepUp.restInterval;
}

export function calculateWorkoutTargetForDate(
  dateStr: string,
  stepUp: WorkoutStepUp,
  records: Record<string, DailyRecord>
): number {
  const targetDateObj = parseISO(dateStr);
  const startDateObj = parseISO(stepUp.startDate);

  if (isBefore(targetDateObj, startDateObj)) {
    return stepUp.startValue;
  }

  // 1. Generate sorted list of dates from startDate to targetDate
  const dates: string[] = [];
  let currentObj = startDateObj;
  while (isBefore(currentObj, targetDateObj) || isEqual(currentObj, targetDateObj)) {
    dates.push(format(currentObj, 'yyyy-MM-dd'));
    currentObj = addDays(currentObj, 1);
  }

  // 2. Simulation variables
  let currentc = 0; // Number of training days cleared so far
  let previousTarget = stepUp.startValue;
  let lastActiveWasFailed = false;

  let finalTarget = stepUp.startValue;

  for (let i = 0; i < dates.length; i++) {
    const d = dates[i];
    const record = records[d];
    const item = record?.items[stepUp.categoryId];
    
    // Check if it's a rest day for this category (manually set OR automatically scheduled)
    const isRest = item?.isRest === true || isWorkoutProgressRestDay(d, stepUp);

    if (isRest) {
      // If it's a rest day, simulation continues but state remains unchanged.
      if (d === dateStr) {
        return previousTarget;
      }
      continue;
    }

    // It's a training day. Calculate today's target.
    let todayTarget = stepUp.startValue;
    if (i === 0) {
      // First day
      todayTarget = stepUp.startValue;
    } else if (lastActiveWasFailed) {
      // If last active day failed, target stays the same
      todayTarget = previousTarget;
    } else {
      // Progress target based on cleared count
      const totalDiff = stepUp.targetValue - stepUp.startValue;
      const progress = stepUp.durationDays > 1 
        ? Math.floor((totalDiff * currentc) / (stepUp.durationDays - 1))
        : 0;
      todayTarget = Math.min(stepUp.targetValue, stepUp.startValue + progress);
    }

    if (d === dateStr) {
      finalTarget = todayTarget;
      break;
    }

    // Update state for the next iterations based on today's actual performance
    previousTarget = todayTarget;
    const actual = item?.actualValue;
    if (actual !== undefined && actual !== null) {
      if (actual < todayTarget) {
        lastActiveWasFailed = true;
        // c is not incremented
      } else {
        lastActiveWasFailed = false;
        currentc++;
      }
    } else {
      // No actual value entered yet: treat as successful/completed to let progress continue
      lastActiveWasFailed = false;
      currentc++;
    }
  }

  return finalTarget;
}
