import { useQuery } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";
import { GET_VOTES_QUERY } from "@/graphql/queries/getVotes";
import { PROPOSAL_ID } from "@/utils/config";

const SNAPSHOT_API = "https://hub.snapshot.org/graphql";
const graphQLClient = new GraphQLClient(SNAPSHOT_API);

interface VoteMetadata {
  votingPower?: number;
  verifiedVotingPower?: number;
  [key: string]: unknown;
}

export interface Vote {
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

export interface VotesResponse {
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
