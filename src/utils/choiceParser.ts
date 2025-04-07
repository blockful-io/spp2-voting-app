/**
 * Choice Parser Utilities
 * 
 * This module provides functions to parse service provider names and budget types
 * from choice option strings in the voting data.
 * 
 * It extracts the base service provider name and budget type (basic or extended)
 * from the formatted choice names like "provider - basic" or "provider - ext".
 */

import { Choice, ParsedChoice, ServiceProviderData, BudgetType } from './types';

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
    const normalizedBudgetType: BudgetType = budgetType.toLowerCase() === "ext" ? "extended" : "basic";
    
    return { name: name.trim(), budgetType: normalizedBudgetType };
  }
  
  // If no budget type specified, default to "basic"
  return { name: choiceName.trim(), budgetType: "basic" };
}

/**
 * Checks if two choice names belong to the same service provider
 * 
 * @param choiceName1 - First choice name
 * @param choiceName2 - Second choice name
 * @returns True if both choices are from the same service provider
 */
export function isSameServiceProvider(choiceName1: string, choiceName2: string): boolean {
  // Special case: None Below is always its own group
  if (
    (choiceName1.toLowerCase().includes("none") && choiceName1.toLowerCase().includes("below")) ||
    (choiceName2.toLowerCase().includes("none") && choiceName2.toLowerCase().includes("below"))
  ) {
    return false;
  }
  
  const parsed1 = parseChoiceName(choiceName1);
  const parsed2 = parseChoiceName(choiceName2);
  
  // If base names match, they're from the same provider
  return parsed1.name === parsed2.name;
}

/**
 * Group choices by service provider
 * 
 * @param choices - Array of choice names
 * @returns Map of base provider name to array of full choice names
 */
export function groupChoicesByProvider(choices: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  
  choices.forEach(choice => {
    const { name } = parseChoiceName(choice);
    
    if (!groups.has(name)) {
      groups.set(name, []);
    }
    
    groups.get(name)?.push(choice);
  });
  
  return groups;
}

/**
 * Reorders a vote's choices to ensure options from the same provider are grouped together
 * 
 * @param choices - Original array of choice indexes (1-indexed)
 * @param choiceNames - Array of all available choice names
 * @returns Reordered array of choice indexes
 */
export function reorderChoicesByProvider(choices: number[], choiceNames: string[]): number[] {
  if (choices.length <= 1) return choices;
  
  // Convert 1-indexed to 0-indexed for processing
  const zeroIndexedChoices = choices.map(c => c - 1);
  
  // Create an array to store processed providers
  const processedProviders: string[] = [];
  const result: number[] = [];
  
  // Process each choice in order
  for (const choiceIdx of zeroIndexedChoices) {
    if (choiceIdx < 0 || choiceIdx >= choiceNames.length) continue;
    
    const { name: providerName } = parseChoiceName(choiceNames[choiceIdx]);
    
    // If we haven't processed this provider yet
    if (!processedProviders.includes(providerName)) {
      // Find all choices from the same provider
      const providerChoices = zeroIndexedChoices.filter(idx => {
        const { name } = parseChoiceName(choiceNames[idx]);
        return name === providerName;
      });
      
      // Add all choices from this provider to the result
      result.push(...providerChoices);
      
      // Mark this provider as processed
      processedProviders.push(providerName);
    }
  }
  
  // Convert back to 1-indexed
  return result.map(c => c + 1);
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