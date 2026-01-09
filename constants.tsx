
import { ChemistryBranch, Lesson, GradeLevel } from './types';

export const GRADE_LEVELS: GradeLevel[] = [
  '1st Preparatory', '2nd Preparatory', '3rd Preparatory',
  '1st Secondary', '2nd Secondary', '3rd Secondary'
];

export const INITIAL_LESSONS: Lesson[] = [
  {
    id: '1',
    title: 'Matter and its Properties',
    branch: ChemistryBranch.GENERAL,
    grade: '1st Preparatory',
    content: 'Everything around us is matter. Matter has mass and volume. Let\'s explore density!',
    summary: 'Introduction to mass, volume, and density.',
    icon: '⚖️'
  },
  {
    id: '2',
    title: 'Atomic Structure',
    branch: ChemistryBranch.GENERAL,
    grade: '1st Secondary',
    content: 'Discover the nucleus, protons, neutrons, and electrons that make up everything.',
    summary: 'The building blocks of atoms.',
    icon: '⚛️'
  },
  {
    id: '3',
    title: 'Introduction to Organic Chemistry',
    branch: ChemistryBranch.ORGANIC,
    grade: '3rd Secondary',
    content: 'Hydrocarbons are the foundation of organic life. Let\'s study Alkanes, Alkenes, and Alkynes.',
    summary: 'Deep dive into carbon-based chemistry.',
    icon: '🧪'
  }
];

export const BRANCH_COLORS: Record<ChemistryBranch, string> = {
  [ChemistryBranch.GENERAL]: 'bg-blue-100 text-blue-700 border-blue-200',
  [ChemistryBranch.ORGANIC]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  [ChemistryBranch.INORGANIC]: 'bg-amber-100 text-amber-700 border-amber-200',
  [ChemistryBranch.PHYSICAL]: 'bg-purple-100 text-purple-700 border-purple-200',
  [ChemistryBranch.ANALYTICAL]: 'bg-rose-100 text-rose-700 border-rose-200',
};
