"use client";

import { useState, useEffect } from "react";
import { useChoices, VoteCandidate } from "@/hooks/useEnsElectionData";
import { VoteTable } from "@/components/vote/VoteTable";
import { MenuIcon } from "@/components/vote/MenuIcon";
import toast, { Toaster } from "react-hot-toast";
import { useVoteOnProposal } from "@/hooks/useSnapshot";
import { useVotes } from "@/hooks/useVotes";
import { useAccount } from "wagmi";
import { loadChoices } from "@/utils/loadChoices";

export default function VotePage() {
  const { fetchChoices, isLoading } = useChoices();
  const [candidates, setCandidates] = useState<VoteCandidate[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { voteFunc } = useVoteOnProposal();
  const { address } = useAccount();
  const { data: previousVote, isLoading: isLoadingVote } = useVotes(address);

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
    if (!fetchChoices) return;
    setCandidates(loadChoices(fetchChoices, previousVote));
  }, [fetchChoices, previousVote]);

  const handleBudgetSelection = (name: string, type: "basic" | "extended") => {
    setCandidates(
      candidates.map((candidate) => {
        if (candidate.name !== name) return candidate;
        return {
          ...candidate,
          budgets: candidate.budgets.map((budget) => ({
            ...budget,
            selected: budget.type === type,
          })),
        };
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

      const dividerIndex = candidates.findIndex((c) =>
        c.name.toLowerCase().includes("below")
      );

      const allBudgetsSelected = candidates.every((c, index) =>
        index < dividerIndex ? c.budgets.some((b) => b.selected) : true
      );

      if (!allBudgetsSelected) {
        return toast.error(
          "Please select a budget type for all candidates above 'None of the below'"
        );
      }

      const selectedChoiceIds = candidates.reduce(
        (acc, candidate) => [
          ...acc,
          ...candidate.budgets
            .sort((a, b) => (a.selected ? -1 : 1) - (b.selected ? -1 : 1))
            .map((b) => b.id),
        ],
        [] as number[]
      );

      await voteFunc(selectedChoiceIds);
      toast.success("Vote submitted successfully!");
    } catch (error) {
      // Check for no voting power error
      if (
        error &&
        typeof error === "object" &&
        "error" in error &&
        error.error === "client_error" &&
        "error_description" in error &&
        error.error_description === "no voting power"
      ) {
        toast.error(
          "You don't have voting power. Please ensure you hold the required tokens to participate in this vote."
        );
      } else {
        toast.error("Error submitting vote. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isLoadingVote) {
    return (
      <div className="min-h-screen w-full text-white flex flex-col">
        <div className="container p-4 items-center justify-center flex flex-col max-w-7xl mx-auto gap-4">
          <div className="p-4">Loading...</div>
        </div>
      </div>
    );
  }

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
          {previousVote?.votes?.length && previousVote.votes.length > 0 && (
            <div className="bg-blue-900/50 p-4 rounded-lg mb-6">
              <p className="text-blue-200">
                Your previous vote has been loaded. You can modify your choices
                and submit again if you wish.
              </p>
            </div>
          )}
        </div>
        <div className="grow flex flex-col w-full">
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
