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
import { getVotingResultData, VotingResultResponse } from './votingResults';
import { processCopelandRanking, combineData } from './voteProcessing';
import { allocateBudgets } from './budgetAllocation';
import fs from 'fs';
import path from 'path';

// Import the reporting module (using require since it's CommonJS)
const { formatCurrency, displayResults, exportResults } = require('./reporting');

/**
 * Main function that orchestrates the entire process
 */
export async function main(): Promise<{
  results?: any;
  filename?: string;
  error?: string;
  stack?: string;
  timestamp?: string;
}> {
  try {
    console.log("Starting Service Provider Program allocation...");
    console.log(`Budget: ${formatCurrency(PROGRAM_BUDGET)} per year`);
    console.log(`Data Source: ${USE_LOCAL_DATA ? 'Local Data' : 'Snapshot API'}`);
    
    // Ensure data directory exists
    const dataDir = path.resolve(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`Created data directory: ${dataDir}`);
    }
    
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
    const { proposal, headToHeadMatches, summary, allocations } = votingData;
    
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
    
    const formattedResults = displayResults(allocationResults, proposalData, headToHeadMatches);
    const exportedFilename = exportResults(formattedResults);

    console.log("\nAllocation process completed successfully!");
    console.log(`Results saved to: ${exportedFilename}`);
    
    // Return the results and filename for potential further processing
    return {
      results: formattedResults,
      filename: exportedFilename
    };
  } catch (error: any) {
    console.error("\nERROR: Allocation process failed");
    console.error(error.message);
    console.error(error.stack);
    return { 
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
  }
}

// Re-export commonly used functions for external use
export {
  processCopelandRanking,
  combineData,
  allocateBudgets,
  getVotingResultData
};

// Re-export functions from reporting
export const formatCurrencyFn = formatCurrency;
export const displayResultsFn = displayResults;
export const exportResultsFn = exportResults;

// Execute the script if directly run (not imported)
if (require.main === module) {
  main().catch(err => {
    console.error("Unhandled error in main function:", err);
    process.exit(1);
  });
} 