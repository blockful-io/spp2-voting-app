# SPP2 Voting App - Copeland Ranking System

## Overview

This application implements a Service Provider Program (SPP) allocation system using the Copeland method for ranked choice voting. It processes voting data from Snapshot, ranks candidates, and allocates budgets based on configurable rules.

## Features

- Processes ranked choice voting data from Snapshot or CSV files
- Implements the Copeland method for fair candidate ranking
- Allocates budgets according to program-specific rules
- Handles special "None Below" voting marker
- Generates detailed reports of allocation results
- Provides head-to-head comparison data for all candidates

## Algorithm: The Copeland Method

The Copeland method is a rank-determination algorithm that works as follows:

1. **Pairwise Comparisons**: Each candidate is compared head-to-head with every other candidate.
2. **Voting Mechanism**:
   - For each pair of candidates (A, B), we count how much voting power ranked A above B.
   - "None Below" option serves as a special marker - any candidate ranked below it is considered unranked.
   - Ranked candidates always beat unranked candidates in head-to-head contests.
   - No votes are counted between two unranked candidates.

3. **Scoring**:
   - A candidate receives 1 point for each head-to-head matchup they win.
   - No points are awarded for losses or ties.
   - Total points determine the final ranking.
   - In case of equal points, average support percentage is used as a tiebreaker.

4. **Budget Allocation**:
   - Candidates are processed in ranking order
   - SPP1 projects can receive 2-year funding streams
   - Remaining projects are allocated 1-year funding streams
   - Extended budgets are attempted first, falling back to basic budgets if necessary
   - Any remaining 2-year stream budget is transferred to the 1-year stream

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/spp2-voting-app.git
cd spp2-voting-app

# Install dependencies
npm install
```

## Usage

### Configuration

Edit `src/helpers/config.js` to set your specific parameters:

```javascript
// Budget parameters
const PROGRAM_BUDGET = 4500000; // Total budget in USD per year
const TWO_YEAR_STREAM_RATIO = 1/3; // Proportion allocated to 2-year streams
const ONE_YEAR_STREAM_RATIO = 2/3; // Proportion allocated to 1-year stream

// Data source configuration
const USE_LOCAL_DATA = true; // Set to false to use Snapshot API
const USE_CSV_DATA = true; // Use CSV files for service provider data

