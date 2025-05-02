import { useQuery } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";
import { GET_ALL_VOTES_QUERY } from "@/graphql/queries/getAllVotes";
import { PROPOSAL_ID } from "@/utils/config";
import { Vote } from "./useVotes";

const SNAPSHOT_API = "https://hub.snapshot.org/graphql";
const graphQLClient = new GraphQLClient(SNAPSHOT_API);

export interface AllVotesResponse {
  votes: Vote[];
}

export interface UseAllVotesProps {
  first?: number;
  skip?: number;
  orderBy?: "vp" | "created";
}

// Default to fetching 1000 votes to load all at once
export function useAllVotes({ first = 1000, skip = 0, orderBy = "vp" }: UseAllVotesProps = {}) {
  return useQuery<AllVotesResponse>({
    queryKey: ["allVotes", first, skip, orderBy],
    queryFn: async () => {
      const response = await graphQLClient.request<AllVotesResponse>(GET_ALL_VOTES_QUERY, {
        proposal: PROPOSAL_ID,
        first,
        skip,
      });
      
      if (response.votes && response.votes.length > 0) {
        if (orderBy === "vp") {
          response.votes.sort((a: Vote, b: Vote) => b.vp - a.vp);
        } else if (orderBy === "created") {
          response.votes.sort((a: Vote, b: Vote) => b.created - a.created);
        }
      }
      
      return response;
    },
  });
} 