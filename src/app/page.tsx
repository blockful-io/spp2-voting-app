"use client";

import { Check } from "lucide-react";
import Navbar from "./components/navbar";
import { useGetRanking } from "./hooks/useSnapshot";
import { formatCurrency } from "@/utils";

export default function Home() {
  const { ranking, isLoading, isError, isFetching } = useGetRanking();

  if (isLoading) return <div>Loading...</div>;
  if (isError || !ranking) return <div>Error</div>;
  if (isFetching) return <div>Fetching...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Total Budget: {formatCurrency(4500000)}
            </h2>
            <div className="flex space-x-8">
              <p>1 year: {formatCurrency(3000000)}</p>
              <p>2 years: {formatCurrency(1500000)}</p>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Remaining Budget: {/* {formatCurrency(remainingBudget)} */}
            </h2>
            <div className="flex space-x-8">
              <p>1 year: {/* {formatCurrency(remainingBudget1Year)} */}</p>
              <p>2 years: {/* {formatCurrency(remainingBudget2Years)} */}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Candidate
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Votes
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Basic Budget
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Extended Budget
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Stream Duration
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ranking.map((rank, index) => {
                return (
                  <tr
                    key={index}
                    className={rank.allocated ? "bg-green-50" : ""}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm ${
                          rank.allocated ? "font-bold" : "font-normal"
                        } text-gray-900`}
                      >
                        {rank.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm ${
                          rank.allocated ? "font-bold" : "font-normal"
                        } text-gray-900`}
                      >
                        {rank.score.toFixed(3)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm ${
                          rank.allocated ? "font-bold" : "font-normal"
                        } text-gray-900 flex items-center`}
                      >
                        {rank.basicBudget}
                        {rank.allocated && (
                          <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full">
                            <Check size={16} />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm ${
                          rank.allocated ? "font-bold" : "font-normal"
                        } text-gray-900 flex items-center`}
                      >
                        {rank.extendedBudget}
                        {rank.allocated && (
                          <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full">
                            <Check size={16} />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${
                          rank.streamDuration === "2 Years"
                            ? "bg-blue-100 text-blue-800"
                            : rank.streamDuration === "1 Year"
                            ? "bg-blue-100 text-blue-800"
                            : rank.streamDuration === "Eligible"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {rank.streamDuration}
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
