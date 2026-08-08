import React, { useEffect, useRef, useState } from 'react';
import { format, parseISO, addMonths, subMonths, getDaysInMonth, startOfMonth, addDays } from 'date-fns';
import { Category, DailyRecord, Mode, Assignment, Section, BookProgress, WorkoutStepUp, WorkoutRestSchedule } from '../types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ListTodo, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getSectionColorStyle } from './DetailPanel';
import { getSectionStats } from '../lib/stats';

interface TimelineProps {
  records: Record<string, DailyRecord>;
  categories: Category[];
  sections: Section[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  mode: Mode;
  assignments: Assignment[];
  bookProgresses?: Record<string, BookProgress>;
  workoutStepUps?: Record<string, WorkoutStepUp>;
  workoutRestSchedule?: WorkoutRestSchedule;
}

export function Timeline({
  records,
  categories,
  sections,
  selectedDate,
  onSelectDate,
  mode,
  assignments,
  bookProgresses = {},
  workoutStepUps = {},
  workoutRestSchedule,
}: TimelineProps) {
  const selectedItemRef = useRef<HTMLDivElement>(null);
  
  const [viewMonth, setViewMonth] = useState(() => format(parseISO(selectedDate), 'yyyy-MM'));

  const monthStart = startOfMonth(parseISO(`${viewMonth}-01`));
  const daysInMonth = getDaysInMonth(monthStart);
  
  const dates = Array.from({ length: daysInMonth }, (_, i) => {
    return format(addDays(monthStart, i), 'yyyy-MM-dd');
  });

  useEffect(() => {
    const selectedMonth = format(parseISO(selectedDate), 'yyyy-MM');
    if (selectedMonth !== viewMonth) {
      setViewMonth(selectedMonth);
    }

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const isToday = selectedDate === todayStr;

    if (isToday) {
      const timer = setTimeout(() => {
        if (selectedItemRef.current) {
          selectedItemRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [selectedDate]);
  
  const handlePrevMonth = () => {
    setViewMonth(prev => format(subMonths(parseISO(`${prev}-01`), 1), 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    setViewMonth(prev => format(addMonths(parseISO(`${prev}-01`), 1), 'yyyy-MM'));
  };

  return (
    <div className="flex flex-col space-y-3 h-full flex-1 min-h-0 overflow-hidden">
      {/* Month Navigation */}
      <div className="flex items-center justify-between px-2 shrink-0">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold tracking-wide">
          {format(parseISO(`${viewMonth}-01`), 'MMMM yyyy')}
        </span>
        <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div
        className="relative flex-1 min-h-0 h-full w-full overflow-hidden"
        style={{
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 36px, black calc(100% - 36px), transparent 100%)',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 36px, black calc(100% - 36px), transparent 100%)',
        }}
      >
        <ScrollArea className="h-full w-full pr-3">
          <div className="flex flex-col space-y-2 py-4">
            {dates.map((dateString) => {
              const record = records[dateString] || { items: {}, hasAssignments: false, generalPlan: [], date: dateString };
              const isSelected = selectedDate === dateString;
              const dateObj = parseISO(dateString);
              const dayOfWeek = format(dateObj, 'EEE');

              const dayAssignments = assignments.filter(a => a.dueDate === dateString);
              const pendingCount = dayAssignments.filter(a => !a.isCompleted).length;
              const totalAssignments = dayAssignments.length;

              const planTexts = Array.isArray(record.generalPlan)
                ? record.generalPlan.map(p => p.time ? `[${p.time}] ${p.text}` : p.text).filter(Boolean)
                : (record.generalPlan ? [record.generalPlan] : []);
              const hasPlan = planTexts.length > 0;

              return (
                <motion.div
                  ref={isSelected ? selectedItemRef : null}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  key={dateString}
                  onClick={() => onSelectDate(dateString)}
                  className={cn(
                    "flex items-center p-3 rounded-lg cursor-pointer transition-all border relative",
                    isSelected 
                      ? "bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-300 shadow-sm ring-1 ring-indigo-200" 
                      : "bg-card border-border/50 hover:border-border hover:bg-accent/50 text-card-foreground"
                  )}
                >
                  {/* Date Column */}
                  <div className="flex flex-col items-center justify-center w-12 shrink-0 relative">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">{dayOfWeek}</span>
                    <span className={cn("text-lg font-bold leading-none mt-0.5", isSelected ? "text-indigo-600" : "")}>
                      {format(dateObj, 'd')}
                    </span>
                    {totalAssignments > 0 && (
                      <div className="mt-1 flex items-center gap-0.5">
                        <ListTodo className={cn("w-3 h-3", pendingCount > 0 ? "text-rose-500" : "text-emerald-500")} />
                      </div>
                    )}
                  </div>

                  {/* Content Column */}
                  <div className="ml-3 flex-1 flex flex-col justify-center space-y-1.5 overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("text-xs font-medium truncate flex items-center gap-1.5", hasPlan ? "text-foreground font-semibold" : "text-muted-foreground")}>
                        {hasPlan ? (
                          <>
                            <Calendar className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span className="truncate">{planTexts.join(' / ')}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground/60 italic text-[11px]">No plans</span>
                        )}
                      </span>

                      {totalAssignments > 0 && (
                        <Badge variant={pendingCount > 0 ? "destructive" : "secondary"} className="h-4 px-1.5 text-[9px] uppercase shrink-0">
                          {pendingCount > 0 ? `${pendingCount} due` : 'Done'}
                        </Badge>
                      )}
                    </div>

                    {/* Dynamic Sections Stats Badges */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      {sections.map(section => {
                        const style = getSectionColorStyle(section.color);
                        const stats = getSectionStats(section.id, dateString, record, categories, bookProgresses, workoutStepUps, workoutRestSchedule, records);
                        if (stats.total === 0) return null;

                        const isAllDone = stats.completed === stats.total;

                        return (
                          <div key={section.id} className="flex items-center gap-1">
                            <span className={cn("w-1.5 h-1.5 rounded-full", style.bar)} />
                            <span className="text-muted-foreground">{section.name}:</span>
                            <span className={cn("font-medium", isAllDone ? "text-emerald-600 font-bold" : "text-foreground")}>
                              {stats.completed}/{stats.total}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
