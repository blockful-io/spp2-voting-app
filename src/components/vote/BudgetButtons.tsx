import { Check } from "lucide-react";
import { Budget } from "@/hooks/useEnsElectionData";

interface BudgetButtonsProps {
  basicBudget: Budget;
  extendedBudget?: Budget;
  isBelowDivider: boolean;
  onBudgetSelect: (type: "basic" | "extended") => void;
}

export function BudgetButtons({
  basicBudget,
  extendedBudget,
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
              : basicBudget.selected
              ? "bg-slate-50 text-black hover:bg-slate-100"
              : "border-gray-700 bg-stone-900 text-gray-100"
          }
        `}
        onClick={() => onBudgetSelect("basic")}
        disabled={isBelowDivider}
      >
        <Check
          className={`w-4 h-4 mr-2 
            ${(isBelowDivider || !basicBudget.selected) && "invisible"}
          `}
        />
        Basic: {formatCurrency(basicBudget.value)}
      </button>
      <button
        className={`
          rounded-r flex items-center justify-center w-full my-1 border
          ${
            isBelowDivider
              ? "bg-transparent border-gray-700 text-gray-500 border-l-0"
              : !extendedBudget
              ? "text-gray-600"
              : extendedBudget?.selected
              ? "bg-slate-50 text-black hover:bg-slate-100"
              : "border-gray-700 bg-stone-900 text-gray-100"
          }
        `}
        onClick={() => onBudgetSelect("extended")}
        disabled={isBelowDivider || !extendedBudget}
      >
        <Check
          className={`w-4 h-4 mr-2 
            ${(isBelowDivider || !extendedBudget?.selected) && "invisible"}
            
          `}
        />
        Extended: {extendedBudget ? formatCurrency(extendedBudget.value) : "-"}
      </button>
    </div>
  );
}
