import { PROPOSAL_ID } from "@/utils/config";
import {
  AllocationResponse,
  Allocation,
  BudgetSummary,
  Choice,
  VoteCandidate,
  Budget,
} from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";

// Re-export types needed by components
export type { VoteCandidate, Budget };

export function useChoices() {
  const {
    data: fetchChoicesFunc,
    isLoading,
    isError,
  } = useQuery({
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
          selected: item.budgetType === "basic",
        })),
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
  const [data, setData] = useState<Allocation[]>([]);
  const [allocationData, setAllocationData] =
    useState<AllocationResponse | null>(null);

  console.log("allocationData", allocationData);

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
      console.log("allocationResponse", allocationResponse);
      setAllocationData(allocationResponse);

      // Transform allocation data to match our Allocation interface
      const transformedData: Allocation[] = allocationResponse.allocations.map(
        (allocation, index) => ({
          name: allocation.name,
          score: allocation.score,
          averageSupport: allocation.averageSupport,
          budget: allocation.budget,
          provider: allocation.provider,
          allocated: allocation.allocated,
          streamDuration: allocation.streamDuration || "1-year", // Default to 1-year if null
          rejectionReason: allocation.rejectionReason,
          isNoneBelow: allocation.isNoneBelow,
          isSpp1: allocation.isSpp1,
          budgetType: allocation.budgetType,
        })
      );

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
    choices: allocationData?.choices,
  };
}
