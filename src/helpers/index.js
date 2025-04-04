/**
 * Service Provider Program (SPP) Allocation Script
 * 
 * This script integrates with Snapshot to:
 * 1. Fetch ranked choice voting results
 * 2. Process them using the Copeland method
 * 3. Allocate budgets to service providers based on program rules
 * 4. Generate detailed reports of the allocations
 */

// -------------------- CONFIGURATION --------------------
// Edit these values to match your specific requirements

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
  

// -------------------- SNAPSHOT API INTEGRATION --------------------

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
      // Node.js environment
      mockData = require(LOCAL_DATA_PATH);
    } else {
      // Browser environment
      const response = await fetch(LOCAL_DATA_PATH);
      mockData = await response.json();
    }
    
    // Create a proposal object with the structure expected by the rest of the code
    const proposal = {
      id: PROPOSAL_ID,
      title: "Service Provider Program Renewal",
      choices: mockData.data.votes[0].proposal.choices,
      scores_total: mockData.data.votes.reduce((sum, vote) => sum + vote.vp, 0),
      state: "closed",
      space: {
        id: "ens.eth",
        name: "ENS DAO"
      },
      votes: mockData.data.votes
    };
    
    console.log(`Successfully loaded mock data with ${proposal.votes.length} votes`);
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

// -------------------- VOTE PROCESSING --------------------

/**
 * Process Snapshot ranked choice voting results using the Copeland method
 * 
 * Algorithm:
 * 1. Any candidate ranked before "None Below" is considered ranked by the voter
 * 2. Any candidate ranked after "None Below" is considered unranked by the voter
 * 3. All candidates are compared head-to-head
 * 4. In a match between a ranked and unranked candidate, the ranked candidate wins
 * 5. In a match between two unranked candidates, no vote is counted
 * 6. Each victory awards 1 point, ties or losses award 0 points
 * 7. Average support is used as a tiebreaker
 * 
 * @param {Object} proposalData - The proposal data from Snapshot
 * @returns {Object} - Candidates ranked by wins and all head-to-head match results
 */
