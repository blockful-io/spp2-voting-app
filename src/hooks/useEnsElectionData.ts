import { PROPOSAL_ID } from "@/helpers/config";
import { useQuery } from "@tanstack/react-query";
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
  id: number;
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

export interface Choice {
  budget: number;
  budgetType: "basic" | "extended";
  choiceId: number;
  isNoneBelow: boolean;
  isSpp1: boolean;
  name: string;
  originalName: string;
}

export interface VoteCandidate {
  name: string;
  budgets: Budget[];
}

export interface Budget {
  value: number;
  type: string;
  id: number;
  selected: boolean;
}


export function useChoices() {
  const { data: fetchChoicesFunc, isLoading, isError } = useQuery({
    queryKey: ["choices"],
    queryFn: fetchChoices,
  });

  async function fetchChoices() {
    const response = await window.fetch(
      `/api/allocation?proposalId=${PROPOSAL_ID}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const { choices } = await response.json();

    // Create a map to group items by name
    const groupedByName = new Map();

    // Group items by name
    for (const item of choices) {
      const name = item.name;

      if (!groupedByName.has(name)) {
        groupedByName.set(name, []);
      }

      groupedByName.get(name).push(item);
    }

    const result = [];
    for (const [name, items] of groupedByName) {
      result.push({
        name: name,
        budgets: items.map((item: Choice) => ({
          id: item.choiceId,
          value: item.budget,
          type: item.budgetType,
          selected: false,
        }))
      });
    }
    return result;
  }

  return {
    fetchChoices: fetchChoicesFunc,
    isLoading,
    isError,
  };
}

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
          .map((allocation, index) => ({
            id: index + 1,
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
    data,
    isLoading,
    error,
    fetch,
    allocationData, // Also expose the full allocation data if needed
    summary, // Expose the processed summary data
  };
}
