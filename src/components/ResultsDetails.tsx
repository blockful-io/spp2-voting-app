import { HeadToHeadMatch } from "@/utils/voteProcessing";

import { X, Trophy, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { Allocation } from "@/utils/types";
import { parseChoiceName } from "@/utils/parseChoiceName";
import cc from "classcat";
import { useState, useEffect } from "react";
import { Web3Provider } from "@ethersproject/providers";
import { filterHeadToHeadMatches } from "@/utils/candidateComparisons";
import { BasicBadge, ExtendedBadge } from "@/components/Badges";

// Cache for ENS names to avoid redundant lookups
const ensCache: Record<string, string | null> = {};

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
  const [ensNames, setEnsNames] = useState<Record<string, string | null>>({});
  const [provider, setProvider] = useState<Web3Provider | null>(null);

  const headToHeadResults = filterHeadToHeadMatches(
    data.headToHeadMatches,
    candidateName
  );

  // Initialize provider when component mounts
  useEffect(() => {
    if (window.ethereum) {
      setProvider(new Web3Provider(window.ethereum));
    }
  }, []);

  // Resolve ENS names for addresses
  useEffect(() => {
    if (!provider || !headToHeadResults) return;

    const { matches } = headToHeadResults;

    async function resolveEnsNames() {
      const addresses: string[] = [];

      // Collect all unique addresses from expanded matches
      expandedMatches.forEach((index) => {
        const match = matches[index];
        if (!match) return;

        match.choice1.voters.forEach((voter: { voter: string; vp: number }) => {
          if (!ensCache[voter.voter] && !addresses.includes(voter.voter)) {
            addresses.push(voter.voter);
          }
        });

        match.choice2.voters.forEach((voter: { voter: string; vp: number }) => {
          if (!ensCache[voter.voter] && !addresses.includes(voter.voter)) {
            addresses.push(voter.voter);
          }
        });
      });

      // If no addresses to resolve, don't continue
      if (addresses.length === 0) return;

      // Lookup ENS names for all collected addresses
      const newEnsNames: Record<string, string | null> = { ...ensNames };

      await Promise.all(
        addresses.map(async (address) => {
          try {
            if (provider) {
              const ensName = await provider.lookupAddress(address);
              newEnsNames[address] = ensName;
              ensCache[address] = ensName; // Cache the result
            }
          } catch (error) {
            console.error(`Error resolving ENS for ${address}:`, error);
            newEnsNames[address] = null;
            ensCache[address] = null; // Cache the failure
          }
        })
      );

      setEnsNames(newEnsNames);
    }

    resolveEnsNames();
  }, [expandedMatches, provider, headToHeadResults, ensNames]);

  const toggleMatchExpand = (index: number) => {
    if (expandedMatches.includes(index)) {
      setExpandedMatches(expandedMatches.filter((i) => i !== index));
    } else {
      setExpandedMatches([...expandedMatches, index]);
    }
  };

  const truncateAddress = (address: string) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const getDisplayName = (address: string) => {
    // Return ENS name if available, otherwise return truncated address
    return ensNames[address] || ensCache[address] || truncateAddress(address);
  };

  const parsedChoice = parseChoiceName(candidateName);

  // Helper function to detect budget type from name
  const getBudgetType = (name: string) => {
    if (name.endsWith("- basic")) return "basic";
    if (name.endsWith("- ext")) return "extended";
    return null;
  };

  // Extract base name without budget type suffix
  const getBaseName = (name: string) => {
    return name.replace(/ - (basic|ext)$/, "");
  };

  if (!headToHeadResults) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="text-red-400">Candidate not found</div>
        </div>
      </div>
    );
  }

  const { matches, wins, losses } = headToHeadResults;

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

      {/* Head-to-head Match Results */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-100">
          Head-to-head Match Results
        </h3>
        <div className="space-y-3">
          {matches.map((match: HeadToHeadMatch, index: number) => {
            const isExpanded = expandedMatches.includes(index);
            const choice1BudgetType = getBudgetType(match.choice1.name);
            const choice2BudgetType = getBudgetType(match.choice2.name);
            const choice1BaseName = getBaseName(match.choice1.name);
            const choice2BaseName = getBaseName(match.choice2.name);

            if (!match.isInternal)
              return (
                <div
                  key={index}
                  className="rounded-lg border border-lightDark bg-dark/50 p-4"
                >
                  {/* New Layout with names at top */}
                  <div className="flex justify-between mb-3">
                    {/* Left provider name */}
                    <div className="flex flex-col items-start">
                      <h4 className="text-m font-medium text-gray-100 mb-1 break-words max-w-[150px] sm:max-w-xs">
                        {choice1BaseName}
                      </h4>
                      <div className="flex items-center">
                        {choice1BudgetType === "basic" && <BasicBadge />}
                        {choice1BudgetType === "extended" && <ExtendedBadge />}
                      </div>
                    </div>

                    {/* Right provider name */}
                    <div className="flex flex-col items-end">
                      <h4 className="text-m font-medium text-gray-100 mb-1 break-words max-w-[150px] sm:max-w-xs text-right">
                        {choice2BaseName}
                      </h4>
                      <div className="flex items-center">
                        {choice2BudgetType === "basic" && <BasicBadge />}
                        {choice2BudgetType === "extended" && <ExtendedBadge />}
                      </div>
                    </div>
                  </div>

                  {/* Vote results in the middle */}
                  <div className="flex items-center justify-between mb-3 px-2">
                    {/* Left votes with trophy if winner */}
                    <div className="flex items-center">
                      {match.winner.includes(match.choice1.name) && (
                        <Trophy className="text-emerald-500 h-5 w-5 mr-2" />
                      )}
                      <span
                        className={`text-m font-semibold ${
                          match.winner.includes(match.choice1.name)
                            ? "text-emerald-500"
                            : "text-gray-400"
                        }`}
                      >
                        {Math.round(match.choice1.totalVotes).toLocaleString()}
                      </span>
                    </div>

                    {/* VS indicator */}
                    <span className="text-gray-400 mx-4">vs</span>

                    {/* Right votes with trophy if winner */}
                    <div className="flex items-center">
                      <span
                        className={`text-m font-semibold ${
                          match.winner.includes(match.choice2.name)
                            ? "text-blue-500"
                            : "text-gray-400"
                        }`}
                      >
                        {Math.round(match.choice2.totalVotes).toLocaleString()}
                      </span>
                      {match.winner.includes(match.choice2.name) && (
                        <Trophy className="text-blue-500 h-5 w-5 ml-2" />
                      )}
                    </div>

                    {/* Toggle button moved to the very right */}
                    <button
                      className="ml-4 p-1 rounded-full hover:bg-gray-700 transition-colors"
                      onClick={() => toggleMatchExpand(index)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-dark">
                    <div className="relative h-full w-full">
                      <div className="absolute h-full w-full bg-blue-500" />
                      <div
                        className={`absolute h-full ${
                          match.winner !== match.choice2.name
                            ? "bg-emerald-500"
                            : "bg-blue-500"
                        }`}
                        style={{
                          width: `${
                            (match.choice1.totalVotes / match.totalVotes) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-lightDark">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex flex-col md:flex-row">
                          {/* Left side - Candidate 1 Voters */}
                          <div className="flex-1 mb-4 md:mb-0">
                            <h4 className="text-sm font-medium text-gray-300 mb-2">
                              {match.choice1.name} (
                              {match.choice1.voters.length})
                            </h4>
                            <div className="max-h-40 overflow-y-auto">
                              {match.choice1.voters.length > 0 ? (
                                <ul className="space-y-1">
                                  {match.choice1.voters.map((voter, i) => (
                                    <li
                                      key={i}
                                      className="text-xs flex items-center"
                                    >
                                      <button
                                        onClick={() =>
                                          copyToClipboard(voter.voter)
                                        }
                                        className="flex items-center text-gray-400 hover:text-gray-300 transition-colors flex-1 min-w-0"
                                        title={voter.voter}
                                      >
                                        <span className="font-mono truncate">
                                          {getDisplayName(voter.voter)}
                                        </span>
                                        {copiedAddress === voter.voter ? (
                                          <Check className="h-3 w-3 ml-1 text-green-500 flex-shrink-0" />
                                        ) : (
                                          <Copy className="h-3 w-3 ml-1 opacity-50 flex-shrink-0" />
                                        )}
                                      </button>
                                      <span className="text-gray-300 ml-auto text-right w-14 md:w-16 mr-2 md:mr-4">
                                        {Math.round(voter.vp).toLocaleString()}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs text-gray-500">
                                  No voters
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right side - Candidate 2 Voters */}
                          <div className="flex-1 md:pl-4 md:border-l border-lightDark">
                            <h4 className="text-sm font-medium text-gray-300 mb-2 md:text-right">
                              {match.choice2.name} (
                              {match.choice2.voters.length})
                            </h4>
                            <div className="max-h-40 overflow-y-auto">
                              {match.choice2.voters.length > 0 ? (
                                <ul className="space-y-1">
                                  {match.choice2.voters.map((voter, i) => (
                                    <li
                                      key={i}
                                      className="text-xs flex items-center md:justify-end"
                                    >
                                      <span className="text-gray-300 mr-auto md:ml-0 text-left w-14 md:w-16 order-2 md:order-1">
                                        {Math.round(voter.vp).toLocaleString()}
                                      </span>
                                      <button
                                        onClick={() =>
                                          copyToClipboard(voter.voter)
                                        }
                                        className="flex items-center text-gray-400 hover:text-gray-300 transition-colors flex-1 min-w-0 md:justify-end order-1 md:order-2"
                                        title={voter.voter}
                                      >
                                        {copiedAddress === voter.voter ? (
                                          <Check className="h-3 w-3 mr-1 md:mr-1 ml-1 md:ml-0 order-last md:order-first text-green-500 flex-shrink-0" />
                                        ) : (
                                          <Copy className="h-3 w-3 mr-1 md:mr-1 ml-1 md:ml-0 order-last md:order-first opacity-50 flex-shrink-0" />
                                        )}
                                        <span className={"font-mono truncate"}>
                                          {getDisplayName(voter.voter)}
                                        </span>
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs text-gray-500 md:text-right">
                                  No voters
                                </p>
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
