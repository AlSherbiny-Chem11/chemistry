
export type GradeLevel = 
  | '1st Preparatory' 
  | '2nd Preparatory' 
  | '3rd Preparatory' 
  | '1st Secondary' 
  | '2nd Secondary' 
  | '3rd Secondary';

export enum ChemistryBranch {
  GENERAL = 'General Chemistry',
  ORGANIC = 'Organic Chemistry',
  INORGANIC = 'Inorganic Chemistry',
  PHYSICAL = 'Physical Chemistry',
  ANALYTICAL = 'Analytical Chemistry'
}

export interface User {
  id: string;
  name: string;
  email: string;
  grade: GradeLevel;
  points: number;
  avatar: string;
}

export interface Lesson {
  id: string;
  title: string;
  branch: ChemistryBranch;
  grade: GradeLevel;
  content: string;
  summary: string;
  icon: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  branch: ChemistryBranch;
  aiSummary?: string;
}

export type View = 'dashboard' | 'lessons' | 'journal' | 'tutor' | 'periodic-table';
