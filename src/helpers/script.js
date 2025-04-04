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
const { convertVotesFromCsv, loadServiceProvidersFromCsv, loadChoiceOptions } = require('./csvUtils');
const fs = require('fs');
const path = require('path');

/**
 * Gets choice options from the CSV file
 * 
 * @returns {Array} - Array of choice option names
 */
function getChoiceOptions() {
  try {
    console.log('Loading choice options from CSV...');
    const choicesCsvPath = path.resolve(__dirname, CHOICES_CSV_PATH);
    if (!fs.existsSync(choicesCsvPath)) {
      throw new Error(`Choices CSV file not found: ${choicesCsvPath}`);
    }
    
    const choices = loadChoiceOptions(choicesCsvPath);
    console.log(`Loaded ${choices.length} choice options from ${choicesCsvPath}`);
    return choices;
  } catch (error) {
    console.error('Error loading choice options:', error);
    throw error;
  }
}

/**
 * Prepares service provider data from CSV
 * 
 * @returns {Object} - Service provider data for allocation
 */
function getServiceProviderData() {
  try {
    console.log('Loading service provider data from CSV...');
    // We're using the choices.csv file for service provider data
    const csvPath = path.resolve(__dirname, CHOICES_CSV_PATH);
    if (!fs.existsSync(csvPath)) {
      throw new Error(`Choices CSV file not found: ${csvPath}`);
    }
    
    const providers = loadServiceProvidersFromCsv(csvPath);
    console.log(`Loaded service provider data for ${Object.keys(providers).length} providers`);
    return providers;
  } catch (error) {
    console.error('Error loading service provider data:', error);
    throw error;
  }
}

/**
 * Prepares vote data from CSV and converts it to mocked-votes.json format
 * 
 * @returns {Promise<void>} - Resolves when conversion is complete
 */
async function prepareVotesFromCsv() {
  try {
    // Load choice options from CSV
    const choiceOptions = getChoiceOptions();
    
    // Convert votes from CSV to JSON and save to mocked-votes.json
    const votesCsvPath = path.resolve(__dirname, VOTES_CSV_PATH);
    if (!fs.existsSync(votesCsvPath)) {
      throw new Error(`Votes CSV file not found: ${votesCsvPath}`);
    }
    
    const outputPath = path.resolve(__dirname, LOCAL_DATA_PATH);
    console.log(`Converting votes from ${votesCsvPath} to JSON format...`);
    
    convertVotesFromCsv(votesCsvPath, choiceOptions, outputPath);
    console.log(`Votes converted from CSV and saved to ${outputPath}`);
  } catch (error) {
    console.error('Error preparing votes from CSV:', error);
    throw error;
  }
}

/**
 * Main function that orchestrates the entire process
 */
async function main() {
  try {
    console.log("Starting Service Provider Program allocation...");
    console.log(`Budget: ${formatCurrency(PROGRAM_BUDGET)} per year`);
    console.log(`Two-Year Stream: ${(TWO_YEAR_STREAM_RATIO * 100).toFixed(0)}%, One-Year Stream: ${(ONE_YEAR_STREAM_RATIO * 100).toFixed(0)}%`);
    console.log(`Data Source: ${USE_LOCAL_DATA ? 'Local Data' : 'Snapshot API'}`);
    console.log(`Service Provider Data Source: ${USE_CSV_DATA ? 'CSV File' : 'Hardcoded'}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    // Check if we need to prepare votes from CSV
    if (USE_LOCAL_DATA) {
      const localDataPath = path.resolve(__dirname, LOCAL_DATA_PATH);
      if (!fs.existsSync(localDataPath)) {
        console.log(`Local data file not found. Converting votes from CSV to JSON...`);
        await prepareVotesFromCsv();
      } else {
        console.log(`Using existing JSON data from ${localDataPath}`);
      }
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

// Execute the script if not being imported or handling specific command
main().catch(err => {
    console.error("Unhandled error in main function:", err);
    process.exit(1);
  });
