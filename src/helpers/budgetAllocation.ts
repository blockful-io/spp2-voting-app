/**
 * Budget allocation logic for the Service Provider Program
 */

import { TWO_YEAR_STREAM_RATIO, ONE_YEAR_STREAM_RATIO, BIDIMENSIONAL_ENABLED } from "./config";


interface Allocation {
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

interface AllocationSummary {
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

interface AllocationResults {
  summary: AllocationSummary;
  allocations: Allocation[];
}

/**
 * Allocates budgets to candidates based on their ranking and the new bidimensional rules
 * 
 * @param candidates - Array of candidates with their rankings and budgets
 * @param totalBudget - Total budget available for allocation
 * @returns Object containing allocation results and summary
 */
export function allocateBudgets(
  candidates: Allocation[],
  totalBudget: number
): AllocationResults {
  if (BIDIMENSIONAL_ENABLED) {
    return allocateBudgetsBidimensional(candidates, totalBudget);
  } else {
    return allocateBudgetsStandard(candidates, totalBudget);
  }
}

/**
 * Allocates budgets using the standard allocation method
 */
function allocateBudgetsStandard(
  candidates: Allocation[],
  totalBudget: number
): AllocationResults {
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

  // Process candidates in ranking order
  const allocations = candidates.map((candidate) => {
    // Skip if None Below is reached
    if (candidate.isNoneBelow) {
      return {
        ...candidate,
        allocated: false,
        streamDuration: null,
        allocatedBudget: 0,
        rejectionReason: "None Below reached",
      };
    }

    // Try extended budget first
    if (candidate.isSpp1 && candidate.extendedBudget <= remainingTwoYearBudget) {
      remainingTwoYearBudget -= candidate.extendedBudget;
      totalAllocated += candidate.extendedBudget;
      allocatedProjects++;
      return {
        ...candidate,
        allocated: true,
        streamDuration: "2-year",
        allocatedBudget: candidate.extendedBudget,
        rejectionReason: null,
      };
    }

    // Transfer remaining two-year budget to one-year stream
    if (remainingTwoYearBudget > 0) {
      transferredBudget = remainingTwoYearBudget;
      remainingOneYearBudget += remainingTwoYearBudget;
      remainingTwoYearBudget = 0;
    }

    // Try extended budget in one-year stream
    if (candidate.extendedBudget <= remainingOneYearBudget) {
      remainingOneYearBudget -= candidate.extendedBudget;
      totalAllocated += candidate.extendedBudget;
      allocatedProjects++;
      return {
        ...candidate,
        allocated: true,
        streamDuration: "1-year",
        allocatedBudget: candidate.extendedBudget,
        rejectionReason: null,
      };
    }

    // Try basic budget in one-year stream
    if (candidate.basicBudget <= remainingOneYearBudget) {
      remainingOneYearBudget -= candidate.basicBudget;
      totalAllocated += candidate.basicBudget;
      allocatedProjects++;
      return {
        ...candidate,
        allocated: true,
        streamDuration: "1-year",
        allocatedBudget: candidate.basicBudget,
        rejectionReason: null,
      };
    }

    // If no allocation possible, mark as rejected
    rejectedProjects++;
    return {
      ...candidate,
      allocated: false,
      streamDuration: null,
      allocatedBudget: 0,
      rejectionReason: "Insufficient budget",
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

/**
 * Allocates budgets using the bidimensional allocation method
 */
function allocateBudgetsBidimensional(
  candidates: Allocation[],
  totalBudget: number
): AllocationResults {
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

  // Process candidates in ranking order
  const allocations = candidates.map((candidate) => {
    // Skip if None Below is reached
    if (candidate.isNoneBelow) {
      return {
        ...candidate,
        allocated: false,
        streamDuration: null,
        allocatedBudget: 0,
        rejectionReason: "None Below reached",
      };
    }

    // Get the selected budget based on internal head-to-head comparison
    const selectedBudget = candidate.extendedBudget > candidate.basicBudget ? 
      candidate.extendedBudget : candidate.basicBudget;

    // Check if candidate is in top 5 and eligible for two-year stream
    const isTop5 = candidate.score >= candidates[4]?.score;
    const isEligibleForTwoYear = isTop5 && candidate.isSpp1;

    // Try to allocate to two-year stream if eligible
    if (isEligibleForTwoYear && selectedBudget <= remainingTwoYearBudget) {
      remainingTwoYearBudget -= selectedBudget;
      totalAllocated += selectedBudget;
      allocatedProjects++;
      return {
        ...candidate,
        allocated: true,
        streamDuration: "2-year",
        allocatedBudget: selectedBudget,
        rejectionReason: null,
      };
    }

    // After top 5, transfer remaining two-year budget to one-year stream
    if (!isTop5 && remainingTwoYearBudget > 0) {
      transferredBudget = remainingTwoYearBudget;
      remainingOneYearBudget += remainingTwoYearBudget;
      remainingTwoYearBudget = 0;
    }

    // Try to allocate to one-year stream
    if (selectedBudget <= remainingOneYearBudget) {
      remainingOneYearBudget -= selectedBudget;
      totalAllocated += selectedBudget;
      allocatedProjects++;
      return {
        ...candidate,
        allocated: true,
        streamDuration: "1-year",
        allocatedBudget: selectedBudget,
        rejectionReason: null,
      };
    }

    // If no allocation possible, mark as rejected
    rejectedProjects++;
    return {
      ...candidate,
      allocated: false,
      streamDuration: null,
      allocatedBudget: 0,
      rejectionReason: "Insufficient budget",
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
