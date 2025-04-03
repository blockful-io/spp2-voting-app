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
          rounded-l flex items-center justify-center w-full my-1
          ${
            isBelowDivider
              ? "bg-transparent border border-gray-700 text-gray-500"
              : budgetType === "basic"
              ? "bg-slate-50 text-black hover:bg-slate-100"
              : "border border-gray-700 bg-dark text-gray-100"
          }
        `}
        onClick={() => onBudgetSelect("basic")}
        disabled={isBelowDivider}
      >
        {budgetType === "basic" && !isBelowDivider && (
          <Check className="w-4 h-4 mr-2" />
        )}
        Basic: {formatCurrency(basicBudget)}
      </button>
      <button
        className={`
          rounded-r flex items-center justify-center w-full my-1
          ${
            isBelowDivider
              ? "bg-transparent border border-gray-700 text-gray-500 border-l-0"
              : budgetType === "extended"
              ? "bg-slate-50 text-black hover:bg-slate-100"
              : "border border-gray-700 bg-dark text-gray-100"
          }
        `}
        onClick={() => onBudgetSelect("extended")}
        disabled={isBelowDivider}
      >
        {budgetType === "extended" && !isBelowDivider && (
          <Check className="w-4 h-4 mr-2" />
        )}
        Extended: {formatCurrency(extendedBudget)}
      </button>
    </div>
  );
}
