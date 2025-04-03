import { useHeadToHeadData } from "@/hooks/useHeadToHeadData";

interface ResultsDetailsProps {
  candidateName: string;
  onClose: () => void;
}

export function ResultsDetails({
  candidateName,
  onClose,
}: ResultsDetailsProps) {
  const { data, isLoading, getCandidateHeadToHead } = useHeadToHeadData();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="text-gray-300">Loading results...</div>
        </div>
      </div>
    );
  }

  const results = getCandidateHeadToHead(candidateName);

  if (!results) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="text-red-400">Candidate not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-100">Results Details</h2>
        <button
          onClick={onClose}
          className="text-2xl text-gray-400 hover:text-gray-200"
        >
          ×
        </button>
      </div>

      {/* Preferred Budget Section */}
      <div className="mb-8">
        <h3 className="mb-4 text-lg font-semibold text-gray-100">
          Preferred Budget
        </h3>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span
                className={
                  results.budget.basic.selected
                    ? "text-blue-400"
                    : "text-gray-300"
                }
              >
                Basic (${results.budget.basic.amount / 1000}k)
              </span>
              {results.budget.basic.selected && (
                <span className="text-blue-400">🏆</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={
                  results.budget.extended.selected
                    ? "text-emerald-500"
                    : "text-gray-300"
                }
              >
                Extended (${results.budget.extended.amount / 1000}k)
              </span>
              {results.budget.extended.selected && (
                <span className="text-emerald-500">🏆</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-semibold text-gray-300">
              {(results.budget.basic.amount / 1000).toLocaleString()}
            </span>
            <span className="text-2xl font-semibold text-gray-500">
              {(
                (results.budget.extended.amount - results.budget.basic.amount) /
                1000
              ).toLocaleString()}
            </span>
          </div>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-600">
          <div className="relative h-full w-full">
            <div
              className="absolute h-full bg-blue-500"
              style={{
                width: `${
                  (results.budget.basic.amount /
                    results.budget.extended.amount) *
                  100
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Head-to-head Match Results */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-100">
          Head-to-head Match Results
        </h3>
        <div className="space-y-3">
          {results.matches.map((match, index) => (
            <div
              key={index}
              className="rounded-lg border border-lightDark bg-dark/50 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-gray-300">
                    {match.votes.toLocaleString()}
                  </span>
                  <span className="text-gray-100">{match.candidate}</span>
                </div>
                {match.winner ? (
                  <span className="flex items-center gap-2 text-emerald-500">
                    <span className="text-xl">🏆</span>
                    {(match.votes * 3).toLocaleString()}
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-gray-500">
                    ⨯ {(match.votes / 2).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="h-[6px] w-full overflow-hidden rounded-full bg-dark">
                <div className="relative h-full w-full">
                  <div className="absolute h-full w-full bg-gray-600" />
                  <div
                    className="absolute h-full bg-emerald-500"
                    style={{
                      width: match.winner
                        ? `${(match.votes / (match.votes * 3)) * 100}%`
                        : `${(match.votes / (match.votes * 2)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-right text-sm text-gray-400">
          {results.wins} wins / {results.losses} losses
        </div>
      </div>
    </div>
  );
}
