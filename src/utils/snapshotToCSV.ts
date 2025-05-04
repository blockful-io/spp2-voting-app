/**
 * Converts Snapshot API votes to CSV
 * This script creates a CSV file with the columns:
 * address, votingPower, choice1, choice2, choice3, choice4, choice5, choice6, choice7, choice8, choice9, choice10
 */

import fs from "fs";
import path from "path";
import { fetchSnapshotResults } from "./snapshot";
import { ProposalData, Vote } from "./types";
import { preprocessVotes } from "./voteProcessing";

/**
 * Converts Snapshot votes to CSV format
 * @param proposalId The Snapshot proposal ID
 * @param outputPath Optional path to save the CSV (defaults to snapshot-votes.csv in the data directory)
 * @returns Path to the saved CSV file
 */
export async function convertSnapshotVotesToCSV(
  proposalId: string,
  outputPath: string = "snapshot-votes.csv"
): Promise<string> {
  try {
    console.log(`Fetching votes for proposal ${proposalId} from Snapshot API...`);
    
    // Get proposal data from Snapshot
    const proposalData: ProposalData = await fetchSnapshotResults(proposalId);
    
    console.log(`Successfully fetched ${proposalData.votes.length} votes`);
    
    // Preprocess the votes to ensure basic budgets are ranked above extended budgets
    const preprocessedVotes = preprocessVotes(proposalData.votes, proposalData.choices);
    
    // Sort votes by voting power (vp) in descending order
    const sortedVotes = [...preprocessedVotes].sort((a, b) => b.vp - a.vp);
    
    // Create CSV header row
    let csvContent = "address,votingPower";
    
    // Add choice columns (up to 10)
    for (let i = 1; i <= 10; i++) {
      csvContent += `,choice${i}`;
    }
    csvContent += "\n";
    
    // Process each vote
    sortedVotes.forEach((vote: Vote) => {
      // Start with address and voting power
      let row = `${vote.voter},${vote.vp}`;
      
      if (Array.isArray(vote.choice) && vote.choice.length > 0) {
        // Convert choice indices to choice names
        let choiceNames = vote.choice.map(
          (choiceIndex: number) => proposalData.choices[choiceIndex - 1] || ""
        );
        
        // Find the index of "none below" if it exists
        const nonebelowIndex = choiceNames.findIndex(
          (choice) => choice && choice.toLowerCase() === "none below"
        );
        
        // If "none below" exists, truncate the array to exclude choices after it
        if (nonebelowIndex !== -1) {
          choiceNames = choiceNames.slice(0, nonebelowIndex + 1);
        }
        
        // Fill in choices up to 10 (pad with empty strings if needed)
        for (let i = 0; i < 10; i++) {
          row += `,${choiceNames[i] || ""}`;
        }
      } else {
        // If no choices, add 10 empty columns
        row += ",".repeat(10);
      }
      
      csvContent += row + "\n";
    });
    
    // Determine file path - save to src/utils/data directory
    const filePath = path.join(
      process.cwd(),
      "src",
      "utils",
      "data",
      outputPath
    );
    
    // Create the directory if it doesn't exist
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Write CSV to file
    fs.writeFileSync(filePath, csvContent, "utf8");
    
    console.log(`Saved ${proposalData.votes.length} votes to ${filePath}`);
    
    return filePath;
  } catch (error) {
    console.error("Error converting Snapshot votes to CSV:", error);
    throw new Error(
      `Failed to convert Snapshot votes to CSV: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Command line interface for running the converter directly
 */
if (require.main === module) {
  // Check if a proposal ID was provided
  const proposalId = process.argv[2];
  
  if (!proposalId) {
    console.error("Please provide a proposal ID as an argument");
    process.exit(1);
  }
  
  // Run the converter
  convertSnapshotVotesToCSV(proposalId)
    .then((filePath) => {
      console.log(`CSV file created at: ${filePath}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}

module.exports = {
  convertSnapshotVotesToCSV
}; 