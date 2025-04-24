import {
  HeadToHeadMatch,
  CandidateHeadToHeadResults,
  Allocation,
} from "./types";

// Re-export types needed by components
export type { CandidateHeadToHeadResults };

export function filterHeadToHeadMatches(
  headToHeadMatches: HeadToHeadMatch[],
  candidateName: string
): CandidateHeadToHeadResults | null {
  if (!headToHeadMatches || !candidateName) return null;

  const matches = headToHeadMatches.filter(
    (match) =>
      match.choice1.name === candidateName ||
      match.choice2.name === candidateName
  );

  return {
    matches,
    wins: matches.filter((match) => match.winner === candidateName).length,
    losses: matches.filter(
      (match) => match.winner !== candidateName && match.winner !== "tie"
    ).length,
    ties: matches.filter((match) => match.winner === "tie").length,
  };
}
