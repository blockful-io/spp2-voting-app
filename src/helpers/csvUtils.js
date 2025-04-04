/**
 * CSV Utilities for the Service Provider Program Allocation
 * 
 * This module provides functions to:
 * 1. Convert votes from a CSV file to the mocked-votes.json format
 * 2. Load service provider metadata from a CSV file instead of hardcoding
 * 3. Load choice options from a CSV file
 */

const fs = require('fs');
const path = require('path');

/**
 * Resolves a relative path from the current directory
 * 
 * @param {String} filePath - The file path to resolve
 * @returns {String} - The resolved absolute path
 */
function resolvePath(filePath) {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return path.resolve(__dirname, filePath);
  }
  return filePath;
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
 * @param {String} csvFilePath - Path to the CSV file containing choice options
 * @returns {Array} - Array of choice options
 */
function loadChoiceOptions(csvFilePath) {
  try {
    const resolvedPath = resolvePath(csvFilePath);
    console.log(`Loading choice options from CSV file: ${resolvedPath}`);
    
    // Read the CSV file
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }
    
    const csvData = fs.readFileSync(resolvedPath, 'utf8');
    const lines = csvData.trim().split('\n');
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }
    
    // Parse header to determine column structure
    const header = lines[0].split(',');
    
    // First check if this is in the specific format for choices.csv
    const choiceIdxHeader = header.findIndex(col => col.toLowerCase() === 'choice');
    const nameIdxHeader = header.findIndex(col => col.toLowerCase() === 'name');
    
    // If choices.csv format (has Choice,Name columns)
    if (choiceIdxHeader !== -1 && nameIdxHeader !== -1) {
      console.log('Detected choices.csv special format with Choice,Name columns');
      const options = [];
      
      // Start from the second line (skip header)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].split(',');
        
        // Skip if there aren't enough columns
        if (line.length <= Math.max(choiceIdxHeader, nameIdxHeader)) {
          console.warn(`Skipping line ${i+1} - not enough columns`);
          continue;
        }
        
        // Get the name of the choice
        const name = line[nameIdxHeader].trim();
        
        if (name) {
          options.push(name);
          console.log(`  Added choice option: ${name}`);
        }
      }
      
      if (options.length === 0) {
        throw new Error('No valid choices found in CSV file');
      }
      
      console.log(`Successfully loaded ${options.length} choice options from CSV`);
      return options;
    }
    // Standard format with just name column
    else {
      const nameIndex = header.findIndex(col => col.toLowerCase() === 'name');
      
      if (nameIndex !== -1) {
        console.log('Found standard format with name column');
        const options = [];
        
        // Start from the second line (skip header)
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].split(',');
          
          // Skip if there aren't enough columns
          if (line.length <= nameIndex) {
            console.warn(`Skipping line ${i+1} - not enough columns`);
            continue;
          }
          
          // Get the name of the choice
          const name = line[nameIndex].trim();
          
          if (name) {
            options.push(name);
            console.log(`  Added choice option: ${name}`);
          }
        }
        
        if (options.length === 0) {
          throw new Error('No valid choices found in CSV file');
        }
        
        console.log(`Successfully loaded ${options.length} choice options from CSV`);
        return options;
      }
      // Fallback to simple list format
      else {
        console.log('No header found, treating each line as a choice name');
        const options = [];
        
        // Process each line as a choice
        for (let i = 0; i < lines.length; i++) {
          const name = lines[i].trim();
          if (name) {
            options.push(name);
            console.log(`  Added choice option: ${name}`);
          }
        }
        
        if (options.length === 0) {
          throw new Error('No valid choices found in CSV file');
        }
        
        console.log(`Successfully loaded ${options.length} choice options from CSV`);
        return options;
      }
    }
  } catch (error) {
    console.error('Error loading choice options from CSV:', error);
    throw new Error(`Failed to load choice options from CSV: ${error.message}`);
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
function convertVotesFromCsv(csvFilePath, choiceOptions, outputPath = null) {
  try {
    const resolvedCsvPath = resolvePath(csvFilePath);
    console.log(`Loading votes from CSV file: ${resolvedCsvPath}`);
    
    // Read the CSV file
    if (!fs.existsSync(resolvedCsvPath)) {
      throw new Error(`File not found: ${resolvedCsvPath}`);
    }
    
    const csvData = fs.readFileSync(resolvedCsvPath, 'utf8');
    const lines = csvData.trim().split('\n');
    
    // Parse header to determine column structure
    const header = lines[0].split(',');
    
    // Find column indexes - support both formats
    let voterIndex = header.findIndex(col => col.toLowerCase() === 'voter');
    let vpIndex = header.findIndex(col => col.toLowerCase() === 'vp');
    
    // Handle the alternative format from votes.csv
    if (voterIndex === -1) {
      voterIndex = header.findIndex(col => col.toLowerCase() === 'name');
    }
    
    if (vpIndex === -1) {
      vpIndex = header.findIndex(col => col.toLowerCase() === 'votes');
    }
    
    // Validate required columns exist
    if (voterIndex === -1 || vpIndex === -1) {
      throw new Error('CSV file must contain "Name/voter" and "Votes/vp" columns');
    }
    
    console.log(`Found voter column at index ${voterIndex} and voting power column at index ${vpIndex}`);
    console.log(`Available choice options: ${choiceOptions.join(', ')}`);
    
    // Prepare result structure
    const votes = [];
    
    // Process each vote line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].split(',');
      
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
        if (j !== voterIndex && j !== vpIndex && 
            (header[j].toLowerCase().includes('choice') || 
             header[j].match(/^choice\d+$/i) ||
             j > Math.max(voterIndex, vpIndex))) { // Assume columns after voter/vp are choices
          choiceColumns.push(j);
        }
      }
      
      console.log(`Found ${choiceColumns.length} choice columns`);
      
      // Get choices from each choice column
      for (let j of choiceColumns) {
        if (j < line.length && line[j]) {
          const choiceName = line[j].trim();
          rankedChoices.push(choiceName);
          
          // Find the index of the choice in the choiceOptions array (1-indexed for Snapshot)
          const choiceIndex = choiceOptions.findIndex(opt => opt === choiceName);
          
          if (choiceIndex !== -1) {
            // In Snapshot, choices are 1-indexed
            choiceArr.push(choiceIndex + 1);
          } else {
            console.warn(`Unknown choice "${choiceName}" in line ${i + 1}`);
          }
        }
      }
      
      if (choiceArr.length === 0) {
        console.warn(`No valid choices found for voter ${voter} in line ${i + 1}`);
        continue;
      }
      
      console.log(`Processed vote from ${voter} with choices: ${rankedChoices.join(' > ')}`);
      
      // Create a vote object in the expected format
      votes.push({
        voter,
        vp,
        choice: choiceArr,
        proposal: {
          choices: choiceOptions
        }
      });
    }
    
    if (votes.length === 0) {
      throw new Error('No valid votes found in the CSV file');
    }
    
    // Create the final structure matching mocked-votes.json
    const result = {
      data: {
        votes
      }
    };
    
    // Save to file if outputPath is provided
    if (outputPath) {
      const resolvedOutputPath = resolvePath(outputPath);
      fs.writeFileSync(resolvedOutputPath, JSON.stringify(result, null, 2));
      console.log(`Converted votes saved to ${resolvedOutputPath}`);
    }
    
    console.log(`Successfully converted ${votes.length} votes from CSV`);
    return result;
  } catch (error) {
    console.error('Error converting votes from CSV:', error);
    throw new Error(`Failed to convert votes from CSV: ${error.message}`);
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
function loadServiceProvidersFromCsv(csvFilePath) {
  try {
    const resolvedPath = resolvePath(csvFilePath);
    console.log(`Loading service provider data from CSV file: ${resolvedPath}`);
    
    // Read the CSV file
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }
    
    const csvData = fs.readFileSync(resolvedPath, 'utf8');
    const lines = csvData.trim().split('\n');
    
    // Parse header to determine column structure
    const header = lines[0].split(',');
    
    // First check if this is in the specific format for choices.csv (our service provider data)
    const choiceIdxHeader = header.findIndex(col => col.toLowerCase() === 'choice');
    const nameIdxHeader = header.findIndex(col => col.toLowerCase() === 'name');
    const basicBudgetIdxHeader = header.findIndex(col => col.toLowerCase().includes('basic') && col.toLowerCase().includes('budget'));
    const extendedBudgetIdxHeader = header.findIndex(col => col.toLowerCase().includes('extended') && col.toLowerCase().includes('budget'));
    const isSppIdxHeader = header.findIndex(col => col.toLowerCase().includes('spp'));
    
    // Prepare result structure
    const serviceProviderData = {};
    
    // Check if we have the choices.csv format
    if (nameIdxHeader !== -1 && (basicBudgetIdxHeader !== -1 || extendedBudgetIdxHeader !== -1)) {
      console.log(`Found service provider CSV header format with columns: ${header.join(', ')}`);
      
      // Process each service provider line
      for (let i = 1; i < lines.length; i++) {
        // Handle quoted fields with commas by splitting carefully
        let line = [];
        let currentField = '';
        let inQuotes = false;
        
        for (let c = 0; c < lines[i].length; c++) {
          const char = lines[i][c];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            line.push(currentField);
            currentField = '';
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
        
        // Check if this is the "None Below" option
        const isNoneBelow = name.toLowerCase() === "none below" || name.toLowerCase() === "none of the below";
        
        // Parse budget values - handle values with commas
        let basicBudget = 0;
        let extendedBudget = 0;
        
        if (basicBudgetIdxHeader !== -1 && line[basicBudgetIdxHeader]) {
          // Remove quotes and commas for parsing
          const basicBudgetStr = line[basicBudgetIdxHeader].replace(/[",]/g, '');
          basicBudget = parseInt(basicBudgetStr, 10);
        }
        
        if (extendedBudgetIdxHeader !== -1 && line[extendedBudgetIdxHeader]) {
          // Remove quotes and commas for parsing
          const extendedBudgetStr = line[extendedBudgetIdxHeader].replace(/[",]/g, '');
          extendedBudget = parseInt(extendedBudgetStr, 10);
        }
        
        // Parse isSpp1 flag (default to false if not present)
        let isSpp1 = false;
        if (isSppIdxHeader !== -1 && line[isSppIdxHeader]) {
          const isSpp1Value = line[isSppIdxHeader].trim().toUpperCase();
          isSpp1 = isSpp1Value === 'TRUE' || isSpp1Value === 'YES' || isSpp1Value === '1';
        }
        
        // Create service provider object
        // If it's "None Below", set budget values to 0
        serviceProviderData[name] = {
          basicBudget: isNoneBelow ? 0 : (isNaN(basicBudget) ? 0 : basicBudget),
          extendedBudget: isNoneBelow ? 0 : (isNaN(extendedBudget) ? 0 : extendedBudget),
          isSpp1: isNoneBelow ? false : isSpp1,
          isNoneBelow: isNoneBelow
        };
        
        if (isNoneBelow) {
          console.log(`Loaded "None Below" option: ${name}`);
        } else {
          console.log(`Loaded service provider: ${name} (Basic: ${basicBudget}, Extended: ${extendedBudget}, SPP1: ${isSpp1})`);
        }
      }
    } else {
      // Try standard format for backward compatibility
      const nameIndex = header.findIndex(col => col.toLowerCase() === 'name');
      const basicBudgetIndex = header.findIndex(col => col.toLowerCase() === 'basicbudget');
      const extendedBudgetIndex = header.findIndex(col => col.toLowerCase() === 'extendedbudget');
      const isSpp1Index = header.findIndex(col => col.toLowerCase() === 'isspp1');
      
      // Validate required columns exist
      if (nameIndex === -1 || basicBudgetIndex === -1 || extendedBudgetIndex === -1) {
        throw new Error('CSV file must contain service provider data columns (Name, budget, etc.)');
      }
      
      // Process each service provider line
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].split(',');
        
        // Skip if there aren't enough columns
        if (line.length <= Math.max(nameIndex, basicBudgetIndex, extendedBudgetIndex)) {
          console.warn(`Skipping line ${i+1} - not enough columns`);
          continue;
        }
        
        // Get service provider name
        const name = line[nameIndex].trim();
        
        if (!name) {
          console.warn(`Skipping line ${i + 1} due to missing name`);
          continue;
        }
        
        // Check if this is the "None Below" option
        const isNoneBelow = name.toLowerCase() === "none below" || name.toLowerCase() === "none of the below";
        
        // Parse budget values
        const basicBudget = parseInt(line[basicBudgetIndex], 10);
        const extendedBudget = parseInt(line[extendedBudgetIndex], 10);
        
        // Parse isSpp1 flag (default to false if not present)
        let isSpp1 = false;
        if (isSpp1Index !== -1 && line[isSpp1Index]) {
          const isSpp1Value = line[isSpp1Index].trim().toLowerCase();
          isSpp1 = isSpp1Value === 'true' || isSpp1Value === 'yes' || isSpp1Value === '1';
        }
        
        // Create service provider object
        serviceProviderData[name] = {
          basicBudget: isNoneBelow ? 0 : (isNaN(basicBudget) ? 0 : basicBudget),
          extendedBudget: isNoneBelow ? 0 : (isNaN(extendedBudget) ? 0 : extendedBudget),
          isSpp1: isNoneBelow ? false : isSpp1,
          isNoneBelow: isNoneBelow
        };
      }
    }
    
    if (Object.keys(serviceProviderData).length === 0) {
      throw new Error('No valid service providers found in CSV file');
    }
    
    console.log(`Successfully loaded ${Object.keys(serviceProviderData).length} service providers from CSV`);
    console.log(serviceProviderData);
    return serviceProviderData;
  } catch (error) {
    console.error('Error loading service providers from CSV:', error);
    throw new Error(`Failed to load service providers from CSV: ${error.message}`);
  }
}

module.exports = {
  convertVotesFromCsv,
  loadServiceProvidersFromCsv,
  loadChoiceOptions,
  resolvePath
}; 