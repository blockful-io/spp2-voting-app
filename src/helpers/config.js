/**
 * Configuration for the Service Provider Program (SPP) Allocation
 */

// Testing configuration
const USE_LOCAL_DATA = true; // Set to false for production (to fetch from Snapshot API)
const LOCAL_DATA_PATH = './mocked-votes.json'; // Path to local JSON data file

// Budget parameters
const PROGRAM_BUDGET = 4500000; // Total budget in USD per year
const TWO_YEAR_STREAM_RATIO = 1/3; // Proportion allocated to 2-year streams
const ONE_YEAR_STREAM_RATIO = 2/3; // Proportion allocated to 1-year streams

// Snapshot proposal ID - replace with your proposal ID
const PROPOSAL_ID = "0x5dff4695ef4b5a576d132c2d278342a54b1fe5846ebcdc9a908e273611f27ee1";

// Service provider metadata (not available from Snapshot)
// Format: { "Project Name": { basicBudget: $$$, extendedBudget: $$$, isSpp1: true/false } }
const serviceProviderData = {
    "Unruggable": {
        basicBudget: 400000,
        extendedBudget: 700000,
        isSpp1: true
    },
    "Blockful": {
        basicBudget: 400000,
        extendedBudget: 700000,
        isSpp1: true
    },
    "Namespace": {
        basicBudget: 500000,
        extendedBudget: 700000,
        isSpp1: true
    },
    "eth.limo": {
        basicBudget: 700000,
        extendedBudget: 800000,
        isSpp1: true
    },
    "None below": {
        isNoneBelow: true
    }
};

module.exports = {
    USE_LOCAL_DATA,
    LOCAL_DATA_PATH,
    PROGRAM_BUDGET,
    TWO_YEAR_STREAM_RATIO,
    ONE_YEAR_STREAM_RATIO,
    PROPOSAL_ID,
    serviceProviderData
}; 