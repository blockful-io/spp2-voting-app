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
        // Extract indexes from the composite IDs
        const activeId = String(active.id);
        const overId = String(over?.id);

        const oldIndex = parseInt(activeId.split("-").pop() || "0");
        const newIndex = parseInt(overId.split("-").pop() || "0");

        // Reorder the candidates array
        const newOrder = arrayMove(candidates, oldIndex, newIndex);
        onReorder(newOrder);
      }

      onDragEnd?.();
    },
    [candidates, onReorder, onDragEnd]
  );

  // Generate unique ID for each candidate
  const getCandidateId = (candidate: Choice, index: number) =>
    `${candidate.providerName}-${candidate.budgetType}-${index}`;

  console.log("candidates", candidates);

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
