/**
 * Vote processing logic for the Copeland ranking method
 */

import { reorderChoicesByProvider, isSameServiceProvider } from "./choiceParser";
// Import shared types
import {
  Vote,
  ProposalData,
  HeadToHeadMatch,
  RankedChoice,
  CopelandResults,
  Allocation,
  Choice,
  BudgetType,
} from "./types";
import { parseChoiceName } from "./parseChoiceName";
import { WIN_POINTS, TIE_POINTS, LOSS_POINTS } from "./config";

// Re-export types needed by components
export type { HeadToHeadMatch };

/**
 * Pre-process votes to ensure basic budgets are ranked above extended budgets for the same provider
 * 
 * @param votes - Array of votes to process
 * @param choices - Array of all available choices
 * @returns Processed votes with choices correctly ordered
 */
export function preprocessVotes(votes: Vote[], choices: string[]): Vote[] {
  return votes.map(vote => {
    // Create a map of providers to their basic and extended budget positions
    const providerBudgets = new Map<string, { basic: number, extended: number }>();
    
    // Track the position of each budget type for each provider
    vote.choice.forEach((choiceIndex, position) => {
      const choiceName = choices[choiceIndex - 1];
      const { name, budgetType } = parseChoiceName(choiceName);
      
      if (!providerBudgets.has(name)) {
        providerBudgets.set(name, { basic: -1, extended: -1 });
      }
      
      const entry = providerBudgets.get(name)!;
      if (budgetType === "basic") {
        entry.basic = position;
      } else if (budgetType === "extended") {
        entry.extended = position;
      }
    });
    
    // Create a new array for the reordered choices
    const newChoice = [...vote.choice];
    
    // Apply reordering rule: if extended is ranked higher than basic, move basic above extended
    for (const [provider, positions] of providerBudgets.entries()) {
      if (positions.basic !== -1 && positions.extended !== -1) {
        // If extended is ranked higher (lower position number) than basic
        if (positions.extended < positions.basic) {
          // Find the actual choice indices
          const basicIndex = vote.choice.findIndex((c, i) => {
            const choiceName = choices[c - 1];
            const parsed = parseChoiceName(choiceName);
            return parsed.name === provider && parsed.budgetType === "basic";
          });
          
          const extendedIndex = vote.choice.findIndex((c, i) => {
            const choiceName = choices[c - 1];
            const parsed = parseChoiceName(choiceName);
            return parsed.name === provider && parsed.budgetType === "extended";
          });
          
          // Move basic choice right above extended by rearranging the array
          if (basicIndex !== -1 && extendedIndex !== -1) {
            const basicValue = newChoice[basicIndex];
            // Remove the basic entry
            newChoice.splice(basicIndex, 1);
            // Insert it right before the extended entry
            // If extended was before basic, the extended index has now decreased by 1
            const adjustedExtendedIndex = extendedIndex > basicIndex ? extendedIndex - 1 : extendedIndex;
            newChoice.splice(adjustedExtendedIndex, 0, basicValue);
          }
        }
      }
    }
    // Return vote with correctly ordered choices
    return {
      ...vote,
      choice: newChoice,
    };
  });
}

/**
 * Process votes using the Copeland method and return ranked results
 *
 * @param proposalData - The proposal data containing votes and choices
 * @returns Object containing ranked candidates and head-to-head matches
 */
