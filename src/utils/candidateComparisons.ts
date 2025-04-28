import {
  HeadToHeadMatch,
  CandidateHeadToHeadResults,
} from "./types";

// Re-export types needed by components
export type { CandidateHeadToHeadResults };

export function filterHeadToHeadMatches(
  headToHeadMatches: HeadToHeadMatch[],
  candidateName: string
): CandidateHeadToHeadResults | null {
  if (!headToHeadMatches || !candidateName) return null;

  let matches = [];
  // filter matches to only include the candidate
  matches = headToHeadMatches.filter(
    (match) =>
      match.choice1.name === candidateName ||
      match.choice2.name === candidateName
  );

  // candidate filtered should be the first in each match
  matches = matches.map((match) => {
    if (match.choice1.name !== candidateName) {
      return {
        ...match,
        choice1: match.choice2,
        choice2: match.choice1,
      };
    }

    return match;
  });

  // sort matches by total votes
  matches.sort((a, b) => b.choice1.totalVotes - a.choice1.totalVotes);

  return {
    matches,
    wins: matches.filter((match) => match.winner === candidateName).length,
    losses: matches.filter(
      (match) => match.winner !== candidateName && match.winner !== "tie"
    ).length,
    ties: matches.filter((match) => match.winner === "tie").length,
  };
}
