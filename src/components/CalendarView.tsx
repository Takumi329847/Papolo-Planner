import React, { useEffect, useState } from 'react';
import { format, parseISO, startOfMonth, startOfWeek, addDays, subMonths, addMonths, isSameMonth } from 'date-fns';
import { Category, DailyRecord, Mode, Assignment, WorkoutStepUp, WorkoutRestSchedule, Section, BookProgress } from '../types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { getSectionColorStyle } from './DetailPanel';
import { getSectionStats } from '../lib/stats';

interface CalendarViewProps {
  records: Record<string, DailyRecord>;
  categories: Category[];
  sections: Section[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  mode: Mode;
  assignments: Assignment[];
  bookProgresses?: Record<string, BookProgress>;
  workoutStepUps: Record<string, WorkoutStepUp>;
  workoutRestSchedule?: WorkoutRestSchedule;
}

export function CalendarView({
  records,
  categories,
  sections,
  selectedDate,
  onSelectDate,
  mode,
  assignments,
  bookProgresses = {},
  workoutStepUps,
  workoutRestSchedule,
}: CalendarViewProps) {
  const [viewMonth, setViewMonth] = useState(() => format(parseISO(selectedDate), 'yyyy-MM'));

  useEffect(() => {
    const selectedMonth = format(parseISO(selectedDate), 'yyyy-MM');
    if (selectedMonth !== viewMonth) {
      setViewMonth(selectedMonth);
    }
  }, [selectedDate]);

  const handlePrevMonth = () => {
    setViewMonth(prev => format(subMonths(parseISO(`${prev}-01`), 1), 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    setViewMonth(prev => format(addMonths(parseISO(`${prev}-01`), 1), 'yyyy-MM'));
  };

  const monthStart = startOfMonth(parseISO(`${viewMonth}-01`));
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
  
  // 7 columns x 5 rows = 35 days
  const dates = Array.from({ length: 35 }, (_, i) => {
    return format(addDays(calendarStart, i), 'yyyy-MM-dd');
  });

  return (
    <div className="flex flex-col space-y-3 h-full">
      {/* Month Navigation */}
      <div className="flex items-center justify-between px-2 shrink-0">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold tracking-wide">
          {format(monthStart, 'MMMM yyyy')}
        </span>
        <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Grid Container */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1 shrink-0">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
            <span key={d} className={cn("text-[11px] font-bold py-1 uppercase", i === 0 ? "text-rose-500" : i === 6 ? "text-sky-500" : "text-muted-foreground")}>
              {d}
            </span>
          ))}
        </div>
        
        {/* Calendar Grid (5 rows x 7 cols) */}
        <div className="grid grid-cols-7 grid-rows-5 gap-1.5 flex-1 min-h-0">
          {dates.map((dateString) => {
            const record = records[dateString] || { items: {}, hasAssignments: false, generalPlan: [], date: dateString };
            const isSelected = selectedDate === dateString;
            const dateObj = parseISO(dateString);
            const isCurrentMonth = isSameMonth(dateObj, monthStart);

            const dayAssignments = assignments.filter(a => a.dueDate === dateString);
            const pendingAssignments = dayAssignments.filter(a => !a.isCompleted);

            const planTexts = Array.isArray(record.generalPlan)
              ? record.generalPlan.map(p => p.text).filter(Boolean)
              : (record.generalPlan ? [record.generalPlan] : []);
            const hasPlan = planTexts.length > 0;

            // Compute overall section stats
            let grandTotal = 0;
            let grandCompleted = 0;
            sections.forEach(s => {
              const stats = getSectionStats(s.id, dateString, record, categories, bookProgresses, workoutStepUps, workoutRestSchedule, records);
              grandTotal += stats.total;
              grandCompleted += stats.completed;
            });

            const isAllCompleted = grandTotal > 0 && grandCompleted === grandTotal;

            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
                key={dateString}
                onClick={() => onSelectDate(dateString)}
                className={cn(
                  "flex flex-col justify-between p-1.5 rounded-lg cursor-pointer transition-all border relative select-none overflow-hidden",
                  isCurrentMonth ? "bg-card hover:bg-accent/40" : "bg-muted/20 opacity-40",
                  isSelected 
                    ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm bg-indigo-50/40 dark:bg-indigo-950/30" 
                    : "border-border/40",
                  isAllCompleted && mode === 'actual' ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200" : ""
                )}
              >
                {/* Header: Date + Assignment dot */}
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-xs font-bold leading-none",
                    isSelected ? "text-indigo-600" : isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {format(dateObj, 'd')}
                  </span>

                  {dayAssignments.length > 0 && (
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        pendingAssignments.length > 0 ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                      )}
                      title={`Assignments: ${pendingAssignments.length} pending`}
                    />
                  )}
                </div>

                {/* Plan text preview if available */}
                {hasPlan && (
                  <div className="my-0.5 px-1 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 rounded text-[9px] text-indigo-700 dark:text-indigo-300 font-medium truncate flex items-center gap-0.5">
                    <CalendarIcon className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{planTexts[0]}</span>
                  </div>
                )}

                {/* Section progress indicator dots */}
                <div className="flex items-center gap-1 mt-auto pt-1">
                  {sections.map(sec => {
                    const style = getSectionColorStyle(sec.color);
                    const stats = getSectionStats(sec.id, dateString, record, categories, bookProgresses, workoutStepUps, workoutRestSchedule, records);
                    if (stats.total === 0) return null;

                    const isDone = stats.completed === stats.total;

                    return (
                      <div
                        key={sec.id}
                        className={cn(
                          "flex items-center justify-center rounded-full text-[8px] font-bold px-1 h-3.5 transition-all",
                          isDone ? "bg-emerald-500 text-white" : style.bar + " text-white opacity-80"
                        )}
                        title={`${sec.name}: ${stats.completed}/${stats.total}`}
                      >
                        {isDone ? <Check className="w-2.5 h-2.5" /> : `${stats.completed}/${stats.total}`}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