export function processCopelandRanking(
  proposalData: ProposalData
): CopelandResults {
  const { choices, votes } = proposalData;

  // Find the "None Below" option
  const noneBelowIndex = choices.findIndex(
    (choice) => choice.toLowerCase() === "none below"
  );

  // Keep all choices including None Below as options
  const numChoices = choices.length;

  // Create matrices for pairwise comparisons and match participation
  const pairwiseMatrix = Array(numChoices)
    .fill(undefined)
    .map(() => Array(numChoices).fill(0));
  const matchesParticipated = Array(numChoices)
    .fill(undefined)
    .map(() => Array(numChoices).fill(0));

  // Process each vote to update the pairwise matrix
  votes.forEach((vote: Vote, voteIndex: number) => {
    // Skip invalid votes (non-array choices)
    if (!Array.isArray(vote.choice)) {
      console.warn(
        `Vote #${voteIndex} from ${vote.voter} is not an array. Skipping.`
      );
      return;
    }

    const vp = vote.vp;

    // For each vote, determine which choices are ranked
    // Treat all choices in the vote as ranked, including "None Below"
    const rankedChoices = new Set();
    vote.choice.forEach((choiceNum) => {
      rankedChoices.add(choiceNum - 1); // Convert to 0-indexed
    });

    // Find position of None Below
    let noneBelowPos = -1;
    if (noneBelowIndex !== -1 && rankedChoices.has(noneBelowIndex)) {
      noneBelowPos = vote.choice.indexOf(noneBelowIndex + 1);
    }
    
    // Compare each pair of choices
    for (let i = 0; i < numChoices; i++) {
      for (let j = i + 1; j < numChoices; j++) {
        // Both choices are ranked
        if (rankedChoices.has(i) && rankedChoices.has(j)) {
          // Find their positions in the ranking
          const posI = vote.choice.indexOf(i + 1);
          const posJ = vote.choice.indexOf(j + 1);
          
          // Skip counting if both choices are ranked below None Below
          if (noneBelowPos !== -1 && posI > noneBelowPos && posJ > noneBelowPos) {
            continue;
          }

          // Lower position value means higher rank
          if (posI < posJ) {
            // Choice i is ranked higher
            pairwiseMatrix[i][j] += vp;
            matchesParticipated[i][j] += vp;
            matchesParticipated[j][i] += vp;
          } else if (posJ < posI) {
            // Choice j is ranked higher
            pairwiseMatrix[j][i] += vp;
            matchesParticipated[i][j] += vp;
            matchesParticipated[j][i] += vp;
          }
        }
        // One choice ranked, one not ranked
        else if (rankedChoices.has(i) && !rankedChoices.has(j)) {
          // If the ranked choice is below None Below, skip
          if (noneBelowPos !== -1 && vote.choice.indexOf(i + 1) > noneBelowPos) {
            continue;
          }
          
          // Ranked choice (i) wins against unranked (j)
          pairwiseMatrix[i][j] += vp;
          matchesParticipated[i][j] += vp;
          matchesParticipated[j][i] += vp;
        } else if (!rankedChoices.has(i) && rankedChoices.has(j)) {
          // If the ranked choice is below None Below, skip
          if (noneBelowPos !== -1 && vote.choice.indexOf(j + 1) > noneBelowPos) {
            continue;
          }
          
          // Ranked choice (j) wins against unranked (i)
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
  for (let i = 0; i < numChoices; i++) {
    for (let j = i + 1; j < numChoices; j++) {
      // Track if choices are from the same provider (for information only, doesn't affect scoring)
      const isInternal = isSameServiceProvider(
        choices[i],
        choices[j]
      );

      // Track voters for each choice
      const choice1Voters: Array<{ voter: string; vp: number }> = [];
      const choice2Voters: Array<{ voter: string; vp: number }> = [];

      // Process each vote to determine which voters supported each choice
      votes.forEach((vote) => {
        const vp = vote.vp;
        const posI = vote.choice.indexOf(i + 1);
        const posJ = vote.choice.indexOf(j + 1);

        // If both choices are ranked
        if (posI !== -1 && posJ !== -1) {
          if (posI < posJ) {
            choice1Voters.push({ voter: vote.voter, vp });
          } else if (posJ < posI) {
            choice2Voters.push({ voter: vote.voter, vp });
          }
        }
        // If only one choice is ranked
        else if (posI !== -1) {
          choice1Voters.push({ voter: vote.voter, vp });
        } else if (posJ !== -1) {
          choice2Voters.push({ voter: vote.voter, vp });
        }
      });

      // Sort voters by voting power (descending)
      choice1Voters.sort((a, b) => b.vp - a.vp);
      choice2Voters.sort((a, b) => b.vp - a.vp);

      // Determine the winner of the match
      const choice1Votes = pairwiseMatrix[i][j];
      const choice2Votes = pairwiseMatrix[j][i];
      let winner: string;
      
      if (choice1Votes > choice2Votes) {
        winner = choices[i];
      } else if (choice2Votes > choice1Votes) {
        winner = choices[j];
      } else {
        winner = "tie";
      }

      matchResults.push({
        choice1: {
          name: choices[i],
          totalVotes: choice1Votes,
          voters: choice1Voters
        },
        choice2: {
          name: choices[j],
          totalVotes: choice2Votes,
          voters: choice2Voters
        },
        totalVotes: matchesParticipated[i][j],
        winner,
        isInternal
      });
    }
  }

  // Sort matches by total votes (highest first)
  matchResults.sort((a, b) => b.totalVotes - a.totalVotes);

  // Calculate Copeland scores and average support for each choice
  const choiceResults = [];
  for (let i = 0; i < numChoices; i++) {
    let score = 0;
    let totalVotesReceived = 0;
    let totalMatches = 0;

    for (let j = 0; j < numChoices; j++) {
      if (i !== j) {
        // Calculate points based on match outcome
        if (pairwiseMatrix[i][j] > pairwiseMatrix[j][i]) {
          // Win - award points regardless of provider
          score += WIN_POINTS;
        } else if (pairwiseMatrix[i][j] === pairwiseMatrix[j][i] && pairwiseMatrix[i][j] > 0) {
          // Tie (only count if both received votes)
          score += TIE_POINTS;
        } else if (pairwiseMatrix[i][j] < pairwiseMatrix[j][i]) {
          // Loss
          score += LOSS_POINTS;
        }

        // Sum up votes received in all matches for average support
        totalVotesReceived += pairwiseMatrix[i][j];

        // Count matches where this choice received votes
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

    choiceResults.push({
      name: choices[i],
      score,
      averageSupport,
      isNoneBelow,
    });
  }

  // Sort by wins (descending), then by average support (descending) as tiebreaker
  choiceResults.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return b.averageSupport - a.averageSupport;
  });

  return {
    rankedChoices: choiceResults,
    headToHeadMatches: matchResults,
  };
}

/**
 * Post-process Copeland results to handle any final ranking adjustments
 *
 * @param results - The original Copeland ranking results
 * @returns Processed results
 */
export function postprocessRanking(results: CopelandResults): CopelandResults {
  // Each entry is treated as a separate choice, so we don't filter or modify the rankings
  // Simply return the original results
  return {
    rankedChoices: results.rankedChoices,
    headToHeadMatches: results.headToHeadMatches
  };
}

/**
 * Combines Snapshot results with service provider metadata
 *
 * @param {Array} rankedResults - Ranked results from Snapshot
 * @param {Array} choicesData - Service provider choices data
 * @returns {Array} - Combined data for allocation
 */
export function combineData(
  rankedResults: RankedChoice[],
  choicesData: Choice[]
): Allocation[] {
  return rankedResults.map((result) => {
    // Find all choices for this provider
    const providerChoices = choicesData.filter(
      (choice) => choice.name === parseChoiceName(result.name).name
    );

    // Get the budget from the choice that matches this ranked result
    const { name: resultName, budgetType: resultBudgetType } = parseChoiceName(result.name);
    const matchingChoice = choicesData.find(
      c => c.name === resultName && c.budgetType === resultBudgetType
    );
    
    // Get budget amount for this specific choice
    const budget = matchingChoice?.budget || 0;

    // Get the first choice's metadata for common properties
    const firstChoice = providerChoices[0];
    const providerName = firstChoice?.name || resultName;

    return {
      name: result.name,
      providerName: providerName,
      score: result.score,
      averageSupport: result.averageSupport || 0,
      budget,
      isSpp1: matchingChoice?.isSpp1 || false,
      isNoneBelow: result.isNoneBelow || false,
      allocated: false,
      streamDuration: null,
      rejectionReason: null,
      budgetType: matchingChoice?.budgetType || "none"
    };
  });
}
