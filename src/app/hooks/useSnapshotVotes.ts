import { Proposal as SSProposal } from '@snapshot-labs/snapshot.js/dist/src/sign/types';
import { useQuery } from '@tanstack/react-query';

export type SnapshotVotes = {
  proposal: {
    title: string;
    choices: string[];
  };
  choice: number[];
};

const QUERY = `
  query Proposalsxxxxx {
    proposals(
      first: 1,
      skip: 0,
      where: {
        space_in: ["pikonha.eth"],
        state: "open",
      },
      orderBy: "created",
      orderDirection: desc
    ) {
      id
      title
      snapshot
      state
      scores
    }
  }
`;

interface Proposal extends SSProposal {
  id: string;
  scores: number[];
}

export function useSnapshotProposal() {

  const { data: proposals, isLoading, isError, isFetching } = useQuery({
    queryKey: ['snapshot-score'],
    queryFn: () => fetchProposals(),
  });

  async function fetchProposals(): Promise<Proposal[]> {
    const res = await fetch('https://hub.snapshot.org/graphql', {
      method: 'POST',
      body: JSON.stringify({ query: QUERY }), //, variables: { voter: address } }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const { data: { proposals } } = await res.json()
    return proposals;
  }

  return {
    proposals: proposals || [],
    isLoading,
    isError,
    isFetching,
  }

}