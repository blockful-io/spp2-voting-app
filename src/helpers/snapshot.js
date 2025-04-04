/**
 * Snapshot API integration for fetching voting data
 */

const { USE_LOCAL_DATA, LOCAL_DATA_PATH, PROPOSAL_ID } = require('./config');
const fs = require('fs');
const path = require('path');

/**
 * Load mock data from local JSON file
 * 
 * @returns {Promise<Object>} - Mock proposal data
 */
async function loadLocalData() {
  try {
    console.log(`Loading mock data from ${LOCAL_DATA_PATH}...`);
    
    let mockData;
    
    // Handle different environments (Node.js vs Browser)
    if (typeof require !== 'undefined') {
      // Node.js environment - handle both relative and absolute paths
      const filePath = LOCAL_DATA_PATH.startsWith('./') 
        ? path.resolve(__dirname, LOCAL_DATA_PATH)
        : LOCAL_DATA_PATH;
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      // Since we're requiring a JSON file dynamically, we need to read and parse it
      const jsonData = fs.readFileSync(filePath, 'utf8');
      mockData = JSON.parse(jsonData);
    } else {
      // Browser environment
      const response = await fetch(LOCAL_DATA_PATH);
      mockData = await response.json();
    }
    
    // Check if loaded data is valid
    if (!mockData || !mockData.data || !mockData.data.votes || !mockData.data.votes.length) {
      throw new Error('Loaded mock data has invalid format');
    }
    
    // Make sure votes have choices property
    const sampleVote = mockData.data.votes[0];
    if (!sampleVote.proposal || !sampleVote.proposal.choices) {
      throw new Error('Loaded votes missing required proposal.choices property');
    }
    
    // Create a proposal object with the structure expected by the rest of the code
    const proposal = {
      id: PROPOSAL_ID,
      title: "Service Provider Program Renewal",
      choices: sampleVote.proposal.choices,
      scores_total: mockData.data.votes.reduce((sum, vote) => sum + vote.vp, 0),
      state: "closed",
      space: {
        id: "ens.eth",
        name: "ENS DAO"
      },
      votes: mockData.data.votes
    };
    
    console.log(`Successfully loaded mock data with ${proposal.votes.length} votes and ${proposal.choices.length} choice options`);
    console.log(`Choices: ${proposal.choices.join(', ')}`);
    return proposal;
  } catch (error) {
    console.error('Error loading mock data:', error);
    throw new Error(`Failed to load mock data: ${error.message}`);
  }
}

/**
 * Fetches voting results from Snapshot API
 * 
 * @param {String} proposalId - The Snapshot proposal ID
 * @returns {Promise<Object>} - The proposal data including votes
 */
async function fetchSnapshotResults(proposalId) {
  // Use local data if configured
  if (USE_LOCAL_DATA) {
    return loadLocalData();
  }
  
  // Otherwise fetch from Snapshot API
  try {
    const snapshotAPI = 'https://hub.snapshot.org/graphql';
    
    // Query to get proposal info
    const proposalQuery = `
      query Proposal {
        proposal(id: "${proposalId}") {
          id
          title
          choices
          scores_total
          state
          space {
            id
            name
          }
        }
      }
    `;
    
    // Query to get votes with voting power
    const votesQuery = `
      query Votes {
        votes(
          first: 1000
          where: {
            proposal: "${proposalId}"
          }
        ) {
          voter
          created
          choice
          vp
          vp_by_strategy
          proposal {
            choices
          }
        }
      }
    `;
    
    console.log(`Fetching proposal data from Snapshot API for proposal ${proposalId}...`);
    
    // Fetch proposal data
    const proposalResponse = await fetch(snapshotAPI, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: proposalQuery }),
    });
    
    const proposalData = await proposalResponse.json();
    
    if (!proposalData?.data?.proposal) {
      throw new Error('Invalid response from Snapshot API for proposal data');
    }
    
    const proposal = proposalData.data.proposal;
    console.log(`Successfully fetched proposal: "${proposal.title}"`);
    
    // Fetch votes data
    console.log(`Fetching votes for proposal ${proposalId}...`);
    
    const votesResponse = await fetch(snapshotAPI, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: votesQuery }),
    });
    
    const votesData = await votesResponse.json();
    
    if (!votesData?.data?.votes) {
      throw new Error('Invalid response from Snapshot API for votes data');
    }
    
    const votes = votesData.data.votes;
    console.log(`Successfully fetched ${votes.length} votes`);
    
    // Combine proposal and votes data
    return {
      ...proposal,
      votes: votes
    };
  } catch (error) {
    console.error('Error fetching data from Snapshot:', error);
    throw new Error(`Failed to fetch Snapshot data: ${error.message}`);
  }
}

module.exports = {
  loadLocalData,
  fetchSnapshotResults
}; 