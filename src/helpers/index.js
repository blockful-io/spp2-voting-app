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
const { 
  PROGRAM_BUDGET, 
  TWO_YEAR_STREAM_RATIO, 
  ONE_YEAR_STREAM_RATIO, 
  PROPOSAL_ID,
  USE_LOCAL_DATA,
  serviceProviderData
} = require('./config');

// Import modules
const { fetchSnapshotResults } = require('./snapshot');
const { processCopelandRanking, combineData } = require('./voteProcessing');
const { allocateBudgets } = require('./budgetAllocation');
const { formatCurrency, displayResults, exportResults } = require('./reporting');

/**
 * Main function that orchestrates the entire process
 */
async function main() {
  try {
    console.log("Starting Service Provider Program allocation...");
    console.log(`Budget: ${formatCurrency(PROGRAM_BUDGET)} per year`);
    console.log(`Two-Year Stream: ${(TWO_YEAR_STREAM_RATIO * 100).toFixed(0)}%, One-Year Stream: ${(ONE_YEAR_STREAM_RATIO * 100).toFixed(0)}%`);
    console.log(`Data Source: ${USE_LOCAL_DATA ? 'Local Mock Data' : 'Snapshot API'}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    // Step 1: Fetch results from Snapshot or load from local file
    const proposalData = await fetchSnapshotResults(PROPOSAL_ID);
    
    // Check if proposal exists
    if (!proposalData) {
      throw new Error("Proposal not found");
    }
    
    // Step 2: Process with Copeland method to get rankings
    console.log("\nProcessing votes using Copeland method...");
    const copelandResults = processCopelandRanking(proposalData);
    const { rankedCandidates, headToHeadMatches } = copelandResults;
    
    // Step 3: Combine with service provider metadata
    console.log("\nCombining with service provider metadata...");
    const combinedData = combineData(rankedCandidates, serviceProviderData);
    
    // Step 4: Allocate budgets
    console.log("\nAllocating budgets based on ranking...");
    const allocationResults = allocateBudgets(combinedData, PROGRAM_BUDGET);
    
    // Step 5: Display and export results
    const formattedResults = displayResults(allocationResults, proposalData, headToHeadMatches);
    const exportedFilename = exportResults(formattedResults);
    
    console.log("\nAllocation process completed successfully!");
    console.log(`Results saved to: ${exportedFilename}`);
    
    // Return the results and filename for potential further processing
    return {
      results: formattedResults,
      filename: exportedFilename
    };
  } catch (error) {
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

// Execute the script if not being imported
if (typeof module === 'undefined' || !module.parent) {
  main().catch(err => {
    console.error("Unhandled error in main function:", err);
    process.exit(1);
  });
} else {
  // Export functions for testing or importing
  module.exports = {
    main
  };
} 