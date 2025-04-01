import snapshot from '@snapshot-labs/snapshot.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Web3Provider } from '@ethersproject/providers';

const PROPOSAL_ID = "0x8ccd12442eb55df65eb24c7a292eab4a5988d6cc2699484791c07859eb954784"

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
    "name": "Namespace",
    "score": 4,
    "averageSupport": 863000,
    "basicBudget": 500000,
    "extendedBudget": 700000,
    "allocated": true,
    "streamDuration": "2-year",
    "allocatedBudget": 700000,
    "rejectionReason": null
  },
  {
    "name": "Unruggable",
    "score": 2,
    "averageSupport": 689750,
    "basicBudget": 400000,
    "extendedBudget": 700000,
    "allocated": true,
    "streamDuration": "2-year",
    "allocatedBudget": 700000,
    "rejectionReason": null
  },
  {
    "name": "eth.limo",
    "score": 2,
    "averageSupport": 613250,
    "basicBudget": 700000,
    "extendedBudget": 800000,
    "allocated": true,
    "streamDuration": "1-year",
    "allocatedBudget": 800000,
    "rejectionReason": null
  },
  {
    "name": "Blockful",
    "score": 2,
    "averageSupport": 596500,
    "basicBudget": 400000,
    "extendedBudget": 700000,
    "allocated": true,
    "streamDuration": "1-year",
    "allocatedBudget": 700000,
    "rejectionReason": null
  },
  {
    "name": "EFP",
    "score": 0,
    "averageSupport": 704500,
    "basicBudget": 0,
    "extendedBudget": 0,
    "allocated": false,
    "streamDuration": "1-year",
    "allocatedBudget": 0,
    "rejectionReason": null
  }
]

export interface Choice {
  id: number;
  name: number;
}

export function useGetChoices() {

  const { data: choices, isLoading, isError, isFetching } = useQuery({
    queryKey: ['snapshot-choices'],
    queryFn: () => fetchChoices(),
  });

  async function fetchChoices() {
    const res = await fetch('https://hub.snapshot.org/graphql', {
      method: 'POST',
      body: JSON.stringify({
        query: `
          query TotalScore($proposalId: String!) {
            proposal(id: $proposalId) {
              choices
            }
          }
          `, variables: { proposalId: PROPOSAL_ID }
      })
    })
    const { data: { proposal } } = await res.json()
    return proposal.choices.map((c: number, index: number) => ({ id: c, name: c }))
  }

  return {
    choices,
    isLoading,
    isError,
    isFetching,
  }

}

export function useGetRanking() {

  const { data: ranking, isLoading, isError, isFetching } = useQuery({
    queryKey: ['snapshot-score'],
    queryFn: () => fetchRanking(),
  });

  async function fetchRanking(): Promise<Ranking[] | undefined> {
    return mockRanking
  }

  return {
    ranking,
    isLoading,
    isError,
    isFetching,
  }

}

export function useVoteOnProposals() {
  const queryClient = useQueryClient()

  const client = new snapshot.Client712('https://hub.snapshot.org');
  const web3 = new Web3Provider(window.ethereum!);

  const { mutateAsync: voteFunc, error, isPending } = useMutation({
    mutationFn: voteOnProposal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snapshot-score'] })
    }
  });

  async function voteOnProposal(choice: number[]) {
    const [account] = await web3.listAccounts();
    await client.vote(web3, account, {
      space: 'pikonha.eth',
      proposal: PROPOSAL_ID,
      type: "ranked-choice",
      choice,
    })
  }

  return {
    voteFunc,
    error,
    isPending
  }

}