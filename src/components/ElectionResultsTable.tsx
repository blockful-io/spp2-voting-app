import { type Candidate } from "@/types/election";

interface ElectionResultsTableProps {
  candidates: Candidate[];
}

function RankIcon({ rank }: { rank: number }) {
  return (
    <div className="flex h-6 w-6 items-center justify-center text-orange-500">
      <span className="text-lg">🏆</span>
    </div>
  );
}

export function ElectionResultsTable({
  candidates,
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
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
              Candidate
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
              Avg. ENS Support
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
              2-year Eligibility
            </th>
            <th className="w-16 px-6 py-4 text-left text-sm font-medium text-gray-300">
              Results
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-lightDark">
          {/* Funded Section */}
          <tr>
            <td colSpan={8} className="bg-dark/50 px-6 py-2">
              <span className="text-sm font-medium text-orange-500">
                FUNDED
              </span>
            </td>
          </tr>
          {fundedCandidates.map((candidate, index) => (
            <tr key={candidate.name} className="hover:bg-dark/50">
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex items-center gap-2">
                  <RankIcon rank={index + 1} />
                  <span className="text-sm text-gray-300">{index + 1}</span>
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                {candidate.name}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                {candidate.averageSupport.toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                ${candidate.allocatedBudget.toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="text-emerald-500">✓</div>
                  <span className="text-sm text-emerald-500">
                    ${candidate.allocatedBudget.toLocaleString()}
                  </span>
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <span
                  className={`rounded-full px-3 py-1 text-sm ${
                    candidate.streamDuration === "2 years"
                      ? "bg-emerald-500/20 text-emerald-500"
                      : "bg-orange-500/20 text-orange-500"
                  }`}
                >
                  {candidate.streamDuration}
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
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                <button className="rounded-full bg-dark/50 px-3 py-1 hover:bg-dark/70">
                  Details →
                </button>
              </td>
            </tr>
          ))}
          {/* Not Funded Section */}
          <tr>
            <td colSpan={8} className="bg-dark/50 px-6 py-2">
              <span className="text-sm font-medium text-gray-500">
                NOT FUNDED
              </span>
            </td>
          </tr>
          {notFundedCandidates.map((candidate, index) => (
            <tr key={candidate.name} className="hover:bg-dark/50">
              <td className="whitespace-nowrap px-6 py-4">
                <span className="ml-8 text-sm text-gray-300">
                  {fundedCandidates.length + index + 1}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                {candidate.name}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                {candidate.averageSupport.toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                ${candidate.allocatedBudget.toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                ${candidate.allocatedBudget.toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <span
                  className={`rounded-full px-3 py-1 text-sm ${
                    candidate.streamDuration === "2 years"
                      ? "bg-emerald-950 text-emerald-500"
                      : "bg-orange-950 text-orange-500"
                  }`}
                >
                  {candidate.streamDuration}
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
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                <button className="rounded-full bg-dark/50 px-3 py-1 hover:bg-dark/70">
                  Details →
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
