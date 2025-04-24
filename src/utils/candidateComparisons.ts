import { HeadToHeadMatch, Allocation, FormattedMatch, CandidateHeadToHeadResults } from "./types";
import { parseChoiceName } from "./parseChoiceName";

// Re-export types needed by components
export type { FormattedMatch };

export function getCandidateHeadToHead(
  data: { headToHeadMatches: HeadToHeadMatch[]; candidates: Allocation[] },
  candidateName: string
): CandidateHeadToHeadResults | null {
  if (!data || !candidateName) return null;

  const matches: FormattedMatch[] = [];
  let wins = 0;
  let losses = 0;

  // Find the candidate's allocation
  const candidate = data.candidates.find(
    (c) => c.name === candidateName
  );
  if (!candidate) return null;

  // Process all head-to-head matches for this exact choice
  data.headToHeadMatches.forEach((match) => {
    if (match.choice1 === candidateName) {
      matches.push({
        choice1: {
          name: match.choice1,
          candidateVotes: match.choice1Votes,
          voters: match.voters.choice1,
        },
        choice2: {
          name: match.choice2,
          candidateVotes: match.choice2Votes,
          voters: match.voters.choice2,
        },
        totalVotes: match.totalVotes,
        winner: match.winner,
        isInternal: match.isInternal
      });
      if (match.choice1Votes > match.choice2Votes) wins++;
      else losses++;
    } else if (match.choice2 === candidateName) {
      matches.push({
        choice1: {
          name: match.choice2,
          candidateVotes: match.choice2Votes,
          voters: match.voters.choice2,
        },
        choice2: {
          name: match.choice1,
          candidateVotes: match.choice1Votes,
          voters: match.voters.choice1,
        },
        totalVotes: match.totalVotes,
        winner: match.winner === match.choice1 ? match.choice1 : 
               match.winner === match.choice2 ? match.choice2 : "Tie",
        isInternal: match.isInternal
      });
      if (match.choice2Votes > match.choice1Votes) wins++;
      else losses++;
    }
  });

  // Sort matches by the ratio of candidate's votes to opponent's votes
  matches.sort((a, b) => {
    const ratioA = a.choice1.candidateVotes / a.choice2.candidateVotes;
    const ratioB = b.choice1.candidateVotes / b.choice2.candidateVotes;
    return ratioB - ratioA;
  });

  return {
    matches,
    wins,
    losses,
  };
}
