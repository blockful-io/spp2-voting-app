import { VoteCandidate } from "@/hooks/useEnsElectionData";
import { CandidateRow } from "./CandidateRow";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  TouchSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useCallback } from "react";

interface VoteTableProps {
  candidates: VoteCandidate[];
  onBudgetSelect: (name: string, type: "basic" | "extended") => void;
  onReorder: (newOrder: VoteCandidate[]) => void;
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

  const isDivider = (candidate: VoteCandidate) =>
    candidate.name.toLowerCase().includes("below");

  const isBelowDivider = (candidate: VoteCandidate) => {
    return (
      candidates.findIndex((c) => c.name.toLowerCase().includes("below")) <
      candidates.findIndex((c) => c.name === candidate.name)
    );
  };

  const handleDragStart = useCallback(() => onDragStart?.(), [onDragStart]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (active.id !== over?.id) {
        const oldIndex = candidates.findIndex(
          (item) => item.name === active.id
        );
        const newIndex = candidates.findIndex((item) => item.name === over?.id);

        const newOrder = arrayMove(candidates, oldIndex, newIndex);
        onReorder(newOrder);
      }

      onDragEnd?.();
    },
    [candidates, onReorder, onDragEnd]
  );

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
              <th className="text-left text-gray-400 p-4">Preferred Budget</th>
            </tr>
          </thead>
          <tbody>
            <SortableContext
              items={candidates.map((c) => c.name)}
              strategy={verticalListSortingStrategy}
            >
              {candidates.map((candidate, index) => (
                <CandidateRow
                  key={candidate.name}
                  name={candidate.name}
                  index={index}
                  basicBudget={
                    candidate.budgets.find((b) => b.type === "basic")!
                  }
                  extendedBudget={candidate.budgets.find(
                    (b) => b.type === "extended"
                  )}
                  isDivider={isDivider(candidate)}
                  isBelowDivider={isBelowDivider(candidate)}
                  isLastRow={index === candidates.length - 1}
                  onBudgetSelect={(type) =>
                    onBudgetSelect(candidate.name, type)
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
