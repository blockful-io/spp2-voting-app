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
  USE_CSV_DATA,
  LOCAL_DATA_PATH,
  VOTES_CSV_PATH,
  CHOICES_CSV_PATH
} = require('./config');

// Import modules
const { fetchSnapshotResults } = require('./snapshot');
const { processCopelandRanking, combineData } = require('./voteProcessing');
const { allocateBudgets } = require('./budgetAllocation');
const { formatCurrency, displayResults, exportResults } = require('./reporting');
const { 
  convertVotesFromCsv, 
  loadServiceProvidersFromCsv, 
  loadChoiceOptions,
  getChoiceOptions,
  getServiceProviderData,
  prepareVotesFromCsv 
} = require('./csvUtils');
const { getCandidateHeadToHeadResults } = require('./candidateComparisons');
const fs = require('fs');
const path = require('path');

/**
 * Main function that orchestrates the entire process
 */
async function main() {
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
    
    // Step 3: Load service provider data and combine with ranked results
    console.log("\nLoading service provider data...");
    const providerData = getServiceProviderData();
    
    console.log("\nCombining with service provider metadata...");
    const combinedData = combineData(rankedCandidates, providerData);
    
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

// Make functions available for importing
module.exports = {
  main,
  processCopelandRanking,
  combineData,
  allocateBudgets,
  formatCurrency,
  displayResults,
  exportResults,
  getCandidateHeadToHeadResults
};

// Execute the script if directly run (not imported)
if (require.main === module) {
  main().catch(err => {
    console.error("Unhandled error in main function:", err);
    process.exit(1);
  });
}