import { NextRequest, NextResponse } from "next/server";
import { getVotingResultData } from "@/helpers/votingResults";

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

    // Get voting results data from the helper function
    const response = await getVotingResultData(proposalId);

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
