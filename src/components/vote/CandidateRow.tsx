import { DragHandleIcon } from "./DragHandleIcon";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronUp, ChevronDown } from "lucide-react";
import { BasicBadge, ExtendedBadge, CombinedBadge } from "@/components/Badges";

interface CandidateRowProps {
  name: string;
  index: number;
  budget: number;
  isDivider: boolean;
  isBelowDivider: boolean;
  isLastRow: boolean;
  onBudgetSelect: (type: "basic" | "extended") => void;
  onToggleView?: () => void;
  id?: string;
  budgetType?: "basic" | "extended" | "none" | "combined";
  isCombined?: boolean;
  basicBudget?: number;
  extendedBudget?: number;
  isExpanded?: boolean;
  canToggle?: boolean;
}

export function CandidateRow({
  name,
  index,
  budget,
  isDivider,
  isBelowDivider,
  isLastRow,
  onBudgetSelect,
  onToggleView,
  id,
  budgetType,
  isCombined,
  basicBudget,
  extendedBudget,
  isExpanded,
  canToggle,
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
  const displayName = isDivider ? name : name;

  // Determine if the badge should be shown (only show Basic badge if candidate has both options)
  const showBasicBadge = budgetType === "basic" && canToggle;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`
        ${isDivider ? "bg-red-900/20" : isBelowDivider ? "bg-stone-950/70" : "bg-stone-950"}
        ${!isLastRow && "border-b border-gray-700"}
        ${isDragging && "z-10"}
        ${isBelowDivider && "opacity-70"}
      `}
    >
      {/* Drag handle column */}
      <td className="py-2 pr-2 md:py-4 md:pr-3">
        <div className="flex items-center justify-end h-full">
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
      <td className="py-2 px-1 md:py-4 md:px-2">
        <div className="flex items-center">
          {/* Index number (only for ranked candidates) */}
          {!isDivider && !isBelowDivider && (
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-stone-900 flex items-center justify-center mr-2 sm:mr-3 text-sm md:text-base shrink-0 self-center">
              {index + 1}
            </div>
          )}

          {/* Candidate name with appropriate styling */}
          <div
            className={`min-w-0 w-full ${
              isBelowDivider ? "text-gray-500" : ""
            }`}
          >
            {isDivider ? (
              <span className="text-red-500 whitespace-nowrap">
                {displayName}
              </span>
            ) : (
              <div>
                <div className="flex flex-col items-start">
                  <span className={`font-bold ${isBelowDivider ? "text-gray-400" : "text-white"}`}>{displayName}</span>
                  <div className="flex mt-1 pl-0">
                    {showBasicBadge && <BasicBadge />}
                    {budgetType === "extended" && <ExtendedBadge />}
                    {budgetType === "combined" && <CombinedBadge />}
                  </div>
                </div>
              </div>
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
      <td className={`py-2 px-1 md:p-4 ${isBelowDivider ? "text-gray-500" : ""}`}>
        <div className="flex items-center justify-end">
          {/* Budget amount with toggle - aligned to the right */}
          <div className="text-right mr-2 flex flex-col items-end">
            {!isDivider && !isCombined && (
              <span className={`font-bold ${isBelowDivider ? "text-gray-400" : "text-white"}`}>
                {formatBudget(budget)}
              </span>
            )}
            {!isDivider &&
              isCombined &&
              basicBudget !== undefined &&
              extendedBudget !== undefined && (
                <>
                  <div className={`font-bold ${isBelowDivider ? "text-gray-400" : "text-white"}`}>
                    {formatBudget(basicBudget + extendedBudget)}
                  </div>
                  {!isExpanded && (
                    <div className="text-xs text-gray-400 mt-1">
                      {formatBudget(basicBudget)} + {formatBudget(extendedBudget)}
                    </div>
                  )}
                </>
              )}
          </div>
          
          {/* Toggle button or empty space to maintain alignment */}
          <div className="w-6 flex justify-center">
            {canToggle ? (
              <button
                onClick={onToggleView}
                className="p-1 text-gray-400 hover:text-white focus:outline-none"
                title={isExpanded ? "Collapse view" : "Expand view"}
              >
                {isExpanded ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>
            ) : (
              <div className="w-6"></div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}
