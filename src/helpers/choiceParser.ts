/**
 * Choice Parser Utilities
 * 
 * This module provides functions to parse service provider names and budget types
 * from choice options in the voting data.
 */

/**
 * Interface for parsed choice information
 */
export interface ParsedChoice {
  name: string;       // The service provider name (without budget type)
  budgetType: string; // Either "basic" or "extended"
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
  if (
    choiceName.toLowerCase() === "none below" || 
    choiceName.toLowerCase() === "none of the below"
  ) {
    return {
      name: choiceName,
      budgetType: "none"
    };
  }

  // Check if the choice name contains " - " to indicate a budget type
  if (choiceName.includes(" - ")) {
    const [name, budgetType] = choiceName.split(" - ");
    
    // Convert "ext" to "extended" but keep "basic" as is
    const normalizedBudgetType = 
      budgetType.toLowerCase() === "ext" ? "extended" : budgetType.toLowerCase();
    
    return {
      name: name.trim(),
      budgetType: normalizedBudgetType
    };
  }
  
  // If no budget type specified, default to "basic"
  return {
    name: choiceName.trim(),
    budgetType: "basic"
  };
}

/**
 * Applies parsed choice information to an array of choices
 * 
 * @param choices - Array of choice objects
 * @returns The same array with added name and budgetType properties
 */
export function parseChoices<T extends { name: string }>(choices: T[]): (T & ParsedChoice)[] {
  return choices.map(choice => {
    const parsed = parseChoiceName(choice.name);
    return {
      ...choice,
      name: parsed.name,
      budgetType: parsed.budgetType
    };
  });
} 