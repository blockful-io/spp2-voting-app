/**
 * Configuration for the Service Provider Program (SPP) Allocation
 */

// Testing configuration
export const USE_LOCAL_DATA = true; // Set to false for production (to fetch from Snapshot API)
export const LOCAL_DATA_PATH = "mocked-votes.json"; // Path to local JSON data file

// CSV file paths for dynamic data loading
export const VOTES_CSV_PATH = "votes.csv"; // Path to CSV file containing votes
export const CHOICES_CSV_PATH = "choices.csv"; // Path to CSV file containing choice options and service provider data
export const USE_CSV_DATA = true; // Always use data from CSV files

// Budget parameters
export const PROGRAM_BUDGET = 1500000; // Total budget in USD per year
export const TWO_YEAR_STREAM_RATIO = 1 / 3; // Proportion allocated to 2-year streams
export const ONE_YEAR_STREAM_RATIO = 2 / 3; // Proportion allocated to 1-year stream

export const PROPOSAL_SPACE = "pikonha.eth";
// Snapshot proposal ID - replace with your proposal ID
export const PROPOSAL_ID =
  "0x2d5d195baaa173394d77484787b7220da5ed0a2f48568e309a404eeec1d0004b";

// Feature flags
export const BIDIMENSIONAL_ENABLED = true; // When enabled, choices from the same provider are grouped together in voting ranks
