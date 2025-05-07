import { NextRequest, NextResponse } from "next/server";
import { getVotingResultData } from "@/utils/votingResults";
import { VotingResultResponse } from "@/utils/types";

// In-memory cache implementation
const cache = new Map<string, { data: VotingResultResponse; timestamp: number }>();
const CACHE_TTL = process.env.NEXT_PUBLIC_CACHE * 1000;

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

    // Check if we have a valid cached response
    const cachedResponse = cache.get(proposalId);
    const now = Date.now();
    
    if (cachedResponse && (now - cachedResponse.timestamp) < CACHE_TTL) {
      console.log("Returning cached response");
      return NextResponse.json(cachedResponse.data);
    }

    // If no valid cache, get fresh data
    const response = await getVotingResultData(proposalId);
    
    // Store in cache
    cache.set(proposalId, {
      data: response,
      timestamp: now
    });

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
