import { PROPOSAL_ID } from "@/utils/config";
import { HeadToHeadMatch, AllocationResponse, ElectionCandidate, BudgetSummary, Choice, VoteCandidate, Budget } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";

// Re-export types needed by components
export type { VoteCandidate, Budget };

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
          selected: item.budgetType === "basic",
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
            name: allocation.name.includes(" - ")
              ? allocation.name.split(" - ")[0]
              : allocation.name,
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
            isSpp1: allocation.isSpp1,
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
