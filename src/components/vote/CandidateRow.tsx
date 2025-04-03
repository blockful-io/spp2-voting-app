import { DragHandleIcon } from "./DragHandleIcon";
import { BudgetButtons } from "./BudgetButtons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CandidateRowProps {
  name: string;
  index: number;
  basicBudget: number;
  extendedBudget: number;
  budgetType?: "basic" | "extended";
  isDivider: boolean;
  isBelowDivider: boolean;
  isLastRow: boolean;
  onBudgetSelect: (type: "basic" | "extended") => void;
}

export function CandidateRow({
  name,
  index,
  basicBudget,
  extendedBudget,
  budgetType,
  isDivider,
  isBelowDivider,
  isLastRow,
  onBudgetSelect,
}: CandidateRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`
        ${isDivider ? "bg-red-900/20" : "bg-dark"}
        ${!isLastRow && "border-b border-gray-700"}
        ${isDragging ? "z-10" : ""}
      `}
    >
      <td className="p-4">
        <div className="flex items-center">
          <div
            className="text-gray-500 cursor-move"
            {...attributes}
            {...listeners}
          >
            <DragHandleIcon />
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center">
          {!isDivider && !isBelowDivider && (
            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center mr-3">
              {index + 1}
            </div>
          )}
          <div className={`${isBelowDivider ? "text-gray-500" : ""}`}>
            {isDivider ? <span className="text-red-500">{name}</span> : name}
            {isDivider && (
              <span className="text-sm text-gray-500 ml-2">
                (candidates below won&apos;t count)
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="p-4">
        {!isDivider && (
          <BudgetButtons
            basicBudget={basicBudget}
            extendedBudget={extendedBudget}
            budgetType={budgetType}
            isBelowDivider={isBelowDivider}
            onBudgetSelect={onBudgetSelect}
          />
        )}
      </td>
    </tr>
  );
}
