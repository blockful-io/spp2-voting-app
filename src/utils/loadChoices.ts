import { VoteCandidate, Budget } from "@/hooks/useEnsElectionData";
import { VotesResponse } from "@/hooks/useVotes";

function shuffleArray<T>(arrayToShuffle: T[]): T[] {
  const shuffledArray = [...arrayToShuffle];
  for (
    let currentIndex = shuffledArray.length - 1;
    currentIndex > 0;
    currentIndex--
  ) {
    const randomIndex = Math.floor(Math.random() * (currentIndex + 1));
    [shuffledArray[currentIndex], shuffledArray[randomIndex]] = [
      shuffledArray[randomIndex],
      shuffledArray[currentIndex],
    ];
  }
  return shuffledArray;
}

export function loadChoices(
  availableCandidates: VoteCandidate[],
  previousVote: VotesResponse | undefined
): VoteCandidate[] {
  // If there's a previous vote, handle it as before
  if (previousVote?.votes[0]) {
    let rankedCandidates = availableCandidates;
    const previousChoices = Array.isArray(previousVote.votes[0].choice)
      ? previousVote.votes[0].choice
      : [previousVote.votes[0].choice];

    // Sort candidates based on previous vote order
    rankedCandidates = rankedCandidates.sort((candidateA, candidateB) => {
      const firstChoiceA = Math.min(
        ...candidateA.budgets
          .map((budget: Budget) => previousChoices.indexOf(budget.id))
          .filter((position: number) => position !== -1)
      );
      const firstChoiceB = Math.min(
        ...candidateB.budgets
          .map((budget: Budget) => previousChoices.indexOf(budget.id))
          .filter((position: number) => position !== -1)
      );

      if (firstChoiceA === Infinity) return 1;
      if (firstChoiceB === Infinity) return -1;
      return firstChoiceA - firstChoiceB;
    });

    // Set budget selections based on previous vote
    return rankedCandidates.map((candidate) => ({
      ...candidate,
      budgets: candidate.budgets.map((budget: Budget) => ({
        ...budget,
        selected:
          previousChoices.indexOf(budget.id) !== -1 &&
          previousChoices.indexOf(budget.id) ===
            Math.min(
              ...candidate.budgets.map((candidateBudget: Budget) => {
                const budgetPosition = previousChoices.indexOf(
                  candidateBudget.id
                );
                return budgetPosition === -1 ? Infinity : budgetPosition;
              })
            ),
      })),
    }));
  }

  // For new votes, randomize the order but keep constraints
  const noneBelowOption = availableCandidates.find((candidate) =>
    candidate.name.toLowerCase().includes("below")
  );
  const votableCandidates = availableCandidates.filter(
    (candidate) => !candidate.name.toLowerCase().includes("below")
  );

  // Group by provider name (assuming it's the first part of the name before space)
  const candidatesByProvider = votableCandidates.reduce(
    (groupedCandidates, candidate) => {
      const providerName = candidate.name.split(" ")[0];
      if (!groupedCandidates[providerName])
        groupedCandidates[providerName] = [];
      groupedCandidates[providerName].push(candidate);
      return groupedCandidates;
    },
    {} as Record<string, VoteCandidate[]>
  );

  // Randomize the order of providers and their candidates
  const randomizedCandidates = Object.values(candidatesByProvider)
    .map((providerGroup) => shuffleArray(providerGroup))
    .reduce(
      (allCandidates, providerGroup) => [...allCandidates, ...providerGroup],
      []
    );

  return noneBelowOption
    ? [noneBelowOption, ...shuffleArray(randomizedCandidates)]
    : shuffleArray(randomizedCandidates);
}
