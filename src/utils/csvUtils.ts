/**
 * CSV Utilities for the Service Provider Program Allocation
 *
 * This module provides functions to:
 * 1. Convert votes from a CSV file to the mocked-votes.json format
 * 2. Load service provider metadata from a CSV file instead of hardcoding
 * 3. Load choice options from a CSV file
 */

import fs from "fs";
import path from "path";

// Import configuration
import { CHOICES_CSV_PATH, VOTES_CSV_PATH, LOCAL_DATA_PATH } from "./config";
// Import shared types
import { Vote, ProposalData, ProviderData, MockVoteData } from "./types";

/**
 * Resolves a relative path from the project root
 *
 * @param {String} filePath - The file path to resolve
 * @returns {String} - The resolved absolute path
 */
function resolvePath(filePath: string) {
  // Always resolve from project root/src/utils/data
  return path.join(process.cwd(), "src", "utils", "data", filePath);
}

/**
 * Loads choice options from a CSV file
 *
 * Expected CSV format from choices.csv:
 * Choice,Name,Basic budget,Extended budget,2 year eligible
 * 1,sp a,"400,000","700,000",FALSE
 * 2,sp b - basic,"400,000","700,000",TRUE
 * ...
 * 
 * OR new format:
 * choiceId,choiceName,amount,isSpp
 * 1,sp a,400000,FALSE
 * 2,sp b - basic,400000,TRUE
 *
 * @param {String} csvFilePath - Path to the CSV file containing choice options
 * @returns {Array} - Array of choice options
 */
