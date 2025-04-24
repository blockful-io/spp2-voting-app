/**
 * Service Provider Program (SPP) Allocation Script
 * 
 * This script integrates with Snapshot to:
 * 1. Fetch ranked choice voting results
 * 2. Process them using the Copeland method
 * 3. Allocate budgets to service providers based on program rules
 * 4. Generate detailed reports of the allocations
 */

// Import configuration
import { 
  PROGRAM_BUDGET, 
  PROPOSAL_ID,
  USE_LOCAL_DATA
} from './config';

// Import modules
import { prepareVotesFromCsv } from './csvUtils';
import { getVotingResultData } from './votingResults';
import { VotingResultResponse, ReportResults } from './types';
import { processCopelandRanking, combineData } from './voteProcessing';
import { allocateBudgets } from './budgetAllocation';

// Import the reporting module (using ES module imports)
import { formatCurrency, displayResults, exportResults } from './reporting';
import { getCandidateHeadToHead } from './candidateComparisons';

/**
 * Main function that orchestrates the entire process
 */
export async function main(): Promise<{
  results?: ReportResults;
  filename?: string;
  error?: string;
  stack?: string;
  timestamp?: string;
}> {
  try {
    console.log("Starting Service Provider Program allocation...");
    console.log(`Budget: ${formatCurrency(PROGRAM_BUDGET)} per year`);
    console.log(`Data Source: ${USE_LOCAL_DATA ? 'Local Data' : 'Snapshot API'}`);
    
    // Check if we need to prepare votes from CSV
    if (USE_LOCAL_DATA) {
      await prepareVotesFromCsv();
    }
    
    // Get the voting result data using the votingResults module
    console.log(`\nProcessing proposal: ${PROPOSAL_ID}`);
    const votingData: VotingResultResponse = await getVotingResultData(PROPOSAL_ID);
    
    // Display and export results
    console.log("\nGenerating allocation report...");
    
    // Extract the data from the voting results
    const { proposal, headToHeadMatches, summary, allocations, choices } = votingData;
    
    // Create a format compatible with displayResults
    const allocationResults = {
      summary,
      allocations
    };
    
    // Create a format compatible with the original proposalData
    const proposalData = {
      id: proposal.id,
      title: proposal.title,
      space: { name: proposal.space },
      votes: new Array(proposal.totalVotes),
      scores_total: proposal.totalVotingPower,
      state: proposal.state
    };
    
    // Generate and export the final report
    const formattedResults = displayResults(allocationResults, proposalData, headToHeadMatches);
    
    // Add choices data from votingResults to the formattedResults
    formattedResults.choices = choices;
    
    const exportedFilename = exportResults(formattedResults);

    console.log("\nAllocation process completed successfully!");
    if (exportedFilename) {
      console.log(`Results saved to: ${exportedFilename}`);
    } else {
      console.log("Results were not saved to a file.");
    }
    
    const headToHeadResults = getCandidateHeadToHead({
      headToHeadMatches,
      candidates: allocations
    }, "sp l - basic");
    console.log("Head to Head Results: ", headToHeadResults);
    // Return the results and filename for potential further processing
    return {
      results: formattedResults,
      filename: undefined
    };
  } catch (error: unknown) {
    console.error("\nERROR: Allocation process failed");
    const err = error as Error;
    console.error(err.message);
    console.error(err.stack);
    return { 
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    };
  }
}

// Re-export commonly used functions for external use
export {
  processCopelandRanking,
  combineData,
  allocateBudgets,
  getVotingResultData,
  formatCurrency,
  displayResults,
  exportResults
};

// Execute the script if directly run (not imported)
if (require.main === module) {
  main().catch(err => {
    console.error("Unhandled error in main function:", err);
    process.exit(1);
  });
} 