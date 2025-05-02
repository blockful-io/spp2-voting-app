import { gql } from "graphql-request";

export const GET_ALL_VOTES_QUERY = gql`
  query AllVotes($proposal: String!, $first: Int, $skip: Int) {
    votes(
      where: { proposal: $proposal }
      first: $first
      skip: $skip
    ) {
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