function processCopelandRanking(proposalData) {
  const { choices, votes } = proposalData;
  
  // Find the "None Below" option
  const noneBelowIndex = choices.findIndex(choice => 
    choice.toLowerCase() === "none below" || choice.toLowerCase() === "none of the below");
  
  // Get actual candidate choices (excluding None Below)
  const candidateChoices = choices.filter((_, index) => index !== noneBelowIndex);
  const numCandidates = candidateChoices.length;
  
  console.log(`Processing ${votes.length} votes for ${numCandidates} candidates using Copeland method...`);
  console.log(`"None Below" marker is option #${noneBelowIndex + 1}`);
  
  // Create matrices for pairwise comparisons and match participation
  const pairwiseMatrix = Array(numCandidates).fill().map(() => Array(numCandidates).fill(0));
  const matchesParticipated = Array(numCandidates).fill().map(() => Array(numCandidates).fill(0));
  
  // Process each vote to update the pairwise matrix
  votes.forEach((vote, voteIndex) => {
    // Skip invalid votes (non-array choices)
    if (!Array.isArray(vote.choice)) {
      console.warn(`Vote #${voteIndex} from ${vote.voter} is not an array. Skipping.`);
      return;
    }
    
    const vp = vote.vp || 1; // Use voting power or default to 1
    
    // Find where "None Below" is in this particular vote's ranking (if ranked)
    const noneBelowRank = vote.choice.indexOf(noneBelowIndex + 1);
    
    // Map from the ballot's ranked choices to actual candidate indices
    // This handles excluding "None Below" from the candidate list
    function getCandidateIndex(choiceNum) {
      // Convert 1-indexed to 0-indexed and adjust for "None Below" position
      const choiceIndex = choiceNum - 1;
      if (choiceIndex === noneBelowIndex) {
        return -1; // Not a candidate
      }
      // Count how many candidates before this choice in the original array
      return choiceIndex < noneBelowIndex ? choiceIndex : choiceIndex - 1;
    }
    
    // For each vote, determine which candidates are ranked (above "None Below")
    const rankedCandidates = new Set();
    
    // If "None Below" was ranked in this vote, only candidates ranked before it are considered ranked
    if (noneBelowRank !== -1) {
      for (let i = 0; i < noneBelowRank; i++) {
        const candidateIndex = getCandidateIndex(vote.choice[i]);
        if (candidateIndex !== -1) {
          rankedCandidates.add(candidateIndex);
        }
      }
    } 
    // If "None Below" wasn't ranked, all candidates in the vote are considered ranked
    else {
      vote.choice.forEach(choiceNum => {
        const candidateIndex = getCandidateIndex(choiceNum);
        if (candidateIndex !== -1) {
          rankedCandidates.add(candidateIndex);
        }
      });
    }
    
    // Helper to get position in ranking (accounting for None Below)
    function getPosition(candidateIndex) {
      // Map back to original choice number
      const originalIndex = candidateIndex < noneBelowIndex ? candidateIndex : candidateIndex + 1;
      return vote.choice.indexOf(originalIndex + 1);
    }
    
    // Compare each pair of candidates
    for (let i = 0; i < numCandidates; i++) {
      for (let j = i + 1; j < numCandidates; j++) {
        // Both candidates are ranked
        if (rankedCandidates.has(i) && rankedCandidates.has(j)) {
          // Find their positions in the ranking
          const posI = getPosition(i);
          const posJ = getPosition(j);
          
          // Lower position value means higher rank
          if (posI < posJ) {
            // Candidate i is ranked higher
            pairwiseMatrix[i][j] += vp;
            matchesParticipated[i][j] += vp;
            matchesParticipated[j][i] += vp;
          } else if (posJ < posI) {
            // Candidate j is ranked higher
            pairwiseMatrix[j][i] += vp;
            matchesParticipated[i][j] += vp;
            matchesParticipated[j][i] += vp;
          }
        } 
        // One candidate ranked, one not ranked
        else if (rankedCandidates.has(i) && !rankedCandidates.has(j)) {
          // Ranked candidate (i) wins against unranked (j)
          pairwiseMatrix[i][j] += vp;
          matchesParticipated[i][j] += vp;
          matchesParticipated[j][i] += vp;
        } 
        else if (!rankedCandidates.has(i) && rankedCandidates.has(j)) {
          // Ranked candidate (j) wins against unranked (i)
          pairwiseMatrix[j][i] += vp;
          matchesParticipated[i][j] += vp;
          matchesParticipated[j][i] += vp;
        }
        // Both unranked - no vote counted for this match
      }
    }
  });
  
  // Store match results for display
  const matchResults = [];
  for (let i = 0; i < numCandidates; i++) {
    for (let j = i + 1; j < numCandidates; j++) {
      matchResults.push({
        candidate1: candidateChoices[i],
        candidate2: candidateChoices[j],
        candidate1Votes: pairwiseMatrix[i][j],
        candidate2Votes: pairwiseMatrix[j][i],
        totalVotes: matchesParticipated[i][j],
        winner: pairwiseMatrix[i][j] > pairwiseMatrix[j][i] 
               ? candidateChoices[i] 
               : pairwiseMatrix[j][i] > pairwiseMatrix[i][j] 
                 ? candidateChoices[j] 
                 : "Tie"
      });
    }
  }
  
  // Sort matches by total votes (highest first)
  matchResults.sort((a, b) => b.totalVotes - a.totalVotes);
  
  // Calculate Copeland scores and average support for each candidate
  const candidateResults = [];
  for (let i = 0; i < numCandidates; i++) {
    let wins = 0;
    let totalVotesReceived = 0;
    let totalMatches = 0;
    
    for (let j = 0; j < numCandidates; j++) {
      if (i !== j) {
        // Count wins
        if (pairwiseMatrix[i][j] > pairwiseMatrix[j][i]) {
          wins++; // Victory = 1 point
        }
        
        // Sum up votes received in all matches for average support
        totalVotesReceived += pairwiseMatrix[i][j];
        
        // Count matches where this candidate received votes
        if (matchesParticipated[i][j] > 0) {
          totalMatches++;
        }
      }
    }
    
    // Calculate average support (avoid division by zero)
    const averageSupport = totalMatches > 0 ? totalVotesReceived / totalMatches : 0;
    
    candidateResults.push({
      name: candidateChoices[i],
      wins: wins,
      averageSupport: averageSupport,
      index: i
    });
  }
  
  // Sort by wins (descending), then by average support (descending) as tiebreaker
  candidateResults.sort((a, b) => {
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }
    return b.averageSupport - a.averageSupport;
  });
  
  // Log match results
  console.log("\nHead-to-head Match Results:");
  matchResults.forEach(match => {
    console.log(`${match.candidate1} vs ${match.candidate2}: ${match.candidate1Votes} - ${match.candidate2Votes} (Total votes: ${match.totalVotes})`);
  });
  
  // Log candidate results
  console.log("\nCandidate Rankings:");
  candidateResults.forEach((candidate, index) => {
    console.log(`${index + 1}. ${candidate.name}: ${candidate.wins} wins, Average Support: ${candidate.averageSupport.toFixed(2)}`);
  });
  
  // Return both the ranked results and match details
  return {
    rankedCandidates: candidateResults.map(candidate => ({
      name: candidate.name,
      score: candidate.wins,
      averageSupport: candidate.averageSupport
    })),
    headToHeadMatches: matchResults
  };
}

