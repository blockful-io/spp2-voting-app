/**
 * Reporting functions for the Service Provider Program allocation
 */

const { USE_LOCAL_DATA, PROGRAM_BUDGET, TWO_YEAR_STREAM_RATIO, ONE_YEAR_STREAM_RATIO } = require('./config');

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
  
  try {
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
      const path = require('path');
      
      // Get the absolute path to the current directory
      const currentDir = __dirname || process.cwd();
      const outputPath = path.join(currentDir, filename);
      
      fs.writeFileSync(outputPath, jsonResults);
      console.log(`Results exported to file: ${outputPath}`);
    }
    // Otherwise, just log the JSON
    else {
      console.log("Results JSON:");
      console.log(jsonResults);
    }
    
    return filename;
  } catch (error) {
    console.error(`Error exporting results to file: ${error.message}`);
    console.log("Falling back to logging results to console...");
    console.log("Results JSON:");
    console.log(jsonResults);
    return null;
  }
}

module.exports = {
  formatCurrency,
  displayResults,
  exportResults
}; 