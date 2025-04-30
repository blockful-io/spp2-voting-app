"use client";

import { useState, useEffect, useRef } from "react";
import { useChoices, useEnsElectionData } from "@/hooks/useEnsElectionData";
import { VoteTable } from "@/components/vote/VoteTable";
import { MenuIcon } from "@/components/vote/MenuIcon";
import toast, { Toaster } from "react-hot-toast";
import { useVoteOnProposal } from "@/hooks/useSnapshot";
import { useVotes } from "@/hooks/useVotes";
import { useAccount } from "wagmi";
import { Choice, BudgetType } from "@/utils/types";

export default function VotePage() {
  const { isLoading: isLoadingChoices } = useChoices();
  const [candidates, setCandidates] = useState<Choice[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previousVoteApplied, setPreviousVoteApplied] = useState(false);
  const [reasoning, setReasoning] = useState("");
  const { voteFunc } = useVoteOnProposal();
  const { address } = useAccount();
  const { data: previousVote, isLoading: isLoadingVote } = useVotes(address);
  const { choices, isLoading: isLoadingAllocation } = useEnsElectionData();
  
  // Process choices into candidates once when choices are loaded
  useEffect(() => {
    if (choices && choices.length > 0) {
      try {
        const formattedChoices: Choice[] = choices.map((choice, index) => {
          if (typeof choice === "object" && choice !== null) {
            const choiceObj = choice as Record<string, unknown>;
            return {
              providerName: String(
                choiceObj.providerName || choiceObj.name || ""
              ),
              name: String(choiceObj.name || ""),
              budget:
                typeof choiceObj.budget === "number" ? choiceObj.budget : index,
              isSpp1: Boolean(choiceObj.isSpp1),
              isNoneBelow: Boolean(choiceObj.isNoneBelow),
              choiceId:
                typeof choiceObj.choiceId === "number"
                  ? choiceObj.choiceId
                  : index,
              budgetType:
                typeof choiceObj.budgetType === "string"
                  ? (choiceObj.budgetType as BudgetType)
                  : "basic",
            };
          }

          return {
            providerName:
              typeof choice === "string" ? choice : `Choice ${index}`,
            name: typeof choice === "string" ? choice : `Choice ${index}`,
            budget: index,
            isSpp1: false,
            isNoneBelow:
              typeof choice === "string" &&
              choice.toLowerCase().includes("below"),
            choiceId: index,
            budgetType: "basic" as BudgetType,
          };
        });

        // If previous vote is already loaded, apply it now
        if (previousVote?.votes && previousVote.votes.length > 0 && !previousVoteApplied) {
          applyPreviousVote(formattedChoices);
        } else if (!previousVoteApplied) {
          // Randomize the options below "None of the below"
          const randomizedChoices = randomizeBelowOptions(formattedChoices);
          setCandidates(randomizedChoices);
        }
      } catch (error) {
        console.error("Error formatting choices:", error);
        setCandidates([]);
      }
    }
  }, [choices, previousVote, previousVoteApplied]);

  // Function to ensure consistent ordering of choices
  function ensureConsistentOrder(choicesToOrder: Choice[]) {
    // Find the "None of the below" divider
    const dividerIndex = choicesToOrder.findIndex(c => 
      c.isNoneBelow || c.providerName.toLowerCase().includes("below")
    );
    
    if (dividerIndex === -1) return choicesToOrder;
    
    // Separate choices into above and below divider
    const aboveChoices = choicesToOrder.slice(0, dividerIndex + 1);
    let belowChoices = choicesToOrder.slice(dividerIndex + 1);
    
    // Sort below choices by choiceId to maintain consistent order
    belowChoices = belowChoices.sort((a, b) => a.choiceId - b.choiceId);
    
    // Combine the arrays
    return [...aboveChoices, ...belowChoices];
  }

  // Function to randomize options below "None of the below"
  function randomizeBelowOptions(choicesToOrder: Choice[]) {
    // Find the "None of the below" divider
    const dividerIndex = choicesToOrder.findIndex(c => 
      c.isNoneBelow || c.providerName.toLowerCase().includes("below")
    );
    
    if (dividerIndex === -1) return choicesToOrder;
    
    // Separate choices into above and below divider
    const aboveChoices = choicesToOrder.slice(0, dividerIndex + 1);
    const belowChoices = choicesToOrder.slice(dividerIndex + 1);
    
    // Group by provider name
    const groupedByProvider = belowChoices.reduce((groups, choice) => {
      const providerName = choice.providerName.split(' - ')[0].trim(); // Get base provider name
      if (!groups[providerName]) {
        groups[providerName] = [];
      }
      groups[providerName].push(choice);
      return groups;
    }, {} as Record<string, Choice[]>);
    
    // Convert to array of provider groups
    const providerGroups = Object.values(groupedByProvider);
    
    // Shuffle the provider groups
    for (let i = providerGroups.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [providerGroups[i], providerGroups[j]] = [providerGroups[j], providerGroups[i]];
    }
    
    // Flatten back to a single array
    const randomizedBelow = providerGroups.flat();
    
    // Combine the arrays
    return [...aboveChoices, ...randomizedBelow];
  }

  // Function to apply previous vote to a set of candidates
  function applyPreviousVote(candidatesToOrder: Choice[]) {
    try {
      if (!previousVote?.votes || previousVote.votes.length === 0) {
        return;
      }
      
      // Get the most recent vote
      const latestVote = previousVote.votes[0];
      
      if (!Array.isArray(latestVote.choice) || latestVote.choice.length === 0) {
        return;
      }
      
      const choiceIds = latestVote.choice;
      
      // Create a map of choiceId to ranking position
      const rankMap = new Map<number, number>();
      choiceIds.forEach((choiceId, index) => {
        rankMap.set(choiceId, index);
      });
      
      // Create a new array and sort it
      const orderedCandidates = [...candidatesToOrder];
      
      orderedCandidates.sort((a, b) => {
        const aRank = rankMap.get(a.choiceId);
        const bRank = rankMap.get(b.choiceId);
        
        if (aRank === undefined && bRank === undefined) return 0;
        if (aRank === undefined) return 1; 
        if (bRank === undefined) return -1;
        
        return aRank - bRank;
      });
      
      // Set the candidates order
      setCandidates(orderedCandidates);
      
      // Set the reasoning if available
      if (latestVote.reason) {
        setReasoning(latestVote.reason);
      }
      
      setPreviousVoteApplied(true);
      toast.success("Previous vote loaded successfully");
    } catch (error) {
      console.error("Error applying previous vote:", error);
      toast.error("Failed to load previous vote");
      setCandidates(candidatesToOrder);
    }
  }

  // Handle budget selection for candidates
  const handleBudgetSelection = (name: string, type: "basic" | "extended") => {
    setCandidates((prevCandidates) =>
      prevCandidates.map((candidate) =>
        candidate.providerName === name
          ? {
              ...candidate,
              budgetType: type,
              budget:
                type === "basic" ? candidate.choiceId : candidate.choiceId + 1,
            }
          : candidate
      )
    );
  };

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

  const handleReorder = (newOrder: Choice[]) => {
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
        c.providerName.toLowerCase().includes("below")
      );

      const allBudgetsSelected = candidates.every((c, index) =>
        index < dividerIndex ? c.budget : true
      );

      if (!allBudgetsSelected) {
        return toast.error(
          "Please select a budget type for all candidates above 'None of the below'"
        );
      }

      const selectedChoiceIds = candidates.reduce(
        (acc, candidate) => [...acc, candidate.choiceId],
        [] as number[]
      );

      await voteFunc({
        choice: selectedChoiceIds,
        reason: reasoning
      });
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
        console.error(error);
        toast.error("Error submitting vote. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isLoadingChoices || isLoadingVote || isLoadingAllocation;

  if (isLoading) {
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
      
      <div className="container p-4 flex flex-col max-w-7xl mx-auto gap-3">
        <div className="pb-3">
          <div className="flex items-center mb-3">
            <MenuIcon />
            <h1 className="text-2xl font-bold">Rank Your Preferences</h1>
          </div>

          <p className="text-gray-400 mb-4">
            Drag and drop candidates to rank them, placing your top choice at
            the top while any candidates below &quot;None of the below&quot;
            won&apos;t be counted. You can also select between basic or extended
            budget for each candidate.
          </p>
          {previousVoteApplied && (
            <div className="bg-blue-900/50 p-3 rounded-lg mb-4">
              <p className="text-blue-200">
                Your previous vote has been loaded. You can modify your choices
                and submit again if you wish.
              </p>
            </div>
          )}
        </div>
        <div className="grow flex flex-col w-full pb-28">
          <VoteTable
            candidates={candidates}
            onBudgetSelect={handleBudgetSelection}
            onReorder={handleReorder}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
          
          <div className="mt-5 px-2">
            <h2 className="text-xl font-semibold mb-2">Voting Reasoning</h2>
            <p className="text-gray-400 mb-3">Share your reasoning for this vote (optional)</p>
            <textarea
              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 min-h-[100px]"
              placeholder="Enter your reasoning here..."
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {/* Fixed footer with submit button */}
      <div className="fixed bottom-0 left-0 right-0 z-10 bg-gradient-to-b from-transparent via-black/70 to-black p-4">
        <div className="container mx-auto max-w-7xl">
          {/* Mobile: full width button */}
          <div className="md:hidden">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-white text-black rounded-lg py-3 flex items-center justify-center font-medium"
            >
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="currentColor" />
                  </svg>
                  Submit vote
                </>
              )}
            </button>
          </div>
          
          {/* Desktop: smaller button aligned to center */}
          <div className="hidden md:flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-1/4 bg-white text-black rounded-lg py-3 flex items-center justify-center font-medium"
            >
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="currentColor" />
                  </svg>
                  Submit vote
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
