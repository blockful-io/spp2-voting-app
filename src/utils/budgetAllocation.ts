/**
 * Budget allocation logic for the Service Provider Program
 */

import { Allocation, AllocationResults, AllocationSummary, StreamDuration, HeadToHeadMatch, CopelandResults, Choice, BudgetType } from "./types";
import { parseChoiceName } from "./parseChoiceName";

// Constants for new budget allocation rules
export const TOTAL_BUDGET = 4500000; // $4.5 million total budget
export const TWO_YEAR_STREAM_CAP = 1500000; // $1.5 million cap for 2-year stream
export const TOP_RANK_THRESHOLD = 10; // Top 10 entries eligible for 2-year stream

/**
 * Allocates budgets to choices based on their ranking
 * 
 * @param copelandResults - Results from Copeland ranking including ranked choices and head-to-head matches
 * @param totalBudget - Total budget available for allocation
 * @param choicesData - Choice data containing budget information for service providers
 * @returns Object containing allocation results and summary
 */
export function allocateBudgets(
  copelandResults: CopelandResults,
  totalBudget: number = TOTAL_BUDGET,
  choicesData: Choice[]
): AllocationResults {
  console.log("Starting budget allocation with choices data");
  
  // Initialize budget tracking
  let remainingTwoYearBudget = TWO_YEAR_STREAM_CAP;
  let remainingTotalBudget = totalBudget;
  let twoYearAllocated = 0;
  let oneYearAllocated = 0;
  let totalAllocated = 0;
  let allocatedProjects = 0;
  let rejectedProjects = 0;
  
  // Find the "None Below" entry if it exists
  const noneBelowIndex = copelandResults.rankedChoices.findIndex(c => c.isNoneBelow);
  
  // Process choices in ranking order - convert to allocations and apply allocation logic
  const allocations: Allocation[] = [];
  
  // Process ranked choices
  for (let i = 0; i < copelandResults.rankedChoices.length; i++) {
    const choice = copelandResults.rankedChoices[i];
    
    // Check if we've reached "None Below" - if so, stop allocation
    if (choice.isNoneBelow) {
      allocations.push({
        name: choice.name,
        score: choice.score,
        averageSupport: choice.averageSupport,
        budget: 0,
        allocated: false,
        streamDuration: null,
        rejectionReason: "None Below reached",
        isNoneBelow: true,
        budgetType: "none"
      });
      break; // Stop allocation process
    }
    
    // Parse the choice name
    const { name: providerName, budgetType } = parseChoiceName(choice.name);
    
    // Find the choice data for this entry
    const choiceData = choicesData.find(c => 
      c.name === providerName && c.budgetType === budgetType
    );
    
    if (!choiceData) {
      console.warn(`No choice data found for ${choice.name}`);
      continue;
    }
    
    // Determine if this entry is from a current service provider (SPP1)
    const isSpp1 = choiceData.isSpp1;
    
    // Get budget amount for this specific choice
    const budget = choiceData.budget;
    
    // Determine stream assignment according to the rules:
    let streamDuration: StreamDuration = null;
    let allocated = false;
    let rejectionReason: string | null = null;
    
    // Rule 1: Assign to 2-year stream if:
    // - Current service provider (SPP1)
    // - Ranked in top 10
    // - Won't exceed 2-year stream cap ($1.5M)
    if (isSpp1 && i < TOP_RANK_THRESHOLD && budget <= remainingTwoYearBudget) {
      streamDuration = "2-year";
      remainingTwoYearBudget -= budget;
      remainingTotalBudget -= budget;
      twoYearAllocated += budget;
      totalAllocated += budget;
      allocated = true;
      allocatedProjects++;
    } 
    // Rule 2: Otherwise, assign to 1-year stream if budget fits in remaining total
    else if (budget <= remainingTotalBudget) {
      streamDuration = "1-year";
      remainingTotalBudget -= budget;
      oneYearAllocated += budget;
      totalAllocated += budget;
      allocated = true;
      allocatedProjects++;
    }
    // Rule 3: Reject if budget doesn't fit in remaining total
    else {
      rejectionReason = "Insufficient budget";
      rejectedProjects++;
    }
    
    // Add the allocation result
    allocations.push({
      name: providerName,
      score: choice.score,
      averageSupport: choice.averageSupport,
      budget,
      allocated,
      streamDuration,
      rejectionReason,
      isNoneBelow: false,
      isSpp1,
      budgetType
    });
    
    // Rule 3: Stop if total budget is fully allocated
    if (remainingTotalBudget <= 0) {
      break;
    }
  }
  
  // Calculate summary
  const summary: AllocationSummary = {
    votedBudget: totalBudget,
    twoYearStreamBudget: TWO_YEAR_STREAM_CAP,
    oneYearStreamBudget: totalBudget - TWO_YEAR_STREAM_CAP,
    transferredBudget: 0, // No budget transfer in new model
    adjustedTwoYearBudget: TWO_YEAR_STREAM_CAP,
    adjustedOneYearBudget: totalBudget - TWO_YEAR_STREAM_CAP,
    remainingTwoYearBudget,
    remainingOneYearBudget: remainingTotalBudget - remainingTwoYearBudget,
    totalAllocated,
    unspentBudget: remainingTotalBudget,
    allocatedProjects,
    rejectedProjects
  };
  
  return {
    summary,
    allocations
  };
}
