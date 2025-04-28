/**
 * Configuration for the Service Provider Program (SPP) Allocation
 */

// Testing configuration
export const USE_LOCAL_DATA = false; // Set to false for production (to fetch from Snapshot API)
export const LOCAL_DATA_PATH = "mocked-votes.json"; // Path to local JSON data file

// CSV file paths for dynamic data loading
export const VOTES_CSV_PATH = "votes.csv"; // Path to CSV file containing votes
export const CHOICES_CSV_PATH = "choices.csv"; // Path to CSV file containing choice options and service provider data
export const USE_CSV_DATA = true; // Always use data from CSV files

// Budget parameters
export const PROGRAM_BUDGET = 4500000; // Total budget in USD per year
export const TWO_YEAR_STREAM_RATIO = 1 / 3; // Proportion allocated to 2-year streams
export const ONE_YEAR_STREAM_RATIO = 2 / 3; // Proportion allocated to 1-year stream

export const PROPOSAL_SPACE = "spp-test.eth";
// Snapshot proposal ID - replace with your proposal ID
export const PROPOSAL_ID =
  "0xe6d2c80a64951c939661f0f735d6e44d420799ac0c29b87b08c5fdd4293ee4f7";

// Feature flags
// All code now always uses bidimensional logic
