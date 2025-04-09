/**
 * Budget allocation logic for the Service Provider Program
 */

import { TWO_YEAR_STREAM_RATIO, ONE_YEAR_STREAM_RATIO } from "./config";
import { Allocation, AllocationResults, AllocationSummary, StreamDuration, HeadToHeadMatch, CopelandResults, Choice, BudgetType } from "./types";
import { parseChoiceName } from "./parseChoiceName";

/**
 * Allocates budgets to candidates based on their ranking
 * 
 * @param copelandResults - Results from Copeland ranking including ranked candidates and head-to-head matches
 * @param totalBudget - Total budget available for allocation
 * @param choicesData - Choice data containing budget information for service providers
 * @returns Object containing allocation results and summary
 */
export function allocateBudgets(
  copelandResults: CopelandResults,
  totalBudget: number,
  choicesData: Choice[]
): AllocationResults {
  console.log("Starting budget allocation with choices data");
  
  // Initialize budget streams
  const twoYearStreamBudget = totalBudget * TWO_YEAR_STREAM_RATIO;
  const oneYearStreamBudget = totalBudget * ONE_YEAR_STREAM_RATIO;

  // Initialize allocation tracking
  let remainingTwoYearBudget = twoYearStreamBudget;
  let remainingOneYearBudget = oneYearStreamBudget;
  let totalAllocated = 0;
  let allocatedProjects = 0;
  let rejectedProjects = 0;
  let transferredBudget = 0;

  // Find the index of None Below option
  let reachedNoneBelow = false;

  // Extract head-to-head matches for budget determination
  const { headToHeadMatches } = copelandResults;

  // Process candidates in ranking order - convert to allocations and apply allocation logic in one pass
  const allocations: Allocation[] = copelandResults.rankedCandidates.map((candidate, index) => {
    // Extract base provider name from the candidate name
    const { name: providerName } = parseChoiceName(candidate.name);
    
    // Find all choices for this provider
    const providerChoices = choicesData.filter(choice => choice.name === providerName);
    
    // Get the basic and extended budgets from the choices
    const basicBudget = providerChoices.find(c => c.budgetType === 'basic')?.budget || 0;
    const extendedBudget = providerChoices.find(c => c.budgetType === 'extended')?.budget || 0;
    
    // Get other provider metadata
    const firstChoice = providerChoices[0];
    const isSpp1 = firstChoice?.isSpp1 || false;
        
    // If we've reached None Below or are past it, reject all subsequent candidates
    if (reachedNoneBelow || candidate.isNoneBelow) {
      reachedNoneBelow = true;
      rejectedProjects++;
      return {
        name: providerName,
        score: candidate.score,
        averageSupport: candidate.averageSupport,
        basicBudget,
        extendedBudget,
        allocated: false,
        streamDuration: null,  
        allocatedBudget: 0,
        rejectionReason: "Below 'none below' option",
        isNoneBelow: candidate.isNoneBelow,
        isSpp1,
        budgetType: "none" as BudgetType
      } as Allocation;
    }

    // Determine budget type based on head-to-head match results
    let budgetType: BudgetType = "basic"; // Default budget type
    
    // Find internal head-to-head match for this provider
    const internalMatch = headToHeadMatches.find(match => 
      match.isInternal && 
      match.candidate1.includes(providerName) && match.candidate2.includes(providerName)
    );
    
    if (internalMatch) {
      // If there's a clear winner in the internal match
      if (internalMatch.winner !== "tie") {
        budgetType = internalMatch.winner.includes("ext") ? "extended" : "basic";
      }
    }

    // Get the selected budget based on the determined budget type
    const selectedBudget = budgetType === "extended" ? extendedBudget : basicBudget;

    // Check if candidate is in top 5 and eligible for two-year stream
    const isTop5 = index < 5;
    const isEligibleForTwoYear = isTop5 && isSpp1;

    // Try to allocate to two-year stream if eligible
    if (isEligibleForTwoYear && selectedBudget <= remainingTwoYearBudget) {
      remainingTwoYearBudget -= selectedBudget;
      totalAllocated += selectedBudget;
      allocatedProjects++;
      return {
        name: providerName,
        score: candidate.score,
        averageSupport: candidate.averageSupport,
        basicBudget,
        extendedBudget,
        allocated: true,
        streamDuration: "2-year" as StreamDuration,
        allocatedBudget: selectedBudget,
        rejectionReason: null,
        isNoneBelow: candidate.isNoneBelow,
        isSpp1,
        budgetType
      };
    }

    // After top 5, transfer remaining two-year budget to one-year stream
    if (!isTop5 && remainingTwoYearBudget > 0) {
      transferredBudget = remainingTwoYearBudget;
      remainingOneYearBudget += remainingTwoYearBudget;
      remainingTwoYearBudget = 0;
      console.log(`Transferred remaining 2-year budget ($${transferredBudget}) to 1-year stream`);
    }

    // Try to allocate to one-year stream
    if (selectedBudget <= remainingOneYearBudget) {
      remainingOneYearBudget -= selectedBudget;
      totalAllocated += selectedBudget;
      allocatedProjects++;
      return {
        name: providerName,
        score: candidate.score,
        averageSupport: candidate.averageSupport,
        basicBudget,
        extendedBudget,
        allocated: true,
        streamDuration: "1-year" as StreamDuration,
        allocatedBudget: selectedBudget,
        rejectionReason: null,
        isNoneBelow: candidate.isNoneBelow,
        isSpp1,
        budgetType
      };
    }

    // If no allocation possible, mark as rejected
    rejectedProjects++;
    console.log(`Rejected ${providerName}: Insufficient budget`);
    return {
      name: providerName,
      score: candidate.score,
      averageSupport: candidate.averageSupport,
      basicBudget,
      extendedBudget,
      allocated: false,
      streamDuration: null,
      allocatedBudget: 0,
      rejectionReason: "Insufficient budget",
      isNoneBelow: candidate.isNoneBelow,
      isSpp1,
      budgetType
    };
  });

  // Calculate summary
  const summary: AllocationSummary = {
    votedBudget: totalBudget,
    twoYearStreamBudget,
    oneYearStreamBudget,
    transferredBudget,
    adjustedTwoYearBudget: twoYearStreamBudget - transferredBudget,
    adjustedOneYearBudget: oneYearStreamBudget + transferredBudget,
    remainingTwoYearBudget,
    remainingOneYearBudget,
    totalAllocated,
    unspentBudget: remainingTwoYearBudget + remainingOneYearBudget,
    allocatedProjects,
    rejectedProjects,
  };

  return {
    summary,
    allocations,
  };
}
