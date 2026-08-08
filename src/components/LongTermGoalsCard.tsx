import React, { useState } from 'react';
import { Target, Plus, X, CheckCircle2, Circle, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { LongTermGoal } from '../types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  goals: LongTermGoal[];
  onUpdateGoals: (goals: LongTermGoal[] | ((prev: LongTermGoal[]) => LongTermGoal[])) => void;
}

export function LongTermGoalsCard({ goals, onUpdateGoals }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTitle.trim()) return;

    const newGoal: LongTermGoal = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      targetDate: newTargetDate || undefined,
      isCompleted: false,
    };

    onUpdateGoals(prev => [...prev, newGoal]);
    setNewTitle('');
    setNewTargetDate('');
    setIsAdding(false);
  };

  const handleToggleComplete = (id: string) => {
    onUpdateGoals(prev =>
      prev.map(g => (g.id === id ? { ...g, isCompleted: !g.isCompleted } : g))
    );
  };

  const handleDelete = (id: string) => {
    onUpdateGoals(prev => prev.filter(g => g.id !== id));
  };

  const activeCount = goals.filter(g => !g.isCompleted).length;

  return (
    <div className="bg-card rounded-xl border shadow-xs p-3 shrink-0 flex flex-col transition-all">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold text-xs">
            <Target className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-foreground">
            Long-term Goals
          </span>
          {goals.length > 0 && (
            <span className="text-[11px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {goals.length - activeCount}/{goals.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsAdding(true);
              setIsCollapsed(false);
            }}
            className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Card Content (Collapsible) */}
      {!isCollapsed && (
        <div className="mt-2 space-y-2">
          {/* Add Goal Inline Form */}
          {isAdding && (
            <form onSubmit={handleAdd} className="flex flex-col gap-2 p-2 bg-muted/40 rounded-lg border border-dashed text-xs">
              <Input
                placeholder="Enter goal (e.g. TOEIC 800 score)"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="h-8 text-xs bg-background"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-muted-foreground flex-1">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <Input
                    type="date"
                    value={newTargetDate}
                    onChange={e => setNewTargetDate(e.target.value)}
                    className="h-7 text-xs bg-background px-1.5"
                  />
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => setIsAdding(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="h-7 text-xs px-2" disabled={!newTitle.trim()}>
                    Save
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* Goal List */}
          {goals.length === 0 && !isAdding ? (
            <p className="text-xs text-muted-foreground text-center py-2 italic">
              No long-term goals registered
            </p>
          ) : (
            <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1">
              {goals.map(goal => (
                <div
                  key={goal.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg border text-xs transition-colors group",
                    goal.isCompleted
                      ? "bg-muted/30 border-muted opacity-60"
                      : "bg-background border-border/60 hover:border-border shadow-2xs"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(goal.id)}
                      className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                    >
                      {goal.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground/60" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "font-medium truncate",
                          goal.isCompleted && "line-through text-muted-foreground"
                        )}
                      >
                        {goal.title}
                      </p>
                      {goal.targetDate && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          🎯 {goal.targetDate}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(goal.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive rounded transition-all shrink-0"
                    title="Delete"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
