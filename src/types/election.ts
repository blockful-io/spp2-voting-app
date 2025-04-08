export interface ProjectData {
  name: string;
  value: number;
  color: string;
}

export interface BudgetData {
  name: string;
  oneYear: number;
  twoYears: number;
  oneYearRemaining: number;
  twoYearsRemaining: number;
  notAllocated: number;
}

export interface BudgetLegendItem {
  color: string;
  label: string;
  value?: string;
  subtext?: string;
}
