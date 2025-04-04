/**
 * Vote processing logic for the Copeland ranking method
 */

interface Vote {
  choice: number[];
  voter: string;
  vp: number;
}

interface ProposalData {
  choices: string[];
  votes: Vote[];
  title: string;
  space: string;
  totalVotes: number;
  totalVotingPower: number;
  state: string;
}

interface RankedResult {
  name: string;
  wins?: number;
  score?: number;
  averageSupport: number;
  isNoneBelow: boolean;
}

interface ProviderData {
  [key: string]: {
    basicBudget: number;
    extendedBudget: number;
    isSpp1: boolean;
  };
}

/**
 * Process Snapshot ranked choice voting results using the Copeland method
 *
 * Algorithm:
 * 1. Any candidate ranked before "None Below" is considered ranked by the voter
 * 2. Any candidate ranked after "None Below" is considered unranked by the voter
 * 3. All candidates are compared head-to-head
 * 4. In a match between a ranked and unranked candidate, the ranked candidate wins
 * 5. In a match between two unranked candidates, no vote is counted
 * 6. Each victory awards 1 point, ties or losses award 0 points
 * 7. Average support is used as a tiebreaker
 *
 * @param {Object} proposalData - The proposal data from Snapshot
 * @returns {Object} - Candidates ranked by wins and all head-to-head match results
 */
