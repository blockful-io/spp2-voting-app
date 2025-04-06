/**
 * Voting results processing functions
 * 
 * This module provides functions to process voting data from Snapshot,
 * implement the Copeland method for ranking, and allocate budgets.
 */

import { fetchSnapshotResults } from "./snapshot";
import { processCopelandRanking, combineData, postprocessRanking, preprocessVotes, HeadToHeadMatch } from "./voteProcessing";
import { allocateBudgets } from "./budgetAllocation";
import { getServiceProviderData } from "./csvUtils";
import { PROGRAM_BUDGET, TWO_YEAR_STREAM_RATIO, ONE_YEAR_STREAM_RATIO } from "./config";
import { processChoices } from './choiceParser';

// Re-export HeadToHeadMatch from voteProcessing
export type { HeadToHeadMatch } from './voteProcessing';

// Interfaces for vote data
export interface Vote {
  choice: number[];
  voter: string;
  vp: number;
}

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

export interface RankedCandidate {
  name: string;
  score: number;
  averageSupport: number;
  isNoneBelow: boolean;
}

export interface CopelandResults {
  rankedCandidates: RankedCandidate[];
  headToHeadMatches: HeadToHeadMatch[];
}

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

export interface Allocation {
  name: string;
  score: number;
  averageSupport: number;
  basicBudget: number;
  extendedBudget: number;
  allocated: boolean;
  streamDuration: string | null;
  allocatedBudget: number;
  rejectionReason: string | null;
  isNoneBelow: boolean;
  isSpp1?: boolean;
}

export interface Choice {
  originalName: string;  // Original full choice name (e.g., "sp a" or "sp b - basic")
  name: string;          // Base provider name without budget type (e.g., "sp a" or "sp b")
  budget: number;        // Budget amount in USD
  isSpp1: boolean;       // Whether provider was part of SPP1
  isNoneBelow: boolean;  // Whether this is the "None Below" indicator
  choiceId: number;      // Numeric ID of the choice
  budgetType: string;    // Budget type: "basic", "extended", or "none"
}

export interface AllocationResults {
  summary: AllocationSummary;
  allocations: Allocation[];
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

/**
 * Get voting result data for a specific proposal
 * 
 * This function orchestrates the entire process of fetching voting data,
 * processing it with the Copeland method, and allocating budgets.
 * 
 * @param proposalId - The ID of the Snapshot proposal to process
 * @returns Processed voting results with allocations
 * @throws Error if the proposal ID is invalid or processing fails
 */
export async function getVotingResultData(proposalId: string): Promise<VotingResultResponse> {
  if (!proposalId) {
    throw new Error("proposalId is required");
  }

  // Step 1: Fetch results from Snapshot
  const rawProposalData = await fetchSnapshotResults(proposalId);

  // Check if proposal exists
  if (!rawProposalData) {
    throw new Error("Proposal not found");
  }

  // Ensure proposal data has required properties
  if (!rawProposalData.choices || !rawProposalData.votes) {
    throw new Error("Proposal data is missing required properties");
  }

  // Format the data for processing
  const proposalData: ProposalData = {
    id: proposalId,
    title: rawProposalData.title,
    space: typeof rawProposalData.space === 'object' ? rawProposalData.space.name : rawProposalData.space,
    totalVotes: rawProposalData.votes.length,
    votes: rawProposalData.votes,
    totalVotingPower: rawProposalData.scores_total || 0,
    state: rawProposalData.state,
    choices: rawProposalData.choices
  };

  // Step 2: Pre-process votes if bidimensional is enabled
  proposalData.votes = preprocessVotes(proposalData.votes, proposalData.choices);

  // Step 3: Process with Copeland method to get rankings
  const copelandResults = processCopelandRanking(proposalData);

  // Step 4: Post-process rankings to handle bidimensional filtering and None Below
  const { rankedCandidates, headToHeadMatches } = postprocessRanking(copelandResults);

  // Step 5: Load service provider data and combine with ranked results
  const providerData = getServiceProviderData();
  const combinedData = combineData(rankedCandidates, providerData);

  // Step 6: Allocate budgets
  const { summary, allocations } = allocateBudgets(combinedData, PROGRAM_BUDGET) as AllocationResults;

  // Step 7: Process choices with name parsing
  const choicesData = processChoices(providerData);

  // Step 8: Prepare the response
  return {
    proposal: {
      id: proposalId,
      title: proposalData.title,
      space: proposalData.space,
      totalVotes: proposalData.totalVotes,
      totalVotingPower: proposalData.totalVotingPower,
      state: proposalData.state,
      dataSource: "Snapshot API",
    },
    choices: choicesData,
    headToHeadMatches,
    summary,
    allocations,
    programInfo: {
      totalBudget: PROGRAM_BUDGET,
      twoYearStreamRatio: TWO_YEAR_STREAM_RATIO,
      oneYearStreamRatio: ONE_YEAR_STREAM_RATIO
    }
  };
} 