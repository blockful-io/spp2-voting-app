"use client";

import { Check } from "lucide-react";
import Navbar from "../components/navbar";
import { useGetProposals } from "../hooks/useSnapshot";
import { formatCurrency } from "@/utils";

export default function Home() {
  const { proposal, isLoading, isError, isFetching } = useGetProposals();

  if (isLoading) return <div>Loading...</div>;
  if (isError || !proposal) return <div>Error</div>;
  if (isFetching) return <div>Fetching...</div>;

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-gray-100">
              Total Budget: {formatCurrency(4500000)}
            </h2>
            <div className="flex space-x-8 text-gray-400">
              <p>1 year: {formatCurrency(3000000)}</p>
              <p>2 years: {formatCurrency(1500000)}</p>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2 text-gray-100">
              Remaining Budget: {/* {formatCurrency(remainingBudget)} */}
            </h2>
            <div className="flex space-x-8 text-gray-400">
              <p>1 year: {/* {formatCurrency(remainingBudget1Year)} */}</p>
              <p>2 years: {/* {formatCurrency(remainingBudget2Years)} */}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Candidate
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Votes
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Basic Budget
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Extended Budget
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Stream Duration
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {proposal.raking.map((candidate, index) => {
                const isApproved =
                  candidate.isBasicApproved || candidate.isExtendedApproved;

                return (
                  <tr
                    key={index}
                    className={isApproved ? "bg-green-900/30" : ""}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm ${
                          isApproved ? "font-bold" : "font-normal"
                        } text-gray-100`}
                      >
                        {candidate.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm ${
                          isApproved ? "font-bold" : "font-normal"
                        } text-gray-100`}
                      >
                        {candidate.score.toFixed(3)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm ${
                          isApproved ? "font-bold" : "font-normal"
                        } text-gray-100 flex items-center`}
                      >
                        {/* ${candidate.basicBudget.toLocaleString()} */}$
                        {candidate.basicBudget}
                        {candidate.isBasicApproved &&
                          !candidate.isExtendedApproved && (
                            <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-blue-900/50 text-blue-300 rounded-full">
                              <Check size={16} />
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm ${
                          isApproved ? "font-bold" : "font-normal"
                        } text-gray-100 flex items-center`}
                      >
                        {/* ${candidate.extendedBudget.toLocaleString()} */}
                        {candidate.extendedBudget}
                        {candidate.isExtendedApproved && (
                          <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-blue-900/50 text-blue-300 rounded-full">
                            <Check size={16} />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${
                          candidate.streamDuration === "2 Years"
                            ? "bg-blue-900/50 text-blue-300"
                            : candidate.streamDuration === "1 Year"
                            ? "bg-blue-900/50 text-blue-300"
                            : candidate.streamDuration === "Eligible"
                            ? "bg-green-900/50 text-green-300"
                            : "bg-red-900/50 text-red-300"
                        }`}
                      >
                        {candidate.streamDuration}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
