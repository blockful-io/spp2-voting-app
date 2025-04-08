import { Trophy, ChevronRight } from "lucide-react";
import { Allocation } from "@/utils/types";

interface ElectionResultsTableProps {
  candidates: Allocation[];
  onShowDetails: (candidateName: string) => void;
}

function FundedBadge() {
  return (
    <span className="rounded-full flex items-center gap-2 text-black bg-[#4ADE80] p-[6px] text-xs font-medium">
      <Trophy className="h-4 w-4" />
    </span>
  );
}

function NotFundedBadge({ reason }: { reason: string | null }) {
  return (
    <div className="group relative inline-flex items-center">
      <span className="rounded-xl py-1 px-2 bg-gray-700 bg-opacity-10 text-gray-400">
        Not funded
      </span>
      <div className="absolute left-full ml-2 hidden group-hover:block z-50">
        <div className="rounded-md bg-gray-800 p-2 text-xs text-gray-200 shadow-lg whitespace-nowrap">
          {reason || "Unknown reason"}
        </div>
      </div>
    </div>
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
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm font-light text-gray-400">
          <thead>
            <tr className="border-b border-lightDark">
              <th className="px-6 py-4">Rank</th>
              <th className="px-6 py-4">Candidate</th>
              <th className="px-6 py-4">Results</th>
              <th className="px-6 py-4">Wins</th>
              <th className="px-6 py-4">
                Average ENS <br /> Support
              </th>
              <th className="px-6 py-4">Basic Budget</th>
              <th className="px-6 py-4">Extended Budget</th>
              <th className="px-6 py-4">Stream Duration</th>
              <th className="px-6 py-4">2Y Eligibility</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-lightDark">
            {candidates.map((candidate, index) => {
              const isDivider = index === dividerIndex;
              const beforeDivider = index < dividerIndex;
              return (
                <tr
                  key={candidate.name}
                  className={`group cursor-pointer transition-colors duration-200  font-light  hover:bg-gray-800/20 ${
                    beforeDivider ? "bg-stone-950" : "bg-stone-900"
                  }`}
                  onClick={() => onShowDetails(candidate.name)}
                >
                  <td
                    className={`whitespace-nowrap px-6 py-4 ${
                      candidate.allocated && "border-l-2 border-emerald-500"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`${candidate.allocated && "text-emerald-500"}`}>
                        {index + 1}
                      </span>
                      {candidate.allocated && <FundedBadge />}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-300">
                    {candidate.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <ChevronRight className="h-5 w-5 text-gray-400 transition-all duration-300 ease-in-out group-hover:translate-x-1" />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {candidate.score}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {Math.round(candidate.averageSupport).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`${
                          candidate.budgetType === "basic" &&
                          "font-medium text-emerald-500"
                        }`}
                      >
                        {candidate.basicBudget > 0
                          ? `$${Math.round(
                              candidate.basicBudget
                            ).toLocaleString()}`
                          : "-"}
                      </span>
                      {candidate.budgetType === "basic" && (
                        <span className="text-emerald-500">✓</span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`${
                          candidate.budgetType === "extended" &&
                          "font-medium text-emerald-500"
                        }`}
                      >
                        {candidate.extendedBudget > 0
                          ? `$${Math.round(
                              candidate.extendedBudget
                            ).toLocaleString()}`
                          : "-"}
                      </span>
                      {candidate.budgetType === "extended" && (
                        <span className=" text-emerald-500">✓</span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-400">
                    {isDivider ? (
                      <span>-</span>
                    ) : candidate.allocated ? (
                      <span
                        className={`rounded-xl py-1 px-2 ${
                          candidate.streamDuration === "2-year"
                            ? "bg-pink-300 bg-opacity-10 text-pink-400"
                            : "bg-blue-700 bg-opacity-10 text-blue-500"
                        }`}
                      >
                        {candidate.streamDuration === "2-year"
                          ? "2 years"
                          : "1 year"}
                      </span>
                    ) : (
                      <NotFundedBadge reason={candidate.rejectionReason} />
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {isDivider ? (
                      <span>-</span>
                    ) : candidate.isSpp1 ? (
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
    </div>
  );
}
