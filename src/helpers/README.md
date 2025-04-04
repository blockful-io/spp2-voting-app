# Service Provider Program (SPP) Allocation

This codebase contains the algorithm for processing ranked choice voting results using the Copeland method and allocating budgets to service providers based on program rules.

## Structure

The codebase is organized into separate modules:

- `config.js`: Contains all configuration parameters
- `snapshot.js`: Handles Snapshot API integration and data fetching
- `voteProcessing.js`: Implements the Copeland ranking algorithm
- `budgetAllocation.js`: Contains the budget allocation logic
- `reporting.js`: Handles displaying and exporting results
- `csvUtils.js`: Utilities for loading data from CSV files
- `script.js`: Main entry point that orchestrates the entire process
- `index.js`: Original reference file (preserved for reference)

## How to Run

To run the allocation process:

```javascript
// Using Node.js
node src/helpers/script.js
```

To convert a CSV file containing votes to the required JSON format:

```javascript
// Using Node.js
node src/helpers/script.js --convert-votes
```

## CSV Data Formats

### Service Provider Data

Service provider data can be loaded from a CSV file rather than being hardcoded. The expected format is:

```
name,basicBudget,extendedBudget,isSpp1
Unruggable,400000,700000,true
Blockful,400000,700000,true
Namespace,500000,700000,true
eth.limo,700000,800000,true
None below,0,0,false
```

A sample template is provided in `sample-service-providers.csv`.

### Vote Data

Vote data can be loaded from a CSV file rather than using the Snapshot API. The expected format is:

```
voter,vp,choice1,choice2,choice3,choice4,choice5,choice6
0x1234abcd,100000,Namespace,Unruggable,eth.limo,Blockful,EFP,None below
0x5678efgh,200000,Unruggable,Namespace,Blockful,eth.limo,EFP,None below
```

A sample template is provided in `sample-votes.csv`.

## Configuration

To use CSV files for data input, modify the following settings in `config.js`:

- `USE_LOCAL_DATA`: Set to `true` to use locally stored votes
- `USE_CSV_DATA`: Set to `true` to load service provider data from a CSV file
- `VOTES_CSV_PATH`: Path to the CSV file containing votes
- `SERVICE_PROVIDERS_CSV_PATH`: Path to the CSV file containing service provider data
- `CHOICE_OPTIONS`: Array of available choices in the Snapshot proposal

## Module Exports

Each module exports the following functions:

### config.js
- `USE_LOCAL_DATA`: Boolean flag to use local data instead of Snapshot API
- `LOCAL_DATA_PATH`: Path to local JSON data file
- `USE_CSV_DATA`: Boolean flag to use CSV data for service providers
- `VOTES_CSV_PATH`: Path to CSV file containing votes
- `SERVICE_PROVIDERS_CSV_PATH`: Path to CSV file containing service provider data
- `CHOICE_OPTIONS`: Array of available choices in the Snapshot proposal
- `PROGRAM_BUDGET`: Total budget in USD per year
- `TWO_YEAR_STREAM_RATIO`: Proportion allocated to 2-year streams
- `ONE_YEAR_STREAM_RATIO`: Proportion allocated to 1-year streams
- `PROPOSAL_ID`: Snapshot proposal ID
- `serviceProviderData`: Service provider metadata (fallback if not using CSV)

### snapshot.js
- `loadLocalData()`: Loads mock data from local JSON file
- `fetchSnapshotResults(proposalId)`: Fetches voting results from Snapshot API

### voteProcessing.js
- `processCopelandRanking(proposalData)`: Processes votes using Copeland method
- `combineData(rankedResults, providerData)`: Combines Snapshot results with service provider metadata

### budgetAllocation.js
- `allocateBudgets(projects, yearlyBudget)`: Allocates budgets based on program rules

### reporting.js
- `formatCurrency(value)`: Formats currency values
- `displayResults(results, proposalData, headToHeadMatches)`: Displays allocation results
- `exportResults(results)`: Exports results to a JSON file

### csvUtils.js
- `convertVotesFromCsv(csvFilePath, choiceOptions, outputPath)`: Converts a CSV file containing votes to the required JSON format
- `loadServiceProvidersFromCsv(csvFilePath)`: Loads service provider data from a CSV file

### script.js
- `main()`: Orchestrates the entire allocation process
- `prepareVotesFromCsv()`: Converts vote data from CSV to JSON
- `getServiceProviderData()`: Gets service provider data from CSV or hardcoded values

## Important Notes on the Algorithm

The Copeland voting method:
1. Any candidate ranked before "None Below" is considered ranked by the voter
2. Any candidate ranked after "None Below" is considered unranked by the voter
3. All candidates are compared head-to-head
4. In a match between a ranked and unranked candidate, the ranked candidate wins
5. In a match between two unranked candidates, no vote is counted
6. Each victory awards 1 point, ties or losses award 0 points
7. Average support is used as a tiebreaker

Budget allocation rules:
1. SPP1 projects can get 2-year streams with extended budget
2. Any remaining 2-year budget transfers to 1-year stream
3. Other projects can get 1-year streams with extended budget
4. If extended budget doesn't fit, try basic budget 