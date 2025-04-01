"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, ChevronUp, ChevronDown } from "lucide-react";

import Navbar from "../components/navbar";
import {
  Candidate,
  useGetProposals,
  useVoteOnProposals,
} from "../hooks/useSnapshot";
import { useEffect, useState } from "react";

export default function Votes() {
  const { proposal, isLoading, isError, isFetching } = useGetProposals();
  const { voteFunc } = useVoteOnProposals();

  const [orderedItems, setOrderedItems] = useState<Candidate[]>([]);

  useEffect(() => {
    if (proposal)
      setOrderedItems(() => [
        ...proposal.raking,
        // {
        //   name: "None of the below",
        //   basicBudget: 0,
        //   score: 0,
        //   extendedBudget: 0,
        //   streamDuration: "Not Eligible",
        //   id: proposal.raking.length + 1,
        // },
      ]);
  }, [proposal]);

  async function submitVote() {
    const choices = orderedItems.map(({ id }) => id);
    await voteFunc(choices);
  }

  // Move an item up in the list
  const moveUp = (index: number) => {
    if (index === 0) return; // Already at the top

    const newItems = [...orderedItems];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    setOrderedItems(newItems);
  };

  // Move an item down in the list
  const moveDown = (index: number) => {
    if (index === orderedItems.length - 1) return; // Already at the bottom

    const newItems = [...orderedItems];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    setOrderedItems(newItems);
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError || !proposal) return <div>Error</div>;
  if (isFetching) return <div>Fetching...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Rank Your Preferences</h2>
            <p className="text-gray-600">
              Drag candidates up or down to rank them in your preferred order.
              Any candidates below &quot;None of the below&quot; will not be
              counted.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="p-4 bg-blue-50 border-b border-blue-100">
              <h3 className="font-medium text-blue-800">Instructions</h3>
              <p className="text-sm text-blue-700 mt-1">
                Use the arrows to reorder candidates. Your most preferred
                candidate should be at the top. Any candidates below &quot;None
                of the below&quot; will not be counted in your vote.
              </p>
            </div>

            <ul className="divide-y divide-gray-200">
              {orderedItems.map((candidate, index) => (
                <li
                  key={index}
                  className={`p-4 flex items-center `}
                  // ${id === "none" ? "bg-gray-100" : ""}
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900 mr-2">
                        {index + 1}.
                      </span>
                      <span
                        className={`font-medium`}
                        //  ${
                        //   candidate.id === "none"
                        //     ? "text-red-600"
                        //     : "text-gray-900"
                        // }`}
                      >
                        {candidate.name}
                      </span>
                    </div>

                    {/* {candidate.id !== "none" && (
                      <div className="mt-1 text-sm text-gray-500 grid grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium">Basic:</span>{" "}
                          {formatCurrency(candidate.basicBudget)}
                        </div>
                        <div>
                          <span className="font-medium">Extended:</span>{" "}
                          {formatCurrency(candidate.extendedBudget)}
                        </div>
                      </div>
                    )} */}
                  </div>

                  <div className="flex flex-col space-y-1 ml-4">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move up"
                    >
                      <ChevronUp size={20} />
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === orderedItems.length - 1}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move down"
                    >
                      <ChevronDown size={20} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end">
            <Button onClick={submitVote} className="flex items-center gap-2">
              <Save size={16} />
              Submit Vote
            </Button>
          </div>

          <Card className="mt-8 p-4 bg-yellow-50 border-yellow-200">
            <h3 className="font-medium text-yellow-800">Important Note</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Once submitted, your vote cannot be changed. Please review your
              ranking carefully before submitting.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
