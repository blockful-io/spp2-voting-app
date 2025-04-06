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
      <table className="w-full text-left font-medium text-sm">
        <thead>
          <tr className="border-b border-lightDark text-gray-300">
            <th className="px-6 py-4">Rank</th>
            <th className="px-6 py-4">Candidate</th>
            <th className="px-6 py-4">Wins</th>
            <th className="px-6 py-4">Average ENS Support</th>
            <th className="px-6 py-4">Basic Budget</th>
            <th className="px-6 py-4">Extended Budget</th>
            <th className="px-6 py-4">Stream Duration</th>
            <th className="px-6 py-4">2Y Eligibility</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-lightDark">
          {candidates.map((candidate, index) => (
            <tr
              key={candidate.name}
              className="group cursor-pointer transition-colors duration-200 hover:bg-gray-800"
              onClick={() => onShowDetails?.(candidate.name)}
            >
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex items-center gap-4">
                  <span>{index + 1}</span>
                  <FundedBadge />
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">{candidate.name}</td>
              <td className="whitespace-nowrap px-6 py-4">
                {candidate.wins || 0}
              </td>
              <td className="whitespace-nowrap px-6 py-4 ">
                {candidate.averageSupport.toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex items-center gap-2">
                  <span
                    className={
                      candidate.allocatedBudget > 0
                        ? "text-emerald-500"
                        : "invisible"
                    }
                  >
                    ✓
                  </span>
                  <span
                    className={`${
                      candidate.allocatedBudget > 0 && "text-emerald-500"
                    }`}
                  >
                    ${candidate.basicBudget.toLocaleString()}
                  </span>
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex items-center gap-2">
                  <span
                    className={
                      candidate.allocatedBudget > 0
                        ? "text-emerald-500"
                        : "invisible"
                    }
                  >
                    ✓
                  </span>
                  <span
                    className={`${
                      candidate.allocatedBudget > 0 && "text-emerald-500"
                    }`}
                  >
                    ${candidate.extendedBudget.toLocaleString()}
                  </span>
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <span
                  className={`rounded-lg px-3 py-1 ${
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
                      <span className="text-emerald-500">Yes</span>
                    </>
                  ) : (
                    <>
                      <div className="text-red-500">✕</div>
                      <span className="text-red-500">No</span>
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
