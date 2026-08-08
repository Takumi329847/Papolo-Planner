import { parseISO, differenceInCalendarDays, isAfter, isEqual, isBefore } from 'date-fns';
import { BookProgress, DailyRecord } from '../types';

export interface CalculatedProgress {
  startPage: number;
  targetPages: number;
  planEndPage: number;
  actualEndPage: number | null;
  remainingDays: number;
}

export function calculateBookProgressForDate(
  dateStr: string,
  progress: BookProgress,
  records: Record<string, DailyRecord>
): CalculatedProgress {
  const targetDateObj = parseISO(dateStr);
  const startDateObj = parseISO(progress.startDate);
  const endDateObj = parseISO(progress.endDate);

  // Total days planned at registration
  const totalDays = Math.max(1, differenceInCalendarDays(endDateObj, startDateObj) + 1);
  // Total pages planned at registration
  const totalPages = Math.max(0, progress.endPage - progress.startPage + 1);
  // Flat daily target page allocation
  const baseQuota = Math.ceil(totalPages / totalDays);

  // If the target date is before the start date of the book, return initial state
  if (isBefore(targetDateObj, startDateObj)) {
    return {
      startPage: progress.startPage,
      targetPages: 0,
      planEndPage: progress.startPage - 1,
      actualEndPage: null,
      remainingDays: differenceInCalendarDays(endDateObj, targetDateObj) + 1,
    };
  }

  // Calculate sum of actual pages read BEFORE targetDate (from startDate up to targetDate - 1 day)
  let pagesReadBefore = 0;
  
  Object.keys(records).forEach(recordDateStr => {
    const recordDateObj = parseISO(recordDateStr);
    
    // Check if recordDate is in range [startDate, targetDate - 1 day]
    const isAfterOrEqualStart = isAfter(recordDateObj, startDateObj) || isEqual(recordDateObj, startDateObj);
    const isBeforeTarget = isBefore(recordDateObj, targetDateObj);
    
    if (isAfterOrEqualStart && isBeforeTarget) {
      const record = records[recordDateStr];
      const item = record.items[progress.categoryId];
      if (item && item.actualValue !== null && item.actualValue > 0) {
        pagesReadBefore += item.actualValue;
      }
    }
  });

  const startPageForToday = progress.startPage + pagesReadBefore;
  
  // Remaining pages
  const totalRemainingPages = Math.max(0, progress.endPage - startPageForToday + 1);

  // Remaining days (inclusive of today)
  let remainingDays = differenceInCalendarDays(endDateObj, targetDateObj) + 1;
  if (remainingDays <= 0) {
    remainingDays = 1; // Fallback to 1 day if we are past target end date
  }

  // Target pages for today: use flat baseQuota. If remaining pages is less, cap at remaining pages.
  const targetPagesToday = totalRemainingPages > 0 
    ? Math.min(totalRemainingPages, baseQuota)
    : 0;

  const planEndPageToday = totalRemainingPages > 0 
    ? startPageForToday + targetPagesToday - 1
    : startPageForToday - 1;

  // Actual end page if user entered actualValue today
  const todayRecord = records[dateStr];
  const todayItem = todayRecord?.items[progress.categoryId];
  const actualValueToday = todayItem?.actualValue;
  const actualEndPageToday = (actualValueToday !== undefined && actualValueToday !== null && actualValueToday > 0)
    ? startPageForToday + actualValueToday - 1
    : null;

  return {
    startPage: startPageForToday,
    targetPages: targetPagesToday,
    planEndPage: planEndPageToday,
    actualEndPage: actualEndPageToday,
    remainingDays,
  };
}
