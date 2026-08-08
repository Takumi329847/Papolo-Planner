import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Assignment } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, CheckCircle2, Circle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface AssignmentsViewProps {
  assignments: Assignment[];
  setAssignments: (assignments: Assignment[]) => void;
  onClose: () => void;
}

export function AssignmentsView({ assignments, setAssignments, onClose }: AssignmentsViewProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleAdd = () => {
    if (!newTitle.trim() || !newDate) return;
    const newAssignment: Assignment = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      dueDate: newDate,
      isCompleted: false,
    };
    setAssignments([...assignments, newAssignment]);
    setNewTitle('');
  };

  const handleToggle = (id: string) => {
    setAssignments(assignments.map(a => a.id === id ? { ...a, isCompleted: !a.isCompleted } : a));
  };

  const handleDelete = (id: string) => {
    setAssignments(assignments.filter(a => a.id !== id));
  };

  const sortedAssignments = [...assignments].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8 flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">All Assignments</h1>
        <Button variant="outline" onClick={onClose}>Back to Dashboard</Button>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-end space-x-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="new-title">Assignment Title</Label>
              <Input 
                id="new-title" 
                placeholder="e.g., Math Homework" 
                value={newTitle} 
                onChange={(e) => setNewTitle(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <div className="w-48 space-y-2">
              <Label htmlFor="new-date">Due Date</Label>
              <Input 
                id="new-date" 
                type="date" 
                value={newDate} 
                onChange={(e) => setNewDate(e.target.value)} 
              />
            </div>
            <Button onClick={handleAdd} className="w-24">
              <Plus className="w-4 h-4 mr-2" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex-1 overflow-y-auto pr-4 space-y-3">
        {sortedAssignments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No assignments found. Add one above!
          </div>
        ) : (
          sortedAssignments.map(assignment => {
            const dateObj = parseISO(assignment.dueDate);
            return (
              <div 
                key={assignment.id} 
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border bg-card transition-colors",
                  assignment.isCompleted ? "opacity-60" : ""
                )}
              >
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => handleToggle(assignment.id)}
                    className="flex-shrink-0 text-muted-foreground hover:text-emerald-500 transition-colors"
                  >
                    {assignment.isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </button>
                  <div className={cn("flex flex-col", assignment.isCompleted && "line-through text-muted-foreground")}>
                    <span className="font-medium text-lg">{assignment.title}</span>
                    <span className="text-sm text-muted-foreground">
                      Due: {format(dateObj, 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {!assignment.isCompleted && (
                    <Badge variant="outline" className="text-xs">
                      Pending
                    </Badge>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(assignment.id)}>
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
