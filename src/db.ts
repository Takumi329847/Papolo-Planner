import Dexie, { type Table } from 'dexie';
import type { DailyRecord, Assignment, BookProgress, WorkoutStepUp, Category, WorkoutRestSchedule, LongTermGoal, Section } from './types';

export class AttuneDB extends Dexie {
  records!: Table<DailyRecord, string>;
  assignments!: Table<Assignment, string>;
  bookProgresses!: Table<BookProgress, string>;
  workoutStepUps!: Table<WorkoutStepUp, string>;
  categories!: Table<Category, string>;
  workoutRestSchedule!: Table<WorkoutRestSchedule, string>;
  longTermGoals!: Table<LongTermGoal, string>;
  sections!: Table<Section, string>;

  constructor() {
    super('AttuneDB');

    // v1: original schema
    this.version(1).stores({
      records: 'date',
      assignments: 'id',
      bookProgresses: 'categoryId',
      workoutStepUps: 'categoryId',
      categories: 'id',
    });

    // v2: add workoutRestSchedule table
    this.version(2).stores({
      records: 'date',
      assignments: 'id',
      bookProgresses: 'categoryId',
      workoutStepUps: 'categoryId',
      categories: 'id',
      workoutRestSchedule: 'id',
    });

    // v3: add longTermGoals table
    this.version(3).stores({
      records: 'date',
      assignments: 'id',
      bookProgresses: 'categoryId',
      workoutStepUps: 'categoryId',
      categories: 'id',
      workoutRestSchedule: 'id',
      longTermGoals: 'id',
    });

    // v4: add sections table
    this.version(4).stores({
      records: 'date',
      assignments: 'id',
      bookProgresses: 'categoryId',
      workoutStepUps: 'categoryId',
      categories: 'id',
      workoutRestSchedule: 'id',
      longTermGoals: 'id',
      sections: 'id',
    });
  }
}

export const db = new AttuneDB();
