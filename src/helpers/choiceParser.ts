/**
 * Choice Parser Utilities
 * 
 * This module provides functions to parse service provider names and budget types
 * from choice option strings in the voting data.
 * 
 * It extracts the base service provider name and budget type (basic or extended)
 * from the formatted choice names like "provider - basic" or "provider - ext".
 */

import { Choice } from './votingResults';

/**
 * Interface for parsed choice information
 */
export interface ParsedChoice {
  name: string;       // The service provider name (without budget type)
  budgetType: string; // "basic", "extended", or "none" for None Below
}

/**
 * Service provider data structure as received from CSV
 */
export interface ServiceProviderData {
  basicBudget: number;      // Basic budget amount in USD
  extendedBudget: number;   // Extended budget amount in USD
  isSpp1: boolean;          // Whether provider was part of SPP1
  isNoneBelow: boolean;     // Whether this is the "None Below" indicator
  choiceId: number;         // Numeric ID of the choice
}

/**
 * Parses a choice option name to extract the service provider name and budget type
 * 
 * Format examples:
 * - "service provider name - basic" -> { name: "service provider name", budgetType: "basic" }
 * - "service provider name - ext" -> { name: "service provider name", budgetType: "extended" }
 * - "service provider name" -> { name: "service provider name", budgetType: "basic" }
 * - "None below" -> { name: "None below", budgetType: "none" }
 * 
 * @param choiceName - The raw choice name from the voting data
 * @returns The parsed choice with separated name and budget type
 */
export function parseChoiceName(choiceName: string): ParsedChoice {
  // Handle special case for "None below" option
  if (choiceName.toLowerCase().includes("none") && 
      (choiceName.toLowerCase().includes("below") || choiceName.toLowerCase().includes("of the"))) {
    return { name: choiceName, budgetType: "none" };
  }

  // Check if the choice name contains " - " to indicate a budget type
  if (choiceName.includes(" - ")) {
    const [name, budgetType] = choiceName.split(" - ");
    
    // Convert "ext" to "extended" but keep "basic" as is
    const normalizedBudgetType = budgetType.toLowerCase() === "ext" ? "extended" : budgetType.toLowerCase();
    
    return { name: name.trim(), budgetType: normalizedBudgetType };
  }
  
  // If no budget type specified, default to "basic"
  return { name: choiceName.trim(), budgetType: "basic" };
}

/**
 * Process an entire set of service provider data and create Choice objects with parsed names
 * 
 * @param providerData - Service provider data from CSV with structure { [providerName: string]: ServiceProviderData }
 * @returns Array of Choice objects with parsed name and budget type information
 */
export function processChoices(providerData: Record<string, ServiceProviderData>): Choice[] {
  return Object.entries(providerData).map(([name, data]) => {
    const { name: parsedName, budgetType } = parseChoiceName(name);
    return {
      originalName: name,        // Original choice name (e.g., "sp b - basic")
      name: parsedName,          // Base provider name (e.g., "sp b")
      budget: data.basicBudget,  // Budget amount in USD
      isSpp1: data.isSpp1,       // Whether provider was part of SPP1
      isNoneBelow: data.isNoneBelow, // Whether this is the "None Below" indicator
      choiceId: data.choiceId,   // Numeric ID of the choice
      budgetType                 // Budget type: "basic", "extended", or "none"
    };
  });
} 