function loadChoiceOptions(csvFilePath: string) {
  try {
    const resolvedPath = resolvePath(csvFilePath);

    // Read the CSV file
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }

    const csvData = fs.readFileSync(resolvedPath, "utf8");
    const lines = csvData.trim().split("\n");

    if (lines.length === 0) {
      throw new Error("CSV file is empty");
    }

    // Parse header to determine column structure
    const header = lines[0].split(",").map(col => col.trim());
    
    // Check for new column structure with choiceId and choiceName
    const choiceIdHeader = header.findIndex(
      (col) => col.toLowerCase() === "choiceid"
    );
    const choiceNameHeader = header.findIndex(
      (col) => col.toLowerCase() === "choicename"
    );

    // Check for original column structure
    const choiceIdxHeader = header.findIndex(
      (col) => col.toLowerCase() === "choice"
    );
    const nameIdxHeader = header.findIndex(
      (col) => col.toLowerCase() === "name"
    );

    // If new format (has choiceId,choiceName columns)
    if (choiceIdHeader !== -1 && choiceNameHeader !== -1) {
      const options = [];

      // Start from the second line (skip header)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].split(",");

        // Skip if there aren't enough columns
        if (line.length <= Math.max(choiceIdHeader, choiceNameHeader)) {
          console.warn(`Skipping line ${i + 1} - not enough columns`);
          continue;
        }

        // Get the name of the choice
        const name = line[choiceNameHeader].trim();

        if (name) {
          options.push(name);
        }
      }

      if (options.length === 0) {
        throw new Error("No valid choices found in CSV file");
      }

      return options;
    }
    // If choices.csv format (has Choice,Name columns)
    else if (choiceIdxHeader !== -1 && nameIdxHeader !== -1) {
      const options = [];

      // Start from the second line (skip header)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].split(",");

        // Skip if there aren't enough columns
        if (line.length <= Math.max(choiceIdxHeader, nameIdxHeader)) {
          console.warn(`Skipping line ${i + 1} - not enough columns`);
          continue;
        }

        // Get the name of the choice
        const name = line[nameIdxHeader].trim();

        if (name) {
          options.push(name);
        }
      }

      if (options.length === 0) {
        throw new Error("No valid choices found in CSV file");
      }

      return options;
    }
    // Standard format with just name column
    else {
      const nameIndex = header.findIndex((col) => col.toLowerCase() === "name");

      if (nameIndex !== -1) {
        const options = [];

        // Start from the second line (skip header)
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].split(",");

          // Skip if there aren't enough columns
          if (line.length <= nameIndex) {
            console.warn(`Skipping line ${i + 1} - not enough columns`);
            continue;
          }

          // Get the name of the choice
          const name = line[nameIndex].trim();

          if (name) {
            options.push(name);
          }
        }

        if (options.length === 0) {
          throw new Error("No valid choices found in CSV file");
        }

        return options;
      }
      // Fallback to simple list format
      else {
        const options = [];

        // Process each line as a choice
        for (let i = 0; i < lines.length; i++) {
          const name = lines[i].trim();
          if (name) {
            options.push(name);
          }
        }

        if (options.length === 0) {
          throw new Error("No valid choices found in CSV file");
        }

        return options;
      }
    }
  } catch (error) {
    console.error("Error loading choice options from CSV:", error);
    throw new Error(
      `Failed to load choice options from CSV: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Converts a CSV file containing votes into the mocked-votes.json format
 *
 * Expected CSV format from votes.csv:
 * Name,Votes,Choice 1,Choice 2,Choice 3,Choice 4,Choice 5
 * 0x809FA673...,1.00,sp b - basic,sp b - ext,sp a,sp c,None below
 *
 * @param {String} csvFilePath - Path to the CSV file containing votes
 * @param {Array} choiceOptions - Array of available choices in the exact order they appear in the Snapshot proposal
 * @param {String} outputPath - Path to save the JSON output (optional)
 * @returns {Object} - The vote data in mocked-votes.json format
 */
function convertVotesFromCsv(
  csvFilePath: string,
  choiceOptions: string[],
  outputPath: string | null = null
) {
  try {
    const resolvedCsvPath = resolvePath(csvFilePath);

    // Read the CSV file
    if (!fs.existsSync(resolvedCsvPath)) {
      throw new Error(`File not found: ${resolvedCsvPath}`);
    }

    const csvData = fs.readFileSync(resolvedCsvPath, "utf8");
    const lines = csvData.trim().split("\n");

    // Parse header to determine column structure
    const header = lines[0].split(",");

    // Find column indexes - support both formats
    let voterIndex = header.findIndex((col) => col.toLowerCase() === "voter");
    let vpIndex = header.findIndex((col) => col.toLowerCase() === "vp");

    // Handle the alternative format from votes.csv
    if (voterIndex === -1) {
      voterIndex = header.findIndex((col) => col.toLowerCase() === "name");
    }

    if (vpIndex === -1) {
      vpIndex = header.findIndex((col) => col.toLowerCase() === "votes");
    }

    // Validate required columns exist
    if (voterIndex === -1 || vpIndex === -1) {
      throw new Error(
        'CSV file must contain "Name/voter" and "Votes/vp" columns'
      );
    }

    // Prepare result structure
    const votes = [];

    // Process each vote line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].split(",");

      // Get voter address and voting power
      const voter = line[voterIndex].trim();
      const vp = parseFloat(line[vpIndex]);

      if (!voter || isNaN(vp)) {
        console.warn(`Skipping line ${i + 1} due to invalid voter or vp`);
        continue;
      }

      // Process choices (ranked choices)
      const choiceArr = [];
      const rankedChoices = [];

      // Find choice columns - they usually have "Choice" in the header
      const choiceColumns = [];
      for (let j = 0; j < header.length; j++) {
        if (
          j !== voterIndex &&
          j !== vpIndex &&
          (header[j].toLowerCase().includes("choice") ||
            header[j].match(/^choice\d+$/i) ||
            j > Math.max(voterIndex, vpIndex))
        ) {
          // Assume columns after voter/vp are choices
          choiceColumns.push(j);
        }
      }

      // Get choices from each choice column
      for (const j of choiceColumns) {
        if (j < line.length && line[j]) {
          const choiceName = line[j].trim();
          rankedChoices.push(choiceName);

          // Find the index of the choice in the choiceOptions array (1-indexed for Snapshot)
          const choiceIndex = choiceOptions.findIndex(
            (opt) => opt === choiceName
          );

          if (choiceIndex !== -1) {
            // In Snapshot, choices are 1-indexed
            choiceArr.push(choiceIndex + 1);
          } else {
            console.warn(`Unknown choice "${choiceName}" in line ${i + 1}`);
          }
        }
      }

      if (choiceArr.length === 0) {
        console.warn(
          `No valid choices found for voter ${voter} in line ${i + 1}`
        );
        continue;
      }

      // Create a vote object in the expected format
      votes.push({
        voter,
        vp,
        choice: choiceArr,
        proposal: {
          choices: choiceOptions,
        },
      });
    }

    if (votes.length === 0) {
      throw new Error("No valid votes found in the CSV file");
    }

    // Create the final structure matching mocked-votes.json
    const result = {
      data: {
        votes,
      },
    };

    // Save to file if outputPath is provided
    if (outputPath) {
      const resolvedOutputPath = resolvePath(outputPath);
      fs.writeFileSync(resolvedOutputPath, JSON.stringify(result, null, 2));
      console.log(`Converted votes saved to ${resolvedOutputPath}`);
    }

    return result;
  } catch (error) {
    console.error("Error converting votes from CSV:", error);
    throw new Error(
      `Failed to convert votes from CSV: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Loads service provider data from a CSV file
 *
 * Expected CSV format from choices.csv:
 * Choice,Name,Basic budget,Extended budget,is SPP
 * 1,sp a,"400,000","700,000",FALSE
 * 2,sp b - basic,"400,000","700,000",TRUE
 * ...
 *
 * @param {String} csvFilePath - Path to the CSV file containing service provider data
 * @returns {Object} - Service provider data in the format needed for allocation
 */
function loadServiceProvidersFromCsv(csvFilePath: string) {
  try {
    const resolvedPath = resolvePath(csvFilePath);

    // Read the CSV file
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }

    const csvData = fs.readFileSync(resolvedPath, "utf8");
    const lines = csvData.trim().split("\n");

    // Parse header to determine column structure
    const header = lines[0].split(",").map(col => col.trim());
    
    // Check for new column structure: choiceId, choiceName, amount, isSpp
    const choiceIdHeader = header.findIndex(
      (col) => col.toLowerCase() === "choiceid"
    );
    const choiceNameHeader = header.findIndex(
      (col) => col.toLowerCase() === "choicename"
    );
    const amountHeader = header.findIndex(
      (col) => col.toLowerCase() === "amount" || col.toLowerCase() === "budgetamount"
    );
    const isSppHeader = header.findIndex(
      (col) => col.toLowerCase() === "isspp" || col.toLowerCase() === "isspp1"
    );

    // Check for original column structure
    const choiceIdxHeader = header.findIndex(
      (col) => col.toLowerCase() === "choice"
    );
    const nameIdxHeader = header.findIndex(
      (col) => col.toLowerCase() === "name"
    );
    const basicBudgetIdxHeader = header.findIndex(
      (col) =>
        col.toLowerCase().includes("basic") &&
        col.toLowerCase().includes("budget")
    );
    const extendedBudgetIdxHeader = header.findIndex(
      (col) =>
        col.toLowerCase().includes("extended") &&
        col.toLowerCase().includes("budget")
    );
    const isSppIdxHeader = header.findIndex((col) =>
      col.toLowerCase().includes("spp")
    );

    // Prepare result structure
    const serviceProviderData: {
      [key: string]: {
        basicBudget: number;
        extendedBudget: number;
        isSpp1: boolean;
        isNoneBelow: boolean;
        choiceId: number;
      };
    } = {};

    // Check if we have the NEW column structure (choiceId, choiceName, amount/budgetAmount, isSpp)
    if (
      choiceIdHeader !== -1 &&
      choiceNameHeader !== -1 &&
      amountHeader !== -1
    ) {
      console.log("Using new choices.csv format with single budget amount column");
      
      // Process each service provider line with the new structure
      for (let i = 1; i < lines.length; i++) {
        // Handle quoted fields with commas by splitting carefully
        const line = [];
        let currentField = "";
        let inQuotes = false;

        for (let c = 0; c < lines[i].length; c++) {
          const char = lines[i][c];

          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            line.push(currentField);
            currentField = "";
          } else {
            currentField += char;
          }
        }

        // Don't forget the last field
        line.push(currentField);

        // Get service provider name
        const name = line[choiceNameHeader]?.trim();

        if (!name) {
          console.warn(`Skipping line ${i + 1} due to missing name`);
          continue;
        }

        // Get the choiceId value
        const choiceId = line[choiceIdHeader]?.trim();
        // Parse choiceId as a number, defaulting to line index if invalid
        const parsedChoiceId = choiceId ? parseInt(choiceId, 10) : i;
        // Use line index as fallback if parsing results in NaN
        const finalChoiceId = isNaN(parsedChoiceId) ? i : parsedChoiceId;

        // Check if this is the "None Below" option
        const isNoneBelow =
          name.toLowerCase() === "none below" ||
          name.toLowerCase() === "none of the below";

        // Parse amount value - handle values with commas
        let amount = 0;
        if (amountHeader !== -1 && line[amountHeader]) {
          // Remove quotes and commas for parsing
          const amountStr = line[amountHeader].replace(/[",]/g, "");
          amount = parseInt(amountStr, 10);
        }

        // Parse isSpp1 flag (default to false if not present)
        let isSpp1 = false;
        if (isSppHeader !== -1 && line[isSppHeader]) {
          const isSpp1Value = line[isSppHeader].trim().toUpperCase();
          isSpp1 =
            isSpp1Value === "TRUE" ||
            isSpp1Value === "YES" ||
            isSpp1Value === "1";
        }

        // Create service provider object
        // For the new structure, we set both basicBudget and extendedBudget to the same budget amount
        serviceProviderData[name] = {
          basicBudget: isNoneBelow ? 0 : isNaN(amount) ? 0 : amount,
          extendedBudget: isNoneBelow ? 0 : isNaN(amount) ? 0 : amount,
          isSpp1: isNoneBelow ? false : isSpp1,
          isNoneBelow: isNoneBelow,
          choiceId: finalChoiceId,
        };
      }
    }
    // Check if we have the original choices.csv format
    else if (
      nameIdxHeader !== -1 &&
      (basicBudgetIdxHeader !== -1 || extendedBudgetIdxHeader !== -1)
    ) {
      console.log("Using original choices.csv format with separate budget columns");
      
      // Process each service provider line
      for (let i = 1; i < lines.length; i++) {
        // Handle quoted fields with commas by splitting carefully
        const line = [];
        let currentField = "";
        let inQuotes = false;

        for (let c = 0; c < lines[i].length; c++) {
          const char = lines[i][c];

          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            line.push(currentField);
            currentField = "";
          } else {
            currentField += char;
          }
        }

        // Don't forget the last field
        line.push(currentField);

        // Get service provider name
        const name = line[nameIdxHeader]?.trim();

        if (!name) {
          console.warn(`Skipping line ${i + 1} due to missing name`);
          continue;
        }

        // Get the choiceId value
        const choiceId = line[choiceIdxHeader]?.trim();
        // Parse choiceId as a number, defaulting to line index if invalid
        const parsedChoiceId = choiceId ? parseInt(choiceId, 10) : i;
        // Use line index as fallback if parsing results in NaN
        const finalChoiceId = isNaN(parsedChoiceId) ? i : parsedChoiceId;

        // Check if this is the "None Below" option
        const isNoneBelow =
          name.toLowerCase() === "none below" ||
          name.toLowerCase() === "none of the below";

        // Parse budget values - handle values with commas
        let basicBudget = 0;
        let extendedBudget = 0;

        if (basicBudgetIdxHeader !== -1 && line[basicBudgetIdxHeader]) {
          // Remove quotes and commas for parsing
          const basicBudgetStr = line[basicBudgetIdxHeader].replace(
            /[",]/g,
            ""
          );
          basicBudget = parseInt(basicBudgetStr, 10);
        }

        if (extendedBudgetIdxHeader !== -1 && line[extendedBudgetIdxHeader]) {
          // Remove quotes and commas for parsing
          const extendedBudgetStr = line[extendedBudgetIdxHeader].replace(
            /[",]/g,
            ""
          );
          extendedBudget = parseInt(extendedBudgetStr, 10);
        }

        // Parse isSpp1 flag (default to false if not present)
        let isSpp1 = false;
        if (isSppIdxHeader !== -1 && line[isSppIdxHeader]) {
          const isSpp1Value = line[isSppIdxHeader].trim().toUpperCase();
          isSpp1 =
            isSpp1Value === "TRUE" ||
            isSpp1Value === "YES" ||
            isSpp1Value === "1";
        }

        // Create service provider object
        // If it's "None Below", set budget values to 0
        serviceProviderData[name] = {
          basicBudget: isNoneBelow ? 0 : isNaN(basicBudget) ? 0 : basicBudget,
          extendedBudget: isNoneBelow
            ? 0
            : isNaN(extendedBudget)
            ? 0
            : extendedBudget,
          isSpp1: isNoneBelow ? false : isSpp1,
          isNoneBelow: isNoneBelow,
          choiceId: finalChoiceId,
        };
      }
    } else {
      // Try standard format for backward compatibility
      const nameIndex = header.findIndex((col) => col.toLowerCase() === "name");
      const basicBudgetIndex = header.findIndex(
        (col) => col.toLowerCase() === "basicbudget"
      );
      const extendedBudgetIndex = header.findIndex(
        (col) => col.toLowerCase() === "extendedbudget"
      );
      const isSpp1Index = header.findIndex(
        (col) => col.toLowerCase() === "isspp1"
      );

      // Validate required columns exist
      if (
        nameIndex === -1 ||
        basicBudgetIndex === -1 ||
        extendedBudgetIndex === -1
      ) {
        throw new Error(
          "CSV file must contain service provider data columns (Name, budget, etc.)"
        );
      }

      // Process each service provider line
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].split(",");

        // Skip if there aren't enough columns
        if (
          line.length <=
          Math.max(nameIndex, basicBudgetIndex, extendedBudgetIndex)
        ) {
          console.warn(`Skipping line ${i + 1} - not enough columns`);
          continue;
        }

        // Get service provider name
        const name = line[nameIndex].trim();

        if (!name) {
          console.warn(`Skipping line ${i + 1} due to missing name`);
          continue;
        }

        // Check if this is the "None Below" option
        const isNoneBelow =
          name.toLowerCase() === "none below" ||
          name.toLowerCase() === "none of the below";

        // Parse budget values
        const basicBudget = parseInt(line[basicBudgetIndex], 10);
        const extendedBudget = parseInt(line[extendedBudgetIndex], 10);

        // Parse isSpp1 flag (default to false if not present)
        let isSpp1 = false;
        if (isSpp1Index !== -1 && line[isSpp1Index]) {
          const isSpp1Value = line[isSpp1Index].trim().toLowerCase();
          isSpp1 =
            isSpp1Value === "true" ||
            isSpp1Value === "yes" ||
            isSpp1Value === "1";
        }

        // Create service provider object
        serviceProviderData[name] = {
          basicBudget: isNoneBelow ? 0 : isNaN(basicBudget) ? 0 : basicBudget,
          extendedBudget: isNoneBelow
            ? 0
            : isNaN(extendedBudget)
            ? 0
            : extendedBudget,
          isSpp1: isNoneBelow ? false : isSpp1,
          isNoneBelow: isNoneBelow,
          // For backward compatibility format, we use the line index + 1 as the choiceId
          choiceId: i,
        };
      }
    }

    if (Object.keys(serviceProviderData).length === 0) {
      throw new Error("No valid service providers found in CSV file");
    }

    return serviceProviderData;
  } catch (error) {
    console.error("Error loading service providers from CSV:", error);
    throw new Error(
      `Failed to load service providers from CSV: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Gets choice options from the CSV file
 *
 * @returns {Array} - Array of choice option names
 */
function getChoiceOptions() {
  try {
    console.log("Loading choice options from CSV...");
    const choices = loadChoiceOptions(CHOICES_CSV_PATH);
    return choices;
  } catch (error) {
    console.error("Error loading choice options:", error);
    throw error;
  }
}

/**
 * Gets service provider data
 * 
 * @returns ProviderData
 */
export const getServiceProviderData = () => {
  try {
    console.log("Loading service provider data from CSV...");
    // We're using the choices.csv file for service provider data
    const providers = loadServiceProvidersFromCsv(CHOICES_CSV_PATH);
    return providers;
  } catch (error) {
    console.error("Error loading service provider data:", error);
    throw error;
  }
};

/**
 * Prepares votes from CSV file
 * 
 * @returns Promise<void>
 */
export async function prepareVotesFromCsv() {
  try {
    // Load choice options from CSV
    const choiceOptions = getChoiceOptions();

    // Convert votes from CSV to JSON and save to mocked-votes.json
    console.log(`Converting votes from ${VOTES_CSV_PATH} to JSON format...`);

    convertVotesFromCsv(VOTES_CSV_PATH, choiceOptions, LOCAL_DATA_PATH);
    console.log(`Votes converted from CSV and saved to ${LOCAL_DATA_PATH}`);
  } catch (error) {
    console.error("Error preparing votes from CSV:", error);
    throw error;
  }
}

/**
 * Loads full choice data from a CSV file
 * 
 * @param csvFilePath - Path to the CSV file containing choice options
 * @returns Array of choice data objects
 */
export function loadChoiceData(csvFilePath: string): Array<{ choiceId: string; choiceName: string; budgetAmount: string; isSpp1: string }> {
  try {
    const resolvedPath = resolvePath(csvFilePath);

    // Read the CSV file
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }

    const csvData = fs.readFileSync(resolvedPath, "utf8");
    const lines = csvData.trim().split("\n");

    if (lines.length === 0) {
      throw new Error("CSV file is empty");
    }

    // Parse header to determine column structure
    const header = lines[0].split(",").map(col => col.trim());
    
    // Get column indices
    const choiceIdIndex = header.findIndex(col => col.toLowerCase() === "choiceid");
    const choiceNameIndex = header.findIndex(col => col.toLowerCase() === "choicename");
    const budgetAmountIndex = header.findIndex(col => col.toLowerCase() === "budgetamount");
    const isSpp1Index = header.findIndex(col => col.toLowerCase() === "isspp1");

    if (choiceIdIndex === -1 || choiceNameIndex === -1 || budgetAmountIndex === -1 || isSpp1Index === -1) {
      throw new Error("CSV file is missing required columns");
    }

    const choices = [];

    // Start from the second line (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].split(",");
      
      // Skip if there aren't enough columns
      if (line.length <= Math.max(choiceIdIndex, choiceNameIndex, budgetAmountIndex, isSpp1Index)) {
        console.warn(`Skipping line ${i + 1} - not enough columns`);
        continue;
      }

      choices.push({
        choiceId: line[choiceIdIndex].trim(),
        choiceName: line[choiceNameIndex].trim(),
        budgetAmount: line[budgetAmountIndex].trim(),
        isSpp1: line[isSpp1Index].trim()
      });
    }

    if (choices.length === 0) {
      throw new Error("No valid choices found in CSV file");
    }

    return choices;
  } catch (error) {
    console.error("Error loading choice data from CSV:", error);
    throw new Error(
      `Failed to load choice data from CSV: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
