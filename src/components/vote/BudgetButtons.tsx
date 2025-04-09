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
    <div className="flex gap-0">
      <button
        className={`
          rounded-md flex items-center justify-center w-full my-1 border px-2 py-1
          ${
            isBelowDivider
              ? "bg-transparent border-gray-700 text-gray-500"
              : basicBudget.selected
              ? "bg-slate-50 text-black hover:bg-slate-100"
              : "border-gray-700 bg-stone-900 text-gray-100"
          }
          ${extendedBudget ? "rounded-r-none" : ""}
          transition-all duration-200 ease-in-out
        `}
        onClick={() => onBudgetSelect("basic")}
        disabled={isBelowDivider}
      >
        <Check
          className={`w-4 h-4 mr-3 transition-opacity duration-200 hidden sm:block
            ${
              isBelowDivider || !basicBudget.selected
                ? "opacity-0"
                : "opacity-100"
            }
          `}
        />
        <span className="hidden sm:block">Basic</span>{": "}
        {formatCurrency(basicBudget.value)}
      </button>
      {extendedBudget && (
        <button
          className={`
            rounded-md rounded-l-none flex items-center justify-center w-full my-1 border px-2 py-1
            transition-all duration-200 ease-in-out
            ${
              isBelowDivider
                ? "bg-transparent border-gray-700 text-gray-500 border-l-0"
                : extendedBudget?.selected
                ? "bg-slate-50 text-black hover:bg-slate-100"
                : "border-gray-700 bg-stone-900 text-gray-100"
            }
          `}
          onClick={() => onBudgetSelect("extended")}
          disabled={isBelowDivider}
        >
          <Check
            className={`w-4 h-4 mr-3 transition-opacity duration-200 hidden sm:block
              ${
                isBelowDivider || !extendedBudget?.selected
                  ? "opacity-0"
                  : "opacity-100"
              }
            `}
          />
          <span className="hidden sm:block">Extended</span>{": "}
          {formatCurrency(extendedBudget.value)}
        </button>
      )}
    </div>
  );
}
