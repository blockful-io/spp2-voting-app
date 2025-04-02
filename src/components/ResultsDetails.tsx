import { useState } from "react";
import { BarChart, Bar, ResponsiveContainer } from "recharts";

interface ResultsDetailsProps {
  onClose: () => void;
}

interface HeadToHeadResult {
  candidate: string;
  votes: number;
  winner: boolean;
}

export function ResultsDetails({ onClose }: ResultsDetailsProps) {
  const [selectedBudget, setSelectedBudget] = useState<"basic" | "extended">(
    "basic"
  );

  const budgetData = [
    {
      name: "Budget",
      basic: 265500,
      extended: 98500,
    },
  ];

  const matchResults: HeadToHeadResult[] = [
    { candidate: "Blockful", votes: 100500, winner: true },
    { candidate: "Namespace", votes: 120500, winner: true },
    { candidate: "NameStone", votes: 120500, winner: false },
    { candidate: "Lighthouse Labs", votes: 100500, winner: true },
    { candidate: "Unicorn.eth", votes: 120500, winner: false },
    { candidate: "GovPal", votes: 120500, winner: false },
    { candidate: "Web3.bio", votes: 100500, winner: true },
    { candidate: "Tally", votes: 100500, winner: true },
  ];

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-100">Results Details</h2>
        <button
          onClick={onClose}
          className="text-2xl text-gray-400 hover:text-gray-200"
        >
          ×
        </button>
      </div>

      {/* Preferred Budget Section */}
      <div className="mb-12">
        <h3 className="mb-4 text-lg font-semibold text-gray-100">
          Preferred Budget
        </h3>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-blue-400">Basic ($500k)</span>
              <span className="text-xl">🏆</span>
            </div>
            <span className="text-gray-400">Extended ($700k)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-semibold text-gray-300">
              265,500
            </span>
            <span className="text-2xl font-semibold text-gray-500">98,500</span>
          </div>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-600">
          <div className="relative h-full w-full">
            <div
              className="absolute h-full bg-blue-500"
              style={{
                width: `${(265500 / (265500 + 98500)) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Head-to-head Match Results */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-100">
          Head-to-head Match Results
        </h3>
        <div className="space-y-3">
          {matchResults.map((result, index) => (
            <div
              key={index}
              className="rounded-lg border border-lightDark bg-dark/50 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-gray-300">
                    {result.votes.toLocaleString()}
                  </span>
                  <span className="text-gray-100">{result.candidate}</span>
                </div>
                {result.winner ? (
                  <span className="flex items-center gap-2 text-emerald-500">
                    <span className="text-xl">🏆</span>
                    {(result.votes * 3).toLocaleString()}
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-gray-500">
                    ⨯ {(result.votes / 2).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="h-[6px] w-full overflow-hidden rounded-full bg-dark">
                <div className="relative h-full w-full">
                  <div className="absolute h-full w-full bg-gray-600" />
                  <div
                    className="absolute h-full bg-emerald-500"
                    style={{
                      width: result.winner
                        ? `${(result.votes / (result.votes * 3)) * 100}%`
                        : `${(result.votes / (result.votes * 2)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-right text-sm text-gray-400">
          21 wins / 4 losses
        </div>
      </div>
    </div>
  );
}
