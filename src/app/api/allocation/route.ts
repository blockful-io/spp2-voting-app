import { NextRequest, NextResponse } from "next/server";
import { fetchSnapshotResults } from "@/helpers/snapshot";
import { processCopelandRanking, combineData } from "@/helpers/voteProcessing";
import { allocateBudgets } from "@/helpers/budgetAllocation";
import { getServiceProviderData } from "@/helpers/csvUtils";

// Import configuration but we might want to make these configurable via API params later
import { PROGRAM_BUDGET } from "@/helpers/config";

interface ProposalData {
  title: string;
  space: string;
  totalVotes: number;
  totalVotingPower: number;
  state: string;
}

interface RankedCandidate {
  name: string;
  score: number;
  averageSupport: number;
  isNoneBelow: boolean;
}

interface HeadToHeadMatch {
  candidate1: string;
  candidate2: string;
  candidate1Votes: number;
  candidate2Votes: number;
  totalVotes: number;
  winner: string;
}

interface CopelandResults {
  rankedCandidates: RankedCandidate[];
  headToHeadMatches: HeadToHeadMatch[];
}

interface AllocationSummary {
  votedBudget: number;
  twoYearStreamBudget: number;
  oneYearStreamBudget: number;
  transferredBudget: number;
  adjustedTwoYearBudget: number;
  adjustedOneYearBudget: number;
  remainingTwoYearBudget: number;
  remainingOneYearBudget: number;
  totalAllocated: number;
  unspentBudget: number;
  allocatedProjects: number;
  rejectedProjects: number;
}

interface Allocation {
  name: string;
  score: number;
  averageSupport: number;
  basicBudget: number;
  extendedBudget: number;
  allocated: boolean;
  streamDuration: string | null;
  allocatedBudget: number;
  rejectionReason: string | null;
  isNoneBelow: boolean;
}

interface AllocationResults {
  summary: AllocationSummary;
  allocations: Allocation[];
}

export async function GET(request: NextRequest) {
  try {
    // Get proposal ID from query params
    const { searchParams } = new URL(request.url);
    const proposalId = searchParams.get("proposalId");

    if (!proposalId) {
      return NextResponse.json(
        { error: "proposalId is required" },
        { status: 400 }
      );
    }

    // Step 1: Fetch results from Snapshot
    const proposalData = (await fetchSnapshotResults(
      proposalId
    )) as ProposalData;

    // Check if proposal exists
    if (!proposalData) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    // Step 2: Process with Copeland method to get rankings
    const copelandResults = processCopelandRanking(
      proposalData
    ) as CopelandResults;
    const { rankedCandidates, headToHeadMatches } = copelandResults;

    // Step 3: Load service provider data and combine with ranked results
    const providerData = getServiceProviderData();
    const combinedData = combineData(rankedCandidates, providerData);

    // Step 4: Allocate budgets
    const allocationResults = allocateBudgets(
      combinedData,
      PROGRAM_BUDGET
    ) as AllocationResults;

    // Step 5: Format the response
    const response = {
      proposal: {
        id: proposalId,
        title: proposalData.title,
        space: proposalData.space,
        totalVotes: proposalData.totalVotes,
        totalVotingPower: proposalData.totalVotingPower,
        state: proposalData.state,
        dataSource: "Snapshot API",
      },
      copelandRanking: rankedCandidates,
      headToHeadMatches,
      summary: allocationResults.summary,
      allocations: allocationResults.allocations,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Error processing allocation:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        error: "Failed to process allocation",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
