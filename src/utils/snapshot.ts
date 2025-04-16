/**
 * Snapshot API integration for fetching voting data
 */

import { USE_LOCAL_DATA, LOCAL_DATA_PATH, PROPOSAL_ID } from "./config";
import fs from "fs";
import path from "path";
// Import shared types
import { ProposalData, MockVoteData } from "./types";

/**
 * Load mock data from local JSON file
 */
export async function loadLocalData(): Promise<ProposalData> {
  const filePath = path.join(
    process.cwd(),
    "src",
    "utils",
    "data",
    "mocked-votes.json"
  );
  const jsonData = fs.readFileSync(filePath, "utf8");
  const mockData: MockVoteData = JSON.parse(jsonData);

  return {
    id: PROPOSAL_ID,
    title: "Service Provider Program Renewal",
    space: "ens.eth",
    totalVotes: mockData.data.votes.length,
    votes: mockData.data.votes.map((vote) => ({
      choice: vote.choice,
      voter: vote.voter,
      vp: vote.vp,
    })),
    totalVotingPower: mockData.data.votes.reduce(
      (sum, vote) => sum + vote.vp,
      0
    ),
    state: "CLOSED",
    choices: mockData.data.votes[0].proposal.choices,
    start: String(Date.now() / 1000),
    end: String(Date.now() / 1000 + 30 * 24 * 60 * 60), // 30 days from now
  };
}

/**
 * Get proposal data from Snapshot API or local mock data
 */
export async function getProposalData(
  proposalId: string
): Promise<ProposalData> {
  if (USE_LOCAL_DATA) {
    return loadLocalData();
  }

  // TODO: Implement actual Snapshot API call
  throw new Error("Snapshot API integration not implemented");
}

/**
 * Fetches voting results from Snapshot API
 *
 * @param {String} proposalId - The Snapshot proposal ID
 * @returns {Promise<ProposalData>} - The proposal data including votes
 */
export async function fetchSnapshotResults(
  proposalId: string
): Promise<ProposalData> {
  // Use local data if configured
  if (USE_LOCAL_DATA) {
    return loadLocalData();
  }

  // Otherwise fetch from Snapshot API
  try {
    const snapshotAPI = "https://hub.snapshot.org/graphql";

    // Query to get proposal info
    const proposalQuery = `
      query Proposal {
        proposal(id: "${proposalId}") {
          id
          title
          choices
          scores_total
          state
          space {
            id
            name
          }
            start
            end
        }

      }
    `;

    // Query to get votes with voting power
    const votesQuery = `
      query Votes {
        votes(
          first: 1000
          where: {
            proposal: "${proposalId}"
          }
        ) {
          voter
          created
          choice
          vp
          vp_by_strategy
          proposal {
            choices
          }
        }
      }
    `;

    console.log(
      `Fetching proposal data from Snapshot API for proposal ${proposalId}...`
    );

    // Fetch proposal data
    const proposalResponse = await fetch(snapshotAPI, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: proposalQuery }),
    });

    const proposalData = await proposalResponse.json();

    if (!proposalData?.data?.proposal) {
      throw new Error("Invalid response from Snapshot API for proposal data");
    }

    const proposal = proposalData.data.proposal;

    // Fetch votes data
    console.log(`Fetching votes for proposal ${proposalId}...`);

    const votesResponse = await fetch(snapshotAPI, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: votesQuery }),
    });

    const votesData = await votesResponse.json();

    if (!votesData?.data?.votes) {
      throw new Error("Invalid response from Snapshot API for votes data");
    }

    const votes = votesData.data.votes;
    console.log(`Successfully fetched ${votes.length} votes`);

    // Transform and return data according to ProposalData interface
    return {
      id: proposal.id,
      title: proposal.title,
      space: proposal.space.name,
      totalVotes: votes.length,
      votes: votes.map(
        (vote: { choice: number[]; voter: string; vp: number }) => ({
          choice: vote.choice,
          voter: vote.voter,
          vp: vote.vp,
        })
      ),
      scores_total: proposal.scores_total,
      totalVotingPower: votes.reduce(
        (sum: number, vote: { vp: number }) => sum + vote.vp,
        0
      ),
      state: proposal.state,
      choices: proposal.choices,
      start: proposal.start,
      end: proposal.end,
    };
  } catch (error) {
    console.error("Error fetching data from Snapshot:", error);
    throw new Error(
      `Failed to fetch Snapshot data: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
