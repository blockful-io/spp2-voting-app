import { gql } from "graphql-request";

export const GET_VOTES_QUERY = gql`
  query Votes($proposal: String!, $voter: String!) {
    votes(where: { proposal: $proposal, voter: $voter }) {
      id
      ipfs
      voter
      created
      choice
      metadata
      reason
      app
      vp
      vp_by_strategy
      vp_state
    }
  }
`;
