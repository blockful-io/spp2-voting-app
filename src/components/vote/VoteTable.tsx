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
import { useCallback, useMemo, useState } from "react";
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
  // State to track which provider's view should be expanded/collapsed
  const [combinedViews, setCombinedViews] = useState<Record<string, boolean>>(
    {}
  );

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
        // Check if they are adjacent in the original array
        const basicIndex = candidates.indexOf(basicCandidate);
        const extendedIndex = candidates.indexOf(extendedCandidate);

        if (Math.abs(basicIndex - extendedIndex) === 1) {
          result[providerName] = {
            providerName,
            basicCandidate,
            extendedCandidate,
            isExpanded: combinedViews[providerName] || false,
          };
        }
      }
    }

    return result;
  }, [candidates, combinedViews]);

  // Create a display list that either combines or separates items based on the current view state
  const displayItems = useMemo(() => {
    // Create a map to track which items should be skipped (because they're part of a collapsed pair)
    const skipItems = new Set<Choice>();

    return candidates
      .map((candidate, index) => {
        // If this item has already been processed as part of a combined view, skip it
        if (skipItems.has(candidate)) {
          return null;
        }

        const combined = combinedCandidates[candidate.providerName];

        // If this provider has both budget types and they're adjacent
        if (combined) {
          const nextCandidate =
            index < candidates.length - 1 ? candidates[index + 1] : null;

          // Check if current and next are the pair we want to combine
          if (
            nextCandidate &&
            nextCandidate.providerName === candidate.providerName &&
            ((candidate.budgetType === "basic" &&
              nextCandidate.budgetType === "extended") ||
              (candidate.budgetType === "extended" &&
                nextCandidate.budgetType === "basic"))
          ) {
            // If view is expanded, don't combine them
            if (combined.isExpanded) {
              return {
                type: "regular",
                candidate,
                index,
              } as RegularDisplayItem;
            }

            // Otherwise combine them and mark the next item to be skipped
            skipItems.add(nextCandidate);

            // Determine which is basic and which is extended
            const basicCand =
              candidate.budgetType === "basic" ? candidate : nextCandidate;
            const extendedCand =
              candidate.budgetType === "extended" ? candidate : nextCandidate;

            return {
              type: "combined",
              providerName: candidate.providerName,
              basicCandidate: basicCand,
              extendedCandidate: extendedCand,
              index,
            } as CombinedDisplayItem;
          }
        }

        // Default: just return this candidate as-is
        return { type: "regular", candidate, index } as RegularDisplayItem;
      })
      .filter((item): item is DisplayItem => item !== null); // Type guard to remove null entries
  }, [candidates, combinedCandidates]);

  // Toggle between expanded/collapsed view for a provider
  const toggleView = (providerName: string) => {
    setCombinedViews((prev) => ({
      ...prev,
      [providerName]: !prev[providerName],
    }));
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
          console.error("Failed to decode drag IDs", { activeId, overId });
          return;
        }

        console.log("Active:", activeDecoded);
        console.log("Over:", overDecoded);

        // Step 1: Find indices in the displayItems array
        const activeDisplayIndex = displayItems.findIndex(
          (item, index) => getItemId(item, index) === activeId
        );

        const overDisplayIndex = displayItems.findIndex(
          (item, index) => getItemId(item, index) === overId
        );

        if (activeDisplayIndex === -1 || overDisplayIndex === -1) {
          console.error("Could not find display indices");
          return;
        }

        // Step 2: Create a new copy of the candidates array to manipulate
        const newCandidates = [...candidates];

        // Step 3: Handle by display type
        if (activeDecoded.budgetType === "combined") {
          // --- DRAGGING A COMBINED ITEM ---
          console.log("===== COMBINED DRAG START =====");

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
            console.error("No provider items found");
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

          console.log(
            `Inserted ${itemsToMove.length} items at position ${insertIndex}`
          );
          console.log("===== COMBINED DRAG END =====");
        } else {
          // --- DRAGGING A REGULAR ITEM ---
          console.log("===== REGULAR DRAG START =====");

          // Find the item we're moving in the candidates array
          const activeItemIndex = candidates.findIndex(
            (c) =>
              c.providerName === activeDecoded.provider &&
              c.budgetType === activeDecoded.budgetType
          );

          if (activeItemIndex === -1) {
            console.error("Could not find active item in candidates");
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

          console.log(`Moved item from ${activeItemIndex} to ${insertIndex}`);
          console.log("===== REGULAR DRAG END =====");
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
                      isExpanded={
                        combinedCandidates[item.providerName]?.isExpanded
                      }
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
                      isExpanded={combined?.isExpanded}
                      onToggleView={
                        combined
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
