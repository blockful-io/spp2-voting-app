import { type Candidate } from "@/types/election";

interface ElectionResultsTableProps {
  candidates: Candidate[];
}

export function ElectionResultsTable({
  candidates,
}: ElectionResultsTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-lightDark bg-dark">
      <table className="w-full">
        <thead>
          <tr className="border-b border-lightDark">
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
              Name
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
              Score
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
              Support
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
              Budget
            </th>
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
              Duration
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-lightDark">
          {candidates.map((candidate) => (
            <tr key={candidate.name} className="hover:bg-dark/50">
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                {candidate.name}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                {candidate.score}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                {candidate.averageSupport.toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                ${candidate.allocatedBudget.toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                {candidate.streamDuration}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
