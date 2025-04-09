/**
 * Shared types and interfaces for the Service Provider Program Allocation
 */

// ===== CSV Data Types =====
/**
 * Service provider data structure as received from CSV
 */
export interface ServiceProviderData {
  choiceId: number;         // Numeric ID of the choice
  basicBudget: number;      // Basic budget amount in USD
  extendedBudget: number;   // Extended budget amount in USD
  isSpp1: boolean;          // Whether provider was part of SPP1
  isNoneBelow: boolean;     // Whether this is the "None Below" indicator
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
  name: string;       // The service provider name (without budget type)
  budgetType: BudgetType; // Enforced budget type values
}

export interface Choice {
  originalName: string;  // Original full choice name (e.g., "sp a" or "sp b - basic")
  name: string;          // Base provider name without budget type (e.g., "sp a" or "sp b")
  budget: number;        // Budget amount in USD
  isSpp1: boolean;       // Whether provider was part of SPP1
  isNoneBelow: boolean;  // Whether this is the "None Below" indicator
  choiceId: number;      // Numeric ID of the choice
  budgetType: BudgetType;    // Budget type: "basic", "extended", or "none"
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
export interface RankedCandidate {
  name: string;
  score: number;
  averageSupport: number;
  isNoneBelow: boolean;
}

export interface HeadToHeadMatch {
  candidate1: string;
  candidate2: string;
  candidate1Votes: number;
  candidate2Votes: number;
  totalVotes: number;
  winner: string;
  isInternal: boolean;  // Whether this is a match between options from the same provider
  voters: {
    candidate1: Array<{ voter: string; vp: number }>;
    candidate2: Array<{ voter: string; vp: number }>;
  };
}

export interface CopelandResults {
  rankedCandidates: RankedCandidate[];
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
  basicBudget: number;
  extendedBudget: number;
  allocated: boolean;
  streamDuration: StreamDuration;
  allocatedBudget: number;
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
    basicBudget: number;
    extendedBudget: number;
    isSpp1?: boolean;
    allocated: boolean;
    streamDuration: StreamDuration;
    allocatedBudget: number;
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