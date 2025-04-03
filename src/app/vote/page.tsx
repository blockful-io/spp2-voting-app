"use client";

import { useState, useEffect } from "react";
import { useEnsElectionData } from "@/hooks/useEnsElectionData";
import { VoteTable } from "@/components/vote/VoteTable";
import { MenuIcon } from "@/components/vote/MenuIcon";
import toast, { Toaster } from "react-hot-toast";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Prevent page scrolling during drag
  useEffect(() => {
    if (!isDragging) return;

    const preventDefault = (e: TouchEvent) => {
      if (isDragging) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchmove", preventDefault, { passive: false });

    return () => {
      document.removeEventListener("touchmove", preventDefault);
    };
  }, [isDragging]);

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

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Get the index of "None of the below"
      const dividerIndex = candidates.findIndex(
        (c) => c.name === "None of the below"
      );

      // Get only the candidates above "None of the below"
      const validCandidates = candidates.slice(0, dividerIndex);

      // Validate that all candidates have a budget type selected
      const allBudgetsSelected = validCandidates.every((c) => c.budgetType);

      if (!allBudgetsSelected) {
        toast.error(
          "Please select a budget type for all candidates above 'None of the below'"
        );
        return;
      }

      // Here you would typically send the vote to your backend
      console.log("Submitting vote with candidates:", validCandidates);

      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Vote submitted successfully!");
    } catch (error) {
      console.error("Error submitting vote:", error);
      toast.error("Error submitting vote. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
      <Toaster
        position="top-center"
        toastOptions={{
          success: {
            style: {
              background: "#059669",
              color: "white",
            },
          },
          error: {
            style: {
              background: "#DC2626",
              color: "white",
            },
          },
          duration: 4000,
        }}
      />
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
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
          <div className="flex justify-end mt-6">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`
                px-6 py-3 rounded-lg font-medium
                ${
                  isSubmitting
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }
                transition-colors
              `}
            >
              {isSubmitting ? "Submitting..." : "Submit Vote"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
