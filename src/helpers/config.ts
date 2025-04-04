/**
 * Configuration for the Service Provider Program (SPP) Allocation
 */

// Testing configuration
export const USE_LOCAL_DATA = true; // Set to false for production (to fetch from Snapshot API)
export const LOCAL_DATA_PATH = 'mocked-votes.json'; // Path to local JSON data file

// CSV file paths for dynamic data loading
export const VOTES_CSV_PATH = 'votes.csv'; // Path to CSV file containing votes
export const CHOICES_CSV_PATH = 'choices.csv'; // Path to CSV file containing choice options and service provider data
export const USE_CSV_DATA = true; // Always use data from CSV files

// Budget parameters
export const PROGRAM_BUDGET = 4500000; // Total budget in USD per year
export const TWO_YEAR_STREAM_RATIO = 1/3; // Proportion allocated to 2-year streams
export const ONE_YEAR_STREAM_RATIO = 2/3; // Proportion allocated to 1-year stream

// Snapshot proposal ID - replace with your proposal ID
export const PROPOSAL_ID = "0x5dff4695ef4b5a576d132c2d278342a54b1fe5846ebcdc9a908e273611f27ee1"; 