// Snapshot proposal ID
const PROPOSAL_ID = "0x5dff4695ef4b5a576d132c2d278342a54b1fe5846ebcdc9a908e273611f27ee1";
```

### CSV Data Format

Place your CSV files in the `src/helpers/data` directory:

1. **choices.csv**: Contains service provider data
   ```
   choiceId,choiceName,budgetAmount,isSpp
   1,sp a,400000,FALSE
   2,sp b - basic,400000,TRUE
   3,sp b - ext,500000,FALSE
   4,sp c,700000,TRUE
   5,None below,0,FALSE
   ```

2. **votes.csv**: Contains voting data
   ```
   Name,Votes,Choice 1,Choice 2,Choice 3,Choice 4,Choice 5
   0xAddress1,1.00,Provider A,Provider B,Provider C,None Below,Provider D
   ```

### Running the Application

```bash
node src/helpers/index.js
```

## Code Structure

### Core Files

- **index.js**: Main entry point that orchestrates the entire process
- **voteProcessing.js**: Implements the Copeland ranking algorithm
- **budgetAllocation.js**: Handles budget allocation logic based on rankings
- **reporting.js**: Formats and exports results
- **candidateComparisons.js**: Provides utilities for analyzing head-to-head results
- **csvUtils.js**: Handles CSV file processing and conversion
- **snapshot.js**: Interfaces with Snapshot API or loads mock data
- **config.js**: Contains application configuration parameters

## The Helpers Folder

The `src/helpers` folder is the core of the application, containing modular components that handle different aspects of the voting and allocation process:

### Main Module Files

- **index.js** (292 lines): The orchestrator that ties everything together
  - Contains the `main()` function that executes the full allocation workflow
  - Provides wrapper functions for CSV data handling (`getChoiceOptions()`, `getServiceProviderData()`, `prepareVotesFromCsv()`)
  - Includes detailed logging for the entire process
  - Exports all key functions for external use

- **voteProcessing.js** (246 lines): The voting algorithm implementation
  - Implements the Copeland method in `processCopelandRanking()`
  - Handles the special "None Below" option as both a marker and a candidate
  - Calculates pairwise comparisons between all candidates
  - Computes scores and rankings based on head-to-head results
  - Combines ranking data with service provider metadata

- **budgetAllocation.js** (216 lines): The budget distribution logic
  - Allocates budgets based on ranking order
  - Implements the two-stream allocation model (2-year and 1-year funding)
  - Handles budget transfers between streams
  - Preserves the original ranking order throughout allocation
  - Provides detailed allocation statistics

- **reporting.js** (231 lines): Output formatting and report generation
  - Formats allocation results for display
  - Generates structured JSON data for reporting
  - Exports results to timestamped files
  - Provides currency formatting utilities

- **candidateComparisons.js** (118 lines): Head-to-head analysis tools
  - Extracts match data for specific candidates
  - Formats match results for frontend display
  - Calculates statistics like win percentages and vote shares
  - Sorts results by votes or other criteria

- **csvUtils.js** (473 lines): Data processing utilities
  - Low-level CSV parsing for votes and service provider data
  - Handles complex CSV formats including quoted fields
  - Converts between CSV and JSON formats
  - Supports multiple CSV format variations

- **snapshot.js** (~100 lines): Integration with Snapshot
  - Interfaces with Snapshot API for live vote data
  - Falls back to local data when configured
  - Standardizes data format from multiple sources

- **config.js** (32 lines): Application configuration
  - Defines all configurable parameters
  - Controls data sources and budget allocation rules
  - Sets Snapshot proposal IDs and file paths

### Data Directory

The `src/helpers/data` directory holds all input and output files:

- **Input Files**:
  - `choices.csv`: Service provider options and metadata
  - `votes.csv`: Raw vote data from Snapshot or other sources
  
- **Generated Files**:
  - `mocked-votes.json`: Processed vote data in JSON format
  - `spp-allocation-[proposalId]-[timestamp].json`: Allocation results
  - `spp-allocation-[proposalId]-latest.json`: Latest allocation results

### Function Relationships

- **Data Flow**: 
  1. CSV data → JSON conversion (`csvUtils.js`)
  2. Vote processing and ranking (`voteProcessing.js`)
  3. Budget allocation (`budgetAllocation.js`)
  4. Reporting and export (`reporting.js`)

- **Helper Layers**:
  - Low-level utilities (`loadServiceProvidersFromCsv`, `convertVotesFromCsv`)
  - High-level wrappers (`getServiceProviderData`, `prepareVotesFromCsv`)
  - Integration functions (in `index.js`)

### Key Functions

| File | Function | Description |
|------|----------|-------------|
| voteProcessing.js | `processCopelandRanking()` | Core algorithm for Copeland method ranking |
| voteProcessing.js | `combineData()` | Merges rankings with provider metadata |
| budgetAllocation.js | `allocateBudgets()` | Distributes budgets according to rules |
| csvUtils.js | `loadServiceProvidersFromCsv()` | Low-level CSV parsing for provider data |
| index.js | `getServiceProviderData()` | High-level wrapper for provider data loading |
| csvUtils.js | `convertVotesFromCsv()` | Converts vote CSV data to JSON format |
| candidateComparisons.js | `getCandidateHeadToHeadResults()` | Extracts match data for a candidate |
| reporting.js | `displayResults()` | Formats allocation results |
| reporting.js | `exportResults()` | Saves results to JSON file |

## Output

The application generates:

1. Console output showing the full allocation process
2. JSON files with detailed results in the `src/helpers/data` directory
3. Head-to-head comparison data that can be accessed programmatically

## Example

When executed, the program will:

1. Load data from CSV files or Snapshot
2. Process votes using the Copeland method
3. Display full rankings with scores
4. Show budget allocations for each service provider
5. Generate detailed head-to-head match statistics
6. Export complete results to a timestamped JSON file

## License

[MIT License](LICENSE)

## Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## CSV Format

### choices.csv
The choices.csv file contains service provider data with the following columns:

```
choiceId,choiceName,budgetAmount,isSpp
1,sp a,400000,FALSE
2,sp b - basic,400000,TRUE
3,sp b - ext,500000,FALSE
4,sp c,700000,TRUE
5,None below,0,FALSE
```

- `choiceId`: Numeric ID for the choice option
- `choiceName`: Display name of the service provider
- `budgetAmount`: Budget amount requested (in USD without commas)
- `isSpp`: Boolean flag indicating if the provider was part of SPP1 (TRUE/FALSE)

Note: The "None below" option is special and should always be included.
