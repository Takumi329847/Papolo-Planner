import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  ListTodo,
  CheckCircle2,
  BookOpen,
  Dumbbell,
  Target,
  BarChart3,
  Settings,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  HelpCircle,
  Clock,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to Papolo! 👋',
    subtitle: 'Your Excel-like vertical calendar for Study & Workout tracking',
    icon: Sparkles,
    color: 'from-indigo-500 to-purple-600',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm leading-relaxed">
          Papolo helps you bridge the gap between <strong>what you plan</strong> and <strong>what you actually achieve</strong>.
          Whether preparing for exams, reading books, or building workout habits, Papolo keeps you structured and accountable.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-lg border bg-card/60 space-y-1">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs">
              <Calendar className="w-4 h-4" />
              <span>Smart Scheduling</span>
            </div>
            <p className="text-xs text-muted-foreground">Auto-calculate book pages, step-up reps, and rest days.</p>
          </div>
          <div className="p-3 rounded-lg border bg-card/60 space-y-1">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Achievement Verification</span>
            </div>
            <p className="text-xs text-muted-foreground">Automatic "Achieved" badges when actual progress meets target.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'modes',
    title: 'Plan Mode vs. Record Mode',
    subtitle: 'Switch seamlessly between setting targets and logging progress',
    icon: Target,
    color: 'from-blue-500 to-indigo-600',
    content: (
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Use the top switch to toggle between <strong>Plan Mode</strong> and <strong>Record Mode</strong>:
        </p>

        <div className="space-y-3">
          <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Plan Mode
              </span>
              <Badge variant="outline" className="text-[10px] bg-background">Before the day starts</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Set target pages, rep goals, and block out daily time schedules.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Record Mode
              </span>
              <Badge variant="outline" className="text-[10px] bg-background">During/After the day</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter your actual pages or reps completed. Papolo compares it against your plan and grants an <strong>Achieved</strong> badge when targets are reached!
            </p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'navigation',
    title: 'Timeline & Calendar Views',
    subtitle: 'Browse daily vertical schedules or month-at-a-glance grids',
    icon: Calendar,
    color: 'from-amber-500 to-orange-600',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border bg-card space-y-2">
            <div className="flex items-center gap-2 font-medium text-xs">
              <ListTodo className="w-4 h-4 text-amber-500" />
              <span>Vertical Timeline</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Scroll day-by-day with colored status badges showing section progress at a glance.
            </p>
          </div>

          <div className="p-3 rounded-lg border bg-card space-y-2">
            <div className="flex items-center gap-2 font-medium text-xs">
              <Calendar className="w-4 h-4 text-orange-500" />
              <span>Month Calendar</span>
            </div>
            <p className="text-xs text-muted-foreground">
              View full month grids with completion dots showing overall daily consistency.
            </p>
          </div>
        </div>

        <div className="p-2.5 rounded-md bg-muted/60 text-xs text-muted-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Click any date on the Timeline or Calendar to immediately open its details on the right panel.</span>
        </div>
      </div>
    )
  },
  {
    id: 'automated',
    title: 'Smart Progress Trackers',
    subtitle: 'Automate book reading goals and progressive workout schedules',
    icon: BookOpen,
    color: 'from-emerald-500 to-teal-600',
    content: (
      <div className="space-y-3">
        <div className="p-3 rounded-lg border bg-card flex items-start gap-3">
          <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-semibold text-xs">Book Progress Calculator</h4>
            <p className="text-xs text-muted-foreground">
              Set total pages and target end dates. Papolo automatically calculates daily page targets based on remaining pages.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg border bg-card flex items-start gap-3">
          <div className="p-2 rounded-md bg-teal-100 dark:bg-teal-950/60 text-teal-600 shrink-0">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-semibold text-xs">Step-Up Workouts & Rest Days</h4>
            <p className="text-xs text-muted-foreground">
              Configure start reps, goal reps, and step-up frequencies. Mark specific days or globally scheduled rest days effortlessly.
            </p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'assignments_reports',
    title: 'Assignments, Goals & Reports',
    subtitle: 'Stay ahead of deadlines and analyze performance stats',
    icon: BarChart3,
    color: 'from-purple-500 to-pink-600',
    content: (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border bg-card space-y-1">
            <span className="font-semibold text-xs flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
              <ListTodo className="w-3.5 h-3.5" />
              Assignments View
            </span>
            <p className="text-xs text-muted-foreground">
              Manage school homework or work tasks with subject filters and deadline indicators.
            </p>
          </div>

          <div className="p-3 rounded-lg border bg-card space-y-1">
            <span className="font-semibold text-xs flex items-center gap-1.5 text-pink-600 dark:text-pink-400">
              <BarChart3 className="w-3.5 h-3.5" />
              Progress Report
            </span>
            <p className="text-xs text-muted-foreground">
              Open the Report modal anytime to inspect achievement rates, total items completed, and rest day ratios.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg border bg-card space-y-1">
          <span className="font-semibold text-xs flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
            <Settings className="w-3.5 h-3.5" />
            Custom Sections in Settings
          </span>
          <p className="text-xs text-muted-foreground">
            Add custom categories or brand new sections beyond Study & Workout (e.g., Reading, Coding, Habits) with personalized colors.
          </p>
        </div>
      </div>
    )
  }
];

export function TutorialModal({ isOpen, onClose, onComplete }: TutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const step = steps[currentStep];
  const StepIcon = step.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('papolo_tutorial_completed', 'true');
    if (onComplete) onComplete();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md sm:max-w-lg p-0 overflow-hidden rounded-xl border">
        {/* Header gradient banner */}
        <div className={`p-6 text-white bg-gradient-to-r ${step.color} transition-all duration-300 relative`}>
          <div className="flex items-center justify-between mb-3">
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 text-[11px] font-medium backdrop-blur-xs">
              Step {currentStep + 1} of {steps.length}
            </Badge>

            <button
              onClick={handleFinish}
              className="text-xs text-white/80 hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
            >
              Skip Tutorial
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
              <StepIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white tracking-tight">
                {step.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-white/85 mt-0.5">
                {step.subtitle}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Step Body */}
        <div className="p-6 min-h-[220px] flex flex-col justify-between bg-background">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              {step.content}
            </motion.div>
          </AnimatePresence>

          {/* Indicators and Navigation */}
          <div className="pt-6 mt-4 border-t flex items-center justify-between">
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentStep
                      ? 'w-6 bg-primary'
                      : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            {/* Nav Buttons */}
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={handlePrev} className="h-8 text-xs gap-1">
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Back
                </Button>
              )}

              <Button size="sm" onClick={handleNext} className="h-8 text-xs gap-1 bg-primary text-primary-foreground">
                {currentStep === steps.length - 1 ? (
                  <>
                    <span>Get Started</span>
                    <Check className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