// -------------------- DATA PREPARATION --------------------

/**
 * Combines Snapshot results with service provider metadata
 * 
 * @param {Array} rankedResults - Ranked results from Snapshot
 * @param {Object} providerData - Service provider metadata
 * @returns {Array} - Combined data for allocation
 */
function combineData(rankedResults, providerData) {
  return rankedResults.map(result => {
    const metadata = providerData[result.name] || {};
    
    return {
      name: result.name,
      score: result.wins || result.score, // Support both naming formats
      averageSupport: result.averageSupport || 0,
      basicBudget: metadata.basicBudget || 0,
      extendedBudget: metadata.extendedBudget || 0,
      isSpp1: metadata.isSpp1 || false,
      isNoneBelow: false // None Below is not included in candidates
    };
  });
}

// -------------------- BUDGET ALLOCATION --------------------

/**
 * Allocates budgets to service providers based on the program rules
 * 
 * Allocation Rules:
 * 1. SPP1 projects can get 2-year streams with extended budget
 * 2. Any remaining 2-year budget transfers to 1-year stream
 * 3. Other projects can get 1-year streams with extended budget
 * 4. If extended budget doesn't fit, try basic budget
 * 
 * @param {Array} projects - Ranked list of service provider projects
 * @param {Number} yearlyBudget - Total program budget per year
 * @returns {Object} Allocation results and summary statistics
 */
