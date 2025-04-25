import { DragHandleIcon } from "./DragHandleIcon";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CandidateRowProps {
  name: string;
  index: number;
  budget: number;
  isDivider: boolean;
  isBelowDivider: boolean;
  isLastRow: boolean;
  onBudgetSelect: (type: "basic" | "extended") => void;
  id?: string;
  budgetType?: "basic" | "extended" | "none";
}

export function CandidateRow({
  name,
  index,
  budget,
  isDivider,
  isBelowDivider,
  isLastRow,
  onBudgetSelect,
  id,
  budgetType,
}: CandidateRowProps) {
  // Setup drag and drop functionality
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: id || `${name}-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Format the budget as currency
  const formatBudget = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format the display name to include budget type
  const displayName = isDivider
    ? name
    : budgetType && budgetType !== "none"
    ? `${name} - ${budgetType}`
    : name;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`
        ${isDivider ? "bg-red-900/20" : "bg-stone-950"}
        ${!isLastRow && "border-b border-gray-700"}
        ${isDragging && "z-10"}
      `}
    >
      {/* Drag handle column */}
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

      {/* Candidate name column */}
      <td className="p-0 md:p-4">
        <div className="flex items-center">
          {/* Index number (only for ranked candidates) */}
          {!isDivider && !isBelowDivider && (
            <div className="w-6 h-6 rounded-full bg-stone-900 flex items-center justify-center mr-1 sm:mr-3">
              {index + 1}
            </div>
          )}

          {/* Candidate name with appropriate styling */}
          <div
            className={`overflow-hidden text-ellipsis whitespace-nowrap max-w-[100px] w-full sm:max-w-full ${
              isBelowDivider ? "text-gray-500" : ""
            }`}
          >
            {isDivider ? (
              <span className="text-red-500 whitespace-nowrap">
                {displayName}
              </span>
            ) : (
              displayName
            )}
            {isDivider && (
              <span className="text-sm text-gray-500 ml-2">
                (candidates below won&apos;t count)
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Budget column */}
      <td className={`p-4 ${isBelowDivider ? "text-gray-500" : ""} text-right`}>
        {!isDivider && formatBudget(budget)}
      </td>
    </tr>
  );
}
