import { type Candidate } from "@/types/election";
import { ChevronRight, Trophy } from "lucide-react";

interface ElectionResultsTableProps {
  candidates: Candidate[];
  onShowDetails?: (candidateName: string) => void;
}

function RankIcon({ rank }: { rank: number }) {
  return (
    <div className="flex h-6 w-6 items-center justify-center">
      <span className="text-sm text-gray-300">{rank}</span>
    </div>
  );
}

function FundedBadge() {
  return (
    <span className="rounded-full flex items-center gap-2 text-black bg-[#4ADE80] px-2 py-1 text-xs font-medium">
      <Trophy className="h-4 w-4" />
      Funded
    </span>
  );
}

export function ElectionResultsTable({
  candidates,
  onShowDetails,
}: ElectionResultsTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-lightDark bg-dark">
      <table className="w-full">
        <thead>
          <tr className="border-b border-lightDark">
            <th className="w-16 px-6 py-4 text-left text-sm font-medium text-gray-300">
              Rank
            </th>
            <th className="w-24 px-6 py-4 text-left text-sm font-medium text-gray-300">
              Candidate
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
              Results
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
              Wins
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
              Average ENS Support
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
              Basic Budget
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
              Extended Budget
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
              Stream Duration
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
              2Y Eligibility
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-lightDark">
          {candidates.map((candidate, index) => (
            <tr
              key={candidate.name}
              className="group cursor-pointer transition-colors duration-200 hover:bg-gray-800 text-gray-300"
              onClick={() => onShowDetails?.(candidate.name)}
            >
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-300">{index + 1}</span>
                  <FundedBadge />
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                {candidate.name}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <ChevronRight className="h-4 w-4 text-gray-500 transition-transform duration-200 group-hover:translate-x-1" />
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                {candidate.wins || 0}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                {candidate.averageSupport.toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                {candidate.basicBudget === candidate.allocatedBudget ? (
                  <div className="flex items-center gap-2">
                    {candidate.allocatedBudget > 0 && (
                      <div className="text-emerald-500">✓</div>
                    )}
                    <span
                      className={`text-sm ${
                        candidate.allocatedBudget > 0 && "text-emerald-500"
                      }`}
                    >
                      ${candidate.basicBudget.toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-300">
                    ${candidate.basicBudget.toLocaleString()}
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex items-center gap-2">
                  {candidate.allocatedBudget > 0 && (
                    <div className="text-emerald-500">✓</div>
                  )}
                  <span
                    className={`text-sm ${
                      candidate.allocatedBudget > 0 && "text-emerald-500"
                    }`}
                  >
                    ${candidate.extendedBudget.toLocaleString()}
                  </span>
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <span
                  className={`rounded-lg px-3 py-1 text-sm ${
                    candidate.streamDuration === "2-year" ||
                    candidate.streamDuration === "2 years"
                      ? "bg-pink-950/50 text-pink-500"
                      : "bg-blue-950 text-blue-500"
                  }`}
                >
                  {candidate.streamDuration === "2-year" ||
                  candidate.streamDuration === "2 years"
                    ? "2-year"
                    : "1-year"}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex items-center gap-2">
                  {candidate.isEligibleForExtendedBudget ? (
                    <>
                      <div className="text-emerald-500">✓</div>
                      <span className="text-sm text-emerald-500">Yes</span>
                    </>
                  ) : (
                    <>
                      <div className="text-red-500">✕</div>
                      <span className="text-sm text-red-500">No</span>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
