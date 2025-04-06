/**
 * Vote processing logic for the Copeland ranking method
 */

import { BIDIMENSIONAL_ENABLED } from "./config";
import { reorderChoicesByProvider, parseChoiceName } from "./choiceParser";

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

interface HeadToHeadMatch {
  candidate1: string;
  candidate2: string;
  candidate1Votes: number;
  candidate2Votes: number;
  totalVotes: number;
  winner: string;
}

interface RankedCandidate {
  name: string;
  score: number;
  averageSupport: number;
  isNoneBelow: boolean;
}

interface CopelandResults {
  rankedCandidates: RankedCandidate[];
  headToHeadMatches: HeadToHeadMatch[];
}

interface ProviderData {
  [key: string]: {
    basicBudget: number;
    extendedBudget: number;
    isSpp1: boolean;
    isNoneBelow: boolean;
  };
}

interface Allocation {
  name: string;
  score: number;
  averageSupport: number;
  basicBudget: number;
  extendedBudget: number;
  isSpp1: boolean;
  isNoneBelow: boolean;
  allocated: boolean;
  streamDuration: string | null;
  allocatedBudget: number;
  rejectionReason: string | null;
}

/**
 * Pre-process votes to reorder choices by provider if bidimensional is enabled
 * 
 * @param votes - Array of votes to process
 * @param choices - Array of all available choices
 * @returns Processed votes with choices reordered by provider
 */
export function preprocessVotes(votes: Vote[], choices: string[]): Vote[] {
  if (!BIDIMENSIONAL_ENABLED) {
    return votes;
  }

  return votes.map(vote => ({
    ...vote,
    choice: reorderChoicesByProvider(vote.choice, choices)
  }));
}

/**
 * Process votes using the Copeland method and return ranked results
 * 
 * @param proposalData - The proposal data containing votes and choices
 * @returns Object containing ranked candidates and head-to-head matches
 */
export function processCopelandRanking(proposalData: ProposalData): CopelandResults {
  const { choices, votes } = proposalData;

  // Pre-process votes to reorder choices by provider if bidimensional is enabled
  const processedVotes = preprocessVotes(votes, choices);

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
  processedVotes.forEach((vote: Vote, voteIndex: number) => {
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
            : "tie",
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
      score: wins,
      averageSupport: averageSupport,
      isNoneBelow: isNoneBelow,
    });
  }

  // Sort by wins (descending), then by average support (descending) as tiebreaker
  candidateResults.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return b.averageSupport - a.averageSupport;
  });

  return {
    rankedCandidates: candidateResults,
    headToHeadMatches: matchResults,
  };
}

/**
 * Post-process Copeland results to handle bidimensional filtering and None Below
 * 
 * @param results - The original Copeland ranking results
 * @returns Processed results with bidimensional filtering and None Below handling
 */
export function postprocessRanking(results: CopelandResults): CopelandResults {
  if (!BIDIMENSIONAL_ENABLED) {
    return results;
  }

  // Group candidates by provider
  const providerGroups = new Map<string, RankedCandidate[]>();
  results.rankedCandidates.forEach(candidate => {
    const { name: providerName } = parseChoiceName(candidate.name);
    if (!providerGroups.has(providerName)) {
      providerGroups.set(providerName, []);
    }
    providerGroups.get(providerName)!.push(candidate);
  });

  // Keep only the highest-ranked candidate per provider
  const filteredCandidates: RankedCandidate[] = [];
  providerGroups.forEach(candidates => {
    // Sort by score and average support to get the highest-ranked
    const sorted = [...candidates].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.averageSupport - a.averageSupport;
    });
    filteredCandidates.push(sorted[0]);
  });

  // Filter head-to-head matches to include:
  // 1. Internal matches between options of the same provider
  // 2. Matches between the highest-ranked candidates of different providers
  // 3. Matches between a provider's highest-ranked candidate and None Below
  const filteredMatches = results.headToHeadMatches.filter(match => {
    const { name: provider1 } = parseChoiceName(match.candidate1);
    const { name: provider2 } = parseChoiceName(match.candidate2);

    // Case 1: Internal provider match (both candidates from same provider)
    if (provider1 === provider2) {
      return true;
    }

    // Get the highest-ranked candidate for each provider
    const topCandidate1 = providerGroups.get(provider1)?.[0];
    const topCandidate2 = providerGroups.get(provider2)?.[0];

    // Case 2: Both candidates are the highest-ranked for their providers
    if (topCandidate1?.name === match.candidate1 && topCandidate2?.name === match.candidate2) {
      return true;
    }

    // Case 3: One candidate is None Below and the other is a provider's highest-ranked
    const isNoneBelow1 = match.candidate1.toLowerCase().includes('none below');
    const isNoneBelow2 = match.candidate2.toLowerCase().includes('none below');
    
    if (isNoneBelow1 && topCandidate2?.name === match.candidate2) return true;
    if (isNoneBelow2 && topCandidate1?.name === match.candidate1) return true;

    return false;
  });

  return {
    rankedCandidates: filteredCandidates,
    headToHeadMatches: filteredMatches
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
  rankedResults: RankedCandidate[],
  providerData: ProviderData
): Allocation[] {
  return rankedResults.map((result) => {
    const metadata = providerData[result.name] || {};

    return {
      name: result.name,
      score: result.score,
      averageSupport: result.averageSupport || 0,
      basicBudget: metadata.basicBudget || 0,
      extendedBudget: metadata.extendedBudget || 0,
      isSpp1: metadata.isSpp1 || false,
      isNoneBelow: result.isNoneBelow || false,
      allocated: false,
      streamDuration: null,
      allocatedBudget: 0,
      rejectionReason: null
    };
  });
}
