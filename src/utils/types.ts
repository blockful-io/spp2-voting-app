/**
 * Shared types and interfaces for the Service Provider Program Allocation
 */

// ===== CSV Data Types =====
/**
 * Service provider data structure as received from CSV
 */
export interface ServiceProviderData {
  choiceId: number; // Numeric ID of the choice
  basicBudget: number; // Basic budget amount in USD
  extendedBudget: number; // Extended budget amount in USD
  isSpp1: boolean; // Whether provider was part of SPP1
  isNoneBelow: boolean; // Whether this is the "None Below" indicator
}

// ===== Vote Types =====
export interface Vote {
  choice: number[];
  voter: string;
  vp: number;
}

// ===== Mock Data Types =====
export interface MockVote {
  voter: string;
  vp: number;
  choice: number[];
  proposal: {
    choices: string[];
  };
}

export interface MockProposal {
  choices: string[];
}

export interface MockVoteData {
  data: {
    votes: MockVote[];
  };
}

// ===== Choice Types =====
/**
 * Budget type options
 */
export type BudgetType = "basic" | "extended" | "none";

/**
 * Interface for parsed choice information
 */
export interface ParsedChoice {
  name: string; // The service provider name (without budget type)
  budgetType: BudgetType; // Enforced budget type values
}

export interface Choice {
  originalName: string; // Original full choice name (e.g., "sp a" or "sp b - basic")
  name: string; // Base provider name without budget type (e.g., "sp a" or "sp b")
  budget: number; // Budget amount in USD
  isSpp1: boolean; // Whether provider was part of SPP1
  isNoneBelow: boolean; // Whether this is the "None Below" indicator
  choiceId: number; // Numeric ID of the choice
  budgetType: BudgetType; // Budget type: "basic", "extended", or "none"
}

// ===== Voting Results Types =====
export interface ProposalData {
  id?: string;
  title: string;
  space: string;
  totalVotes: number;
  votes: Vote[];
  scores_total?: number;
  totalVotingPower: number;
  state: string;
  choices: string[];
  start: string;
  end: string;
}

export interface ProviderData {
  [key: string]: {
    basicBudget: number;
    extendedBudget: number;
    isSpp1: boolean;
    isNoneBelow: boolean;
    choiceId: number;
  };
}

export interface VotingResultResponse {
  proposal: {
    id: string;
    title: string;
    space: string;
    totalVotes: number;
    totalVotingPower: number;
    state: string;
    dataSource: string;
    start: string;
    end: string;
  };
  choices: Choice[];
  headToHeadMatches: HeadToHeadMatch[];
  summary: AllocationSummary;
  allocations: Allocation[];
  programInfo: {
    totalBudget: number;
    twoYearStreamRatio: number;
    oneYearStreamRatio: number;
  };
}

// ===== Vote Processing Types =====
export interface RankedChoice {
  name: string;
  score: number;
  averageSupport: number;
  isNoneBelow: boolean;
}

export interface HeadToHeadMatch {
  choice1: string;
  choice2: string;
  choice1Votes: number;
  choice2Votes: number;
  totalVotes: number;
  winner: string;
  resultType: "win" | "loss" | "tie";  // The type of result
  isInternal: boolean;  // Whether options are from the same provider (for information only, doesn't affect scoring)
  voters: {
    choice1: Array<{ voter: string; vp: number }>;
    choice2: Array<{ voter: string; vp: number }>;
  };
}

export interface CopelandResults {
  rankedChoices: RankedChoice[];
  headToHeadMatches: HeadToHeadMatch[];
}

// ===== Budget Allocation Types =====
/**
 * Stream duration options
 */
export type StreamDuration = "1-year" | "2-year" | null;

/**
 * Proposal state options
 */
export type ProposalState = "CLOSED" | "ACTIVE" | "PENDING" | "CANCELLED";

/**
 * Data source options
 */
export type DataSource = "Local Data" | "Snapshot" | "API";

export interface Allocation {
  name: string;
  score: number;
  averageSupport: number;
  budget: number;        // Budget amount for this specific choice
  allocated: boolean;
  streamDuration: StreamDuration;
  rejectionReason: string | null;
  isNoneBelow: boolean;
  isSpp1?: boolean;
  budgetType: BudgetType;
}

/**
 * Summary of budget allocation results
 */
export interface AllocationSummary {
  votedBudget: number;
  twoYearStreamBudget: number;
  oneYearStreamBudget: number;
  transferredBudget: number;
  adjustedTwoYearBudget: number;
  adjustedOneYearBudget: number;
  remainingTwoYearBudget: number;
  remainingOneYearBudget: number;
  totalAllocated: number;
  unspentBudget: number;
  allocatedProjects: number;
  rejectedProjects: number;
}

