import { Check } from "lucide-react";

interface BudgetButtonsProps {
  basicBudget: number;
  extendedBudget: number;
  budgetType?: "basic" | "extended";
  isBelowDivider: boolean;
  onBudgetSelect: (type: "basic" | "extended") => void;
}

export function BudgetButtons({
  basicBudget,
  extendedBudget,
  budgetType,
  isBelowDivider,
  onBudgetSelect,
}: BudgetButtonsProps) {
  const formatCurrency = (amount: number) => {
    return `$${(amount / 1000).toFixed(0)}k`;
  };

  return (
    <div className="flex">
      <button
        className={`
          rounded-l flex items-center justify-center w-full my-1 border
          ${
            isBelowDivider
              ? "bg-transparent border-gray-700 text-gray-500"
              : budgetType === "basic"
              ? "bg-slate-50 text-black hover:bg-slate-100"
              : "border-gray-700 bg-dark text-gray-100"
          }
        `}
        onClick={() => onBudgetSelect("basic")}
        disabled={isBelowDivider}
      >
        <Check
          className={`w-4 h-4 mr-2 
            ${(isBelowDivider || budgetType !== "basic") && "invisible"}
          `}
        />
        Basic: {formatCurrency(basicBudget)}
      </button>
      <button
        className={`
          rounded-r flex items-center justify-center w-full my-1 border
          ${
            isBelowDivider
              ? "bg-transparent border-gray-700 text-gray-500 border-l-0"
              : budgetType === "extended"
              ? "bg-slate-50 text-black hover:bg-slate-100"
              : " border-gray-700 bg-dark text-gray-100"
          }
        `}
        onClick={() => onBudgetSelect("extended")}
        disabled={isBelowDivider}
      >
        <Check
          className={`w-4 h-4 mr-2 
            ${(isBelowDivider || budgetType !== "extended") && "invisible"}
          `}
        />
        Extended: {formatCurrency(extendedBudget)}
      </button>
    </div>
  );
}
