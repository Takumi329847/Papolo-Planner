import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { WorkoutStepUp } from '../types';
import { Trash2 } from 'lucide-react';

interface WorkoutStepUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  categoryName: string;
  currentStepUp?: WorkoutStepUp;
  onSave: (stepUp: WorkoutStepUp) => void;
  onDelete: (categoryId: string) => void;
  selectedDate: string;
}

export function WorkoutStepUpModal({
  isOpen,
  onClose,
  categoryId,
  categoryName,
  currentStepUp,
  onSave,
  onDelete,
  selectedDate
}: WorkoutStepUpModalProps) {
  const [startValue, setStartValue] = useState(10);
  const [targetValue, setTargetValue] = useState(50);
  const [durationDays, setDurationDays] = useState(30);
  const [restInterval, setRestInterval] = useState(0);

  useEffect(() => {
    if (isOpen) {
      if (currentStepUp) {
        setStartValue(currentStepUp.startValue);
        setTargetValue(currentStepUp.targetValue);
        setDurationDays(currentStepUp.durationDays);
        setRestInterval(currentStepUp.restInterval || 0);
      } else {
        setStartValue(10);
        setTargetValue(50);
        setDurationDays(30);
        setRestInterval(0);
      }
    }
  }, [isOpen, currentStepUp]);

  const handleSave = () => {
    if (!startValue || !targetValue || !durationDays) return;

    onSave({
      categoryId,
      startValue,
      targetValue,
      durationDays,
      startDate: currentStepUp ? currentStepUp.startDate : selectedDate,
      restInterval
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>📈 Step-Up Settings ({categoryName})</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="startValue">Initial Target / Reps</Label>
            <Input
              id="startValue"
              type="number"
              min="1"
              value={startValue}
              onChange={(e) => setStartValue(parseInt(e.target.value, 10) || 1)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetValue">Final Target / Reps</Label>
            <Input
              id="targetValue"
              type="number"
              min="1"
              value={targetValue}
              onChange={(e) => setTargetValue(parseInt(e.target.value, 10) || 1)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="durationDays">Target Days to Complete</Label>
            <Input
              id="durationDays"
              type="number"
              min="1"
              value={durationDays}
              onChange={(e) => setDurationDays(parseInt(e.target.value, 10) || 1)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="restInterval">Auto Rest Days (Repeat)</Label>
            <select
              id="restInterval"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={restInterval}
              onChange={(e) => setRestInterval(parseInt(e.target.value, 10) || 0)}
            >
              <option value="0">None (Train daily)</option>
              <option value="1">Every other day (1 train / 1 rest)</option>
              <option value="2">Every 2 days (2 train / 1 rest)</option>
              <option value="3">Every 3 days (3 train / 1 rest)</option>
              <option value="4">Every 4 days (4 train / 1 rest)</option>
              <option value="5">Every 5 days (5 train / 1 rest)</option>
              <option value="6">Every 6 days (6 train / 1 rest)</option>
            </select>
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between items-center gap-2">
          {currentStepUp ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                onDelete(categoryId);
                onClose();
              }}
              className="mr-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Remove Settings
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={!startValue || !targetValue || !durationDays}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
