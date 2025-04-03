import snapshot from "@snapshot-labs/snapshot.js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Web3Provider } from "@ethersproject/providers";

const PROPOSAL_ID =
  "0x8ccd12442eb55df65eb24c7a292eab4a5988d6cc2699484791c07859eb954784";

export interface Ranking {
  name: string;
  score: number;
  averageSupport: number;
  basicBudget: number;
  extendedBudget: number;
  allocated: boolean;
  streamDuration: string;
  allocatedBudget: number;
  rejectionReason: null;
}

const mockRanking = [
  {
    name: "A",
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
    name: "B",
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
    name: "C",
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
    name: "D",
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
    name: "E",
    score: 0,
    averageSupport: 704500,
    basicBudget: 0,
    extendedBudget: 0,
    allocated: false,
    streamDuration: "1-year",
    allocatedBudget: 0,
    rejectionReason: null,
  },
  {
    name: "F",
    score: 0,
    averageSupport: 704500,
    basicBudget: 0,
    extendedBudget: 0,
    allocated: false,
    streamDuration: "1-year",
    allocatedBudget: 0,
    rejectionReason: null,
  },
];

export interface Candidate {
  name: string;
  basicBudget: number;
  extendedBudget: number;
  budgetType?: "basic" | "extended";
}

const mockCandidatesMap: Record<string, Omit<Candidate, 'name'>> = {
  "A": {
    basicBudget: 500000,
    extendedBudget: 700000,
  },
  "B": {
    basicBudget: 500000,
    extendedBudget: 700000,
  },
  "C": {
    basicBudget: 500000,
    extendedBudget: 700000,
  },
  "D": {
    basicBudget: 500000,
    extendedBudget: 700000,
  },
  "E": {
    basicBudget: 500000,
    extendedBudget: 700000,
  },
  "F": {
    basicBudget: 500000,
    extendedBudget: 700000,
  },
};

export function useGetCandidates() {
  const {
    data: candidates,
    isLoading,
    isError,
    isFetching,
  } = useQuery({
    queryKey: ["snapshot-choices"],
    queryFn: () => fetchCandidates(),
  });

  async function fetchCandidates(): Promise<Candidate[]> {
    const res = await fetch("https://hub.snapshot.org/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query Choices($proposalId: String!) {
            proposal(id: $proposalId) {
              choices
            }
          }
          `,
        variables: { proposalId: PROPOSAL_ID },
        operationName: "Choices",
      }),
    });
    const {
      data: { proposal: { choices } },
    } = await res.json();
    return choices.map((name: string): Candidate => ({
      ...mockCandidatesMap[name],
      name,
    }));
  }

  return {
    candidates,
    isLoading,
    isError,
    isFetching,
  };
}

export function useGetRanking() {
  const {
    data: ranking,
    isLoading,
    isError,
    isFetching,
  } = useQuery({
    queryKey: ["snapshot-score"],
    queryFn: () => fetchRanking(),
  });

  async function fetchRanking(): Promise<Ranking[] | undefined> {
    return mockRanking;
  }

  return {
    ranking,
    isLoading,
    isError,
    isFetching,
  };
}

export function useVoteOnProposals() {
  const queryClient = useQueryClient();

  const client = new snapshot.Client712("https://hub.snapshot.org");
  const web3 =
    typeof window !== "undefined" ? new Web3Provider(window.ethereum!) : null;

  const {
    mutateAsync: voteFunc,
    error,
    isPending,
  } = useMutation({
    mutationFn: voteOnProposal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snapshot-score"] });
    },
  });

  async function voteOnProposal(choice: number[]) {
    if (!web3) {
      throw new Error("Web3 provider not available");
    }
    const [account] = await web3.listAccounts();
    await client.vote(web3, account, {
      space: "pikonha.eth",
      proposal: PROPOSAL_ID,
      type: "ranked-choice",
      choice,
    });
  }

  return {
    voteFunc,
    error,
    isPending,
  };
}
