import { Trophy, Info } from "lucide-react";
import { ElectionCandidate } from "@/hooks/useEnsElectionData";

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
  const fundedCandidates = candidates.filter((c) => c.allocatedBudget > 0);
  const notFundedCandidates = candidates.filter((c) => c.allocatedBudget === 0);

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
          {fundedCandidates.map((candidate, index) => (
            <tr
              key={candidate.name}
              className="group cursor-pointer transition-colors duration-200 hover:bg-gray-800"
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
                    <div className="text-emerald-500">✓</div>
                    <span className="text-sm text-emerald-500">
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
                {candidate.extendedBudget === candidate.allocatedBudget ? (
                  <div className="flex items-center gap-2">
                    <div className="text-emerald-500">✓</div>
                    <span className="text-sm text-emerald-500">
                      ${candidate.extendedBudget.toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-300">
                    ${candidate.extendedBudget.toLocaleString()}
                  </span>
                )}
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
                  {candidate.score}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {candidate.averageSupport.toLocaleString()}
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
                  ) : isFunded ? (
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
                  ) : (
                    <NotFundedBadge reason={candidate.rejectionReason} />
                  )}
                </div>
              </td>
            </tr>
          ))}
          {notFundedCandidates.map((candidate, index) => (
            <tr
              key={candidate.name}
              className="group cursor-pointer transition-colors duration-200 hover:bg-gray-800"
              onClick={() => onShowDetails?.(candidate.name)}
            >
              <td className="whitespace-nowrap px-6 py-4">
                <span className="text-sm text-gray-300">
                  {fundedCandidates.length + index + 1}
                </span>
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
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                ${candidate.basicBudget.toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                -
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
