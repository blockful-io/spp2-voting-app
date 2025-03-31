import { Card } from "@/components/ui/card";
import { useSnapshotProposal } from "../hooks/useSnapshotVotes";

export function VoteList() {
  const { proposals, isLoading, isError, isFetching } = useSnapshotProposal();

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;
  if (isFetching) return <div>Fetching...</div>;

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-2">
      {proposals.map((prop) => (
        <Card key={prop.id} className="overflow-hidden gap-0">
          <div className="flex flex-col">
            <div className="w-full h-14 flex items-center justify-center font-medium text-lg">
              {prop.title}
            </div>
            <div className="w-full max-w-md mx-auto space-y-2">
              {prop.scores.map((result, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="flex">
                    <div className="w-16 h-14 bg-gray-200 flex items-center justify-center font-medium text-lg">
                      {result === 0
                        ? "0"
                        : result < 0.001
                        ? "~0"
                        : result.toFixed(3)}
                    </div>
                    <div className="flex-1 flex items-center justify-end">
                      <div className="text-right">
                        <span className="font-medium">
                          {result === 0
                            ? "0"
                            : result < 0.001
                            ? "~0"
                            : result.toFixed(3)}
                        </span>
                        {/* <span className="ml-2">
                          {result.percentage === 0
                            ? "0"
                            : result.percentage < 0.01
                            ? "<0.01"
                            : result.percentage.toFixed(2)}
                          %
                        </span> */}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
