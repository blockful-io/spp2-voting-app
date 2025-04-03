"use client";

import { useState, useEffect } from "react";
import { useEnsElectionData } from "@/hooks/useEnsElectionData";
import { VoteTable } from "@/components/vote/VoteTable";
import { MenuIcon } from "@/components/vote/MenuIcon";

// Define a type for our vote page candidates
interface VoteCandidate {
  name: string;
  basicBudget: number;
  extendedBudget: number;
  budgetType?: "basic" | "extended";
}

export default function VotePage() {
  const { data: electionData, isLoading } = useEnsElectionData();
  const [candidates, setCandidates] = useState<VoteCandidate[]>([]);

  useEffect(() => {
    if (electionData) {
      // Convert ElectionCandidate to VoteCandidate format and set default budgetType
      const voteCandidates = electionData.map((candidate) => ({
        name: candidate.name,
        basicBudget: candidate.basicBudget,
        extendedBudget: candidate.extendedBudget,
        budgetType: "basic" as const, // Set default budget type
      }));

      setCandidates([
        ...voteCandidates,
        { name: "None of the below", basicBudget: 0, extendedBudget: 0 },
      ]);
    }
  }, [electionData]);

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

  const handleReorder = (newOrder: VoteCandidate[]) => {
    setCandidates(newOrder);
  };

  if (isLoading)
    return (
      <div className="min-h-screen w-full text-white flex flex-col">
        <div className="container p-4 items-center justify-center flex flex-col max-w-7xl mx-auto gap-4">
          <div className="p-4">Loading...</div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen w-full text-white flex flex-col">
      <div className="container p-4 flex flex-col max-w-7xl mx-auto gap-4">
        <div className="p-4">
          <div className="flex items-center mb-4">
            <MenuIcon />
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
          <VoteTable
            candidates={candidates}
            onBudgetSelect={handleBudgetSelection}
            onReorder={handleReorder}
          />
        </div>
      </div>
    </div>
  );
}
