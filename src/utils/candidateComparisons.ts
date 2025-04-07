import { HeadToHeadMatch, Candidate, FormattedMatch, CandidateBudget, CandidateHeadToHeadResults } from "@/utils/types";

// Re-export types needed by components
export type { FormattedMatch };

export function getCandidateHeadToHead(
  data: { headToHeadMatches: HeadToHeadMatch[]; candidates: Candidate[] },
  candidateName: string
): CandidateHeadToHeadResults | null {
  if (!data || !candidateName) return null;

  const matches: FormattedMatch[] = [];
  let wins = 0;
  let losses = 0;

  // Find the candidate's allocation for budget info
  const candidates = data.candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(candidateName?.toLowerCase())
  );

  if (candidates.length === 0) return null;

  let candidate = candidates.length == 1 && candidates[0];
  if (!candidate) {
    candidate =
      candidates.find(
        (c) => c.extendedBudget > 0 && c.allocatedBudget > c.extendedBudget
      ) || candidates.find((c) => c.basicBudget > 0)!;
  }

  // Get budget information
  const budget: CandidateBudget = {
    basic: {
      amount: candidate.basicBudget || 0,
      selected: candidate.allocatedBudget === candidate.basicBudget,
    },
    extended: {
      amount: candidate.extendedBudget || 0,
      selected: candidate.allocatedBudget === candidate.extendedBudget,
    },
  };

  // Process all head-to-head matches
  data.headToHeadMatches.forEach((match) => {
    const lowerCandidateName = candidateName.toLowerCase();
    const candidate1Lower = match.candidate1.toLowerCase();
    const candidate2Lower = match.candidate2.toLowerCase();

    if (candidate1Lower.includes(lowerCandidateName)) {
      matches.push({
        candidate1: {
          name: match.candidate1.includes(" - ") ? match.candidate1.split(" - ")[0] : match.candidate1,
          candidateVotes: match.candidate1Votes,
        },
        candidate2: {
          name: match.candidate2.includes(" - ") ? match.candidate2.split(" - ")[0] : match.candidate2,
          candidateVotes: match.candidate2Votes,
        },
        totalVotes: match.totalVotes,
        winner: match.winner,
        isInternal: match.isInternal
      });
      if (match.candidate1Votes > match.candidate2Votes) wins++;
      else losses++;
    } else if (candidate2Lower.includes(lowerCandidateName)) {
      matches.push({
        candidate1: {
          name: match.candidate2.includes(" - ") ? match.candidate2.split(" - ")[0] : match.candidate2,
          candidateVotes: match.candidate2Votes,
        },
        candidate2: {
          name: match.candidate1.includes(" - ") ? match.candidate1.split(" - ")[0] : match.candidate1,
          candidateVotes: match.candidate1Votes,
        },
        totalVotes: match.totalVotes,
        winner:
          match.winner === match.candidate1
            ? match.candidate1
            : match.winner === match.candidate2
              ? match.candidate2
              : "Tie",
        isInternal: match.isInternal
      });
      if (match.candidate2Votes > match.candidate1Votes) wins++;
      else losses++;
    }
  });

  // Sort matches by the ratio of candidate's votes to opponent's votes
  matches.sort((a, b) => {
    const ratioA = a.candidate1.candidateVotes / a.candidate2.candidateVotes;
    const ratioB = b.candidate1.candidateVotes / b.candidate2.candidateVotes;
    return ratioB - ratioA;
  });

  return {
    matches,
    budget,
    wins,
    losses,
  };
}
