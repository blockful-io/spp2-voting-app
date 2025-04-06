/**
 * Voting results processing functions
 * 
 * This module provides functions to process voting data from Snapshot,
 * implement the Copeland method for ranking, and allocate budgets.
 */

import { fetchSnapshotResults } from "./snapshot";
import { processCopelandRanking, combineData } from "./voteProcessing";
import { allocateBudgets } from "./budgetAllocation";
import { getServiceProviderData, getChoiceOptions } from "./csvUtils";
import { PROGRAM_BUDGET, TWO_YEAR_STREAM_RATIO, ONE_YEAR_STREAM_RATIO } from "./config";

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

export interface HeadToHeadMatch {
  candidate1: string;
  candidate2: string;
  candidate1Votes: number;
  candidate2Votes: number;
  totalVotes: number;
  winner: string;
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
  name: string;
  budget: number;
  isSpp1: boolean;
  isNoneBelow: boolean;
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

  // Ensure proposal data has required properties and format it to match the expected interface
  if (!rawProposalData.choices || !rawProposalData.votes) {
    throw new Error("Proposal data is missing required properties");
  }

  // Format the data to match what processCopelandRanking expects
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

  // Step 2: Process with Copeland method to get rankings
  const copelandResults = processCopelandRanking(proposalData) as CopelandResults;
  const { rankedCandidates, headToHeadMatches } = copelandResults;

  // Step 3: Load service provider data and combine with ranked results
  const providerData = getServiceProviderData();
  const combinedData = combineData(rankedCandidates, providerData);

  // Step 4: Allocate budgets
  const allocationResults = allocateBudgets(combinedData, PROGRAM_BUDGET) as AllocationResults;

  // Step 5: Get choices data from providers
  const choicesData: Choice[] = Object.entries(providerData).map(([name, data]) => ({
    name,
    budget: data.basicBudget,
    isSpp1: data.isSpp1,
    isNoneBelow: data.isNoneBelow
  }));

  // Step 6: Format the response
  const response: VotingResultResponse = {
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
    summary: allocationResults.summary,
    allocations: allocationResults.allocations,
    programInfo: {
      totalBudget: PROGRAM_BUDGET,
      twoYearStreamRatio: TWO_YEAR_STREAM_RATIO,
      oneYearStreamRatio: ONE_YEAR_STREAM_RATIO
    }
  };

  return response;
} 