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
import { useCallback } from "react";
import { Choice } from "@/utils/types";

interface VoteTableProps {
  candidates: Choice[];
  onBudgetSelect: (name: string, type: "basic" | "extended") => void;
  onReorder: (newOrder: Choice[]) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function VoteTable({
  candidates,
  onBudgetSelect,
  onReorder,
  onDragStart,
  onDragEnd,
}: VoteTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

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
          return;
        }

        const oldIndex = activeDecoded.index;
        const newIndex = overDecoded.index;

        // First, do the basic move
        const newOrder = arrayMove([...candidates], oldIndex, newIndex);

        // After the drag, check if any extended budget appears above its corresponding basic budget
        // If so, move the basic budget to be right above the extended one

        // Get all provider names
        const providerNames = [...new Set(newOrder.map((c) => c.providerName))];

        let orderChanged = false;

        // For each provider, check if extended is ranked above basic
        for (const provider of providerNames) {
          // Find the indices of basic and extended budgets for this provider
          const indices = newOrder
            .map((candidate, index) => ({
              index,
              budgetType: candidate.budgetType,
              provider: candidate.providerName,
            }))
            .filter((item) => item.provider === provider);

          const basicEntry = indices.find(
            (item) => item.budgetType === "basic"
          );
          const extendedEntry = indices.find(
            (item) => item.budgetType === "extended"
          );

          // If both exist and the extended budget is ranked higher (has a lower index)
          if (
            basicEntry &&
            extendedEntry &&
            extendedEntry.index < basicEntry.index
          ) {
            // Remove the basic budget from its current position
            const basicBudget = newOrder.splice(basicEntry.index, 1)[0];

            // Insert it right above the extended budget
            // Need to adjust the extended index if basic was before it originally
            const insertIndex =
              basicEntry.index < extendedEntry.index
                ? extendedEntry.index - 1 // Basic was before extended, so extended shifts down 1
                : extendedEntry.index; // Basic was after extended, so no shift

            newOrder.splice(insertIndex, 0, basicBudget);
            orderChanged = true;
          }
        }

        // Verify that the rule has been correctly applied
        let allValid = true;

        for (const provider of providerNames) {
          const providerEntries = newOrder
            .map((candidate, index) => ({
              index,
              budgetType: candidate.budgetType,
              provider: candidate.providerName,
            }))
            .filter((item) => item.provider === provider);

          const basicIndex = providerEntries.find(
            (item) => item.budgetType === "basic"
          )?.index;
          const extendedIndex = providerEntries.find(
            (item) => item.budgetType === "extended"
          )?.index;

          if (basicIndex !== undefined && extendedIndex !== undefined) {
            if (extendedIndex < basicIndex) {
              allValid = false;
            }
          }
        }

        onReorder(newOrder);
      }

      onDragEnd?.();
    },
    [candidates, onReorder, onDragEnd]
  );

  // Generate unique ID for each candidate
  const getCandidateId = (candidate: Choice, index: number) => {
    // Always use the same consistent format
    return `${candidate.providerName}-${candidate.budgetType}-${index}`;
  };

  // Debug utility to decode an ID back to its components
  const decodeId = (id: string) => {
    const parts = id.split("-");
    if (parts.length >= 3) {
      return {
        provider: parts.slice(0, parts.length - 2).join("-"), // Handle providers with dashes in their names
        budgetType: parts[parts.length - 2],
        index: parseInt(parts[parts.length - 1]),
      };
    }
    return null;
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
              items={candidates.map((candidate, index) =>
                getCandidateId(candidate, index)
              )}
              strategy={verticalListSortingStrategy}
            >
              {candidates.map((candidate, index) => (
                <CandidateRow
                  key={getCandidateId(candidate, index)}
                  id={getCandidateId(candidate, index)}
                  name={candidate.providerName}
                  index={index}
                  budget={candidate.budget}
                  isDivider={isDivider(candidate)}
                  isBelowDivider={isBelowDivider(candidate)}
                  isLastRow={index === candidates.length - 1}
                  budgetType={candidate.budgetType}
                  onBudgetSelect={(type) =>
                    onBudgetSelect(candidate.providerName, type)
                  }
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </div>
    </DndContext>
  );
}
