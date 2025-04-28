import { Trophy, ChevronRight } from "lucide-react";
import { Allocation } from "@/utils/types";

/**
 * ElectionResultsTable props interface
 * @param candidates - Array of allocation objects representing election candidates
 * @param onShowDetails - Callback function to show details for a specific candidate
 */
interface ElectionResultsTableProps {
  candidates: Allocation[];
  onShowDetails: (candidateName: string) => void;
}

/**
 * Badge component displayed for funded/winning candidates
 */
function FundedBadge() {
  return (
    <span className="rounded-full flex items-center gap-2 text-black bg-[#4ADE80] p-[6px] text-xs font-medium">
      <Trophy className="h-4 w-4" />
    </span>
  );
}

/**
 * Badge component displayed for non-funded candidates with reason tooltip
 */
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

/**
 * Election Results Table Component
 * Displays election candidates with their ranking, funding status, and other metrics
 */
export function ElectionResultsTable({
  candidates,
  onShowDetails,
}: ElectionResultsTableProps) {
  // Find the divider row (typically "Below Threshold" or similar) to separate funded/non-funded candidates
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
              <th className="px-6 py-4">Choice</th>
              <th className="px-6 py-4">Budget</th>
              <th className="px-6 py-4">Wins</th>
              <th className="px-6 py-4">
                Average ENS <br /> Support
              </th>
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
                  key={candidate.name + index}
                  className={`group cursor-pointer transition-colors duration-200  font-light  hover:bg-gray-800/20 ${
                    beforeDivider ? "bg-stone-950" : "bg-stone-900"
                  }`}
                  onClick={() => onShowDetails(candidate.name)}
                >
                  {/* Column 1: Rank - Shows numerical ranking with funding indicator */}
                  <td
                    className={`whitespace-nowrap px-6 py-4 ${
                      candidate.allocated && "border-l-2 border-emerald-500"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`${
                          candidate.allocated && "text-emerald-500"
                        }`}
                      >
                        {index + 1}
                      </span>
                      {candidate.allocated && <FundedBadge />}
                    </div>
                  </td>

                  {/* Column 2: Choice - Displays the candidate name */}
                  <td className="whitespace-nowrap px-6 py-4 text-gray-300">
                    {candidate.name}
                  </td>

                  {/* Column 3: Budget - Shows allocated budget amount with visual indicators for basic budget type */}
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span>
                        {candidate.budget > 0
                          ? `$${Math.round(candidate.budget).toLocaleString()}`
                          : "-"}
                      </span>
                    </div>
                  </td>

                  {/* Column 4: Wins - Shows the candidate's score or win count */}
                  <td className="whitespace-nowrap px-6 py-4">
                    {candidate.score}
                  </td>

                  {/* Column 5: Average ENS Support - Shows the average support level from ENS holders */}
                  <td className="whitespace-nowrap px-6 py-4">
                    {Math.round(candidate.averageSupport).toLocaleString()}
                  </td>

                  {/* Column 6: Stream Duration - Shows funding period (1-year/2-year) or Not Funded status */}
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

                  {/* Column 7: 2Y Eligibility - Shows whether candidate is eligible for 2-year funding (SPP1 status) */}
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

                  {/* Detail indicator - Shows a chevron that animates on hover */}
                  <td className="whitespace-nowrap px-6 py-4">
                    <ChevronRight className="h-5 w-5 text-gray-400 transition-all duration-300 ease-in-out group-hover:translate-x-1" />
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
