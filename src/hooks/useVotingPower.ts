import { useQuery } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import { PROPOSAL_ID, PROPOSAL_SPACE } from "@/utils/config";
import { useAccount } from "wagmi";

const SNAPSHOT_API = "https://hub.snapshot.org/graphql";
const graphQLClient = new GraphQLClient(SNAPSHOT_API);

// Define the response type for the voting power query
interface VotingPowerResponse {
  vp: {
    vp: number;
    vp_state: string;
  } | null;
}

// GraphQL query to get a user's voting power for a specific proposal
const GET_VOTING_POWER_QUERY = gql`
  query GetVotingPower($space: String!, $voter: String!, $proposal: String!) {
    vp(space: $space, voter: $voter, proposal: $proposal) {
      vp
      vp_state
    }
  }
`;

export function useVotingPower() {
  const { address } = useAccount();

  return useQuery<number | null>({
    queryKey: ["voting-power", address, PROPOSAL_ID],
    queryFn: async () => {
      if (!address) return null;

      try {
        const response = await graphQLClient.request<VotingPowerResponse>(GET_VOTING_POWER_QUERY, {
          space: PROPOSAL_SPACE,
          voter: address,
          proposal: PROPOSAL_ID
        });

        return response?.vp?.vp || 0;
      } catch (error) {
        console.error("Error fetching voting power:", error);
        return 0;
      }
    },
    enabled: !!address,
  });
} 