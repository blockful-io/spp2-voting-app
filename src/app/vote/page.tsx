"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { Candidate, useGetCandidates } from "@/hooks/useSnapshot";

export default function VotePage() {
  const { candidates: initialCandidates, isLoading } = useGetCandidates();
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    if (initialCandidates)
      setCandidates([
        ...initialCandidates,
        { name: "None of the below", basicBudget: 0, extendedBudget: 0 },
      ]);
  }, [initialCandidates]);

  const formatCurrency = (amount: number) => {
    return `$${(amount / 1000).toFixed(0)}k`;
  };

  const handleBudgetSelection = (
    name: string,
    type: "basic" | "extended" | undefined
  ) => {
    setCandidates(
      candidates.map((candidate) => {
        if (candidate.name === name) {
          return {
            ...candidate,
            budgetType: type,
          };
        }
        return candidate;
      })
    );
  };

  const isDivider = (candidate: Candidate) => {
    return candidate.name === "None of the below";
  };

  const isBelowDivider = (candidate: Candidate) => {
    return (
      candidates.findIndex((c) => c.name === "None of the below") <
      candidates.findIndex((c) => c.name === candidate.name)
    );
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container p-4 flex gap-4">
        <div className="w-1/2 p-4">
          <div className="flex items-center mb-4">
            <svg
              className="w-6 h-6 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 6H20M4 12H20M4 18H20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h1 className="text-2xl font-bold">Rank Your Preferences</h1>
          </div>

          <p className="text-gray-400 mb-6">
            Drag and drop candidates to rank them, placing your top choice at
            the top while any candidates below &quot;None of the below&quot;
            won&apos;t be counted. You can also select between basic or extended
            budget for each candidate.
          </p>
        </div>
        <div className="grow flex flex-col w-full">
          <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-4"></div>

          {/* Candidates List */}
          <div className="flex justify-evenly">
            <div className="text-left text-gray-400">CANDIDATE</div>
            <div className="text-left text-gray-400">PREFERRED BUDGED</div>
          </div>

          <div className="mt-2 border border-gray-800 rounded-lg overflow-hidden">
            {candidates.map((candidate, index) => (
              <div
                key={candidate.name}
                className={`
                grid grid-cols-1 md:grid-cols-[1fr,1fr] gap-4 p-4 
                ${isDivider(candidate) ? "bg-red-900/20" : "bg-dark"}
                ${index !== candidates.length - 1 && "border-b border-gray-700"}
              `}
              >
                <div className="flex items-center">
                  <div className="mr-3 text-gray-500">
                    <svg
                      className="w-6 h-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4 6H20M4 12H20M4 18H20"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  {index && (
                    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                      {index}
                    </div>
                  )}
                  <div>
                    {candidate.name}
                    {isDivider(candidate) && (
                      <span className="text-sm text-gray-500 ml-2">
                        (candidates below won&apos;t count)
                      </span>
                    )}
                  </div>
                </div>

                {!isDivider(candidate) && (
                  <div className="flex mx-10">
                    <button
                      className={`
                      rounded-l flex items-center justify-center w-full my-1
                      ${
                        isBelowDivider(candidate) &&
                        "bg-transparent border border-gray-700 text-gray-600"
                      }
                      ${
                        !isBelowDivider(candidate) &&
                        candidate.budgetType === "basic"
                          ? "bg-slate-50 text-black hover:bg-slate-100"
                          : "border border-gray-700 bg-dark text-gray-100"
                      }
                    `}
                      onClick={() =>
                        handleBudgetSelection(candidate.name, "basic")
                      }
                      disabled={isBelowDivider(candidate)}
                    >
                      {candidate.budgetType === "basic" && (
                        <Check className="w-4 h- mr-2" />
                      )}
                      Basic: {formatCurrency(candidate.basicBudget)}
                    </button>
                    <button
                      className={`
                      rounded-r flex items-center justify-center w-full my-1
                      ${
                        isBelowDivider(candidate) &&
                        "bg-transparent border border-gray-700 text-gray-600 border-l-0"
                      }
                      ${
                        !isBelowDivider(candidate) &&
                        candidate.budgetType === "extended"
                          ? "bg-slate-50 text-black hover:bg-slate-100"
                          : "border border-gray-700 bg-dark text-gray-100"
                      }
                    `}
                      onClick={() =>
                        handleBudgetSelection(candidate.name, "extended")
                      }
                      disabled={isBelowDivider(candidate)}
                    >
                      {candidate.budgetType === "extended" && (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Extended: {formatCurrency(candidate.extendedBudget)}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        {/* <div className="mt-6 flex justify-end">
          <button className="bg-white text-black hover:bg-gray-200 flex items-center">
            <Check className="w-4 h-4 mr-2" />
            Submit vote
          </button>
        </div> */}
      </div>
    </div>
  );
}