export interface AllocationResults {
  summary: AllocationSummary;
  allocations: Allocation[];
}

/**
 * Response from allocation endpoint
 */
export interface AllocationResponse {
  proposal: {
    id: string;
    title: string;
    space: {
      id: string;
      name: string;
    };
    state: ProposalState;
    dataSource: DataSource;
    start: number;
    end: number;
  };
  headToHeadMatches: Array<HeadToHeadMatch>;
  summary: {
    votedBudget: number;
    twoYearStreamBudget: number;
    oneYearStreamBudget: number;
    transferredBudget: number;
    adjustedTwoYearBudget: number;
    adjustedOneYearBudget: number;
    remainingTwoYearBudget: number;
    remainingOneYearBudget: number;
    totalAllocated: number;
    unspentBudget: number;
    allocatedProjects: number;
    rejectedProjects: number;
  };
  allocations: Allocation[];
  choices?: Array<string>;
}

/**
 * Budget summary data
 */
export interface BudgetSummary {
  totalBudget: number;
  totalAllocated: number;
  unspentBudget: number;
  streamBreakdown: {
    oneYear: {
      budget: number;
      allocated: number;
      remaining: number;
    };
    twoYear: {
      budget: number;
      allocated: number;
      remaining: number;
    };
  };
  metrics: {
    allocatedProjects: number;
    rejectedProjects: number;
  };
}

/**
 * Budget data
 */
export interface Budget {
  value: number;
  type: BudgetType;
  id: number;
  selected: boolean;
}

/**
 * Vote candidate data
 */
export interface VoteCandidate {
  name: string;
  budgets: Budget[];
}

// ===== Reporting Types =====
/**
 * Proposal data for reporting
 */
export interface ReportingProposalData {
  id?: string;
  title: string;
  space: {
    name: string;
  };
  votes?: Vote[];
  scores_total?: number;
  state: string;
}

/**
 * Allocation results for reporting
 */
export interface ReportingAllocationResults {
  summary: AllocationSummary;
  allocations: Allocation[];
}

/**
 * Report results
 */
export interface ReportResults {
  proposal: {
    id?: string;
    title: string;
    space: string;
    totalVotes: number;
    totalVotingPower: number;
    state: ProposalState;
    dataSource: DataSource;
  };
  headToHeadMatches: HeadToHeadMatch[];
  summary: AllocationSummary;
  allocations: {
    name: string;
    score: number;
    averageSupport: number;
    budget: number;
    isSpp1?: boolean;
    allocated: boolean;
    streamDuration: StreamDuration;
    rejectionReason: string | null;
    isNoneBelow: boolean;
  }[];
  programInfo: {
    totalBudget: number;
    twoYearStreamRatio: number;
    oneYearStreamRatio: number;
  };
  choices?: Choice[];
}

// ===== Candidate Comparison Types =====
/**
 * Formatted head-to-head match
 */
export interface FormattedMatch {
  candidate1: {
    name: string;
    candidateVotes: number;
    voters: Array<{ voter: string; vp: number }>;
  };
  candidate2: {
    name: string;
    candidateVotes: number;
    voters: Array<{ voter: string; vp: number }>;
  };
  totalVotes: number;
  winner: string;
  isInternal: boolean;
}

/**
 * Candidate budget data
 */
export interface CandidateBudget {
  basic: {
    amount: number;
    selected: boolean;
  };
  extended: {
    amount: number;
    selected: boolean;
  };
}

/**
 * Candidate head-to-head results
 */
export interface CandidateHeadToHeadResults {
  matches: FormattedMatch[];
  budget: CandidateBudget;
  wins: number;
  losses: number;
}

export type Space = {
  id: string;
  name: string;
};

export type AppState = "LOADING" | "ERROR" | "READY" | "PROCESSING" | "COMPLETE";

/**
 * Snapshot API Types
 */

export interface SnapshotApiQuery {
  variables: {
    id: string;
  };
  query: string;
}

export interface VoteChoice {
  [key: string]: number;
}

export interface SnapshotVote {
  voter: string;
  vp: number;
  choice: VoteChoice;
}

export interface SnapshotProposal {
  id: string;
  title: string;
  body: string;
  choices: string[];
  start: number;
  end: number;
  snapshot: string;
  state: string;
  author: string;
  space: {
    id: string;
    name: string;
  };
  scores?: number[];
  scores_by_strategy?: number[][];
  scores_total?: number;
  votes?: SnapshotVote[];
}

export interface SnapshotAPIResponse {
  data: {
    proposal: SnapshotProposal;
  };
} 
