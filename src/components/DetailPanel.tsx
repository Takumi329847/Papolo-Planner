import React, { useState, useRef } from 'react';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { Category, DailyRecord, Mode, RecordItem, Assignment, BookProgress, WorkoutStepUp, WorkoutRestSchedule, GeneralPlanItem, Section, SectionColor } from '../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Coffee, Trash2, CalendarClock, AlertCircle, Circle, CheckCircle2, BookOpen, TrendingUp, Plus, X, Clock, Pencil, Check, FolderPlus, Palette, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { BookProgressModal } from './BookProgressModal';
import { WorkoutStepUpModal } from './WorkoutStepUpModal';
import { WorkoutRestScheduleModal } from './WorkoutRestScheduleModal';
import { calculateBookProgressForDate } from '../lib/bookProgress';
import { calculateWorkoutTargetForDate, isWorkoutProgressRestDay, isWorkoutGlobalRestDay } from '../lib/workoutProgress';
import { getCategoryAchievement } from '../lib/stats';

interface DetailPanelProps {
  mode: Mode;
  date: string;
  record: DailyRecord;
  categories: Category[];
  sections: Section[];
  onUpdateRecord: (date: string, newRecord: DailyRecord) => void;
  assignments: Assignment[];
  setAssignments: (assignments: Assignment[]) => void;
  bookProgresses: Record<string, BookProgress>;
  onUpdateBookProgress: (progress: BookProgress) => void;
  onDeleteBookProgress: (categoryId: string) => void;
  workoutStepUps: Record<string, WorkoutStepUp>;
  onUpdateWorkoutStepUp: (stepUp: WorkoutStepUp) => void;
  onDeleteWorkoutStepUp: (categoryId: string) => void;
  workoutRestSchedule?: WorkoutRestSchedule;
  onUpdateWorkoutRestSchedule: (schedule: WorkoutRestSchedule) => void;
  onDeleteWorkoutRestSchedule: () => void;
  records: Record<string, DailyRecord>;
  onAddSection: (name: string, color?: string) => void;
  onUpdateSection: (id: string, name: string, color?: string) => void;
  onDeleteSection: (id: string) => void;
}

