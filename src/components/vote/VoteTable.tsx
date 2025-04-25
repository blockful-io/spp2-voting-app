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
        // Extract indexes using our decoder
        const activeDecoded = decodeId(String(active.id));
        const overDecoded = decodeId(String(over?.id));

        if (!activeDecoded || !overDecoded) {
          console.error("Failed to decode drag IDs", {
            active: active.id,
            over: over?.id,
          });
          return;
        }

        // COMBINED ITEM DRAG
        if (activeDecoded.budgetType === "combined") {
          console.log("===== COMBINED DRAG START =====");
          console.log("Active:", activeDecoded);
          console.log("Over:", overDecoded);
          console.log(
            "Initial candidates:",
            JSON.stringify(
              candidates.map((c) => ({
                name: c.providerName,
                type: c.budgetType,
              }))
            )
          );

          // Get the provider name of what we're moving
          const providerName = activeDecoded.provider;
          console.log("Moving provider:", providerName);

          // Create a working copy
          const workingArray = [...candidates];

          // Find and remove the items we're moving (basic and extended budgets)
          const itemsToMove: Choice[] = [];
          const originalIndexes: number[] = [];

          // Find all the items for this provider
          for (let i = workingArray.length - 1; i >= 0; i--) {
            const candidate = workingArray[i];
            if (
              candidate.providerName === providerName &&
              (candidate.budgetType === "basic" ||
                candidate.budgetType === "extended")
            ) {
              // Remove it from the working array
              const [removed] = workingArray.splice(i, 1);
              console.log(
                `Removed ${removed.providerName} (${removed.budgetType}) at index ${i}`
              );
              // Add it to our items to move (at the beginning to maintain order)
              itemsToMove.unshift(removed);
              originalIndexes.unshift(i);
            }
          }

          if (itemsToMove.length === 0) {
            console.error("No items found to move for combined drag", {
              providerName,
              active: activeDecoded,
              over: overDecoded,
            });
            onDragEnd?.();
            return;
          }

          console.log(
            "Items to move:",
            JSON.stringify(
              itemsToMove.map((c) => ({
                name: c.providerName,
                type: c.budgetType,
              }))
            )
          );

          // Sort the items to move so that basic is always first
          itemsToMove.sort((a, b) =>
            a.budgetType === "basic" ? -1 : b.budgetType === "basic" ? 1 : 0
          );

          const minOriginalIndex = Math.min(...originalIndexes);

          // Find where to insert them
          let insertIndex: number;

          if (overDecoded.budgetType === "combined") {
            // Find the target provider's positions (all instances)
            const targetProviderIndices = workingArray
              .map((c, idx) =>
                c.providerName === overDecoded.provider ? idx : -1
              )
              .filter((idx) => idx !== -1);

            // Default to first position
            insertIndex =
              targetProviderIndices.length > 0 ? targetProviderIndices[0] : -1;

            // Find the min original index of the items being moved
            const minOriginalIndex = Math.min(...originalIndexes);

            // Determine if we're dragging down
            const isDraggingDown =
              minOriginalIndex <
              (targetProviderIndices.length > 0
                ? targetProviderIndices[0]
                : Infinity);

            // If dragging down, place after all items of the target provider
            if (isDraggingDown && targetProviderIndices.length > 0) {
              insertIndex = Math.max(...targetProviderIndices) + 1;
            }

            console.log(
              `Target is combined. Looking for provider: ${overDecoded.provider}, indices: ${targetProviderIndices}, dragging down: ${isDraggingDown}`
            );
          } else {
            // Find the specific target item and handle any merged items
            insertIndex = workingArray.findIndex(
              (c) =>
                c.providerName === overDecoded.provider &&
                c.budgetType === overDecoded.budgetType
            );

            // Determine if target is part of a merged set (has both basic and extended)
            const isTargetPartOfMergedSet = workingArray.some(
              (c) =>
                c.providerName === overDecoded.provider &&
                c.budgetType !== overDecoded.budgetType &&
                (c.budgetType === "basic" || c.budgetType === "extended")
            );

            if (isTargetPartOfMergedSet) {
              // Find all indices of this provider
              const indices = workingArray
                .map((c, idx) =>
                  c.providerName === overDecoded.provider ? idx : -1
                )
                .filter((idx) => idx !== -1);

              // Check if dropping before or after
              const minOriginalIndex = Math.min(...originalIndexes);
              const isDraggingDown = minOriginalIndex < insertIndex;

              // Place either before or after the entire merged set
              insertIndex = isDraggingDown
                ? Math.max(...indices) + 1
                : Math.min(...indices);
            }

            console.log(
              `Target is regular. Looking for provider: ${overDecoded.provider} with type: ${overDecoded.budgetType}, isPartOfMergedSet: ${isTargetPartOfMergedSet}`
            );
          }

          console.log("Insert index found:", insertIndex);

          // If can't find target, insert at beginning
          if (insertIndex === -1) {
            console.warn(
              "Target not found for combined drag, using fallback position",
              {
                targetProvider: overDecoded.provider,
                targetType: overDecoded.budgetType,
              }
            );
            insertIndex = 0;
            console.log("Target not found, defaulting to index 0");
          }

          // Determine if dragging down
          const targetOriginalIndex = candidates.findIndex(
            (c) =>
              c.providerName === overDecoded.provider &&
              (overDecoded.budgetType === "combined"
                ? true
                : c.budgetType === overDecoded.budgetType)
          );

          console.log("Target original index:", targetOriginalIndex);
          console.log("Min original index of moved items:", minOriginalIndex);

          const isDraggingDown = targetOriginalIndex > minOriginalIndex;
          console.log("Is dragging down:", isDraggingDown);

          // If dragging down, we need to insert AFTER the target
          if (isDraggingDown) {
            // UPDATED FIX: For combined targets when dragging down, insert after BOTH items
            if (overDecoded.budgetType === "combined") {
              // When target is combined, find the last item of that provider
              const targetProviderIndices = workingArray
                .map((c, idx) =>
                  c.providerName === overDecoded.provider ? idx : -1
                )
                .filter((idx) => idx !== -1);

              if (targetProviderIndices.length > 0) {
                // Use the last index of the target provider's items
                insertIndex = Math.max(...targetProviderIndices) + 1;
                console.log(
                  "Adjusted insert index after combined target:",
                  insertIndex
                );
              } else {
                insertIndex += 1;
              }
            } else {
              insertIndex += 1;
            }
            console.log(
              "Adjusted insert index for downward drag:",
              insertIndex
            );
          }

          // Insert the items at the target position
          workingArray.splice(insertIndex, 0, ...itemsToMove);

          console.log(
            "Final working array:",
            JSON.stringify(
              workingArray.map((c) => ({
                name: c.providerName,
                type: c.budgetType,
              }))
            )
          );

          // CRITICAL FIX: Reapply the combined status in final array
          // Make sure we update the view state for items that should remain combined
          // We'll do this by checking for provider name pairs that have both budget types
          const finalOrder = enforceBusinessRules(workingArray);

          console.log(
            "After enforcing business rules:",
            JSON.stringify(
              finalOrder.map((c) => ({
                name: c.providerName,
                type: c.budgetType,
              }))
            )
          );
          console.log("===== COMBINED DRAG END =====");

          // Update with the new order and keep the combined view state
          onReorder(finalOrder);
          onDragEnd?.();
          return;
        }
        // REGULAR ITEM DRAG
        else {
          console.log("===== REGULAR DRAG START =====");
          console.log("Active:", activeDecoded);
          console.log("Over:", overDecoded);

          // Find the active item index
          const oldIndex = candidates.findIndex(
            (c) =>
              c.providerName === activeDecoded.provider &&
              c.budgetType === activeDecoded.budgetType
          );

          // Handle differently based on target type
          let newIndex: number;

          if (overDecoded.budgetType === "combined") {
            // When target is a combined item, we need to find the first item of that provider
            const providerIndices = candidates
              .map((c, idx) =>
                c.providerName === overDecoded.provider ? idx : -1
              )
              .filter((idx) => idx !== -1);

            // Default to the first item if found
            newIndex = providerIndices.length > 0 ? providerIndices[0] : -1;

            // If we're dragging down, place after the last item of the provider
            if (providerIndices.length > 0) {
              const minProviderIndex = Math.min(...providerIndices);
              const maxProviderIndex = Math.max(...providerIndices);
              const isDraggingDown = oldIndex < minProviderIndex;

              newIndex = isDraggingDown
                ? maxProviderIndex + 1
                : minProviderIndex;
            }

            console.log(
              `Target is combined, found index: ${newIndex}, indices: ${providerIndices}`
            );
          } else {
            // Otherwise find the exact item
            newIndex = candidates.findIndex(
              (c) =>
                c.providerName === overDecoded.provider &&
                c.budgetType === overDecoded.budgetType
            );
            console.log(`Target is regular, found index: ${newIndex}`);
          }

          console.log(`Moving from index ${oldIndex} to ${newIndex}`);

          if (oldIndex === -1 || newIndex === -1) {
            console.error("Could not find items for regular drag", {
              oldIndex,
              newIndex,
              active: activeDecoded,
              over: overDecoded,
            });
            return;
          }

          // Create new order with the dragged item at the new position
          const newOrder = arrayMove([...candidates], oldIndex, newIndex);

          // Apply business rules - basic must come before extended
          const finalOrder = enforceBusinessRules(newOrder);

          console.log(
            "Final order after enforcing rules:",
            JSON.stringify(
              finalOrder.map((c) => ({
                name: c.providerName,
                type: c.budgetType,
              }))
            )
          );
          console.log("===== REGULAR DRAG END =====");

          // Update with the new order
          onReorder(finalOrder);
          onDragEnd?.();
        }
      } else {
        onDragEnd?.();
      }
    },
    [candidates, onReorder, onDragEnd]
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
