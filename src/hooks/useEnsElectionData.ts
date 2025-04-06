import { useState, useEffect, useMemo } from "react";

interface AllocationResponse {
  proposal: {
    id: string;
    title: string;
    space: {
      id: string;
      name: string;
    };
    state: string;
    dataSource: string;
  };
  headToHeadMatches: Array<{
    candidate1: string;
    candidate2: string;
    candidate1Votes: number;
    candidate2Votes: number;
    totalVotes: number;
    winner: string;
  }>;
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
  allocations: Array<{
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
  }>;
  choices?: Array<string>;
}

interface ElectionCandidate {
  name: string;
  score: number;
  averageSupport: number;
  basicBudget: number;
  extendedBudget: number;
  allocated: boolean;
  streamDuration: string;
  allocatedBudget: number;
  rejectionReason: string | null;
  isEligibleForExtendedBudget: boolean;
  isNoneBelow: boolean;
}

interface BudgetSummary {
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

const PROPOSAL_ID =
  "0x5dff4695ef4b5a576d132c2d278342a54b1fe5846ebcdc9a908e273611f27ee1";

export function useEnsElectionData() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<ElectionCandidate[]>([]);
  const [allocationData, setAllocationData] =
    useState<AllocationResponse | null>(null);

  const fetch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await window.fetch(
        `/api/allocation?proposalId=${PROPOSAL_ID}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const allocationResponse: AllocationResponse = await response.json();
      setAllocationData(allocationResponse);

      // Transform allocation data to match our ElectionCandidate interface
      const transformedData: ElectionCandidate[] =
        allocationResponse.allocations
          .filter((allocation) => !allocation.isNoneBelow) // Filter out "None Below" option
          .map((allocation) => ({
            name: allocation.name,
            score: allocation.score,
            averageSupport: allocation.averageSupport,
            basicBudget: allocation.basicBudget,
            extendedBudget: allocation.extendedBudget,
            allocated: allocation.allocated,
            streamDuration: allocation.streamDuration || "1-year", // Default to 1-year if null
            allocatedBudget: allocation.allocatedBudget,
            rejectionReason: allocation.rejectionReason,
            isEligibleForExtendedBudget:
              allocation.extendedBudget > allocation.basicBudget,
            isNoneBelow: allocation.isNoneBelow,
          }));

      setData(transformedData);
      return transformedData;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch data";
      setError(new Error(errorMessage));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetch().catch(console.error);
  }, []);

  // Memoize the mapped data to prevent unnecessary re-renders
  const mappedData = useMemo(() => {
    return data.map((candidate) => ({
      name: candidate.name,
      score: candidate.score,
      averageSupport: candidate.averageSupport,
      allocatedBudget: candidate.allocatedBudget,
      streamDuration: candidate.streamDuration,
      isEligibleForExtendedBudget: candidate.isEligibleForExtendedBudget,
      wins: candidate.score,
      basicBudget: candidate.basicBudget,
      extendedBudget: candidate.extendedBudget,
      isNoneBelow: candidate.isNoneBelow,
    }));
  }, [data]);

  // Memoize the summary data for graphs
  const summary = useMemo((): BudgetSummary | null => {
    if (!allocationData) return null;

    const { summary: rawSummary } = allocationData;

    return {
      totalBudget: rawSummary.votedBudget,
      totalAllocated: rawSummary.totalAllocated,
      unspentBudget: rawSummary.unspentBudget,
      streamBreakdown: {
        oneYear: {
          budget: rawSummary.oneYearStreamBudget,
          allocated:
            rawSummary.oneYearStreamBudget - rawSummary.remainingOneYearBudget,
          remaining: rawSummary.remainingOneYearBudget,
        },
        twoYear: {
          budget: rawSummary.twoYearStreamBudget,
          allocated:
            rawSummary.twoYearStreamBudget - rawSummary.remainingTwoYearBudget,
          remaining: rawSummary.remainingTwoYearBudget,
        },
      },
      metrics: {
        allocatedProjects: rawSummary.allocatedProjects,
        rejectedProjects: rawSummary.rejectedProjects,
      },
    };
  }, [allocationData]);

  return {
    data: mappedData,
    isLoading,
    error,
    fetch,
    allocationData, // Also expose the full allocation data if needed
    summary, // Expose the processed summary data
  };
}
