import { VoteCandidate, Budget } from "@/hooks/useEnsElectionData";
import { VotesResponse } from "@/hooks/useVotes";

export function loadChoices(
  fetchChoices: VoteCandidate[],
  previousVote: VotesResponse | undefined
): VoteCandidate[] {
  if (!previousVote?.votes[0]) return fetchChoices;

  let loadedCandidates = fetchChoices;
  const prevChoices = Array.isArray(previousVote.votes[0].choice)
    ? previousVote.votes[0].choice
    : [previousVote.votes[0].choice];

  // Sort candidates based on previous vote order
  loadedCandidates = loadedCandidates.sort((a, b) => {
    // Find the first occurrence of either candidate's budget options in the choices
    const aFirstChoice = Math.min(
      ...a.budgets
        .map((budget: Budget) => prevChoices.indexOf(budget.id))
        .filter((idx: number) => idx !== -1)
    );
    const bFirstChoice = Math.min(
      ...b.budgets
        .map((budget: Budget) => prevChoices.indexOf(budget.id))
        .filter((idx: number) => idx !== -1)
    );

    if (aFirstChoice === Infinity) return 1;
    if (bFirstChoice === Infinity) return -1;
    return aFirstChoice - bFirstChoice;
  });

  // Set budget selections based on previous vote
  loadedCandidates = loadedCandidates.map((candidate) => ({
    ...candidate,
    budgets: candidate.budgets.map((budget: Budget) => ({
      ...budget,
      selected:
        prevChoices.indexOf(budget.id) !== -1 &&
        prevChoices.indexOf(budget.id) ===
          Math.min(
            ...candidate.budgets.map((b: Budget) => {
              const idx = prevChoices.indexOf(b.id);
              return idx === -1 ? Infinity : idx;
            })
          ),
    })),
  }));

  return loadedCandidates;
}
