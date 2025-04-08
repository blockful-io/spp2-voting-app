import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { type BudgetData, type BudgetLegendItem } from "@/types/election";

interface AllocatedBudgetProps {
  budgetData: BudgetData[];
  legendItems: BudgetLegendItem[];
  totalBudget: number;
}

export function AllocatedBudget({
  budgetData,
  legendItems,
  totalBudget,
}: AllocatedBudgetProps) {
  const totalAllocated =
    budgetData[0].oneYear +
    budgetData[0].twoYears +
    budgetData[0].oneYearRemaining +
    budgetData[0].twoYearsRemaining;
  const formattedTotal = (totalAllocated / 1_000_000).toFixed(1);
  const formattedBudget = (totalBudget / 1_000_000).toFixed(1);

  return (
    <div className="rounded-lg border border-lightDark bg-dark p-6">
      <h2 className="mb-8 text-lg font-semibold text-gray-100">
        ALLOCATED BUDGET
      </h2>
      <div className="mb-6">
        <div className="flex items-baseline gap-3">
          <span className="text-xl font-bold leading-none text-gray-100">
            ${formattedTotal}M
          </span>
          <span className="text-lg text-gray-500">
            / ${formattedBudget}M total
          </span>
        </div>
      </div>
      <div className="mb-6 h-[24px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={budgetData}
            layout="vertical"
            stackOffset="none"
            barSize={24}
          >
            <XAxis type="number" domain={[0, totalBudget]} hide />
            <YAxis type="category" dataKey="name" hide />
            <Bar dataKey="oneYear" stackId="stack" fill="#3B82F6" />
            <Bar dataKey="twoYears" stackId="stack" fill="#EC4899" />
            <Bar dataKey="oneYearRemaining" stackId="stack" fill="#93C5FD" />
            <Bar dataKey="twoYearsRemaining" stackId="stack" fill="#F9A8D4" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {legendItems.map((item, index) => (
          <div key={index} className="flex flex-col">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-base text-gray-300">{item.label}</span>
            </div>
            {item.subtext && (
              <span className="ml-5 mt-1 text-sm text-gray-500">
                {item.subtext}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
