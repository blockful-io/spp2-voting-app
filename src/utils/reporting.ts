/**
 * Reporting functions for the Service Provider Program allocation
 */

import { USE_LOCAL_DATA, PROGRAM_BUDGET, TWO_YEAR_STREAM_RATIO, ONE_YEAR_STREAM_RATIO, WIN_POINTS, TIE_POINTS, LOSS_POINTS } from './config';
import { TWO_YEAR_STREAM_CAP, TOP_RANK_THRESHOLD } from './budgetAllocation';
import fs from 'fs';
import path from 'path';
import { AllocationSummary, Allocation, HeadToHeadMatch, Choice, ReportingProposalData, ReportingAllocationResults, ReportResults, ProposalState, DataSource } from './types';

export const formatCurrency = (value: number): string => {
  return `$${value.toLocaleString()}`;
};

export const displayResults = (
  results: ReportingAllocationResults, 
  proposalData: ReportingProposalData, 
  headToHeadMatches: HeadToHeadMatch[]
): ReportResults => {
  const { allocations, summary } = results;

  console.log("\n===== SERVICE PROVIDER ALLOCATION RESULTS =====\n");
  
  // Display proposal information
  console.log("PROPOSAL INFO:");
  console.log(`Title: ${proposalData.title}`);
  console.log(`Space: ${proposalData.space.name}`);
  console.log(`Total Votes: ${proposalData.votes?.length || 0}`);
  console.log(`Total Voting Power: ${proposalData.scores_total}`);
  console.log(`State: ${proposalData.state.toUpperCase()}`);
  console.log(`Data Source: ${USE_LOCAL_DATA ? 'Local Data' : 'Snapshot API'}`);
  
  // Display summary information
  console.log("\nPROGRAM SUMMARY:");
  console.log(`Voted Budget: ${formatCurrency(summary.votedBudget)} per year`);
  
  console.log("\nCOPELAND SCORING:");
  const winWord = WIN_POINTS === 1 ? "point" : "points";
  const tieWord = TIE_POINTS === 1 ? "point" : "points";
  const lossWord = LOSS_POINTS === 1 ? "point" : "points";
  console.log(`Win: ${WIN_POINTS} ${winWord}`);
  console.log(`Tie: ${TIE_POINTS} ${tieWord}`);
  console.log(`Loss: ${LOSS_POINTS} ${lossWord}`);
  
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
  console.log(`\nBUDGET ALLOCATION RULES:`);
  console.log(`- Each choice (basic or extended budget) is evaluated independently in ranking order`);
  console.log(`- 2-year stream: Current SPP1 providers in the top ${TOP_RANK_THRESHOLD}, cap of ${formatCurrency(summary.twoYearStreamBudget)}`);
  console.log(`- 1-year stream: All other choices, if they fit within remaining total budget`);
  console.log(`- Allocation stops if total budget is exhausted or "None Below" is reached`);
  console.log(`- Options ranked below "None Below" are automatically rejected`);
  
  console.log("\nPROJECT RANKINGS AND ALLOCATIONS:");
  allocations.forEach((project, index) => {
    // Add a label for the None Below option
    const noneBelow = project.isNoneBelow ? " (None Below)" : "";
    
    console.log(`\n${index + 1}. ${project.name}${noneBelow}`);
    console.log(`   Wins: ${project.score}`);
    console.log(`   Average Support: ${typeof project.averageSupport === 'number' ? project.averageSupport.toFixed(2) : "N/A"}`);
    
    if (project.isNoneBelow) {
      console.log(`   STATUS: ✗ NOT FUNDED - Reason: None Below indicator does not receive allocation`);
    } else if (project.allocated) {
      console.log(`   STATUS: ✓ FUNDED - ${formatCurrency(project.budget)} (${project.streamDuration} stream)`);
    } else {
      console.log(`   STATUS: ✗ NOT FUNDED - Reason: ${project.rejectionReason || "Unknown"}`);
    }
    
    // Only show budget info for real service providers
    if (!project.isNoneBelow) {
      console.log(`   Requested: ${formatCurrency(project.budget)} (${project.budgetType} budget)`);
      console.log(`   SPP1 Participant: ${project.isSpp1 ? "Yes" : "No"}`);
    }
  });
  
  console.log("\nHEAD-TO-HEAD MATCH RESULTS:");
  headToHeadMatches.forEach((match, index) => {
    // Label None Below choices in match results
    const choice1Label = match.choice1.name.toLowerCase() === "none below" || 
                         match.choice1.name.toLowerCase() === "none of the below" 
                         ? " (None Below)" : "";
    const choice2Label = match.choice2.name.toLowerCase() === "none below" || 
                         match.choice2.name.toLowerCase() === "none of the below" 
                         ? " (None Below)" : "";
    
    // Display result type icon                     
    const resultIcon = match.winner === match.choice1.name ? "✓" : 
                      match.winner === match.choice2.name ? "✗" : 
                      "=";
                      
    // Display internal match indicator  
    const internalLabel = match.isInternal ? " [Same Provider]" : "";
                         
    console.log(`\nMatch ${index + 1}: ${match.choice1.name}${choice1Label} vs ${match.choice2.name}${choice2Label}${internalLabel}`);
    console.log(`   ${match.choice1.name}: ${match.choice1.totalVotes} votes ${match.winner === match.choice1.name ? resultIcon : ""}`);
    console.log(`   ${match.choice2.name}: ${match.choice2.totalVotes} votes ${match.winner === match.choice2.name ? resultIcon : ""}`);
    console.log(`   Result: ${match.winner === "tie" ? "Tie" : `${match.winner} wins`} ${match.winner === "tie" ? resultIcon : ""}`);
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
      totalVotingPower: proposalData.scores_total || 0,
      state: proposalData.state.toUpperCase() as ProposalState,
      dataSource: USE_LOCAL_DATA ? "Local Data" as DataSource : "Snapshot" as DataSource,
    },
    headToHeadMatches,
    summary: results.summary,
    allocations: results.allocations.map(a => ({
      name: a.name,
      providerName: a.providerName,
      score: a.score,
      averageSupport: a.averageSupport,
      budget: a.budget,
      isSpp1: a.isSpp1,
      allocated: a.allocated,
      streamDuration: a.streamDuration,
      rejectionReason: a.rejectionReason,
      isNoneBelow: a.isNoneBelow,
      budgetType: a.budgetType,
    })),
    programInfo: {
      totalBudget: PROGRAM_BUDGET,
      twoYearStreamRatio: TWO_YEAR_STREAM_RATIO,
      oneYearStreamRatio: ONE_YEAR_STREAM_RATIO,
    },
  };
};

