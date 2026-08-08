import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  HelpCircle,
  Check,
  Target,
  BarChart3,
  Settings,
  ListTodo,
  Calendar,
  BookOpen,
  Dumbbell,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface TourStep {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  badge?: string;
  preferredPosition?: 'top' | 'bottom' | 'left' | 'right';
  icon?: React.ElementType;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'mode-toggle',
    targetSelector: '[data-tour="mode-toggle"]',
    title: '1. Plan Mode vs. Actual Mode',
    description: 'Toggle between "Plan" mode (to set target pages, reps, and time blocks before your day starts) and "Actual" mode (to log completed study/workouts and earn "Achieved" badges).',
    badge: 'Core Switch',
    preferredPosition: 'bottom',
    icon: Target,
  },
  {
    id: 'book-icon',
    targetSelector: '[data-tour="book-icon"]',
    title: '2. Book Progress Calculator (📖 Icon)',
    description: 'Click this 📖 icon next to any Study category (like English, Math, or Physics) to set your book\'s total page count and target completion date. Papolo automatically calculates required daily pages!',
    badge: 'Circled Feature 📖',
    preferredPosition: 'bottom',
    icon: BookOpen,
  },
  {
    id: 'stepup-icon',
    targetSelector: '[data-tour="stepup-icon"]',
    title: '3. Step-Up Workout Settings (💪 Icon)',
    description: 'Click the step-up icon next to any Workout category (like Plank or Push-ups) to set starting reps, target goals, and progressive step increments (e.g. +5 reps every 3 days).',
    badge: 'Workout Goal',
    preferredPosition: 'bottom',
    icon: Dumbbell,
  },
  {
    id: 'rest-schedule-btn',
    targetSelector: '[data-tour="rest-schedule-btn"]',
    title: '4. Workout Rest Schedule (☕ Button)',
    description: 'Click "Rest Schedule" to configure recurring rest days (e.g. every Sunday or every 4 days). Papolo will automatically flag rest days in your calendar.',
    badge: 'Rest Days',
    preferredPosition: 'bottom',
    icon: Clock,
  },
  {
    id: 'general-plan',
    targetSelector: '[data-tour="general-plan"]',
    title: '5. Daily Schedule & Time Blocks',
    description: 'Add time-blocked daily schedules (e.g., "09:00 - English Chapter 1") or general notes at the top of your daily panel.',
    badge: 'Schedule',
    preferredPosition: 'left',
    icon: Clock,
  },
  {
    id: 'assignments-btn',
    targetSelector: '[data-tour="assignments-btn"]',
    title: '6. Homework & Assignments View',
    description: 'Switch to the dedicated Assignments tab to manage homework tasks, due dates, and subject tags with countdown badges.',
    badge: 'Task Manager',
    preferredPosition: 'bottom',
    icon: ListTodo,
  },
  {
    id: 'report-btn',
    targetSelector: '[data-tour="report-btn"]',
    title: '7. Progress Analytics & Report',
    description: 'Open your performance report showing target completion percentages, total items completed, and rest day ratios.',
    badge: 'Analytics',
    preferredPosition: 'bottom',
    icon: BarChart3,
  },
  {
    id: 'settings-btn',
    targetSelector: '[data-tour="settings-btn"]',
    title: '8. Custom Sections & Settings',
    description: 'Add or modify custom sections (e.g. Study, Workout, Reading, Habits) with personalized theme colors and categories.',
    badge: 'Customize',
    preferredPosition: 'bottom',
    icon: Settings,
  },
  {
    id: 'view-switcher',
    targetSelector: '[data-tour="view-switcher"]',
    title: '9. Timeline & Calendar Switcher',
    description: 'Toggle the left sidebar between a day-by-day vertical Timeline list and a full month Calendar grid.',
    badge: 'Navigation',
    preferredPosition: 'right',
    icon: Calendar,
  },
  {
    id: 'goals-card',
    targetSelector: '[data-tour="goals-card"]',
    title: '10. Long-Term Milestone Goals',
    description: 'Register key milestone goals (e.g. "Pass Exam", "Read 10 Books") with target dates to keep your long-term focus clear.',
    badge: 'Milestones',
    preferredPosition: 'right',
    icon: Sparkles,
  },
  {
    id: 'guide-btn',
    targetSelector: '[data-tour="guide-btn"]',
    title: '11. Guide Button 💡',
    description: 'Click "Guide 💡" at any time to replay this step-by-step interactive tour whenever you need a refresher!',
    badge: 'Replay Anytime',
    preferredPosition: 'bottom',
    icon: HelpCircle,
  },
];

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GuidedTour({ isOpen, onClose }: GuidedTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = TOUR_STEPS[currentStepIndex];

  // Update target element's bounding rect
  const updateTargetRect = useCallback(() => {
    if (!isOpen || !step) return;

    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [isOpen, step]);

  useEffect(() => {
    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);

    const interval = setInterval(updateTargetRect, 200);

    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
      clearInterval(interval);
    };
  }, [updateTargetRect]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('papolo_tour_completed', 'true');
    onClose();
  };

  // Calculate popover positioning relative to targetRect
  let popoverStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 100,
  };

  let arrowStyle: React.CSSProperties = {};
  let arrowClass = '';

  if (targetRect) {
    const margin = 16;
    const popoverWidth = 360;
    const popoverHeight = 220;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let position = step.preferredPosition || 'bottom';

    // Auto-fallback if standard position overflows
    if (position === 'bottom' && targetRect.bottom + popoverHeight + margin > windowHeight) {
      position = 'top';
    } else if (position === 'top' && targetRect.top - popoverHeight - margin < 0) {
      position = 'bottom';
    } else if (position === 'right' && targetRect.right + popoverWidth + margin > windowWidth) {
      position = 'left';
    } else if (position === 'left' && targetRect.left - popoverWidth - margin < 0) {
      position = 'bottom';
    }

    if (position === 'bottom') {
      popoverStyle = {
        position: 'fixed',
        top: Math.min(targetRect.bottom + margin, windowHeight - popoverHeight - 10),
        left: Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - popoverWidth / 2, windowWidth - popoverWidth - 16)),
        zIndex: 100,
      };
      arrowClass = 'border-b-indigo-600 -top-3 left-1/2 -translate-x-1/2 border-x-transparent border-t-transparent border-b-8 border-x-8';
    } else if (position === 'top') {
      popoverStyle = {
        position: 'fixed',
        bottom: Math.min(windowHeight - targetRect.top + margin, windowHeight - 10),
        left: Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - popoverWidth / 2, windowWidth - popoverWidth - 16)),
        zIndex: 100,
      };
      arrowClass = 'border-t-indigo-600 -bottom-3 left-1/2 -translate-x-1/2 border-x-transparent border-b-transparent border-t-8 border-x-8';
    } else if (position === 'right') {
      popoverStyle = {
        position: 'fixed',
        top: Math.max(16, Math.min(targetRect.top + targetRect.height / 2 - popoverHeight / 2, windowHeight - popoverHeight - 16)),
        left: Math.min(targetRect.right + margin, windowWidth - popoverWidth - 16),
        zIndex: 100,
      };
      arrowClass = 'border-r-indigo-600 -left-3 top-1/2 -translate-y-1/2 border-y-transparent border-l-transparent border-r-8 border-y-8';
    } else if (position === 'left') {
      popoverStyle = {
        position: 'fixed',
        top: Math.max(16, Math.min(targetRect.top + targetRect.height / 2 - popoverHeight / 2, windowHeight - popoverHeight - 16)),
        right: Math.min(windowWidth - targetRect.left + margin, windowWidth - 10),
        zIndex: 100,
      };
      arrowClass = 'border-l-indigo-600 -right-3 top-1/2 -translate-y-1/2 border-y-transparent border-r-transparent border-l-8 border-y-8';
    }
  }

  const StepIcon = step.icon || Sparkles;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none pointer-events-auto">
      {/* Crisp overlay backdrop with spotlight cutout */}
      <div className="absolute inset-0 bg-black/35 transition-all duration-300">
        {targetRect && (
          <div
            className="absolute transition-all duration-300 rounded-xl ring-4 ring-indigo-500 ring-offset-2 ring-offset-black/20 shadow-2xl bg-transparent pointer-events-none"
            style={{
              top: targetRect.top - 6,
              left: targetRect.left - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.40)',
            }}
          />
        )}
      </div>

      {/* Popover Card */}
      <div style={popoverStyle} className="w-[360px] max-w-[calc(100vw-32px)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.2 }}
            className="relative bg-card dark:bg-zinc-900 border border-indigo-500/30 shadow-2xl rounded-2xl overflow-hidden"
          >
            {/* Visual Arrow pointing at target */}
            {targetRect && (
              <div
                className={`absolute w-0 h-0 border-solid ${arrowClass}`}
                style={arrowStyle}
              />
            )}

            {/* Top Bar */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-xs">
                  <StepIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xs tracking-tight text-white leading-none">
                    {step.title}
                  </h3>
                  <span className="text-[10px] text-white/80">
                    Step {currentStepIndex + 1} of {TOUR_STEPS.length}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {step.badge && (
                  <Badge className="bg-white/20 text-white text-[10px] font-normal border-0 py-0 h-5">
                    {step.badge}
                  </Badge>
                )}
                <button
                  onClick={handleComplete}
                  className="text-white/70 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                  title="Close Guide"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Description Body */}
            <div className="p-4 space-y-3">
              <p className="text-xs text-foreground/90 leading-relaxed font-normal">
                {step.description}
              </p>

              {!targetRect && (
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300">
                  💡 <em>Note: This button is currently hidden or on another screen view. You can still read what it does!</em>
                </div>
              )}

              {/* Progress Dots & Nav Buttons */}
              <div className="pt-2 flex items-center justify-between border-t">
                <div className="flex items-center gap-1">
                  {TOUR_STEPS.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentStepIndex(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === currentStepIndex
                          ? 'w-4 bg-indigo-600'
                          : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                      }`}
                      aria-label={`Step ${idx + 1}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  {currentStepIndex > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrev}
                      className="h-7 text-[11px] px-2.5 gap-1"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      Back
                    </Button>
                  )}

                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="h-7 text-[11px] px-3 gap-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                  >
                    {currentStepIndex === TOUR_STEPS.length - 1 ? (
                      <>
                        <span>Finish</span>
                        <Check className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        <span>Next</span>
                        <ChevronRight className="w-3 h-3" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
