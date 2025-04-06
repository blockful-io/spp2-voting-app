import { CandidateRow } from "./CandidateRow";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
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
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useCallback } from "react";

// Define a type for our vote page candidates
export interface VoteCandidate {
  id: number;
  name: string;
  basicBudget: number;
  extendedBudget: number;
  budgetType?: "basic" | "extended";
}

interface VoteTableProps {
  candidates: VoteCandidate[];
  onBudgetSelect: (
    name: string,
    type: "basic" | "extended" | undefined
  ) => void;
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

  const isDivider = (candidate: VoteCandidate) => {
    return candidate.name === "None below";
  };

  const isBelowDivider = (candidate: VoteCandidate) => {
    return (
      candidates.findIndex((c) => c.name === "None below") <
      candidates.findIndex((c) => c.name === candidate.name)
    );
  };

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      onDragStart?.();
    },
    [onDragStart]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      debugger;

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
      <div className="mt-2 border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-gray-400 p-4 w-[50px]"></th>
              <th className="text-left text-gray-400 p-4">CANDIDATE</th>
              <th className="text-left text-gray-400 p-4">PREFERRED BUDGET</th>
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
                  basicBudget={candidate.basicBudget}
                  extendedBudget={candidate.extendedBudget}
                  budgetType={candidate.budgetType}
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
