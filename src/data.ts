import { format, addDays, subDays } from 'date-fns';
import { Category, DailyRecord, Assignment, Section } from './types';

export const defaultSections: Section[] = [
  { id: 'study', name: 'Study', color: 'indigo' },
  { id: 'workout', name: 'Workout', color: 'amber' },
];

export const defaultCategories: Category[] = [
  { id: 'math', name: 'Math', type: 'study' },
  { id: 'physics', name: 'Physics', type: 'study' },
  { id: 'english', name: 'English', type: 'study' },
  { id: 'pushup', name: 'Push-ups', type: 'workout' },
  { id: 'plank', name: 'Plank', type: 'workout' },
  { id: 'running', name: 'Running', type: 'workout' },
];

export const generateInitialAssignments = (): Assignment[] => {
  return [];
};

export const generateInitialRecords = (): Record<string, DailyRecord> => {
  const records: Record<string, DailyRecord> = {};
  const today = new Date();
  
  // Generate more days of records (30 days past, 30 days future)
  for (let i = -30; i <= 30; i++) {
    const date = format(addDays(today, i), 'yyyy-MM-dd');
    records[date] = {
      date,
      generalPlan: [],
      items: {},
      hasAssignments: false,
    };
    
    // Initialize empty items for each category
    defaultCategories.forEach(cat => {
      records[date].items[cat.id] = {
        categoryId: cat.id,
        planValue: null,
        actualValue: null,
        isRest: false,
      };
    });
  }
  
  return records;
};