function allocateBudgets(projects, yearlyBudget) {
  // Check if the program should be renewed at all
  if (yearlyBudget === 0) {
    return {
      allocations: projects.map(project => ({
        name: project.name,
        score: project.score,
        averageSupport: project.averageSupport || 0,
        basicBudget: project.basicBudget || 0,
        extendedBudget: project.extendedBudget || 0,
        allocated: false,
        streamDuration: null,
        allocatedBudget: 0,
        rejectionReason: "Program not renewed"
      })),
      summary: {
        votedBudget: 0,
        twoYearStreamBudget: 0,
        oneYearStreamBudget: 0,
        remainingTwoYearBudget: 0,
        remainingOneYearBudget: 0,
        totalAllocated: 0,
        allocatedProjects: 0,
        rejectedProjects: projects.length
      }
    };
  }
  
  // Calculate stream budgets based on the predefined ratios
  const twoYearStreamBudget = yearlyBudget * TWO_YEAR_STREAM_RATIO;
  const oneYearStreamBudget = yearlyBudget * ONE_YEAR_STREAM_RATIO;
  
  // Track remaining budgets
  let remainingTwoYearBudget = twoYearStreamBudget;
  let remainingOneYearBudget = oneYearStreamBudget;
  let transferredBudget = 0;
  
  // Results storage
  const allocations = [];
  
  // Flag to track if any projects qualified for 2-year stream
  let anyQualifiedFor2YearStream = false;
  
  // FIRST PASS: Check for 2-year stream eligibility (SPP1 members only)
  for (const project of projects) {
    // Skip non-SPP1 projects
    if (!project.isSpp1) {
      continue;
    }
    
    // Check if this SPP1 project can get a 2-year stream
    if (project.extendedBudget <= remainingTwoYearBudget) {
      anyQualifiedFor2YearStream = true;
      remainingTwoYearBudget -= project.extendedBudget;
      
      allocations.push({
        name: project.name,
        score: project.score,
        averageSupport: project.averageSupport,
        basicBudget: project.basicBudget,
        extendedBudget: project.extendedBudget,
        allocated: true,
        streamDuration: "2-year",
        allocatedBudget: project.extendedBudget,
        rejectionReason: null
      });
    }
  }
  
  // BUDGET TRANSFER: Move remaining 2-year budget to 1-year stream
  // If no projects qualified for 2-year stream, transfer all 2-year budget to 1-year stream
  if (!anyQualifiedFor2YearStream) {
    transferredBudget = twoYearStreamBudget;
    remainingOneYearBudget += transferredBudget;
    remainingTwoYearBudget = 0;
  }
  // Otherwise, transfer just the remaining 2-year budget to 1-year budget
  else if (remainingTwoYearBudget > 0) {
    transferredBudget = remainingTwoYearBudget;
    remainingOneYearBudget += transferredBudget;
    remainingTwoYearBudget = 0;
  }
  
  // SECOND PASS: Process all projects for 1-year stream
  for (const project of projects) {
    // Skip projects already allocated to 2-year stream
    if (allocations.some(p => p.name === project.name)) {
      continue;
    }
    
    // Initialize allocation data for this project
    const allocation = {
      name: project.name,
      score: project.score,
      averageSupport: project.averageSupport || 0,
      basicBudget: project.basicBudget,
      extendedBudget: project.extendedBudget,
      allocated: false,
      streamDuration: null,
      allocatedBudget: 0,
      rejectionReason: null
    };
    
    // Try to allocate from 1-year stream
    // First try extended budget
    if (project.extendedBudget <= remainingOneYearBudget) {
      allocation.streamDuration = "1-year";
      allocation.allocatedBudget = project.extendedBudget;
      remainingOneYearBudget -= project.extendedBudget;
      allocation.allocated = true;
    } 
    // Then try basic budget
    else if (project.basicBudget <= remainingOneYearBudget) {
      allocation.streamDuration = "1-year";
      allocation.allocatedBudget = project.basicBudget;
      remainingOneYearBudget -= project.basicBudget;
      allocation.allocated = true;
    }
    // Set rejection reason if not allocated
    else {
      allocation.rejectionReason = "Insufficient budget remaining";
    }
    
    allocations.push(allocation);
  }
  
  // Calculate summary statistics
  const totalAllocated = twoYearStreamBudget - remainingTwoYearBudget + 
                         oneYearStreamBudget - remainingOneYearBudget;
  
  const summary = {
    votedBudget: yearlyBudget,
    // Initial budgets
    twoYearStreamBudget,
    oneYearStreamBudget,
    // Budget transfers
    transferredBudget,
    // Adjusted budgets after transfers
    adjustedTwoYearBudget: twoYearStreamBudget - transferredBudget,
    adjustedOneYearBudget: oneYearStreamBudget + transferredBudget,
    // Remaining budgets after allocation
    remainingTwoYearBudget,
    remainingOneYearBudget,
    // Overall statistics
    totalAllocated,
    unspentBudget: remainingTwoYearBudget + remainingOneYearBudget,
    allocatedProjects: allocations.filter(p => p.allocated).length,
    rejectedProjects: allocations.filter(p => !p.allocated).length
  };
  
  return { allocations, summary };
}

// -------------------- REPORTING --------------------

/**
 * Formats currency values in a human-readable way
 * 
 * @param {Number} value - The value to format
 * @returns {String} Formatted currency string
 */
function formatCurrency(value) {
  return `$${value.toLocaleString()}`;
}

/**
 * Displays the allocation results in a readable format
 * 
 * @param {Object} results - The allocation results
 * @param {Object} proposalData - The original proposal data
 * @param {Array} headToHeadMatches - Head-to-head match results
 * @returns {Object} - Formatted results for export
 */
