/**
 * Choice Parser Utilities
 *
 * This module provides functions to parse service provider names and budget types
 * from choice option strings in the voting data.
 *
 * It extracts the base service provider name and budget type (basic or extended)
 * from the formatted choice names like "provider - basic" or "provider - ext".
 */

import { Choice } from "./types";
import { loadChoiceData } from "./csvUtils";
import { parseChoiceName } from "./parseChoiceName";

/**
 * Checks if two choice names belong to the same service provider
 *
 * @param choiceName1 - First choice name
 * @param choiceName2 - Second choice name
 * @returns True if both choices are from the same service provider
 */
export function isSameServiceProvider(
  choiceName1: string,
  choiceName2: string
): boolean {
  // Special case: None Below is always its own group
  if (
    (choiceName1.toLowerCase().includes("none") &&
      choiceName1.toLowerCase().includes("below")) ||
    (choiceName2.toLowerCase().includes("none") &&
      choiceName2.toLowerCase().includes("below"))
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
export function groupChoicesByProvider(
  choices: string[]
): Map<string, string[]> {
  const groups = new Map<string, string[]>();

  choices.forEach((choice) => {
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
export function reorderChoicesByProvider(
  choices: number[],
  choiceNames: string[]
): number[] {
  if (choices.length <= 1) return choices;

  // Convert 1-indexed to 0-indexed for processing
  const zeroIndexedChoices = choices.map((c) => c - 1);

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
      const providerChoices = zeroIndexedChoices.filter((idx) => {
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
  return result.map((c) => c + 1);
}

/**
 * Process an entire set of service provider data and create Choice objects with parsed names
 *
 * @returns Array of Choice objects with parsed name and budget type information
 */
export function getChoicesData(): Choice[] {
  // Read choices from CSV file
  const choices = loadChoiceData("choices.csv");

  return choices.map((row) => {
    const { name: parsedName, budgetType } = parseChoiceName(row.choiceName);
    return {
      name: row.choiceName, // Base provider name (e.g., "sp b")
      providerName: parsedName, // Base provider name without budget type
      budget: Number(row.budgetAmount), // Budget amount from CSV
      isSpp1: row.isSpp1 === "TRUE", // SPP1 status from CSV
      isNoneBelow: row.choiceName.toLowerCase().includes("none below"), // Whether this is the "None Below" indicator
      choiceId: Number(row.choiceId), // Choice ID from CSV
      budgetType, // Budget type: "basic", "extended", or "none"
    };
  });
}
