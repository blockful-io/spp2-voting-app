"use client";

import { useState, useEffect } from "react";
import { useAllVotes } from "@/hooks/useAllVotes";
import { useEnsElectionData } from "@/hooks/useEnsElectionData";
import { Vote } from "@/hooks/useVotes";
import Link from "next/link";
import { format } from "date-fns";
import { Choice, BudgetType } from "@/utils/types";
import { Web3Provider } from "@ethersproject/providers";
import { BasicBadge, ExtendedBadge } from "@/components/Badges";

// Sort options
type SortOption = "vp" | "created";

// Cache for ENS names to avoid redundant lookups (shared across the app)
const ensCache: Record<string, string | null> = {};

// Create utility function for address truncation
function truncateAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!address) return '';
  
  const start = address.substring(0, startChars);
  const end = address.substring(address.length - endChars);
  
  return `${start}...${end}`;
}

// Function to get display name
const getDisplayName = (address: string, ensNames: Record<string, string | null>) => {
  // Return ENS name if available, otherwise return truncated address
  return ensNames[address] || ensCache[address] || truncateAddress(address);
};

// A simple button group component for sort options
const SortButtons = ({ 
  activeSort, 
  onChange 
}: { 
  activeSort: SortOption; 
  onChange: (sort: SortOption) => void;
}) => {
  return (
    <div className="flex rounded-lg overflow-hidden text-xs sm:text-sm">
      <button
        className={`px-2 py-1 sm:px-3 sm:py-2 font-medium ${activeSort === 'vp' 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        onClick={() => onChange('vp')}
      >
        Voting Power
      </button>
      <button
        className={`px-2 py-1 sm:px-3 sm:py-2 font-medium ${activeSort === 'created' 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        onClick={() => onChange('created')}
      >
        Recent First
      </button>
    </div>
  );
};

interface ChoiceDisplay {
  rank: number;
  name: string;
  choiceId: number;
  budgetType?: BudgetType;
}

interface VoteCardProps {
  vote: Vote;
  choiceNames: Record<number, string>;
  choiceBudgetTypes: Record<number, BudgetType>;
  ensNames: Record<string, string | null>;
}

// Create a component for a vote card
const VoteCard = ({ vote, choiceNames, choiceBudgetTypes, ensNames }: VoteCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const toggleExpand = () => setExpanded(!expanded);
  
  // Format the voter's choices in ranking order
  const formattedChoices: ChoiceDisplay[] = Array.isArray(vote.choice) 
    ? vote.choice.map((choiceId: number, index: number) => {
        return {
          rank: index + 1,
          name: choiceNames[choiceId] || `Choice ${choiceId}`,
          choiceId,
          budgetType: choiceBudgetTypes[choiceId]
        };
      })
    : [];
  
  // Calculate voting power in readable format
  const votingPower = vote.vp.toLocaleString(undefined, { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  });

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <a 
              href={`https://etherscan.io/address/${vote.voter}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              {getDisplayName(vote.voter, ensNames)}
            </a>
            <p className="text-gray-400 text-sm">
              {format(new Date(vote.created * 1000), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          <div className="text-right">
            <div className="text-white font-medium">{votingPower}</div>
            <div className="text-gray-400 text-sm">Voting Power</div>
          </div>
        </div>
        
        <div className={`transition-all duration-300 ${expanded ? "max-h-[1000px] overflow-y-auto" : "max-h-20 overflow-hidden"}`}>
          <div className="mb-4">
            <h3 className="text-white font-medium mb-2">Top Choices</h3>
            <div className="grid grid-cols-1 gap-2">
              {formattedChoices.slice(0, expanded ? formattedChoices.length : 3).map((choice) => (
                <div 
                  key={choice.choiceId}
                  className="flex items-center bg-gray-700 rounded p-2"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mr-3">
                    {choice.rank}
                  </div>
                  <div className="flex items-center">
                    <span className="text-white">{choice.name}</span>
                    {/* Only show budget badges for choices with budget types */}
                    {choice.budgetType && !choice.name.toLowerCase().includes("none of the below") && (
                      <>
                        {choice.budgetType === "basic" && <BasicBadge />}
                        {choice.budgetType === "extended" && <ExtendedBadge />}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {vote.reason && (
            <div>
              <h3 className="text-white font-medium mb-2">Reasoning</h3>
              <p className="text-gray-300 whitespace-pre-wrap">{vote.reason}</p>
            </div>
          )}
        </div>
        
        <button 
          onClick={toggleExpand}
          className="text-blue-400 text-sm hover:text-blue-300 mt-2 flex items-center"
        >
          {expanded ? "Show less" : "Show more"}
          <svg 
            className={`w-4 h-4 ml-1 transform transition-transform ${expanded ? "rotate-180" : ""}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default function VotesPage() {
  const [sortBy, setSortBy] = useState<SortOption>("vp");
  const { data: allVotesData, isLoading: isLoadingVotes } = useAllVotes({ orderBy: sortBy });
  const { choices, isLoading: isLoadingChoices } = useEnsElectionData();
  const [choiceNames, setChoiceNames] = useState<Record<number, string>>({});
  const [choiceBudgetTypes, setChoiceBudgetTypes] = useState<Record<number, BudgetType>>({});
  const [ensNames, setEnsNames] = useState<Record<string, string | null>>({});
  const [provider, setProvider] = useState<Web3Provider | null>(null);
  
  // Initialize provider when component mounts
  useEffect(() => {
    if (window.ethereum) {
      setProvider(new Web3Provider(window.ethereum));
    }
  }, []);
  
  // Function to handle sort change
  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
  };
  
  useEffect(() => {
    if (choices && Array.isArray(choices)) {
      // Create a mapping of choice IDs to names and budget types
      const nameMapping: Record<number, string> = {};
      const budgetMapping: Record<number, BudgetType> = {};
      
      choices.forEach((choice) => {
        if (typeof choice === "object" && choice !== null) {
          const choiceObj = choice as any;
          const id = choiceObj.choiceId;
          const name = choiceObj.name || choiceObj.providerName || '';
          const budgetType = choiceObj.budgetType || 'basic';
          
          if (id !== undefined) {
            nameMapping[id] = name;
            budgetMapping[id] = budgetType as BudgetType;
          }
        }
      });
      
      setChoiceNames(nameMapping);
      setChoiceBudgetTypes(budgetMapping);
    }
  }, [choices]);
  
  // Resolve ENS names for votes
  useEffect(() => {
    if (!provider || !allVotesData?.votes) return;
    
    async function resolveEnsNames() {
      const addresses: string[] = [];
      
      // Collect all unique voter addresses
      // We can safely use non-null assertion since we check allVotesData?.votes above
      const votes = allVotesData!.votes;
      votes.forEach(vote => {
        if (!ensCache[vote.voter] && !addresses.includes(vote.voter)) {
          addresses.push(vote.voter);
        }
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
  }, [provider, allVotesData?.votes, ensNames]);
  
  const isLoading = isLoadingVotes || isLoadingChoices;
  
  return (
    <div className="min-h-screen w-full text-white">
      <div className="container p-4 flex flex-col max-w-7xl mx-auto gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Community Votes</h1>
            <p className="text-gray-400">See how the community has voted on the current proposal</p>
          </div>
          
          {!isLoading && allVotesData?.votes && (
            <div className="bg-gray-800/50 rounded-lg p-2 mt-2 sm:mt-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                  <div className="text-xs">
                    <span className="font-semibold text-white">{allVotesData.votes.length}</span>
                    <span className="text-gray-400 ml-1">Votes</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  <div className="text-xs">
                    <span className="font-semibold text-white">
                      {allVotesData.votes.reduce((sum, vote) => sum + vote.vp, 0)
                        .toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })}
                    </span>
                    <span className="text-gray-400 ml-1">VP</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {!isLoading && allVotesData?.votes && (
          <div className="flex justify-end mb-3">
            <div className="flex items-center">
              <span className="mr-2 text-gray-400 text-xs">Sort by:</span>
              <SortButtons activeSort={sortBy} onChange={handleSortChange} />
            </div>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : allVotesData?.votes && allVotesData.votes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allVotesData.votes.map((vote) => (
              <VoteCard 
                key={vote.id} 
                vote={vote} 
                choiceNames={choiceNames}
                choiceBudgetTypes={choiceBudgetTypes}
                ensNames={ensNames}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <h3 className="text-xl font-medium mb-2">No votes found</h3>
            <p className="text-gray-400">Be the first to vote on this proposal!</p>
            <Link
              href="/vote"
              className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg"
            >
              Cast Your Vote
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 