function displayResults(results, proposalData, headToHeadMatches) {
  const { allocations, summary } = results;
  
  console.log("\n===== SERVICE PROVIDER ALLOCATION RESULTS =====\n");
  
  // Display proposal information
  console.log("PROPOSAL INFO:");
  console.log(`Title: ${proposalData.title}`);
  console.log(`Space: ${proposalData.space.name}`);
  console.log(`Total Votes: ${proposalData.votes?.length || 0}`);
  console.log(`Total Voting Power: ${proposalData.scores_total}`);
  console.log(`State: ${proposalData.state.toUpperCase()}`);
  console.log(`Data Source: ${USE_LOCAL_DATA ? 'Local Mock Data' : 'Snapshot API'}`);
  
  // Display summary information
  console.log("\nPROGRAM SUMMARY:");
  console.log(`Voted Budget: ${formatCurrency(summary.votedBudget)} per year`);
  
  console.log("\nINITIAL BUDGET ALLOCATION:");
  console.log(`Two-Year Stream Budget (${(TWO_YEAR_STREAM_RATIO * 100).toFixed(0)}%): ${formatCurrency(summary.twoYearStreamBudget)}`);
  console.log(`One-Year Stream Budget (${(ONE_YEAR_STREAM_RATIO * 100).toFixed(0)}%): ${formatCurrency(summary.oneYearStreamBudget)}`);
  
  if (summary.transferredBudget > 0) {
    console.log(`\nBUDGET REALLOCATION:`);
    console.log(`Transferred from Two-Year to One-Year: ${formatCurrency(summary.transferredBudget)}`);
    
    console.log("\nADJUSTED BUDGET ALLOCATION:");
    console.log(`Adjusted Two-Year Stream Budget: ${formatCurrency(summary.adjustedTwoYearBudget)}`);
    console.log(`Adjusted One-Year Stream Budget: ${formatCurrency(summary.adjustedOneYearBudget)}`);
  }
  
  console.log(`\nALLOCATION RESULTS:`);
  console.log(`Total Allocated: ${formatCurrency(summary.totalAllocated)}`);
  console.log(`Remaining Two-Year Budget: ${formatCurrency(summary.remainingTwoYearBudget)}`);
  console.log(`Remaining One-Year Budget: ${formatCurrency(summary.remainingOneYearBudget)}`);
  console.log(`Total Unspent Budget: ${formatCurrency(summary.unspentBudget)}`);
  console.log(`Projects Funded: ${summary.allocatedProjects}`);
  console.log(`Projects Rejected: ${summary.rejectedProjects}`);
  
  // Explain the budget allocation rules
  console.log(`\nNOTE ON BUDGET ALLOCATION:`);
  if (summary.transferredBudget === summary.twoYearStreamBudget) {
    console.log(`- No projects qualified for the 2-year stream, so the entire 2-year budget`);
    console.log(`  (${formatCurrency(summary.twoYearStreamBudget)}) was transferred to the 1-year stream.`);
  } else if (summary.transferredBudget > 0) {
    console.log(`- Remaining 2-year stream budget (${formatCurrency(summary.transferredBudget)}) was`);
    console.log(`  transferred to the 1-year stream after all eligible projects were funded.`);
  }
  
  console.log("\nPROJECT RANKINGS AND ALLOCATIONS:");
  allocations.forEach((project, index) => {
    console.log(`\n${index + 1}. ${project.name}`);
    console.log(`   Wins: ${project.score}`);
    console.log(`   Average Support: ${typeof project.averageSupport === 'number' ? project.averageSupport.toFixed(2) : "N/A"}`);
    if (project.allocated) {
      console.log(`   STATUS: ✓ FUNDED - ${formatCurrency(project.allocatedBudget)} (${project.streamDuration} stream)`);
    } else {
      console.log(`   STATUS: ✗ NOT FUNDED - Reason: ${project.rejectionReason || "Unknown"}`);
    }
    console.log(`   Requested: Basic ${formatCurrency(project.basicBudget)}, Extended ${formatCurrency(project.extendedBudget)}`);
    console.log(`   SPP1 Participant: ${project.isSpp1 ? "Yes" : "No"}`);
  });
  
  console.log("\nHEAD-TO-HEAD MATCH RESULTS:");
  headToHeadMatches.forEach((match, index) => {
    console.log(`\nMatch ${index + 1}: ${match.candidate1} vs ${match.candidate2}`);
    console.log(`   ${match.candidate1}: ${match.candidate1Votes} votes`);
    console.log(`   ${match.candidate2}: ${match.candidate2Votes} votes`);
    console.log(`   Winner: ${match.winner}`);
    console.log(`   Total Votes: ${match.totalVotes}`);
  });
  
  console.log("\n===== END OF REPORT =====");
  
  // Return results as JSON for potential export
  return {
    proposal: {
      id: proposalData.id,
      title: proposalData.title,
      space: proposalData.space.name,
      totalVotes: proposalData.votes?.length || 0,
      totalVotingPower: proposalData.scores_total,
      state: proposalData.state,
      dataSource: USE_LOCAL_DATA ? 'Local Mock Data' : 'Snapshot API',
      timestamp: new Date().toISOString()
    },
    copelandRanking: allocations.map(a => ({ 
      name: a.name, 
      wins: a.score,
      averageSupport: a.averageSupport
    })),
    headToHeadMatches: headToHeadMatches,
    summary,
    allocations: allocations.map(a => ({
      name: a.name,
      score: a.score,
      averageSupport: a.averageSupport,
      basicBudget: a.basicBudget,
      extendedBudget: a.extendedBudget,
      isSpp1: a.isSpp1,
      allocated: a.allocated,
      streamDuration: a.streamDuration,
      allocatedBudget: a.allocatedBudget,
      rejectionReason: a.rejectionReason
    })),
    programInfo: {
      totalBudget: PROGRAM_BUDGET,
      twoYearStreamRatio: TWO_YEAR_STREAM_RATIO,
      oneYearStreamRatio: ONE_YEAR_STREAM_RATIO
    }
  };
}