export const COLOR_OPTIONS: { id: SectionColor; bg: string; text: string; bar: string }[] = [
  { id: 'indigo', bg: 'bg-indigo-50', text: 'text-indigo-600', bar: 'bg-indigo-500' },
  { id: 'amber', bg: 'bg-amber-50', text: 'text-amber-600', bar: 'bg-amber-500' },
  { id: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-600', bar: 'bg-emerald-500' },
  { id: 'rose', bg: 'bg-rose-50', text: 'text-rose-600', bar: 'bg-rose-500' },
  { id: 'sky', bg: 'bg-sky-50', text: 'text-sky-600', bar: 'bg-sky-500' },
  { id: 'violet', bg: 'bg-violet-50', text: 'text-violet-600', bar: 'bg-violet-500' },
  { id: 'teal', bg: 'bg-teal-50', text: 'text-teal-600', bar: 'bg-teal-500' },
  { id: 'fuchsia', bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', bar: 'bg-fuchsia-500' },
  { id: 'orange', bg: 'bg-orange-50', text: 'text-orange-600', bar: 'bg-orange-500' },
];

export function getSectionColorStyle(color: string) {
  const found = COLOR_OPTIONS.find(c => c.id === color);
  return found || { id: color, bg: 'bg-indigo-50', text: 'text-indigo-600', bar: 'bg-indigo-500' };
}

// Generate time options in 30-minute increments
const TIME_OPTIONS: string[] = [''];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

export function DetailPanel({
  mode,
  date,
  record,
  categories,
  sections,
  onUpdateRecord,
  assignments,
  setAssignments,
  bookProgresses,
  onUpdateBookProgress,
  onDeleteBookProgress,
  workoutStepUps,
  onUpdateWorkoutStepUp,
  onDeleteWorkoutStepUp,
  workoutRestSchedule,
  onUpdateWorkoutRestSchedule,
  onDeleteWorkoutRestSchedule,
  records,
  onAddSection,
  onUpdateSection,
  onDeleteSection,
}: DetailPanelProps) {
  const dateObj = parseISO(date);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [activeBookCategoryId, setActiveBookCategoryId] = useState<string | null>(null);
  const [isWorkoutStepUpModalOpen, setIsWorkoutStepUpModalOpen] = useState(false);
  const [activeWorkoutCategoryId, setActiveWorkoutCategoryId] = useState<string | null>(null);
  const [isRestScheduleModalOpen, setIsRestScheduleModalOpen] = useState(false);

  // Section editing states
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [tempSecName, setTempSecName] = useState('');
  const [tempSecColor, setTempSecColor] = useState<string>('indigo');

  // New section form state
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSecName, setNewSecName] = useState('');
  const [newSecColor, setNewSecColor] = useState<SectionColor>('indigo');

  // Carousel slider ref & scroll helper
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleStartEditSection = (sec: Section) => {
    setEditingSectionId(sec.id);
    setTempSecName(sec.name);
    setTempSecColor(sec.color);
  };

  const handleSaveSection = (id: string) => {
    if (tempSecName.trim()) {
      onUpdateSection(id, tempSecName.trim(), tempSecColor);
    }
    setEditingSectionId(null);
  };

  const handleCreateSection = () => {
    if (newSecName.trim()) {
      onAddSection(newSecName.trim(), newSecColor);
      setNewSecName('');
      setIsAddingSection(false);
    }
  };

  // ── General Plan helpers ──────────────────────────────────────────────────

  const generalPlanItems: GeneralPlanItem[] = Array.isArray(record.generalPlan)
    ? record.generalPlan
    : [];

  const handleAddPlanItem = () => {
    const newItem: GeneralPlanItem = { id: crypto.randomUUID(), time: '', text: '' };
    onUpdateRecord(date, { ...record, generalPlan: [...generalPlanItems, newItem] });
  };

  const handleUpdatePlanItem = (id: string, field: keyof GeneralPlanItem, value: string) => {
    const updated = generalPlanItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    onUpdateRecord(date, { ...record, generalPlan: updated });
  };

  const handleDeletePlanItem = (id: string) => {
    onUpdateRecord(date, {
      ...record,
      generalPlan: generalPlanItems.filter(item => item.id !== id),
    });
  };

  // ── Record item helpers ───────────────────────────────────────────────────

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateRecord(date, { ...record, notes: e.target.value });
  };

  const handleItemChange = (categoryId: string, field: keyof RecordItem, value: any) => {
    const currentItem = record.items[categoryId] || { categoryId, planValue: null, actualValue: null, isRest: false };
    onUpdateRecord(date, {
      ...record,
      items: { ...record.items, [categoryId]: { ...currentItem, [field]: value } },
    });
  };

  const handleClearItem = (categoryId: string) => {
    const newItems = { ...record.items };
    delete newItems[categoryId];
    onUpdateRecord(date, { ...record, items: newItems });
  };

  const studyCats = categories.filter(c => c.type === 'study');
  const workoutCats = categories.filter(c => c.type === 'workout');

  // Global rest day check for all workout items
  const isGlobalRestDay = workoutRestSchedule
    ? isWorkoutGlobalRestDay(date, workoutRestSchedule)
    : false;

  // Filter assignments relevant to the selected date
  const relevantAssignments = assignments
    .filter(a => {
      const due = parseISO(a.dueDate);
      const diff = differenceInCalendarDays(due, dateObj);
      return diff >= 0 && diff <= 3;
    })
    .sort((a, b) => differenceInCalendarDays(parseISO(a.dueDate), parseISO(b.dueDate)));

  // ── Render a single category row ──────────────────────────────────────────

  const renderInputItem = (cat: Category) => {
    const item = record.items[cat.id] || { categoryId: cat.id, planValue: null, actualValue: null, isRest: false };

    const progress = bookProgresses[cat.id];
    let calc = null;
    if (progress) calc = calculateBookProgressForDate(date, progress, records);

    const stepUp = workoutStepUps[cat.id];
    let stepUpTarget: number | null = null;
    if (stepUp) stepUpTarget = calculateWorkoutTargetForDate(date, stepUp, records);

    // Plan Mode
    if (mode === 'plan') {
      const isRestByStepUp = stepUp ? isWorkoutProgressRestDay(date, stepUp) : false;
      const isRestDay = item.isRest || isRestByStepUp || (cat.type === 'workout' && isGlobalRestDay);

      if (isRestDay) {
        return (
          <div key={cat.id} className="flex items-center space-x-3 mb-4">
            <Label className="w-24 text-right text-muted-foreground">{cat.name}</Label>
            <div className="flex-1 h-10 rounded-md border border-dashed border-muted-foreground/50 bg-muted/20 flex items-center justify-center text-muted-foreground text-sm font-medium">
              <Coffee className="w-4 h-4 mr-2" />
              Rest Day
              {isGlobalRestDay && !item.isRest && !isRestByStepUp && (
                <span className="ml-1 text-xs opacity-60">(Global)</span>
              )}
            </div>
            {/* Only show cancel button if manually set (not auto) */}
            {item.isRest && !isRestByStepUp && !isGlobalRestDay ? (
              <Button variant="ghost" size="icon" onClick={() => handleItemChange(cat.id, 'isRest', false)} title="Cancel Rest">
                <Trash2 className="w-4 h-4 text-muted-foreground" />
              </Button>
            ) : (
              <div className="w-10 text-[10px] text-muted-foreground font-medium text-center shrink-0">Auto</div>
            )}
          </div>
        );
      }

      const displayPlanValue = item.planValue === null
        ? (calc ? calc.targetPages : (stepUpTarget !== null ? stepUpTarget : ''))
        : item.planValue;

      return (
        <div key={cat.id} data-tour="input-fields" className="flex items-center space-x-2 mb-4">
          {/* Label column */}
          <div className="w-24 shrink-0 flex flex-col items-end pr-2 justify-center">
            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium">{cat.name}</span>
              {cat.type === 'study' && (
                <button
                  type="button"
                  data-tour="book-icon"
                  onClick={() => { setActiveBookCategoryId(cat.id); setIsBookModalOpen(true); }}
                  className={cn("p-0.5 rounded-sm hover:bg-muted text-muted-foreground transition-colors cursor-pointer", progress ? "text-indigo-600" : "")}
                  title="Book Progress Settings"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                </button>
              )}
              {cat.type === 'workout' && (
                <button
                  type="button"
                  data-tour="stepup-icon"
                  onClick={() => { setActiveWorkoutCategoryId(cat.id); setIsWorkoutStepUpModalOpen(true); }}
                  className={cn("p-0.5 rounded-sm hover:bg-muted text-muted-foreground transition-colors cursor-pointer", stepUp ? "text-amber-600" : "")}
                  title="Step-Up Workout Settings"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {progress && calc && (
              <span className="text-[10px] text-muted-foreground/60 mt-0.5 truncate max-w-full text-right" title={`${progress.bookName}: p.${calc.startPage} - p.${calc.planEndPage}`}>
                p.{calc.startPage} - {calc.planEndPage}
              </span>
            )}
          </div>

          {/* Detail input */}
          <Input
            className="flex-1"
            placeholder={
              progress
                ? `Plan for ${progress.bookName}`
                : (stepUp ? `${cat.name} (${stepUp.startValue}→${stepUp.targetValue} reps) ⚡` : "Detail e.g., Book 1")
            }
            value={
              item.description ||
              (progress
                ? progress.bookName
                : (stepUp ? `${cat.name} (${stepUp.startValue}→${stepUp.targetValue} reps)` : ''))
            }
            onChange={(e) => handleItemChange(cat.id, 'description', e.target.value)}
          />

          {/* Target input */}
          <div className="relative w-24 shrink-0">
            <Input
              type="number"
              min="0"
              className={cn("w-full", stepUpTarget !== null && item.planValue === null ? "pr-6" : "")}
              placeholder={calc ? `Rec: ${calc.targetPages}` : (stepUpTarget !== null ? `Rec: ${stepUpTarget}` : "Target")}
              value={displayPlanValue}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value, 10) : null;
                handleItemChange(cat.id, 'planValue', val);
              }}
            />
            {stepUpTarget !== null && item.planValue === null && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none text-xs" title="Step-up active">⚡</span>
            )}
          </div>

          {/* Workout: Rest Day button */}
          {cat.type === 'workout' && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleItemChange(cat.id, 'isRest', true)}
              title="Set Rest Day"
              className="shrink-0"
            >
              <Coffee className="w-4 h-4" />
            </Button>
          )}

          {/* Delete row button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleClearItem(cat.id)}
            title="Clear inputs for this category"
            className="shrink-0 text-muted-foreground/50 hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    // Actual Mode
    if (mode === 'actual') {
      const isRestByStepUp = stepUp ? isWorkoutProgressRestDay(date, stepUp) : false;
      const isRestDay = item.isRest || isRestByStepUp || (cat.type === 'workout' && isGlobalRestDay);

      if (isRestDay) {
        return (
          <div key={cat.id} className="flex items-center space-x-3 mb-4">
            <Label className="w-24 text-right text-muted-foreground">{cat.name}</Label>
            <div className="flex-1 h-10 rounded-md border border-emerald-200 bg-emerald-50 flex items-center justify-center text-emerald-700 text-sm font-medium">
              <Coffee className="w-4 h-4 mr-2" />
              Completed Rest
              {(isRestByStepUp || isGlobalRestDay) && !item.isRest && ' (Auto)'}
            </div>
          </div>
        );
      }

      const achievementStatus = getCategoryAchievement(cat, date, record, bookProgresses, workoutStepUps, workoutRestSchedule, records);
      const targetVal = achievementStatus.targetVal;
      const isAchieved = achievementStatus.isAchieved && achievementStatus.hasActivity;
      const isFailed = targetVal !== null && item.actualValue !== null && item.actualValue !== undefined && Number(item.actualValue) < targetVal;

      return (
        <div key={cat.id} className="flex items-center space-x-2 mb-4">
          <div className="w-24 shrink-0 flex flex-col items-end pr-2 justify-center">
            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium">{cat.name}</span>
              {cat.type === 'study' && (
                <button
                  type="button"
                  onClick={() => { setActiveBookCategoryId(cat.id); setIsBookModalOpen(true); }}
                  className={cn("p-0.5 rounded-sm hover:bg-muted text-muted-foreground transition-colors cursor-pointer", progress ? "text-indigo-600" : "")}
                  title="教材設定"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                </button>
              )}
              {cat.type === 'workout' && (
                <button
                  type="button"
                  onClick={() => { setActiveWorkoutCategoryId(cat.id); setIsWorkoutStepUpModalOpen(true); }}
                  className={cn("p-0.5 rounded-sm hover:bg-muted text-muted-foreground transition-colors cursor-pointer", stepUp ? "text-amber-600" : "")}
                  title="ステップアップ設定"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {progress && calc && (
              <span className="text-[10px] text-muted-foreground/60 mt-0.5 truncate max-w-full text-right">
                p.{calc.startPage} - {calc.actualEndPage || calc.planEndPage}
              </span>
            )}
          </div>
          <div
            className="flex-1 text-sm text-muted-foreground px-2 truncate flex items-center gap-2"
            title={item.description || (progress ? progress.bookName : (stepUp ? `${cat.name} (${stepUp.startValue}→${stepUp.targetValue} reps)` : ''))}
          >
            <span className="truncate">
              {item.description || (progress ? progress.bookName : (stepUp ? `${cat.name} (${stepUp.startValue}→${stepUp.targetValue} reps)` : <span className="opacity-50">No details</span>))}
            </span>
            {isAchieved && (
              <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0 h-5 shrink-0 gap-1 font-semibold shadow-xs">
                <Check className="w-3 h-3" />
                Achieved
              </Badge>
            )}
          </div>
          <div className="relative w-32 shrink-0">
            <Input
              type="number"
              min="0"
              className={cn(
                "w-full pr-12 transition-colors font-medium",
                isAchieved ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 focus-visible:ring-emerald-400" : "",
                isFailed ? "border-rose-300 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 focus-visible:ring-rose-300" : ""
              )}
              placeholder={targetVal !== null ? `Target: ${targetVal}` : "Actual"}
              value={item.actualValue === null || item.actualValue === undefined ? '' : item.actualValue}
              onChange={(e) => {
                const val = e.target.value !== '' ? parseInt(e.target.value, 10) : null;
                handleItemChange(cat.id, 'actualValue', val !== null && !isNaN(val) ? val : null);
              }}
            />
            {targetVal !== null && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none flex items-center space-x-0.5">
                {stepUpTarget !== null && item.planValue === null && <span className="text-amber-500">⚡</span>}
                <span>/ {targetVal}</span>
              </div>
            )}
          </div>
          {/* Delete row button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleClearItem(cat.id)}
            title="Clear inputs for this category"
            className="shrink-0 text-muted-foreground/50 hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      );
    }
  };

  const activeCategory = categories.find(c => c.id === activeBookCategoryId);
  const activeProgress = activeBookCategoryId ? bookProgresses[activeBookCategoryId] : undefined;
  const activeWCategory = categories.find(c => c.id === activeWorkoutCategoryId);
  const activeStepUp = activeWorkoutCategoryId ? workoutStepUps[activeWorkoutCategoryId] : undefined;

  // Sort plan items by time
  const sortedPlanItems = [...generalPlanItems].sort((a, b) => {
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });

  return (
    <>
      <div className="flex flex-col h-full bg-card rounded-xl border shadow-sm overflow-hidden">

        {/* Header */}
        <div className="p-6 border-b bg-muted/20">
          <h2 className="text-2xl font-bold tracking-tight">
            {format(dateObj, 'MMMM d, yyyy')}
            <span className="text-muted-foreground ml-2 text-lg font-medium">
              {format(dateObj, 'EEEE')}
            </span>
          </h2>

          {/* General Plan: multiple items with time */}
          <div data-tour="general-plan" className="mt-4 flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                General PLAN
              </Label>
              <button
                type="button"
                onClick={handleAddPlanItem}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {sortedPlanItems.length === 0 ? (
              <button
                type="button"
                onClick={handleAddPlanItem}
                className="w-full h-10 rounded-md border border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground/50 text-sm hover:border-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add plan...
              </button>
            ) : (
              <div className="space-y-2">
                {sortedPlanItems.map(item => (
                  <div key={item.id} className="flex items-center gap-2">
                    {/* Time selector */}
                    <select
                      value={item.time}
                      onChange={(e) => handleUpdatePlanItem(item.id, 'time', e.target.value)}
                      className="w-[90px] shrink-0 h-9 rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-muted-foreground"
                    >
                      {TIME_OPTIONS.map(t => (
                        <option key={t} value={t}>{t || '-- All day'}</option>
                      ))}
                    </select>
                    {/* Text input */}
                    <Input
                      className="flex-1 bg-background"
                      placeholder="Enter plan..."
                      value={item.text}
                      onChange={(e) => handleUpdatePlanItem(item.id, 'text', e.target.value)}
                    />
                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDeletePlanItem(item.id)}
                      className="shrink-0 p-1.5 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Relevant assignments */}
          {relevantAssignments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-dashed">
              <Label className="flex items-center text-muted-foreground mb-3">
                <CalendarClock className="w-4 h-4 mr-2" />
                Upcoming Assignments & Deadlines
              </Label>
              <div className="space-y-2">
                {relevantAssignments.map(assignment => {
                  const due = parseISO(assignment.dueDate);
                  const diff = differenceInCalendarDays(due, dateObj);
                  let badgeVariant: "default" | "destructive" | "secondary" | "outline" = "outline";
                  let diffText = "";
                  if (diff === 0) { badgeVariant = "destructive"; diffText = "Due Today"; }
                  else if (diff === 1) { badgeVariant = "default"; diffText = "Due Tomorrow"; }
                  else { badgeVariant = "secondary"; diffText = `Due in ${diff} days`; }

                  return (
                    <div key={assignment.id} className={cn("flex items-center justify-between bg-background p-2 rounded-md border text-sm transition-colors", assignment.isCompleted ? "opacity-50" : "")}>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setAssignments(assignments.map(a => a.id === assignment.id ? { ...a, isCompleted: !a.isCompleted } : a))}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {assignment.isCompleted ? <CheckCircle2 className="w-4 h-4 text-foreground" /> : <Circle className="w-4 h-4" />}
                        </button>
                        {diff === 0 && <AlertCircle className="w-4 h-4 text-destructive" />}
                        <span className={cn(diff === 0 ? "font-semibold text-destructive" : "font-medium", assignment.isCompleted && "line-through text-muted-foreground")}>
                          {assignment.title}
                        </span>
                      </div>
                      <Badge variant={badgeVariant} className="text-[10px]">{diffText}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col min-h-0">
          <div className="max-w-7xl mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 items-stretch">

            {/* Left Column: Dynamic Sections (Vertical Scroll Area ONLY for My Sections) */}
            <div className="lg:col-span-8 xl:col-span-8 flex flex-col h-full min-h-0 space-y-4 min-w-0">
              {/* Section Header */}
              <div className="flex items-center justify-between pb-2 border-b shrink-0">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  My Sections ({sections.length})
                </h3>

                <div className="flex items-center gap-2">
                  {!isAddingSection ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsAddingSection(true)}
                      className="h-8 text-xs gap-1.5 cursor-pointer hover:border-indigo-300"
                    >
                      <FolderPlus className="w-3.5 h-3.5 text-indigo-600" />
                      Add New Section
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsAddingSection(false)}
                      className="h-8 text-xs text-muted-foreground"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>

              {/* Add New Section Inline Form */}
              {isAddingSection && (
                <Card className="border-indigo-200 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-xs max-w-xl shrink-0">
                  <CardContent className="pt-4 space-y-3">
                    <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      <FolderPlus className="w-4 h-4 text-indigo-600" />
                      Create New Section
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Section Name</Label>
                      <Input
                        placeholder="e.g. Reading / Hobbies / Exam study..."
                        value={newSecName}
                        onChange={(e) => setNewSecName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateSection()}
                        className="h-9 text-sm bg-background"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Theme Color</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {COLOR_OPTIONS.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setNewSecColor(c.id)}
                            className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer",
                              c.bar,
                              newSecColor === c.id ? "ring-2 ring-offset-2 ring-primary scale-110" : "opacity-70 hover:opacity-100"
                            )}
                            title={c.id}
                          >
                            {newSecColor === c.id && <Check className="w-3 h-3 text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => setIsAddingSection(false)} className="h-8 text-xs">
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleCreateSection} disabled={!newSecName.trim()} className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                        Add Section
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Scrollable Container for My Sections */}
              <ScrollArea className="flex-1 pr-3 min-h-0">
                <div className="space-y-6 pb-4">
                  {sections.map((section) => {
                    const secStyle = getSectionColorStyle(section.color);
                    const secCats = categories.filter(c => c.type === section.id);
                    const isEditingThis = editingSectionId === section.id;
                    const isWorkoutSection = section.id === 'workout' || section.name.toLowerCase().includes('workout') || section.name.includes('筋トレ');

                    return (
                      <div key={section.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          {isEditingThis ? (
                            <div className="flex flex-col gap-2 w-full p-2.5 bg-muted/40 rounded-lg border">
                              <div className="flex items-center gap-2">
                                <span className={cn("w-2.5 h-6 rounded-full shrink-0", getSectionColorStyle(tempSecColor).bar)} />
                                <Input
                                  value={tempSecName}
                                  onChange={(e) => setTempSecName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveSection(section.id);
                                    if (e.key === 'Escape') setEditingSectionId(null);
                                  }}
                                  className="h-8 text-sm font-semibold"
                                  autoFocus
                                />
                                <Button size="icon" variant="ghost" onClick={() => handleSaveSection(section.id)} className="h-8 w-8 text-emerald-600 shrink-0">
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => setEditingSectionId(null)} className="h-8 w-8 text-muted-foreground shrink-0">
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                              {/* Color selector */}
                              <div className="flex items-center gap-1.5 pl-4">
                                <span className="text-[11px] text-muted-foreground mr-1">Color:</span>
                                {COLOR_OPTIONS.map((c) => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setTempSecColor(c.id)}
                                    className={cn(
                                      "w-4 h-4 rounded-full flex items-center justify-center transition-all cursor-pointer",
                                      c.bar,
                                      tempSecColor === c.id ? "ring-2 ring-offset-1 ring-primary scale-110" : "opacity-60 hover:opacity-100"
                                    )}
                                  />
                                ))}
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={cn("w-2.5 h-6 rounded-full shrink-0", secStyle.bar)} />
                                <h3
                                  className="text-base font-bold flex items-center gap-1.5 group cursor-pointer hover:opacity-80 transition-opacity truncate"
                                  onClick={() => handleStartEditSection(section)}
                                  title="Click to change section name & color"
                                >
                                  <span className="truncate">{section.name}</span>
                                  <Pencil className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity text-muted-foreground" />
                                </h3>

                                {/* Rest Day Indicator for workout */}
                                {isWorkoutSection && isGlobalRestDay && (
                                  <Badge variant="secondary" className="text-[10px] font-normal text-amber-700 bg-amber-100 shrink-0">
                                    <Coffee className="w-3 h-3 mr-1" />
                                    Rest Day
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {/* Global rest schedule button if workout */}
                                {isWorkoutSection && (
                                  <button
                                    type="button"
                                    data-tour="rest-schedule-btn"
                                    onClick={() => setIsRestScheduleModalOpen(true)}
                                    className={cn(
                                      "flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer",
                                      workoutRestSchedule
                                        ? "border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100"
                                        : "border-input text-muted-foreground hover:bg-muted"
                                    )}
                                    title="Workout Rest Schedule"
                                  >
                                    <Coffee className="w-3 h-3" />
                                    Rest Schedule
                                  </button>
                                )}

                                {/* Delete section button */}
                                {sections.length > 1 && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to delete section "${section.name}"?\n(Categories in this section will also be deleted)`)) {
                                        onDeleteSection(section.id);
                                      }
                                    }}
                                    className="h-7 w-7 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                                    title="Delete Section"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        <Card>
                          <CardContent className="pt-5">
                            {secCats.map(renderInputItem)}
                            {secCats.length === 0 && (
                              <div className="text-center py-4 text-muted-foreground text-xs space-y-1">
                                <p>No categories</p>
                                <p className="text-[10px] opacity-70">Add categories via Settings (⚙️)</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Right Column: Fixed Notes Section */}
            <section className="lg:col-span-4 xl:col-span-4 space-y-4 flex flex-col h-full min-h-0">
              <div className="flex items-center justify-between pb-2 border-b shrink-0">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center">
                  <span className="w-2 h-5 bg-teal-400 rounded-full mr-2"></span>
                  Notes & Reflections
                </h3>
              </div>
              <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <CardContent className="p-4 flex-1 flex flex-col min-h-0">
                  <Textarea
                    placeholder="Freely write any thoughts, context, or reflections here..."
                    className="flex-1 h-full min-h-[180px] resize-none text-sm"
                    value={record.notes || ''}
                    onChange={handleNotesChange}
                  />
                </CardContent>
              </Card>
            </section>

          </div>
        </div>
      </div>

      {/* Modals */}
      {activeBookCategoryId && activeCategory && (
        <BookProgressModal
          isOpen={isBookModalOpen}
          onClose={() => { setIsBookModalOpen(false); setActiveBookCategoryId(null); }}
          categoryId={activeBookCategoryId}
          categoryName={activeCategory.name}
          currentProgress={activeProgress}
          onSave={onUpdateBookProgress}
          onDelete={onDeleteBookProgress}
          selectedDate={date}
        />
      )}

      {activeWorkoutCategoryId && activeWCategory && (
        <WorkoutStepUpModal
          isOpen={isWorkoutStepUpModalOpen}
          onClose={() => { setIsWorkoutStepUpModalOpen(false); setActiveWorkoutCategoryId(null); }}
          categoryId={activeWorkoutCategoryId}
          categoryName={activeWCategory.name}
          currentStepUp={activeStepUp}
          onSave={onUpdateWorkoutStepUp}
          onDelete={onDeleteWorkoutStepUp}
          selectedDate={date}
        />
      )}

      <WorkoutRestScheduleModal
        isOpen={isRestScheduleModalOpen}
        onClose={() => setIsRestScheduleModalOpen(false)}
        currentSchedule={workoutRestSchedule}
        onSave={onUpdateWorkoutRestSchedule}
        onDelete={onDeleteWorkoutRestSchedule}
        selectedDate={date}
      />
    </>
  );
}
