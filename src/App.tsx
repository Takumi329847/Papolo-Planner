import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Mode, Category, DailyRecord, Assignment, BookProgress, WorkoutStepUp, WorkoutRestSchedule, GeneralPlanItem, LongTermGoal, Section } from './types';
import { defaultCategories, defaultSections } from './data';
import { db } from './db';
import { Timeline } from './components/Timeline';
import { CalendarView } from './components/CalendarView';
import { DetailPanel } from './components/DetailPanel';
import { ReportModal } from './components/ReportModal';
import { SettingsModal } from './components/SettingsModal';
import { AssignmentsView } from './components/AssignmentsView';
import { LongTermGoalsCard } from './components/LongTermGoalsCard';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BarChart3, Settings, ListTodo, Loader2, HelpCircle } from 'lucide-react';
import { TutorialModal } from './components/TutorialModal';
import { GuidedTour } from './components/GuidedTour';
import { cn } from '@/lib/utils';

/** 旧フォーマット(string)を新フォーマットに変換 */
function migrateGeneralPlan(gp: unknown): GeneralPlanItem[] {
  if (Array.isArray(gp)) return gp as GeneralPlanItem[];
  if (typeof gp === 'string' && gp.trim() !== '') {
    return [{ id: crypto.randomUUID(), time: '', text: gp }];
  }
  return [];
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  const [mode, setMode] = useState<Mode>('plan');
  const [currentView, setCurrentView] = useState<'main' | 'assignments'>('main');
  const [leftView, setLeftView] = useState<'list' | 'calendar'>('list');

  const [sections, setSections] = useState<Section[]>(defaultSections);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [longTermGoals, setLongTermGoals] = useState<LongTermGoal[]>([]);
  const [bookProgresses, setBookProgresses] = useState<Record<string, BookProgress>>({});
  const [workoutStepUps, setWorkoutStepUps] = useState<Record<string, WorkoutStepUp>>({});
  const [workoutRestSchedule, setWorkoutRestSchedule] = useState<WorkoutRestSchedule | undefined>(undefined);
  const [records, setRecords] = useState<Record<string, DailyRecord>>({});

  const handleAddSection = useCallback(async (name: string, color: string = 'indigo') => {
    if (!name.trim()) return;
    const newSec: Section = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      color,
    };
    setSections(prev => [...prev, newSec]);
    await db.sections.put(newSec);
  }, []);

  const handleUpdateSection = useCallback(async (id: string, name: string, color?: string) => {
    setSections(prev => prev.map(s => {
      if (s.id === id) {
        const updated = { ...s, name: name.trim() || s.name, color: color || s.color };
        db.sections.put(updated);
        return updated;
      }
      return s;
    }));
  }, []);

  const handleDeleteSection = useCallback(async (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
    await db.sections.delete(id);

    // Delete categories associated with this section
    const catsToDelete = categories.filter(c => c.type === id);
    for (const c of catsToDelete) {
      await db.categories.delete(c.id);
    }
    setCategories(prev => prev.filter(c => c.type !== id));
  }, [categories]);

  const todayString = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState<string>(todayString);

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Check if first time user to auto-open interactive pointing tour
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('papolo_tour_completed');
    if (!hasSeenTour) {
      // Short delay so DOM mounts completely
      const timer = setTimeout(() => setIsTourOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // ── Load all data from IndexedDB on first mount ──────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [
          dbSections,
          dbCategories,
          dbAssignments,
          dbBookProgresses,
          dbWorkoutStepUps,
          dbRecords,
          dbRestSchedules,
          dbLongTermGoals,
        ] = await Promise.all([
          db.sections.toArray(),
          db.categories.toArray(),
          db.assignments.toArray(),
          db.bookProgresses.toArray(),
          db.workoutStepUps.toArray(),
          db.records.toArray(),
          db.workoutRestSchedule.toArray(),
          db.longTermGoals.toArray(),
        ]);

        if (dbSections.length > 0) {
          setSections(dbSections);
        } else {
          // Initialize default sections
          let initialSecs = defaultSections;
          try {
            const savedTitles = localStorage.getItem('attune_section_titles');
            if (savedTitles) {
              const parsed = JSON.parse(savedTitles);
              initialSecs = [
                { id: 'study', name: parsed.study || 'Study', color: 'indigo' },
                { id: 'workout', name: 'Workout', color: 'amber' },
              ];
            }
          } catch (e) {
            console.error(e);
          }
          setSections(initialSecs);
          await db.sections.bulkPut(initialSecs);
        }

        if (dbCategories.length > 0) {
          setCategories(dbCategories);
        } else {
          await db.categories.bulkPut(defaultCategories);
        }

        setAssignments(dbAssignments);
        setLongTermGoals(dbLongTermGoals);

        const bpMap: Record<string, BookProgress> = {};
        dbBookProgresses.forEach(bp => { bpMap[bp.categoryId] = bp; });
        setBookProgresses(bpMap);

        const suMap: Record<string, WorkoutStepUp> = {};
        dbWorkoutStepUps.forEach(su => { suMap[su.categoryId] = su; });
        setWorkoutStepUps(suMap);

        const globalSchedule = dbRestSchedules.find(s => s.id === 'global');
        if (globalSchedule) setWorkoutRestSchedule(globalSchedule);

        const recMap: Record<string, DailyRecord> = {};
        for (const r of dbRecords) {
          const migrated: DailyRecord = {
            ...r,
            generalPlan: migrateGeneralPlan(r.generalPlan),
          };
          recMap[r.date] = migrated;
          if (!Array.isArray(r.generalPlan)) {
            await db.records.put(migrated);
          }
        }
        setRecords(recMap);
      } catch (err) {
        console.error('Failed to load from IndexedDB:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ── Persist helpers ───────────────────────────────────────────────────────

  const handleUpdateRecord = useCallback(async (date: string, newRecord: DailyRecord) => {
    setRecords(prev => ({ ...prev, [date]: newRecord }));
    await db.records.put(newRecord);
  }, []);

  const handleUpdateBookProgress = useCallback(async (progress: BookProgress) => {
    setBookProgresses(prev => ({ ...prev, [progress.categoryId]: progress }));
    await db.bookProgresses.put(progress);
  }, []);

  const handleDeleteBookProgress = useCallback(async (categoryId: string) => {
    setBookProgresses(prev => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });
    await db.bookProgresses.delete(categoryId);
  }, []);

  const handleUpdateWorkoutStepUp = useCallback(async (stepUp: WorkoutStepUp) => {
    setWorkoutStepUps(prev => ({ ...prev, [stepUp.categoryId]: stepUp }));
    await db.workoutStepUps.put(stepUp);
  }, []);

  const handleDeleteWorkoutStepUp = useCallback(async (categoryId: string) => {
    setWorkoutStepUps(prev => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });
    await db.workoutStepUps.delete(categoryId);
  }, []);

  const handleUpdateWorkoutRestSchedule = useCallback(async (schedule: WorkoutRestSchedule) => {
    setWorkoutRestSchedule(schedule);
    await db.workoutRestSchedule.put(schedule);
  }, []);

  const handleDeleteWorkoutRestSchedule = useCallback(async () => {
    setWorkoutRestSchedule(undefined);
    await db.workoutRestSchedule.delete('global');
  }, []);

  const handleSetAssignments = useCallback(
    async (valueOrUpdater: Assignment[] | ((prev: Assignment[]) => Assignment[])) => {
      setAssignments(prev => {
        const next =
          typeof valueOrUpdater === 'function' ? valueOrUpdater(prev) : valueOrUpdater;
        (async () => {
          try {
            const existingIds = prev.map(a => a.id);
            const nextIds = next.map(a => a.id);
            const deleted = existingIds.filter(id => !nextIds.includes(id));
            await db.assignments.bulkPut(next);
            if (deleted.length) await db.assignments.bulkDelete(deleted);
          } catch (err) {
            console.error('Failed to persist assignments:', err);
          }
        })();
        return next;
      });
    },
    []
  );

  const handleSetLongTermGoals = useCallback(
    async (valueOrUpdater: LongTermGoal[] | ((prev: LongTermGoal[]) => LongTermGoal[])) => {
      setLongTermGoals(prev => {
        const next =
          typeof valueOrUpdater === 'function' ? valueOrUpdater(prev) : valueOrUpdater;
        (async () => {
          try {
            const existingIds = prev.map(g => g.id);
            const nextIds = next.map(g => g.id);
            const deleted = existingIds.filter(id => !nextIds.includes(id));
            await db.longTermGoals.bulkPut(next);
            if (deleted.length) await db.longTermGoals.bulkDelete(deleted);
          } catch (err) {
            console.error('Failed to persist longTermGoals:', err);
          }
        })();
        return next;
      });
    },
    []
  );

  const handleSetCategories = useCallback(
    async (valueOrUpdater: Category[] | ((prev: Category[]) => Category[])) => {
      setCategories(prev => {
        const next =
          typeof valueOrUpdater === 'function' ? valueOrUpdater(prev) : valueOrUpdater;
        (async () => {
          try {
            const existingIds = prev.map(c => c.id);
            const nextIds = next.map(c => c.id);
            const deleted = existingIds.filter(id => !nextIds.includes(id));
            await db.categories.bulkPut(next);
            if (deleted.length) await db.categories.bulkDelete(deleted);
          } catch (err) {
            console.error('Failed to persist categories:', err);
          }
        })();
        return next;
      });
    },
    []
  );

  // ── Loading screen ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm font-medium">データを読み込んでいます…</span>
        </div>
      </div>
    );
  }

  // ── Derived state ─────────────────────────────────────────────────────────
  const selectedRecord = records[selectedDate] || {
    date: selectedDate,
    generalPlan: [],
    items: {},
    hasAssignments: false,
  };

  const handleGoToToday = () => {
    setSelectedDate(todayString);
    if (currentView !== 'main') setCurrentView('main');
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground flex flex-col font-sans">

      {/* Top Navbar */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b shrink-0 h-16">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div
            onClick={handleGoToToday}
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity select-none"
            title="Go to today"
          >
            <img src="/logo.svg" alt="Papolo Logo" className="w-8 h-8 object-contain shrink-0" />
            <span className="font-bold text-xl tracking-tight hidden sm:inline-block">Papolo</span>
          </div>

          <div className="flex items-center space-x-6">
            {/* Mode Toggle */}
            <div data-tour="mode-toggle" className="flex items-center space-x-3 bg-muted/30 px-3 py-1.5 rounded-full border">
              <Label
                htmlFor="mode-toggle"
                className={cn("cursor-pointer font-medium transition-colors", mode === 'plan' ? "text-foreground" : "text-muted-foreground")}
              >
                Plan 📅
              </Label>
              <Switch
                id="mode-toggle"
                checked={mode === 'actual'}
                onCheckedChange={(c) => {
                  setMode(c ? 'actual' : 'plan');
                  if (c) setSelectedDate(todayString);
                }}
              />
              <Label
                htmlFor="mode-toggle"
                className={cn("cursor-pointer font-medium transition-colors", mode === 'actual' ? "text-emerald-600" : "text-muted-foreground")}
              >
                Actual ✅
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Button data-tour="guide-btn" variant="outline" size="sm" onClick={() => setIsTourOpen(true)} className="hidden md:flex">
                <HelpCircle className="w-4 h-4 mr-1.5 text-indigo-500" />
                Guide 💡
              </Button>
              <Button data-tour="assignments-btn" variant="outline" size="sm" onClick={() => setCurrentView(currentView === 'assignments' ? 'main' : 'assignments')} className="hidden sm:flex">
                <ListTodo className="w-4 h-4 mr-2" />
                {currentView === 'assignments' ? 'Timeline' : 'Assignments'}
              </Button>
              <Button data-tour="report-btn" variant="outline" size="sm" onClick={() => setIsReportOpen(true)} className="hidden sm:flex">
                <BarChart3 className="w-4 h-4 mr-2" />
                Report 📈
              </Button>
              <Button data-tour="settings-btn" variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
                <Settings className="w-5 h-5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      {currentView === 'assignments' ? (
        <AssignmentsView
          assignments={assignments}
          setAssignments={handleSetAssignments}
          onClose={() => setCurrentView('main')}
        />
      ) : (
        <main className="flex-1 max-w-7xl mx-auto w-full flex overflow-hidden p-4 min-h-0">

          {/* Left Column: Long-term Goals + Timeline / Calendar */}
          <div className="w-full max-w-[320px] hidden md:flex flex-col h-full pr-4 min-h-0 space-y-3 overflow-hidden">
            {/* Long-term Goals Card */}
            <div data-tour="goals-card">
              <LongTermGoalsCard
                goals={longTermGoals}
                onUpdateGoals={handleSetLongTermGoals}
              />
            </div>

            {/* View Toggle Tabs */}
            <div data-tour="view-switcher" className="flex bg-muted/40 p-1 rounded-lg border shrink-0">
              <Button
                variant={leftView === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(
                  "flex-1 text-xs py-1.5 h-8 font-medium transition-all cursor-pointer",
                  leftView === 'list' ? "bg-background shadow-xs font-semibold" : "text-muted-foreground"
                )}
                onClick={() => setLeftView('list')}
              >
                List ☰
              </Button>
              <Button
                variant={leftView === 'calendar' ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(
                  "flex-1 text-xs py-1.5 h-8 font-medium transition-all cursor-pointer",
                  leftView === 'calendar' ? "bg-background shadow-xs font-semibold" : "text-muted-foreground"
                )}
                onClick={() => setLeftView('calendar')}
              >
                Calendar 🗓️
              </Button>
            </div>

            {/* Timeline or Calendar */}
            <div className="flex-1 min-h-0 h-full flex flex-col overflow-hidden">
              {leftView === 'list' ? (
                <Timeline
                  records={records}
                  categories={categories}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  mode={mode}
                  assignments={assignments}
                  sections={sections}
                  bookProgresses={bookProgresses}
                  workoutStepUps={workoutStepUps}
                  workoutRestSchedule={workoutRestSchedule}
                />
              ) : (
                <CalendarView
                  records={records}
                  categories={categories}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  mode={mode}
                  assignments={assignments}
                  bookProgresses={bookProgresses}
                  workoutStepUps={workoutStepUps}
                  workoutRestSchedule={workoutRestSchedule}
                  sections={sections}
                />
              )}
            </div>
          </div>

          {/* Right Column: Detail Panel */}
          <div className="flex-1 min-w-0 flex flex-col h-full min-h-0">
            <DetailPanel
              mode={mode}
              date={selectedDate}
              record={selectedRecord}
              categories={categories}
              sections={sections}
              onUpdateRecord={handleUpdateRecord}
              assignments={assignments}
              setAssignments={handleSetAssignments}
              bookProgresses={bookProgresses}
              onUpdateBookProgress={handleUpdateBookProgress}
              onDeleteBookProgress={handleDeleteBookProgress}
              workoutStepUps={workoutStepUps}
              onUpdateWorkoutStepUp={handleUpdateWorkoutStepUp}
              onDeleteWorkoutStepUp={handleDeleteWorkoutStepUp}
              workoutRestSchedule={workoutRestSchedule}
              onUpdateWorkoutRestSchedule={handleUpdateWorkoutRestSchedule}
              onDeleteWorkoutRestSchedule={handleDeleteWorkoutRestSchedule}
              records={records}
              onAddSection={handleAddSection}
              onUpdateSection={handleUpdateSection}
              onDeleteSection={handleDeleteSection}
            />
          </div>

        </main>
      )}

      {/* Modals */}
      <GuidedTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        records={records}
        categories={categories}
        bookProgresses={bookProgresses}
        workoutStepUps={workoutStepUps}
        workoutRestSchedule={workoutRestSchedule}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        categories={categories}
        setCategories={handleSetCategories}
        sections={sections}
        onAddSection={handleAddSection}
        onUpdateSection={handleUpdateSection}
        onDeleteSection={handleDeleteSection}
        onOpenTutorial={() => setIsTutorialOpen(true)}
      />
    </div>
  );
}