/**
 * Export results to a JSON file
 * 
 * @param {Object} results - The formatted results
 * @returns {String} - The filename of the exported file
 */
function exportResults(results) {
  // Create a timestamp for the filename
  const timestamp = new Date().toISOString().replace(/[:\-\.]/g, '_').replace('T', '-').slice(0, 19);
  const filename = `spp-allocation-${results.proposal.id}.json`;
  
  const jsonResults = JSON.stringify(results, null, 2);
  
  // In a browser environment, create a downloadable file
  if (typeof window !== 'undefined') {
    const blob = new Blob([jsonResults], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log(`Results exported to file: ${filename}`);
  } 
  // In a Node.js environment, write to file
  else if (typeof require !== 'undefined') {
    const fs = require('fs');
    fs.writeFileSync("./src/helpers/"+ filename, jsonResults);
    console.log(`Results exported to file: ${filename}`);
  }
  // Otherwise, just log the JSON
  else {
    console.log("Results JSON:");
    console.log(jsonResults);
  }
  
  return filename;
}

// -------------------- MAIN EXECUTION --------------------

/**
 * Main function that orchestrates the entire process
 */
async function main() {
  try {
    console.log("Starting Service Provider Program allocation...");
    console.log(`Budget: ${formatCurrency(PROGRAM_BUDGET)} per year`);
    console.log(`Two-Year Stream: ${(TWO_YEAR_STREAM_RATIO * 100).toFixed(0)}%, One-Year Stream: ${(ONE_YEAR_STREAM_RATIO * 100).toFixed(0)}%`);
    console.log(`Data Source: ${USE_LOCAL_DATA ? 'Local Mock Data' : 'Snapshot API'}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
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
    
    // Step 3: Combine with service provider metadata
    console.log("\nCombining with service provider metadata...");
    const combinedData = combineData(rankedCandidates, serviceProviderData);
    
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

// Execute the script if not being imported
if (typeof module === 'undefined' || !module.parent) {
  main().catch(err => {
    console.error("Unhandled error in main function:", err);
    process.exit(1);
  });
} else {
  // Export functions for testing or importing
  module.exports = {
    processCopelandRanking,
    allocateBudgets,
    combineData,
    main
  };
}