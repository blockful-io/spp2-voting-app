import { Proposal as SSProposal } from '@snapshot-labs/snapshot.js/dist/src/sign/types';
import snapshot from '@snapshot-labs/snapshot.js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Web3Provider } from '@ethersproject/providers';

const PROPOSAL_ID = "0x8ccd12442eb55df65eb24c7a292eab4a5988d6cc2699484791c07859eb954784"

export type SnapshotVotes = {
  proposal: {
    title: string;
    choices: string[];
  };
  choice: number[];
};
;

export interface Candidate {
  id: number;
  name: string
  basicBudget: number;
  extendedBudget: number;
  score: number;
  streamDuration?: string;
  isBasicApproved?: boolean;
  isExtendedApproved?: boolean;
}

interface Proposal extends SSProposal {
  id: string;
  raking: Candidate[];
  scores: number[];
  scores_total: number;
}

const mockData = [
  {
    name: "A",
    basicBudget: 300,
    extendedBudget: 1000,
    streamDuration: "FALSE",
  },
  {
    name: "B",
    basicBudget: 200,
    extendedBudget: 400,
    streamDuration: "FALSE",
  },
  {
    name: "C",
    basicBudget: 100,
    extendedBudget: 500,
    streamDuration: "FALSE",
  },
  {
    name: "D",
    basicBudget: 100,
    extendedBudget: 500,
    streamDuration: "FALSE",
  },
  {
    name: "E",
    basicBudget: 400,
    extendedBudget: 500,
    streamDuration: "FALSE",
  },
  {
    name: "F",
    basicBudget: 200,
    extendedBudget: 900,
    streamDuration: "FALSE",
  }
]

export function useGetProposals() {

  // const queryClient = useQueryClient()
  // const [currentScore, setCurrentScore] = useState(0)

  const { data: proposal, isLoading, isError, isFetching } = useQuery({
    queryKey: ['snapshot-score'],
    queryFn: () => fetchProposals(),
  });

  // useQuery({
  //   queryKey: ['snapshot-total-score'],
  //   queryFn: () => fetchTotalScore(),
  //   staleTime: 1000 * 60 * 1, // 1 minute
  // })

  // async function fetchTotalScore() {
  //   const res = await fetch('https://hub.snapshot.org/graphql', {
  //     method: 'POST',
  //     body: JSON.stringify({
  //       query: `
  //         query TotalScore($proposalId: String!) {
  //           proposal(id: $proposalId) {
  //             scores_total
  //           }
  //         }
  //         `, variables: { proposalId: PROPOSAL_ID }
  //     })
  //   })
  //   const { data: { proposal } } = await res.json()
  //   if (proposal.scores_total !== currentScore) {
  //     setCurrentScore(proposal.scores_total)
  //     queryClient.invalidateQueries({ queryKey: ['snapshot-score'] })
  //   }
  // }

  async function fetchProposals(): Promise<Proposal | undefined> {
    const res = await fetch('https://hub.snapshot.org/graphql', {
      method: 'POST',
      body: JSON.stringify({
        query: `
          query Proposal($proposalId: String!) {
            proposal(id: $proposalId) {
              id
              title
              snapshot
              choices
              state
              scores
              scores_total
            }
          }
        `, variables: { proposalId: PROPOSAL_ID }
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const { data: { proposal } } = await res.json()


    return {
      ...proposal,
      raking: proposal.scores.map((score: number, index: number) => {
        const additionalData = mockData[index] || {}
        return {
          id: index + 1,
          name: proposal.choices[index],
          basicBudget: additionalData.basicBudget,
          extendedBudget: additionalData.extendedBudget,
          streamDuration: additionalData.streamDuration,
          score,
          isBasicApproved: index % 2 === 0,
          isExtendedApproved: index % 2 === 0,
        }
      })
        .sort((a: Candidate, b: Candidate) => {
          if (a.isExtendedApproved) return -1
          if (b.isBasicApproved) return 1
          return b.score - a.score
        }),
    };
  }

  return {
    proposal,
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