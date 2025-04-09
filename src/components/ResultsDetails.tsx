import { HeadToHeadMatch } from "@/utils/voteProcessing";
import {
  FormattedMatch,
  getCandidateHeadToHead,
} from "@/utils/candidateComparisons";
import { X, Trophy, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { Allocation } from "@/utils/types";
import { parseChoiceName } from "@/utils/parseChoiceName";
import cc from "classcat";
import { useState } from "react";

interface ResultsDetailsProps {
  candidateName: string;
  onClose: () => void;
  data: {
    headToHeadMatches: HeadToHeadMatch[];
    allocations: Allocation[];
  };
}

export function ResultsDetails({
  candidateName,
  onClose,
  data,
}: ResultsDetailsProps) {
  const [expandedMatches, setExpandedMatches] = useState<number[]>([]);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const toggleMatchExpand = (index: number) => {
    if (expandedMatches.includes(index)) {
      setExpandedMatches(expandedMatches.filter((i) => i !== index));
    } else {
      setExpandedMatches([...expandedMatches, index]);
    }
  };

  const truncateAddress = (address: string) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const headToHeadResults = getCandidateHeadToHead(
    {
      headToHeadMatches: data.headToHeadMatches,
      candidates: data.allocations,
    },
    candidateName
  );

  const parsedChoice = parseChoiceName(candidateName);

  // Find the head-to-head match between basic and extended versions
  const basicVsExtMatch = data.headToHeadMatches.find(
    (match) =>
      match.candidate1 === `${parsedChoice.name} - basic` &&
      match.candidate2 === `${parsedChoice.name} - ext`
  );

  // Find the allocation data for the parsed choice name
  const allocationData = data.allocations.find(
    (allocation) => allocation.name === parsedChoice.name
  );

  if (!headToHeadResults) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="text-red-400">Candidate not found</div>
        </div>
      </div>
    );
  }

  const { matches, budget, wins, losses } = headToHeadResults;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-100">Results Details</h2>
        <button
          onClick={onClose}
          className="text-2xl text-gray-400 hover:text-gray-200"
        >
          <X size={24} />
        </button>
      </div>

      {/* Preferred Budget */}
      <div className="mb-8">
        <h3 className="mb-4 text-lg font-semibold text-gray-100">
          Preferred Budget
        </h3>
        <div className="rounded-lg border border-lightDark bg-dark/50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Basic (${(budget.basic.amount / 1000).toFixed(0)}k)</span>
              {budget.basic.selected && <span>🏆</span>}
            </div>
            <div className="flex items-center gap-2">
              {budget.extended.selected && <span>🏆</span>}
              <span>
                Extended (${(budget.extended.amount / 1000).toFixed(0)}k)
              </span>
            </div>
          </div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-2xl font-semibold">
              {Math.round(
                basicVsExtMatch?.candidate1Votes ||
                  allocationData?.averageSupport ||
                  0
              ).toLocaleString()}
            </span>
            <span className="text-2xl font-semibold">
              {Math.round(
                basicVsExtMatch?.candidate2Votes || 0
              ).toLocaleString()}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-dark">
            <div className="relative h-full w-full">
              <div className="absolute h-full w-full bg-emerald-500" />
              <div
                className="absolute h-full bg-blue-500 right-0"
                style={{
                  width: `${
                    ((basicVsExtMatch?.candidate2Votes || 0) /
                      (basicVsExtMatch?.totalVotes || 0)) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Head-to-head Match Results */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-100">
          Head-to-head Match Results
        </h3>
        <div className="space-y-3">
          {matches.map((match: FormattedMatch, index: number) => {
            const isExpanded = expandedMatches.includes(index);
            
            if (!match.isInternal)
              return (
                <div
                  key={index}
                  className="rounded-lg border border-lightDark bg-dark/50 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center flex-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-100">
                            {match.candidate1.name}
                          </span>
                          {match.winner.includes(match.candidate1.name) && (
                            <Trophy className="text-emerald-500 h-4 w-4" />
                          )}
                          <span
                            className={cc([
                              match.winner.includes(match.candidate1.name)
                                ? "text-emerald-500"
                                : "text-gray-400",
                            ])}
                          >
                            {Math.round(
                              match.candidate1.candidateVotes
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="px-4">
                        <span className="text-gray-400">vs</span>
                      </div>
                      <div className="flex-1 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {match.winner.includes(match.candidate2.name) && (
                            <Trophy className="text-blue-500 h-4 w-4" />
                          )}
                          <span
                            className={cc([
                              match.winner.includes(match.candidate2.name)
                                ? "text-blue-500"
                                : "text-gray-400",
                            ])}
                          >
                            {Math.round(
                              match.candidate2.candidateVotes
                            ).toLocaleString()}
                          </span>

                          <span className="text-gray-100">
                            {match.candidate2.name}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      className="ml-2 p-1 rounded-full hover:bg-gray-700 transition-colors"
                      onClick={() => toggleMatchExpand(index)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  
                  <div className="h-2 w-full overflow-hidden rounded-full bg-dark">
                    <div className="relative h-full w-full">
                      <div className="absolute h-full w-full bg-blue-500" />
                      <div
                        className={`absolute h-full ${
                          match.winner !== match.candidate2.name
                            ? "bg-emerald-500"
                            : "bg-blue-500"
                        }`}
                        style={{
                          width: `${
                            (match.candidate1.candidateVotes /
                              match.totalVotes) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-lightDark">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex">
                          {/* Left side - Candidate 1 Voters */}
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-300 mb-2">
                              {match.candidate1.name} ({match.candidate1.voters.length})
                            </h4>
                            <div className="max-h-40 overflow-y-auto">
                              {match.candidate1.voters.length > 0 ? (
                                <ul className="space-y-1">
                                  {match.candidate1.voters.map((voter, i) => (
                                    <li key={i} className="text-xs flex items-center">
                                      <button 
                                        onClick={() => copyToClipboard(voter.voter)}
                                        className="flex items-center text-gray-400 hover:text-gray-300 transition-colors flex-1"
                                      >
                                        <span className="font-mono truncate">{truncateAddress(voter.voter)}</span>
                                        {copiedAddress === voter.voter ? (
                                          <Check className="h-3 w-3 ml-1 text-green-500 flex-shrink-0" />
                                        ) : (
                                          <Copy className="h-3 w-3 ml-1 opacity-50 flex-shrink-0" />
                                        )}
                                      </button>
                                      <span className="text-gray-300 ml-auto text-right w-16 mr-4">{Math.round(voter.vp).toLocaleString()}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs text-gray-500">No voters</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Right side - Candidate 2 Voters */}
                          <div className="flex-1 pl-4 border-l border-lightDark">
                            <h4 className="text-sm font-medium text-gray-300 mb-2 text-right">
                              {match.candidate2.name} ({match.candidate2.voters.length})
                            </h4>
                            <div className="max-h-40 overflow-y-auto">
                              {match.candidate2.voters.length > 0 ? (
                                <ul className="space-y-1">
                                  {match.candidate2.voters.map((voter, i) => (
                                    <li key={i} className="text-xs flex items-center justify-end">
                                      <span className="text-gray-300 mr-auto text-left w-16">{Math.round(voter.vp).toLocaleString()}</span>
                                      <button 
                                        onClick={() => copyToClipboard(voter.voter)}
                                        className="flex items-center text-gray-400 hover:text-gray-300 transition-colors flex-1 justify-end"
                                      >
                                        {copiedAddress === voter.voter ? (
                                          <Check className="h-3 w-3 mr-1 text-green-500 flex-shrink-0" />
                                        ) : (
                                          <Copy className="h-3 w-3 mr-1 opacity-50 flex-shrink-0" />
                                        )}
                                        <span className="font-mono truncate">{truncateAddress(voter.voter)}</span>
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs text-gray-500 text-right">No voters</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
          })}
        </div>
        <div className="mt-4 text-right text-sm text-gray-400">
          {wins} wins / {losses} losses
        </div>
      </div>
    </div>
  );
}
