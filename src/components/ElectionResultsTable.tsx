import { type Candidate } from "@/types/election";
import { Trophy } from "lucide-react";

interface ElectionResultsTableProps {
  candidates: Candidate[];
  onShowDetails?: (candidateName: string) => void;
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
  const dividerIndex = candidates.findIndex((candidate) =>
    candidate.name.toLowerCase().includes("below")
  );
  return (
    <div className="overflow-hidden rounded-lg border border-lightDark bg-dark">
      <table className="w-full text-left text-sm font-light text-gray-400">
        <thead>
          <tr className="border-b border-lightDark">
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
          {candidates.map((candidate, index) => {
            const isFunded = candidate.allocatedBudget > 0;
            const isExtendedFunded =
              isFunded && candidate.isEligibleForExtendedBudget;
            const isDivider = index === dividerIndex;
            const beforeDivider = index < dividerIndex;
            return (
              <tr
                key={candidate.name}
                className={`group cursor-pointer transition-colors duration-200  font-light  hover:bg-gray-800/20 ${
                  beforeDivider && "bg-gray-800/30 hover:bg-gray-800/20"
                }
                ${isDivider && "cursor-default"}
                `}
                onClick={() => !isDivider && onShowDetails?.(candidate.name)}
              >
                <td
                  className={`whitespace-nowrap px-6 py-4 ${
                    isFunded && "border-l-2 border-emerald-500"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`${isFunded && "text-emerald-500"}`}>
                      {index + 1}
                    </span>
                    {isFunded && <FundedBadge />}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-gray-300">
                  {candidate.name}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {isDivider ? "-" : candidate.wins || 0}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {isDivider ? "-" : candidate.averageSupport.toLocaleString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`${
                        isFunded &&
                        !isExtendedFunded &&
                        "font-medium text-emerald-500"
                      }`}
                    >
                      {candidate.basicBudget > 0
                        ? `$${candidate.basicBudget.toLocaleString()}`
                        : "-"}
                    </span>
                    {isFunded && !isExtendedFunded && (
                      <span className="text-emerald-500">✓</span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`${
                        isExtendedFunded && "font-medium text-emerald-500"
                      }`}
                    >
                      {candidate.extendedBudget > 0
                        ? `$${candidate.extendedBudget.toLocaleString()}`
                        : "-"}
                    </span>
                    {isExtendedFunded && (
                      <span className=" text-emerald-500">✓</span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-gray-400">
                  {isDivider ? (
                    <span>-</span>
                  ) : (
                    <span
                      className={`rounded-xl py-1 px-2 ${
                        candidate.streamDuration === "2-year" ||
                        candidate.streamDuration === "2 years"
                          ? "bg-pink-300 bg-opacity-10 text-pink-400"
                          : "bg-blue-700 bg-opacity-10 text-blue-500"
                      }`}
                    >
                      {candidate.streamDuration === "2-year" ||
                      candidate.streamDuration === "2 years"
                        ? "2 years"
                        : "1 year"}
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {isDivider ? (
                    <span>-</span>
                  ) : candidate.isEligibleForExtendedBudget ? (
                    <div className="flex justify-evenly max-w-14 bg-emerald-100 bg-opacity-10 rounded-xl py-1 text-emerald-500">
                      <div>✓</div>
                      <span>Yes</span>
                    </div>
                  ) : (
                    <div className="flex justify-evenly max-w-14 bg-red-100 bg-opacity-10 rounded-xl py-1 text-red-500">
                      <div>✕</div>
                      <span>No</span>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