export const exportResults = (results: ReportResults): string | null => {
  try {
    // Create a timestamp for the filename
    const timestamp = new Date().toISOString().replace(/[:\-\.]/g, '_').replace('T', '-').slice(0, 19);
    const filename = `spp-allocation-${results.proposal.id}-latest.json`;
    
    const jsonResults = JSON.stringify(results, null, 2);
    
    // Check if we're in a browser environment
    const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
    
    // In a browser environment, create a downloadable file
    if (isBrowser) {
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
    else if (typeof process !== 'undefined' && typeof require === 'function') {
      // Get the absolute path to the current directory
      const currentDir = __dirname || process.cwd();
      
      // Create data directory if it doesn't exist
      const dataDir = path.join(currentDir, 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Save to the data directory
      const outputPath = path.join(dataDir, filename);
      
      fs.writeFileSync(outputPath, jsonResults);
      console.log(`Results exported to file: ${outputPath}`);
    }
    // Otherwise, just log the JSON
    else {
      console.log("Environment not recognized, couldn't save to file.");
      console.log("Results JSON:");
      console.log(jsonResults);
      return null;
    }
    
    return filename;
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`Error saving results: ${err.message}`);
    console.log("Falling back to logging results to console...");
    console.log("Results JSON:");
    console.log(JSON.stringify(results, null, 2));
    return null;
  }
}; 