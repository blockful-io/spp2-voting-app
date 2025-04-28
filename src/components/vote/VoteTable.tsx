import { VoteCandidate } from "@/hooks/useEnsElectionData";
import { CandidateRow } from "./CandidateRow";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useCallback, useMemo, useState, useEffect } from "react";
import { Choice, BudgetType } from "@/utils/types";

interface VoteTableProps {
  candidates: Choice[];
  onBudgetSelect: (name: string, type: "basic" | "extended") => void;
  onReorder: (newOrder: Choice[]) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

// Interface for a combined candidate display
interface CombinedCandidate {
  providerName: string;
  basicCandidate: Choice;
  extendedCandidate: Choice;
  isExpanded: boolean;
}

// Types for items in the display list
type RegularDisplayItem = {
  type: "regular";
  candidate: Choice;
  index: number;
};

type CombinedDisplayItem = {
  type: "combined";
  providerName: string;
  basicCandidate: Choice;
  extendedCandidate: Choice;
  index: number;
};

type DisplayItem = RegularDisplayItem | CombinedDisplayItem;

export function VoteTable({
  candidates,
  onBudgetSelect,
  onReorder,
  onDragStart,
  onDragEnd,
}: VoteTableProps) {
  // Initialize the combined views state with a useEffect to ensure adjacent pairs start merged
  const [combinedViews, setCombinedViews] = useState<Record<string, boolean>>(
    {}
  );

  // Initialize combined views for adjacent pairs
  useEffect(() => {
    // This should only run once on initial render
    const initialViews: Record<string, boolean> = {};
    let hasChanges = false;

    // Find adjacent basic+extended pairs
    for (let i = 0; i < candidates.length - 1; i++) {
      const current = candidates[i];
      const next = candidates[i + 1];

      if (current.providerName === next.providerName) {
        // Check if they're a basic+extended pair
        const isBasicExtendedPair =
          (current.budgetType === "basic" && next.budgetType === "extended") ||
          (current.budgetType === "extended" && next.budgetType === "basic");

        if (isBasicExtendedPair) {
          // Default to combined view (not expanded)
          initialViews[current.providerName] = false;
          hasChanges = true;
        }
      }
    }

    // If we found adjacent pairs, update the state
    if (hasChanges) {
      setCombinedViews(initialViews);
    }
  }, []); // Only run once on mount

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // Find pairs of basic and extended budgets for the same provider
  const combinedCandidates = useMemo(() => {
    const result: Record<string, CombinedCandidate> = {};

    // Group candidates by provider name
    const groupedByProvider: Record<string, Choice[]> = {};
    candidates.forEach((candidate) => {
      if (!groupedByProvider[candidate.providerName]) {
        groupedByProvider[candidate.providerName] = [];
      }
      groupedByProvider[candidate.providerName].push(candidate);
    });

    // Find providers with both basic and extended budgets
    for (const [providerName, group] of Object.entries(groupedByProvider)) {
      const basicCandidate = group.find((c) => c.budgetType === "basic");
      const extendedCandidate = group.find((c) => c.budgetType === "extended");

      if (basicCandidate && extendedCandidate) {
        // Check if this provider is explicitly expanded
        const isExpanded = combinedViews[providerName] === true;

        result[providerName] = {
          providerName,
          basicCandidate,
          extendedCandidate,
          isExpanded,
        };
      }
    }

    return result;
  }, [candidates, combinedViews]);

  // Auto-detect and merge adjacent basic+extended pairs after reordering
  // This runs after each drag operation and updates our state to automatically merge items
  useEffect(() => {
    console.log("Running auto-merge detection");

    // Start with a fresh state instead of copying the existing one
    const newMergedState: Record<string, boolean> = {};
    let hasChanges = false;

    // First pass - find all providers with both budget types
    const providersWithBoth = new Set<string>();

    for (let i = 0; i < candidates.length; i++) {
      const providerName = candidates[i].providerName;
      if (providersWithBoth.has(providerName)) continue;

      // Check if this provider has both basic and extended
      const hasBasic = candidates.some(
        (c) => c.providerName === providerName && c.budgetType === "basic"
      );

      const hasExtended = candidates.some(
        (c) => c.providerName === providerName && c.budgetType === "extended"
      );

      if (hasBasic && hasExtended) {
        providersWithBoth.add(providerName);
        // We don't set any state in this pass - we'll handle it in the next pass
      }
    }

    // Second pass - find adjacent basic+extended pairs and ALWAYS force them to merged state
    // regardless of previous user choices
    for (let i = 0; i < candidates.length - 1; i++) {
      const current = candidates[i];
      const next = candidates[i + 1];

      if (current.providerName === next.providerName) {
        // Check if they're a basic+extended pair
        const isBasicExtendedPair =
          (current.budgetType === "basic" && next.budgetType === "extended") ||
          (current.budgetType === "extended" && next.budgetType === "basic");

        if (isBasicExtendedPair) {
          console.log(
            `Found adjacent pair for ${current.providerName}, current state: ${
              combinedViews[current.providerName]
            }`
          );

          // ALWAYS force to merged state when adjacent, regardless of previous state
          newMergedState[current.providerName] = false; // false = merged/combined
          hasChanges = true;
        }
      }
    }

    // Update all provider states at once
    setCombinedViews(newMergedState);
    console.log("Set new combined views state:", newMergedState);
  }, [candidates]); // Only depend on candidates, not on combinedViews

  // Create a display list that either combines or separates items based on the current view state
  const displayItems = useMemo(() => {
    console.log(
      "Recalculating displayItems, current combined views:",
      combinedViews
    );

    // Create a map to track which items should be skipped (because they're part of a collapsed pair)
    const skipItems = new Set<Choice>();
    const result: DisplayItem[] = [];

    // Track pairs we identify for debugging
    const adjacentPairs: string[] = [];

    // First identify adjacent pairs and handle them
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];

      // If this item has already been processed as part of a combined view, skip it
      if (skipItems.has(candidate)) {
        continue;
      }

      // Check if this has a partner for potential combination
      const nextCandidate =
        i < candidates.length - 1 ? candidates[i + 1] : null;
      const isAdjacentPair =
        nextCandidate &&
        nextCandidate.providerName === candidate.providerName &&
        ((candidate.budgetType === "basic" &&
          nextCandidate.budgetType === "extended") ||
          (candidate.budgetType === "extended" &&
            nextCandidate.budgetType === "basic"));

      if (isAdjacentPair) {
        adjacentPairs.push(candidate.providerName);
      }

      // Check if this provider should be displayed in combined view
      const shouldShowCombined =
        isAdjacentPair && combinedViews[candidate.providerName] !== true; // Show combined unless explicitly expanded

      if (isAdjacentPair) {
        console.log(
          `Found adjacent pair for ${
            candidate.providerName
          }, shouldShowCombined: ${shouldShowCombined}, state: ${
            combinedViews[candidate.providerName]
          }`
        );
      }

      if (shouldShowCombined) {
        // Mark the next item to be skipped as we're showing them combined
        skipItems.add(nextCandidate!);

        // Determine which is basic and which is extended
        let basicCand: Choice, extendedCand: Choice;

        if (candidate.budgetType === "basic") {
          basicCand = candidate;
          extendedCand = nextCandidate!;
        } else {
          basicCand = nextCandidate!;
          extendedCand = candidate;
        }

        // Add as a combined item
        result.push({
          type: "combined",
          providerName: candidate.providerName,
          basicCandidate: basicCand,
          extendedCandidate: extendedCand,
          index: i,
        });
      } else {
        // Add as a regular item
        result.push({
          type: "regular",
          candidate,
          index: i,
        });
      }
    }

    console.log("Found adjacent pairs:", adjacentPairs);
    console.log(
      "Resulting displayItems types:",
      result.map((item) => item.type)
    );

    return result;
  }, [candidates, combinedViews]);

  // Toggle between expanded/collapsed view for a provider
  const toggleView = (providerName: string) => {
    console.log(
      `Toggling view for ${providerName}, current state:`,
      combinedViews[providerName]
    );

    // Current state: undefined/false = combined/collapsed, true = expanded
    const isCurrentlyExpanded = combinedViews[providerName] === true;

    // We always toggle to the opposite state
    setCombinedViews((prev) => {
      const newState = {
        ...prev,
        [providerName]: !isCurrentlyExpanded,
      };
      console.log(
        `New combined state for ${providerName}:`,
        newState[providerName]
      );
      return newState;
    });
  };

  const isDivider = (candidate: Choice) =>
    candidate.providerName.toLowerCase().includes("below");

  const isBelowDivider = (candidate: Choice) => {
    return (
      candidates.findIndex((c) =>
        c.providerName.toLowerCase().includes("below")
      ) <
      candidates.findIndex(
        (c) =>
          c.providerName === candidate.providerName &&
          c.budgetType === candidate.budgetType
      )
    );
  };

  const handleDragStart = useCallback(() => onDragStart?.(), [onDragStart]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (active.id !== over?.id) {
        // Extract item identifiers from the IDs
        const activeId = String(active.id);
        const overId = String(over?.id);

        const activeDecoded = decodeId(activeId);
        const overDecoded = decodeId(overId);

        if (!activeDecoded || !overDecoded) {
          return;
        }

        // Step 1: Find indices in the displayItems array
        const activeDisplayIndex = displayItems.findIndex(
          (item, index) => getItemId(item, index) === activeId
        );

        const overDisplayIndex = displayItems.findIndex(
          (item, index) => getItemId(item, index) === overId
        );

        if (activeDisplayIndex === -1 || overDisplayIndex === -1) {
          return;
        }

        // Step 2: Create a new copy of the candidates array to manipulate
        const newCandidates = [...candidates];

        // Step 3: Handle by display type
        if (activeDecoded.budgetType === "combined") {
          // --- DRAGGING A COMBINED ITEM ---
          // Find the provider we're moving
          const providerName = activeDecoded.provider;

          // Find all items for this provider in the candidates array
          const providerItemIndices = [];
          for (let i = 0; i < candidates.length; i++) {
            if (candidates[i].providerName === providerName) {
              providerItemIndices.push(i);
            }
          }

          if (providerItemIndices.length === 0) {
            return;
          }

          // Remove these items from the candidates array (in reverse order to maintain indices)
          const itemsToMove = [];
          for (let i = providerItemIndices.length - 1; i >= 0; i--) {
            const index = providerItemIndices[i];
            itemsToMove.unshift(newCandidates[index]);
            newCandidates.splice(index, 1);
          }

          // Step 4: Determine where to insert in the candidates array
          // This is tricky, we need to translate from display index to candidate index

          let insertIndex;

          // Find the item in the displayItems that comes after our target position
          // (or use the end of the array if we're at the last position)
          const nextDisplayIndex =
            overDisplayIndex + (activeDisplayIndex < overDisplayIndex ? 1 : 0);

          if (nextDisplayIndex >= displayItems.length) {
            // If dropping at the end, put at the end of candidates
            insertIndex = newCandidates.length;
          } else {
            // Find where the next display item is in the candidates array
            const nextDisplayItem = displayItems[nextDisplayIndex];

            if (nextDisplayItem.type === "regular") {
              // For regular items, find its index in the candidates array
              insertIndex = newCandidates.findIndex(
                (c) =>
                  c.providerName === nextDisplayItem.candidate.providerName &&
                  c.budgetType === nextDisplayItem.candidate.budgetType
              );
            } else {
              // For combined items, find the first item of that provider
              insertIndex = newCandidates.findIndex(
                (c) => c.providerName === nextDisplayItem.providerName
              );
            }

            // If somehow we didn't find it, append to the end
            if (insertIndex === -1) {
              insertIndex = newCandidates.length;
            }
          }

          // Insert the items at the target position
          newCandidates.splice(insertIndex, 0, ...itemsToMove);

          // Step 5: Apply business rules to ensure proper ordering
          const finalOrder = enforceBusinessRules(newCandidates);

          // Step 6: Update the state
          onReorder(finalOrder);
          onDragEnd?.();
        } else {
          // --- DRAGGING A REGULAR ITEM ---
          // Find the item we're moving in the candidates array
          const activeItemIndex = candidates.findIndex(
            (c) =>
              c.providerName === activeDecoded.provider &&
              c.budgetType === activeDecoded.budgetType
          );

          if (activeItemIndex === -1) {
            return;
          }

          // Remove it from our working copy
          const [itemToMove] = newCandidates.splice(activeItemIndex, 1);

          // Step 4: Determine where to insert in the candidates array
          let insertIndex;

          // Similar logic to combined drag - find the next display item
          const nextDisplayIndex =
            overDisplayIndex + (activeDisplayIndex < overDisplayIndex ? 1 : 0);

          if (nextDisplayIndex >= displayItems.length) {
            // If dropping at the end, put at the end of candidates
            insertIndex = newCandidates.length;
          } else {
            // Find where the next display item is in the candidates array
            const nextDisplayItem = displayItems[nextDisplayIndex];

            if (nextDisplayItem.type === "regular") {
              // For regular items, find its index in the candidates array
              insertIndex = newCandidates.findIndex(
                (c) =>
                  c.providerName === nextDisplayItem.candidate.providerName &&
                  c.budgetType === nextDisplayItem.candidate.budgetType
              );
            } else {
              // For combined items, find the first item of that provider
              insertIndex = newCandidates.findIndex(
                (c) => c.providerName === nextDisplayItem.providerName
              );
            }

            // If somehow we didn't find it, append to the end
            if (insertIndex === -1) {
              insertIndex = newCandidates.length;
            }
          }

          // Insert the item at the target position
          newCandidates.splice(insertIndex, 0, itemToMove);
        }

        // Step 5: Apply business rules to ensure proper ordering
        const finalOrder = enforceBusinessRules(newCandidates);

        // Step 6: Update the state
        onReorder(finalOrder);
        onDragEnd?.();
      } else {
        // No change
        onDragEnd?.();
      }
    },
    [candidates, displayItems, onReorder, onDragEnd]
  );

  // Enforce business rules on the candidate order
  const enforceBusinessRules = (candidateList: Choice[]): Choice[] => {
    // Make a copy to avoid modifying the input
    const result = [...candidateList];

    // Get all unique provider names
    const providers = [...new Set(result.map((c) => c.providerName))];

    // Track providers that need to stay merged
    const mergedProviders = new Set<string>();

    // Identify providers that should stay merged (adjacent basic+extended)
    for (let i = 0; i < result.length - 1; i++) {
      const current = result[i];
      const next = result[i + 1];

      if (
        current.providerName === next.providerName &&
        ((current.budgetType === "basic" && next.budgetType === "extended") ||
          (current.budgetType === "extended" && next.budgetType === "basic"))
      ) {
        mergedProviders.add(current.providerName);
      }
    }

    // For each provider, ensure basic is before extended
    for (const provider of providers) {
      const basicIndex = result.findIndex(
        (c) => c.providerName === provider && c.budgetType === "basic"
      );

      const extendedIndex = result.findIndex(
        (c) => c.providerName === provider && c.budgetType === "extended"
      );

      // If both exist and extended is before basic, move basic before extended
      if (
        basicIndex !== -1 &&
        extendedIndex !== -1 &&
        extendedIndex < basicIndex
      ) {
        // Remove basic from its current position
        const basicItem = result.splice(basicIndex, 1)[0];

        // Insert it right before extended
        result.splice(extendedIndex, 0, basicItem);
      }
    }

    // Make sure merged providers stay together - no items should be between their basic and extended
    for (const provider of mergedProviders) {
      const basicIndex = result.findIndex(
        (c) => c.providerName === provider && c.budgetType === "basic"
      );

      const extendedIndex = result.findIndex(
        (c) => c.providerName === provider && c.budgetType === "extended"
      );

      if (basicIndex !== -1 && extendedIndex !== -1) {
        // If they're not adjacent
        if (Math.abs(basicIndex - extendedIndex) > 1) {
          // Remove the extended item
          const extendedItem = result.splice(extendedIndex, 1)[0];

          // Insert it right after basic
          result.splice(basicIndex + 1, 0, extendedItem);
        }
      }
    }

    return result;
  };

  // Generate unique ID for each candidate or combined item
  const getItemId = (item: DisplayItem, index: number) => {
    if (item.type === "combined") {
      return `${item.providerName}-combined-${index}`;
    } else {
      return `${item.candidate.providerName}-${item.candidate.budgetType}-${index}`;
    }
  };

  // Debug utility to decode an ID back to its components
  const decodeId = (id: string) => {
    const parts = id.split("-");
    if (parts.length >= 3) {
      return {
        provider: parts.slice(0, parts.length - 2).join("-"), // Handle providers with dashes in their names
        budgetType: parts[parts.length - 2] as
          | "basic"
          | "extended"
          | "combined"
          | "none",
        index: parseInt(parts[parts.length - 1]),
      };
    }
    return null;
  };

  // Format budget as currency
  const formatBudget = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="mt-2 border border-gray-800 rounded-lg overflow-scroll text-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-gray-400 p-4 w-[50px]"></th>
              <th className="text-left text-gray-400 p-4">Candidate</th>
              <th className="text-right text-gray-400 p-4">Preferred Budget</th>
            </tr>
          </thead>
          <tbody>
            <SortableContext
              items={displayItems.map((item, index) => getItemId(item, index))}
              strategy={verticalListSortingStrategy}
            >
              {displayItems.map((item, index) => {
                if (item.type === "combined") {
                  // Render combined row
                  return (
                    <CandidateRow
                      key={getItemId(item, index)}
                      id={getItemId(item, index)}
                      name={item.providerName}
                      index={index}
                      isCombined={true}
                      basicBudget={item.basicCandidate.budget}
                      extendedBudget={item.extendedCandidate.budget}
                      budget={
                        item.basicCandidate.budget +
                        item.extendedCandidate.budget
                      }
                      isDivider={false}
                      isBelowDivider={isBelowDivider(item.basicCandidate)}
                      isLastRow={index === displayItems.length - 1}
                      budgetType="combined"
                      isExpanded={combinedViews[item.providerName] === true}
                      canToggle={true}
                      onToggleView={() => toggleView(item.providerName)}
                      onBudgetSelect={(type) =>
                        onBudgetSelect(item.providerName, type)
                      }
                    />
                  );
                } else {
                  // Render regular row
                  const { candidate } = item;
                  const combined = combinedCandidates[candidate.providerName];

                  // Check if this item could be part of a merged set
                  const hasBothBudgetTypes = candidates.some(
                    (c) =>
                      c.providerName === candidate.providerName &&
                      c.budgetType !== candidate.budgetType &&
                      (c.budgetType === "basic" || c.budgetType === "extended")
                  );

                  // Check if the counterpart is adjacent
                  let hasAdjacentCounterpart = false;
                  const currentIndex = candidates.findIndex(
                    (c) =>
                      c.providerName === candidate.providerName &&
                      c.budgetType === candidate.budgetType
                  );

                  if (currentIndex !== -1) {
                    // Check if previous or next item is the counterpart
                    const prev =
                      currentIndex > 0 ? candidates[currentIndex - 1] : null;
                    const next =
                      currentIndex < candidates.length - 1
                        ? candidates[currentIndex + 1]
                        : null;

                    const prevIsCounterpart = prev
                      ? prev.providerName === candidate.providerName &&
                        prev.budgetType !== candidate.budgetType &&
                        (prev.budgetType === "basic" ||
                          prev.budgetType === "extended")
                      : false;

                    const nextIsCounterpart = next
                      ? next.providerName === candidate.providerName &&
                        next.budgetType !== candidate.budgetType &&
                        (next.budgetType === "basic" ||
                          next.budgetType === "extended")
                      : false;

                    hasAdjacentCounterpart =
                      prevIsCounterpart || nextIsCounterpart;
                  }

                  return (
                    <CandidateRow
                      key={getItemId(item, index)}
                      id={getItemId(item, index)}
                      name={candidate.providerName}
                      index={index}
                      budget={candidate.budget}
                      isDivider={isDivider(candidate)}
                      isBelowDivider={isBelowDivider(candidate)}
                      isLastRow={index === displayItems.length - 1}
                      budgetType={candidate.budgetType}
                      isExpanded={
                        combinedViews[candidate.providerName] === true
                      }
                      canToggle={hasAdjacentCounterpart}
                      onToggleView={
                        // Show the toggle button only if this provider has both budget types adjacent
                        hasAdjacentCounterpart
                          ? () => toggleView(candidate.providerName)
                          : undefined
                      }
                      onBudgetSelect={(type) =>
                        onBudgetSelect(candidate.providerName, type)
                      }
                    />
                  );
                }
              })}
            </SortableContext>
          </tbody>
        </table>
      </div>
    </DndContext>
  );
}
