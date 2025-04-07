/**
 * Voting results processing functions
 * 
 * This module provides functions to process voting data from Snapshot,
 * implement the Copeland method for ranking, and allocate budgets.
 */

import { fetchSnapshotResults } from "./snapshot";
import { processCopelandRanking, combineData, postprocessRanking, preprocessVotes } from "./voteProcessing";
import { allocateBudgets } from "./budgetAllocation";
import { getServiceProviderData } from "./csvUtils";
import { PROGRAM_BUDGET, TWO_YEAR_STREAM_RATIO, ONE_YEAR_STREAM_RATIO } from "./config";
import { getChoicesData } from './choiceParser';
// Import shared types
import { Vote, ProposalData, HeadToHeadMatch, RankedCandidate, CopelandResults, ProviderData, Allocation, Choice, AllocationResults, VotingResultResponse } from "./types";

// Re-export HeadToHeadMatch from types
export type { HeadToHeadMatch } from './types';

// Add interface for raw proposal data from Snapshot
interface RawSnapshotProposal {
  id: string;
  title: string;
  space: {
    id: string;
    name: string;
  };
  choices: string[];
  scores_total: number;
  state: string;
  votes: Vote[];
}

/**
 * Process voting results and generate allocation report
 * 
 * @param proposalData - The proposal data containing votes and choices
 * @returns The allocation results
 */
export async function processVotingResults(proposalData: ProposalData): Promise<AllocationResults> {
  try {
    // Process votes using Copeland method
    const copelandResults = processCopelandRanking(proposalData);

    // Get service provider data
    const providerData = getServiceProviderData();

    // Convert ranked candidates to allocation format
    const candidates: Allocation[] = copelandResults.rankedCandidates.map(candidate => ({
      name: candidate.name,
      score: candidate.score,
      averageSupport: candidate.averageSupport,
      basicBudget: providerData[candidate.name]?.basicBudget || 0,
      extendedBudget: providerData[candidate.name]?.extendedBudget || 0,
      allocated: false,
      streamDuration: null,
      allocatedBudget: 0,
      rejectionReason: null,
      isNoneBelow: candidate.isNoneBelow,
      isSpp1: providerData[candidate.name]?.isSpp1 || false
    }));

    // Allocate budgets based on ranking
    const allocationResults = allocateBudgets(candidates, PROGRAM_BUDGET);

    return allocationResults;
  } catch (error) {
    console.error("Error processing voting results:", error);
    throw error;
  }
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
  const proposalData = await fetchSnapshotResults(proposalId);

  // Check if proposal exists
  if (!proposalData) {
    throw new Error("Proposal not found");
  }

  // Ensure proposal data has required properties
  if (!proposalData.choices || !proposalData.votes) {
    throw new Error("Proposal data is missing required properties");
  }

  // Step 2: Pre-process votes if bidimensional is enabled
  proposalData.votes = preprocessVotes(proposalData.votes, proposalData.choices);

  // Step 3: Process with Copeland method to get rankings
  const copelandResults = processCopelandRanking(proposalData);

  // Step 4: Post-process rankings to handle bidimensional filtering and None Below
  const { rankedCandidates, headToHeadMatches } = postprocessRanking(copelandResults);

  // Step 5: Get choices data from CSV
  const choicesData = getChoicesData();
  console.log(choicesData);

  // Step 6: Combine ranked candidates with choices data to create allocations
  const allocations: Allocation[] = combineData(rankedCandidates, choicesData);
  console.log(allocations);

  // Step 7: Allocate budgets
  const { summary, allocations: finalAllocations } = allocateBudgets(allocations, PROGRAM_BUDGET) as AllocationResults;

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
    allocations: finalAllocations,
    programInfo: {
      totalBudget: PROGRAM_BUDGET,
      twoYearStreamRatio: TWO_YEAR_STREAM_RATIO,
      oneYearStreamRatio: ONE_YEAR_STREAM_RATIO
    }
  };
} 