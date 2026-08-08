import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Coffee } from 'lucide-react';
import { WorkoutRestSchedule } from '../types';
import { cn } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentSchedule?: WorkoutRestSchedule;
  onSave: (schedule: WorkoutRestSchedule) => void;
  onDelete: () => void;
  selectedDate: string;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function WorkoutRestScheduleModal({
  isOpen,
  onClose,
  currentSchedule,
  onSave,
  onDelete,
  selectedDate,
}: Props) {
  const [startDate, setStartDate] = useState(selectedDate);
  const [restInterval, setRestInterval] = useState(0);
  const [fixedWeekdays, setFixedWeekdays] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (currentSchedule) {
        setStartDate(currentSchedule.startDate);
        setRestInterval(currentSchedule.restInterval);
        setFixedWeekdays(currentSchedule.fixedWeekdays);
      } else {
        setStartDate(selectedDate);
        setRestInterval(0);
        setFixedWeekdays([]);
      }
    }
  }, [isOpen, currentSchedule, selectedDate]);

  const toggleWeekday = (day: number) => {
    setFixedWeekdays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSave = () => {
    onSave({
      id: 'global',
      startDate,
      restInterval,
      fixedWeekdays,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-500" />
            Workout Rest Schedule
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="rest-start-date">Start Date</Label>
            <Input
              id="rest-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* Interval Rest */}
          <div className="space-y-2">
            <Label htmlFor="rest-interval">Periodic Rest Days (Auto Repeat)</Label>
            <select
              id="rest-interval"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={restInterval}
              onChange={(e) => setRestInterval(parseInt(e.target.value, 10))}
            >
              <option value="0">None</option>
              <option value="1">Every other day (1 train / 1 rest)</option>
              <option value="2">Every 2 days (2 train / 1 rest)</option>
              <option value="3">Every 3 days (3 train / 1 rest)</option>
              <option value="4">Every 4 days (4 train / 1 rest)</option>
              <option value="5">Every 5 days (5 train / 1 rest)</option>
              <option value="6">Every 6 days (6 train / 1 rest)</option>
            </select>
          </div>

          {/* Fixed Weekdays */}
          <div className="space-y-2">
            <Label>Fixed Rest Days (Multiple selection allowed)</Label>
            <div className="flex gap-2 flex-wrap">
              {WEEKDAY_LABELS.map((label, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleWeekday(idx)}
                  className={cn(
                    'w-9 h-9 rounded-full text-sm font-medium border transition-colors',
                    fixedWeekdays.includes(idx)
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-background text-muted-foreground border-input hover:border-amber-400'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              e.g. Select 'Sun' and 'Sat' for weekends
            </p>
          </div>

          {/* Preview */}
          {(restInterval > 0 || fixedWeekdays.length > 0) && (
            <div className="rounded-md border border-dashed border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
              <p className="font-medium mb-1">Summary:</p>
              {restInterval > 0 && (
                <p>• 1 rest day every {restInterval} days (Starting {startDate})</p>
              )}
              {fixedWeekdays.length > 0 && (
                <p>• Every {fixedWeekdays.sort((a,b)=>a-b).map(d => WEEKDAY_LABELS[d]).join(', ')} is a rest day</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex sm:justify-between items-center gap-2">
          {currentSchedule ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => { onDelete(); onClose(); }}
              className="mr-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Remove Settings
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