export function processCopelandRanking(proposalData: ProposalData) {
  const { choices, votes } = proposalData;

  // Find the "None Below" option
  const noneBelowIndex = choices.findIndex(
    (choice) =>
      choice.toLowerCase() === "none below" ||
      choice.toLowerCase() === "none of the below"
  );

  // Keep all choices including None Below as candidates
  const candidateChoices = [...choices];
  const numCandidates = candidateChoices.length;

  // Create matrices for pairwise comparisons and match participation
  const pairwiseMatrix = Array(numCandidates)
    .fill(undefined)
    .map(() => Array(numCandidates).fill(0));
  const matchesParticipated = Array(numCandidates)
    .fill(undefined)
    .map(() => Array(numCandidates).fill(0));

  // Process each vote to update the pairwise matrix
  votes.forEach((vote: Vote, voteIndex: number) => {
    // Skip invalid votes (non-array choices)
    if (!Array.isArray(vote.choice)) {
      console.warn(
        `Vote #${voteIndex} from ${vote.voter} is not an array. Skipping.`
      );
      return;
    }

    const vp = vote.vp || 1; // Use voting power or default to 1

    // Find where "None Below" is in this particular vote's ranking (if ranked)
    const noneBelowRank = vote.choice.indexOf(noneBelowIndex + 1);

    // For each vote, determine which candidates are ranked (above "None Below")
    const rankedCandidates = new Set();

    // If "None Below" was ranked in this vote, only candidates ranked before it are considered ranked
    // "None Below" itself is considered ranked
    if (noneBelowRank !== -1) {
      for (let i = 0; i <= noneBelowRank; i++) {
        const candidateIndex = vote.choice[i] - 1; // Convert to 0-indexed
        rankedCandidates.add(candidateIndex);
      }
    }
    // If "None Below" wasn't ranked, all candidates in the vote are considered ranked
    else {
      vote.choice.forEach((choiceNum) => {
        rankedCandidates.add(choiceNum - 1); // Convert to 0-indexed
      });
    }

    // Helper to get position in ranking
    function getPosition(candidateIndex: number) {
      return vote.choice.indexOf(candidateIndex + 1);
    }

    // Compare each pair of candidates
    for (let i = 0; i < numCandidates; i++) {
      for (let j = i + 1; j < numCandidates; j++) {
        // Both candidates are ranked
        if (rankedCandidates.has(i) && rankedCandidates.has(j)) {
          // Find their positions in the ranking
          const posI = getPosition(i);
          const posJ = getPosition(j);

          // Lower position value means higher rank
          if (posI < posJ) {
            // Candidate i is ranked higher
            pairwiseMatrix[i][j] += vp;
            matchesParticipated[i][j] += vp;
            matchesParticipated[j][i] += vp;
          } else if (posJ < posI) {
            // Candidate j is ranked higher
            pairwiseMatrix[j][i] += vp;
            matchesParticipated[i][j] += vp;
            matchesParticipated[j][i] += vp;
          }
        }
        // One candidate ranked, one not ranked
        else if (rankedCandidates.has(i) && !rankedCandidates.has(j)) {
          // Ranked candidate (i) wins against unranked (j)
          pairwiseMatrix[i][j] += vp;
          matchesParticipated[i][j] += vp;
          matchesParticipated[j][i] += vp;
        } else if (!rankedCandidates.has(i) && rankedCandidates.has(j)) {
          // Ranked candidate (j) wins against unranked (i)
          pairwiseMatrix[j][i] += vp;
          matchesParticipated[i][j] += vp;
          matchesParticipated[j][i] += vp;
        }
        // Both unranked - no vote counted for this match
      }
    }
  });

  // Store match results for display
  const matchResults = [];
  for (let i = 0; i < numCandidates; i++) {
    for (let j = i + 1; j < numCandidates; j++) {
      matchResults.push({
        candidate1: candidateChoices[i],
        candidate2: candidateChoices[j],
        candidate1Votes: pairwiseMatrix[i][j],
        candidate2Votes: pairwiseMatrix[j][i],
        totalVotes: matchesParticipated[i][j],
        winner:
          pairwiseMatrix[i][j] > pairwiseMatrix[j][i]
            ? candidateChoices[i]
            : pairwiseMatrix[j][i] > pairwiseMatrix[i][j]
            ? candidateChoices[j]
            : "Tie",
      });
    }
  }

  // Sort matches by total votes (highest first)
  matchResults.sort((a, b) => b.totalVotes - a.totalVotes);

  // Calculate Copeland scores and average support for each candidate
  const candidateResults = [];
  for (let i = 0; i < numCandidates; i++) {
    let wins = 0;
    let totalVotesReceived = 0;
    let totalMatches = 0;

    for (let j = 0; j < numCandidates; j++) {
      if (i !== j) {
        // Count wins
        if (pairwiseMatrix[i][j] > pairwiseMatrix[j][i]) {
          wins++; // Victory = 1 point
        }

        // Sum up votes received in all matches for average support
        totalVotesReceived += pairwiseMatrix[i][j];

        // Count matches where this candidate received votes
        if (matchesParticipated[i][j] > 0) {
          totalMatches++;
        }
      }
    }

    // Calculate average support (avoid division by zero)
    const averageSupport =
      totalMatches > 0 ? totalVotesReceived / totalMatches : 0;

    // Track whether this is the None Below option
    const isNoneBelow = i === noneBelowIndex;

    candidateResults.push({
      name: candidateChoices[i],
      wins: wins,
      averageSupport: averageSupport,
      index: i,
      isNoneBelow: isNoneBelow,
    });
  }

  // Sort by wins (descending), then by average support (descending) as tiebreaker
  candidateResults.sort((a, b) => {
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }
    return b.averageSupport - a.averageSupport;
  });

  // Return both the ranked results and match details
  return {
    rankedCandidates: candidateResults.map((candidate) => ({
      name: candidate.name,
      score: candidate.wins,
      averageSupport: candidate.averageSupport,
      isNoneBelow: candidate.isNoneBelow,
    })),
    headToHeadMatches: matchResults,
  };
}

/**
 * Combines Snapshot results with service provider metadata
 *
 * @param {Array} rankedResults - Ranked results from Snapshot
 * @param {Object} providerData - Service provider metadata
 * @returns {Array} - Combined data for allocation
 */
export function combineData(
  rankedResults: RankedResult[],
  providerData: ProviderData
) {
  return rankedResults.map((result) => {
    const metadata = providerData[result.name] || {};

    return {
      name: result.name,
      score: result.wins ?? result.score ?? 0, // Use nullish coalescing to ensure a number
      averageSupport: result.averageSupport || 0,
      basicBudget: metadata.basicBudget || 0,
      extendedBudget: metadata.extendedBudget || 0,
      isSpp1: metadata.isSpp1 || false,
      isNoneBelow: result.isNoneBelow || false,
    };
  });
}
