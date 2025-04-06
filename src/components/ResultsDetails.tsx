import { getCandidateHeadToHead } from "@/utils/candidateComparisons";
import { X, Trophy } from "lucide-react";

interface ResultsDetailsProps {
  candidateName: string;
  onClose: () => void;
  data: {
    headToHeadMatches: Array<{
      candidate1: string;
      candidate2: string;
      candidate1Votes: number;
      candidate2Votes: number;
      totalVotes: number;
      winner: string;
    }>;
    allocations: Array<{
      name: string;
      score: number;
      averageSupport: number;
      basicBudget: number;
      extendedBudget: number;
      allocated: boolean;
      streamDuration: string | null;
      allocatedBudget: number;
      rejectionReason: string | null;
      isNoneBelow: boolean;
    }>;
  };
}

interface FormattedMatch {
  candidate1: {
    name: string;
    candidateVotes: number;
  };
  candidate2: {
    name: string;
    candidateVotes: number;
  };
  totalVotes: number;
  winner: string;
}

export function ResultsDetails({
  candidateName,
  onClose,
  data,
}: ResultsDetailsProps) {
  const headToHeadResults = getCandidateHeadToHead(
    {
      headToHeadMatches: data.headToHeadMatches,
      candidates: data.allocations,
    },
    candidateName
  );

  if (!headToHeadResults) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="text-red-400">Candidate not found</div>
        </div>
      </div>
    );
  }

  const { matches, budget, wins, losses } = headToHeadResults;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-100">Results Details</h2>
        <button
          onClick={onClose}
          className="text-2xl text-gray-400 hover:text-gray-200"
        >
          <X size={24} />
        </button>
      </div>

      {/* Preferred Budget */}
      <div className="mb-8">
        <h3 className="mb-4 text-lg font-semibold text-gray-100">
          Preferred Budget
        </h3>
        <div className="rounded-lg border border-lightDark bg-dark/50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-blue-400">
                Basic (${(budget.basic.amount / 1000).toFixed(0)}k)
              </span>
              {budget.basic.selected && (
                <span className="text-blue-400">🏆</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">
                Extended (${(budget.extended.amount / 1000).toFixed(0)}k)
              </span>
              {budget.extended.selected && (
                <span className="text-emerald-500">🏆</span>
              )}
            </div>
          </div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-2xl font-semibold text-gray-300">
              {budget.basic.amount.toLocaleString()}
            </span>
            <span className="text-2xl font-semibold text-gray-500">
              {(budget.extended.amount - budget.basic.amount).toLocaleString()}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-dark">
            <div className="relative h-full w-full">
              <div className="absolute h-full w-full bg-gray-600" />
              <div
                className="absolute h-full bg-blue-500"
                style={{
                  width: `${
                    (budget.basic.amount / budget.extended.amount) * 100
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Head-to-head Match Results */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-100">
          Head-to-head Match Results
        </h3>
        <div className="space-y-3">
          {matches.map((match: FormattedMatch, index: number) => (
            <div
              key={index}
              className="rounded-lg border border-lightDark bg-dark/50 p-4"
            >
              <div className="flex items-center mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-100">
                      {match.candidate1.name}
                    </span>
                    {match.winner !== match.candidate2.name && (
                      <Trophy className="text-emerald-500 h-4 w-4" />
                    )}
                    <span className="text-emerald-500">
                      {match.candidate1.candidateVotes.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="px-4">
                  <span className="text-gray-400">vs</span>
                </div>
                <div className="flex-1 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-gray-400">
                      {match.candidate2.candidateVotes.toLocaleString()}
                    </span>
                    <span className="text-gray-100">
                      {match.candidate2.name}
                    </span>
                  </div>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-dark">
                <div className="relative h-full w-full">
                  <div className="absolute h-full w-full bg-blue-500" />
                  <div
                    className={`absolute h-full ${
                      match.winner !== match.candidate2.name
                        ? "bg-emerald-500"
                        : "bg-blue-500"
                    }`}
                    style={{
                      width: `${
                        (match.candidate1.candidateVotes / match.totalVotes) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-right text-sm text-gray-400">
          {wins} wins / {losses} losses
        </div>
      </div>
    </div>
  );
}
