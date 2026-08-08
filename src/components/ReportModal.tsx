import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DailyRecord, Category, BookProgress, WorkoutStepUp, WorkoutRestSchedule } from '../types';
import { Progress } from '@/components/ui/progress';
import { PartyPopper, CalendarClock } from 'lucide-react';
import { getCategoryAchievement } from '../lib/stats';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: Record<string, DailyRecord>;
  categories: Category[];
  bookProgresses?: Record<string, BookProgress>;
  workoutStepUps?: Record<string, WorkoutStepUp>;
  workoutRestSchedule?: WorkoutRestSchedule;
}

export function ReportModal({
  isOpen,
  onClose,
  records,
  categories,
  bookProgresses = {},
  workoutStepUps = {},
  workoutRestSchedule,
}: ReportModalProps) {
  
  let totalPlanItems = 0;
  let completedItems = 0;
  let plannedRestsTaken = 0;
  let hasUnfinishedAssignments = false;

  Object.values(records).forEach(record => {
    if (record.hasAssignments) {
      hasUnfinishedAssignments = true;
    }

    categories.forEach(cat => {
      const status = getCategoryAchievement(cat, record.date, record, bookProgresses, workoutStepUps, workoutRestSchedule, records);
      if (status.hasActivity) {
        totalPlanItems++;
        if (status.isAchieved) {
          completedItems++;
        }
        if (status.isRest) {
          plannedRestsTaken++;
        }
      }
    });
  });

  const completionRate = totalPlanItems === 0 ? 0 : Math.round((completedItems / totalPlanItems) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Weekly Report</DialogTitle>
          <DialogDescription>
            Your progress summary based on your plans and actuals.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 space-y-6">
          <div className="space-y-2 text-center">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Plan Completion Rate</h4>
            <div className="text-5xl font-extrabold tracking-tighter flex items-baseline justify-center">
              {completionRate}<span className="text-2xl text-muted-foreground ml-1">%</span>
            </div>
            <Progress value={completionRate} className="h-3 w-full mt-4" />
          </div>

          {plannedRestsTaken > 0 && (
            <div className="bg-secondary/50 text-secondary-foreground p-4 rounded-lg flex items-start space-x-3 border border-border">
              <PartyPopper className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold mb-1">Great Job on Rest Days!</p>
                <p>You took {plannedRestsTaken} planned rest day(s). Planned physical recovery is not skipping, it's a strategic part of a successful routine!</p>
              </div>
            </div>
          )}

          {hasUnfinishedAssignments && (
            <div className="bg-muted/50 p-4 rounded-lg flex flex-col space-y-3 border">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <CalendarClock className="w-4 h-4" />
                <span>You have unfinished assignments.</span>
              </div>
              <Button variant="secondary" className="w-full text-sm">
                Slide unfinished assignments to next week
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full sm:w-auto">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
