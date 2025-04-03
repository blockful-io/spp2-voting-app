import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

// Define the types for the data structure
interface Proposal {
  id: string;
  title: string;
  space: string;
  totalVotes: number;
  totalVotingPower: number;
  state: string;
  dataSource: string;
}

interface CopelandRanking {
  name: string;
  wins: number;
  averageSupport: number;
}

interface HeadToHeadMatch {
  candidate1: string;
  candidate2: string;
  candidate1Votes: number;
  candidate2Votes: number;
  totalVotes: number;
}

interface Summary {
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

interface Allocation {
  name: string;
  score: number;
  averageSupport: number;
  basicBudget: number;
  extendedBudget: number;
  allocated: boolean;
  streamDuration: string;
  allocatedBudget: number;
  rejectionReason: string | null;
}

interface HeadToHeadData {
  proposal: Proposal;
  copelandRanking: CopelandRanking[];
  headToHeadMatches: HeadToHeadMatch[];
  summary: Summary;
  allocations: Allocation[];
}

/**
 * Represents a single head-to-head match result
 * @example
 * {
 *   candidate: "Namespace",      // Name of the opponent
 *   votes: 832000,              // Number of votes the opponent received
 *   winner: false,              // Whether the opponent won (false means our candidate won)
 *   totalVotes: 1281000         // Total votes in this match
 * }
 */
interface CandidateMatch {
  candidate: string;
  votes: number;
  winner: boolean;
  totalVotes: number;
}

/**
 * Represents the budget options and selection for a candidate
 * @example
 * {
 *   basic: {
 *     amount: 500000,           // Basic budget amount ($500k)
 *     selected: false           // Whether this budget was selected
 *   },
 *   extended: {
 *     amount: 700000,           // Extended budget amount ($700k)
 *     selected: true            // This budget was selected instead of basic
 *   }
 * }
 */
interface CandidateBudget {
  basic: {
    amount: number;
    selected: boolean;
  };
  extended: {
    amount: number;
    selected: boolean;
  };
}

/**
 * Complete head-to-head results for a candidate
 * @example
 * {
 *   matches: [                  // Array of all head-to-head matches
 *     {
 *       candidate: "Namespace",
 *       votes: 832000,
 *       winner: false,
 *       totalVotes: 1281000
 *     },
 *     // ... more matches
 *   ],
 *   budget: {                   // Budget information
 *     basic: { amount: 500000, selected: false },
 *     extended: { amount: 700000, selected: true }
 *   },
 *   wins: 2,                    // Total number of matches won
 *   losses: 1                   // Total number of matches lost
 * }
 */
interface CandidateHeadToHeadResults {
  matches: CandidateMatch[];
  budget: CandidateBudget;
  wins: number;
  losses: number;
}

// Mock data for the hook
const mockHeadToHeadData: HeadToHeadData = {
  proposal: {
    id: "0x5dff4695ef4b5a576d132c2d278342a54b1fe5846ebcdc9a908e273611f27ee1",
    title: "Service Provider Program Renewal",
    space: "ENS DAO",
    totalVotes: 11,
    totalVotingPower: 1952000,
    state: "closed",
    dataSource: "Local Mock Data",
  },
  copelandRanking: [
    {
      name: "Namespace",
      wins: 4,
      averageSupport: 863000,
    },
    {
      name: "Unruggable",
      wins: 2,
      averageSupport: 689750,
    },
    {
      name: "eth.limo",
      wins: 2,
      averageSupport: 613250,
    },
    {
      name: "Blockful",
      wins: 2,
      averageSupport: 596500,
    },
    {
      name: "EFP",
      wins: 0,
      averageSupport: 704500,
    },
  ],
  headToHeadMatches: [
    {
      candidate1: "Namespace",
      candidate2: "EFP",
      candidate1Votes: 1023000,
      candidate2Votes: 818000,
      totalVotes: 1841000,
    },
    {
      candidate1: "Unruggable",
      candidate2: "EFP",
      candidate1Votes: 1006000,
      candidate2Votes: 560000,
      totalVotes: 1566000,
    },
    {
      candidate1: "eth.limo",
      candidate2: "EFP",
      candidate1Votes: 788000,
      candidate2Votes: 751000,
      totalVotes: 1539000,
    },
    {
      candidate1: "Blockful",
      candidate2: "EFP",
      candidate1Votes: 791000,
      candidate2Votes: 689000,
      totalVotes: 1480000,
    },
    {
      candidate1: "Unruggable",
      candidate2: "Namespace",
      candidate1Votes: 449000,
      candidate2Votes: 832000,
      totalVotes: 1281000,
    },
    {
      candidate1: "Unruggable",
      candidate2: "eth.limo",
      candidate1Votes: 622000,
      candidate2Votes: 659000,
      totalVotes: 1281000,
    },
    {
      candidate1: "Blockful",
      candidate2: "Namespace",
      candidate1Votes: 462000,
      candidate2Votes: 819000,
      totalVotes: 1281000,
    },

    {
      candidate1: "Namespace",
      candidate2: "eth.limo",
      candidate1Votes: 778000,
      candidate2Votes: 503000,
      totalVotes: 1281000,
    },
    {
      candidate1: "Blockful",
      candidate2: "eth.limo",
      candidate1Votes: 662000,
      candidate2Votes: 503000,
      totalVotes: 1165000,
    },
    {
      candidate1: "Unruggable",
      candidate2: "Blockful",
      candidate1Votes: 682000,
      candidate2Votes: 471000,
      totalVotes: 1153000,
    },
  ],
  summary: {
    votedBudget: 4500000,
    twoYearStreamBudget: 1500000,
    oneYearStreamBudget: 3000000,
    transferredBudget: 100000,
    adjustedTwoYearBudget: 1400000,
    adjustedOneYearBudget: 3100000,
    remainingTwoYearBudget: 0,
    remainingOneYearBudget: 1600000,
    totalAllocated: 2900000,
    unspentBudget: 1600000,
    allocatedProjects: 5,
    rejectedProjects: 0,
  },
  allocations: [
    {
      name: "Namespace",
      score: 4,
      averageSupport: 863000,
      basicBudget: 500000,
      extendedBudget: 700000,
      allocated: true,
      streamDuration: "2-year",
      allocatedBudget: 700000,
      rejectionReason: null,
    },
    {
      name: "Unruggable",
      score: 2,
      averageSupport: 689750,
      basicBudget: 400000,
      extendedBudget: 700000,
      allocated: true,
      streamDuration: "2-year",
      allocatedBudget: 700000,
      rejectionReason: null,
    },
    {
      name: "eth.limo",
      score: 2,
      averageSupport: 613250,
      basicBudget: 700000,
      extendedBudget: 800000,
      allocated: true,
      streamDuration: "1-year",
      allocatedBudget: 800000,
      rejectionReason: null,
    },
    {
      name: "Blockful",
      score: 2,
      averageSupport: 596500,
      basicBudget: 400000,
      extendedBudget: 700000,
      allocated: true,
      streamDuration: "1-year",
      allocatedBudget: 700000,
      rejectionReason: null,
    },
    {
      name: "EFP",
      score: 0,
      averageSupport: 704500,
      basicBudget: 0,
      extendedBudget: 0,
      allocated: true,
      streamDuration: "1-year",
      allocatedBudget: 0,
      rejectionReason: null,
    },
  ],
};

/**
 * Gets all head-to-head matches for a specific candidate
 *
 * @example
 * // For candidate "Blockful", returns:
 * {
 *   matches: [
 *     {
 *       candidate: "EFP",           // First match against EFP
 *       votes: 689000,             // EFP's votes
 *       winner: false,             // EFP lost (Blockful won)
 *       totalVotes: 1480000        // Total votes in this match
 *     },
 *     {
 *       candidate: "Namespace",     // Second match against Namespace
 *       votes: 819000,             // Namespace's votes
 *       winner: true,              // Namespace won
 *       totalVotes: 1281000        // Total votes in this match
 *     },
 *     // ... more matches
 *   ],
 *   budget: {
 *     basic: {
 *       amount: 400000,            // Basic budget option ($400k)
 *       selected: false            // Basic budget wasn't chosen
 *     },
 *     extended: {
 *       amount: 700000,            // Extended budget option ($700k)
 *       selected: true             // Extended budget was chosen
 *     }
 *   },
 *   wins: 2,                       // Blockful won 2 matches
 *   losses: 1                      // Blockful lost 1 match
 * }
 *
 * @param data The complete head-to-head data
 * @param candidateName The name of the candidate to get matches for
 * @returns Formatted head-to-head results for the candidate, or null if candidate not found
 */
function getCandidateHeadToHead(
  data: HeadToHeadData | undefined,
  candidateName: string
): CandidateHeadToHeadResults | null {
  if (!data || !candidateName) return null;

  const matches: CandidateMatch[] = [];
  let wins = 0;
  let losses = 0;

  // Find the candidate's allocation for budget info
  const allocation = data.allocations?.find(
    (a) => a.name.toLowerCase() === candidateName?.toLowerCase()
  );

  if (!allocation) return null;

  // Get budget information
  const budget: CandidateBudget = {
    basic: {
      amount: allocation.basicBudget || 0,
      selected: allocation.allocatedBudget === allocation.basicBudget,
    },
    extended: {
      amount: allocation.extendedBudget || 0,
      selected: allocation.allocatedBudget === allocation.extendedBudget,
    },
  };

  // Process all head-to-head matches
  data.headToHeadMatches?.forEach((match) => {
    const lowerCandidateName = candidateName.toLowerCase();
    const candidate1Lower = match.candidate1.toLowerCase();
    const candidate2Lower = match.candidate2.toLowerCase();

    if (candidate1Lower === lowerCandidateName) {
      matches.push({
        candidate: match.candidate2,
        votes: match.candidate2Votes,
        winner: match.candidate1Votes > match.candidate2Votes,
        totalVotes: match.totalVotes,
      });
      if (match.candidate1Votes > match.candidate2Votes) wins++;
      else losses++;
    } else if (candidate2Lower === lowerCandidateName) {
      matches.push({
        candidate: match.candidate1,
        votes: match.candidate1Votes,
        winner: match.candidate2Votes > match.candidate1Votes,
        totalVotes: match.totalVotes,
      });
      if (match.candidate2Votes > match.candidate1Votes) wins++;
      else losses++;
    }
  });

  return {
    matches,
    budget,
    wins,
    losses,
  };
}

/**
 * Hook to fetch head-to-head data for a proposal
 * @param proposalId Optional proposal ID to fetch data for. If not provided, returns mock data.
 * @param minLoadingTime Minimum time in milliseconds to show loading state (default: 1000ms)
 * @returns Object containing the head-to-head data, loading state, and error state
 */
export function useHeadToHeadData(proposalId?: string, minLoadingTime = 1000) {
  const [isLoadingWithDelay, setIsLoadingWithDelay] = useState(true);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["head-to-head-data", proposalId],
    queryFn: async () => {
      // In a real implementation, this would fetch data from an API
      // For now, we'll return the mock data
      if (proposalId) {
        // Simulate API call with delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // In a real implementation, you would fetch from an API like:
        // const response = await fetch(`/api/head-to-head/${proposalId}`);
        // return response.json();

        // For now, just return the mock data
        return mockHeadToHeadData;
      }

      return mockHeadToHeadData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Add a delay to the loading state
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isLoading) {
      setIsLoadingWithDelay(true);
    } else {
      // Ensure loading state is shown for at least minLoadingTime
      timer = setTimeout(() => {
        setIsLoadingWithDelay(false);
      }, minLoadingTime);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, minLoadingTime]);

  return {
    data,
    isLoading: isLoadingWithDelay,
    isError,
    error,
    refetch,
    getCandidateHeadToHead: (candidateName: string) =>
      getCandidateHeadToHead(data, candidateName),
  };
}
