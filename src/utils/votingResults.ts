/**
 * Voting results processing functions
 *
 * This module provides functions to process voting data from Snapshot,
 * implement the Copeland method for ranking, and allocate budgets.
 */

import { fetchSnapshotResults } from "./snapshot";
import {
  processCopelandRanking,
  postprocessRanking,
  preprocessVotes,
} from "./voteProcessing";
import { allocateBudgets } from "./budgetAllocation";
import { getChoicesData } from './choiceParser';
import { PROGRAM_BUDGET, TWO_YEAR_STREAM_CAP } from "./config";
// Import shared types
import { AllocationResults, VotingResultResponse } from "./types";

// Re-export HeadToHeadMatch from types
export type { HeadToHeadMatch } from "./types";

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
export async function getVotingResultData(
  proposalId: string
): Promise<VotingResultResponse> {
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

  // Step 2: Pre-process votes if needed (currently uses standard voting)
  proposalData.votes = preprocessVotes(proposalData.votes, proposalData.choices);

  // Step 3: Process with Copeland method to get rankings
  const copelandResults = processCopelandRanking(proposalData);

  // Step 4: Post-process rankings (no special handling needed)
  const { rankedChoices, headToHeadMatches } = postprocessRanking(copelandResults);

  // Step 5: Get choices data from CSV
  const choicesData = getChoicesData();

  // Step 6: Allocate budgets using the ranked candidates and choices data
  const { summary, allocations: finalAllocations } = allocateBudgets({
    rankedChoices,
    headToHeadMatches
  }, PROGRAM_BUDGET, choicesData) as AllocationResults;

  // Step 7: Prepare the response
  return {
    proposal: {
      id: proposalId,
      title: proposalData.title,
      space: proposalData.space,
      totalVotes: proposalData.totalVotes,
      totalVotingPower: proposalData.totalVotingPower,
      state: proposalData.state,
      dataSource: "Snapshot API",
      start: proposalData.start,
      end: proposalData.end,
    },
    choices: choicesData,
    headToHeadMatches,
    summary,
    allocations: finalAllocations,
    programInfo: {
      totalBudget: PROGRAM_BUDGET,
      twoYearStreamRatio: TWO_YEAR_STREAM_CAP / PROGRAM_BUDGET, // Now based on cap
      oneYearStreamRatio: (PROGRAM_BUDGET - TWO_YEAR_STREAM_CAP) / PROGRAM_BUDGET // Remaining budget
    }
  };
}
