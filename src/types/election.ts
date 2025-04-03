export interface Candidate {
  name: string;
  score: number;
  averageSupport: number;
  basicBudget: number;
  extendedBudget: number;
  allocatedBudget: number;
  streamDuration: string;
  isEligibleForExtendedBudget: boolean;
  wins: number;
}

export interface ProjectData {
  name: string;
  value: number;
  color: string;
}

export interface BudgetData {
  name: string;
  oneYear: number;
  twoYears: number;
  notAllocated: number;
}

export interface BudgetLegendItem {
  color: string;
  label: string;
  value?: string;
  subtext?: string;
}
