import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BookProgress } from '../types';
import { format, parseISO, addDays, differenceInCalendarDays } from 'date-fns';
import { Trash2 } from 'lucide-react';

interface BookProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  categoryName: string;
  currentProgress?: BookProgress;
  onSave: (progress: BookProgress) => void;
  onDelete: (categoryId: string) => void;
  selectedDate: string;
}

export function BookProgressModal({
  isOpen,
  onClose,
  categoryId,
  categoryName,
  currentProgress,
  onSave,
  onDelete,
  selectedDate
}: BookProgressModalProps) {
  const [bookName, setBookName] = useState('');
  const [startPage, setStartPage] = useState<string>('1');
  const [endPage, setEndPage] = useState<string>('100');
  const [targetType, setTargetType] = useState<'days' | 'date'>('days');
  const [durationDays, setDurationDays] = useState<string>('30');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (currentProgress) {
        setBookName(currentProgress.bookName);
        setStartPage(currentProgress.startPage.toString());
        setEndPage(currentProgress.endPage.toString());
        setEndDate(currentProgress.endDate);
        
        // Calculate days from startDate to endDate
        const start = parseISO(currentProgress.startDate);
        const end = parseISO(currentProgress.endDate);
        const days = differenceInCalendarDays(end, start) + 1;
        setDurationDays(days > 0 ? days.toString() : '30');
        setTargetType('days');
      } else {
        // Defaults for new book
        setBookName('');
        setStartPage('1');
        setEndPage('100');
        setDurationDays('30');
        const defaultEnd = format(addDays(parseISO(selectedDate), 29), 'yyyy-MM-dd');
        setEndDate(defaultEnd);
        setTargetType('days');
      }
    }
  }, [isOpen, currentProgress, selectedDate]);

  // Synchronize target days with date when days input changes
  const handleDaysChange = (daysStr: string) => {
    setDurationDays(daysStr);
    const days = parseInt(daysStr, 10);
    if (!isNaN(days) && days > 0) {
      const start = parseISO(selectedDate);
      const newEnd = format(addDays(start, days - 1), 'yyyy-MM-dd');
      setEndDate(newEnd);
    }
  };

  // Synchronize date with target days when date input changes
  const handleDateChange = (dateStr: string) => {
    setEndDate(dateStr);
    if (dateStr) {
      const start = parseISO(selectedDate);
      const end = parseISO(dateStr);
      const days = differenceInCalendarDays(end, start) + 1;
      setDurationDays(days > 0 ? days.toString() : '1');
    }
  };

  const handleSave = () => {
    const start = parseInt(startPage, 10);
    const end = parseInt(endPage, 10);
    const duration = parseInt(durationDays, 10);

    if (!bookName.trim() || isNaN(end) || isNaN(start) || end < start) return;

    let finalEndDate = endDate;
    if (targetType === 'days' && !isNaN(duration)) {
      finalEndDate = format(addDays(parseISO(selectedDate), duration - 1), 'yyyy-MM-dd');
    }

    onSave({
      categoryId,
      bookName,
      startPage: start,
      endPage: end,
      startDate: selectedDate,
      endDate: finalEndDate
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>📖 Book Settings ({categoryName})</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="bookName">Book Title</Label>
            <Input
              id="bookName"
              placeholder="e.g. Vocabulary book, Math textbook"
              value={bookName}
              onChange={(e) => setBookName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startPage">Start Page</Label>
              <Input
                id="startPage"
                type="number"
                min="1"
                value={startPage}
                onChange={(e) => setStartPage(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endPage">End Page</Label>
              <Input
                id="endPage"
                type="number"
                min="1"
                value={endPage}
                onChange={(e) => setEndPage(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Target Completion Settings</Label>
            <div className="flex bg-muted/40 p-1 rounded-lg border text-xs">
              <button
                type="button"
                className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                  targetType === 'days' ? 'bg-background shadow-xs' : 'text-muted-foreground'
                }`}
                onClick={() => setTargetType('days')}
              >
                By Days
              </button>
              <button
                type="button"
                className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                  targetType === 'date' ? 'bg-background shadow-xs' : 'text-muted-foreground'
                }`}
                onClick={() => setTargetType('date')}
              >
                By End Date
              </button>
            </div>

            {targetType === 'days' ? (
              <div className="space-y-2">
                <Label htmlFor="durationDays">Days to Complete</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="durationDays"
                    type="number"
                    min="1"
                    value={durationDays}
                    onChange={(e) => handleDaysChange(e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground shrink-0">
                    (Target End: {endDate})
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="endDate">Target End Date</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="endDate"
                    type="date"
                    min={selectedDate}
                    value={endDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground shrink-0">
                    ({durationDays} days)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between items-center gap-2">
          {currentProgress ? (
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
            <Button type="button" onClick={handleSave} disabled={!bookName.trim() || !endPage.trim()}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
