/**
 * Configuration for the Service Provider Program (SPP) Allocation
 */

// Testing configuration
const USE_LOCAL_DATA = true; // Set to false for production (to fetch from Snapshot API)
const LOCAL_DATA_PATH = './data/mocked-votes.json'; // Path to local JSON data file

// CSV file paths for dynamic data loading
const VOTES_CSV_PATH = './data/votes.csv'; // Path to CSV file containing votes
const CHOICES_CSV_PATH = './data/choices.csv'; // Path to CSV file containing choice options and service provider data
const USE_CSV_DATA = true; // Always use data from CSV files

// Budget parameters
const PROGRAM_BUDGET = 4500000; // Total budget in USD per year
const TWO_YEAR_STREAM_RATIO = 1/3; // Proportion allocated to 2-year streams
const ONE_YEAR_STREAM_RATIO = 2/3; // Proportion allocated to 1-year stream

// Snapshot proposal ID - replace with your proposal ID
const PROPOSAL_ID = "0x5dff4695ef4b5a576d132c2d278342a54b1fe5846ebcdc9a908e273611f27ee1";

module.exports = {
    USE_LOCAL_DATA,
    LOCAL_DATA_PATH,
    VOTES_CSV_PATH,
    CHOICES_CSV_PATH,
    USE_CSV_DATA,
    PROGRAM_BUDGET,
    TWO_YEAR_STREAM_RATIO,
    ONE_YEAR_STREAM_RATIO,
    PROPOSAL_ID
}; 