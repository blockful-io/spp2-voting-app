import { useQuery } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";
import { GET_VOTES_QUERY } from "@/graphql/queries/getVotes";

const SNAPSHOT_API = "https://hub.snapshot.org/graphql";
const PROPOSAL_ID = process.env.NEXT_PUBLIC_PROPOSAL_ID;

if (!PROPOSAL_ID) {
  throw new Error("NEXT_PUBLIC_PROPOSAL_ID environment variable is not set");
}

const graphQLClient = new GraphQLClient(SNAPSHOT_API);

interface VoteMetadata {
  votingPower?: number;
  verifiedVotingPower?: number;
  [key: string]: unknown;
}

interface Vote {
  id: string;
  ipfs: string;
  voter: string;
  created: number;
  choice: number | number[];
  metadata: VoteMetadata;
  reason: string | null;
  app: string;
  vp: number;
  vp_by_strategy: number[];
  vp_state: string;
}

interface VotesResponse {
  votes: Vote[];
}

export function useVotes(voter: string | undefined) {
  return useQuery<VotesResponse>({
    queryKey: ["votes", voter],
    queryFn: async () => {
      if (!voter) throw new Error("Voter address is required");
      return graphQLClient.request(GET_VOTES_QUERY, {
        proposal: PROPOSAL_ID,
        voter,
      });
    },
    enabled: !!voter,
  });
}
