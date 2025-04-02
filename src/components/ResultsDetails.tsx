import { useState } from "react";

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

  const budgetData = {
    basic: {
      label: "Basic ($500k)",
      votes: 265500,
    },
    extended: {
      label: "Extended ($700k)",
      votes: 98500,
    },
  };

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
    <div className="h-full p-6">
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
        <div className="flex gap-4">
          {Object.entries(budgetData).map(([key, data]) => (
            <button
              key={key}
              onClick={() => setSelectedBudget(key as "basic" | "extended")}
              className={`flex-1 rounded-lg border p-4 ${
                selectedBudget === key
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-lightDark bg-dark/50"
              }`}
            >
              <div className="mb-2 text-sm font-medium text-gray-300">
                {data.label}
              </div>
              <div className="text-xl font-bold text-gray-100">
                {data.votes.toLocaleString()}
              </div>
            </button>
          ))}
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
              className="flex items-center justify-between rounded-lg border border-lightDark bg-dark/50 p-4"
            >
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
          ))}
        </div>
        <div className="mt-4 text-right text-sm text-gray-400">
          21 wins / 4 losses
        </div>
      </div>
    </div>
  );
}
