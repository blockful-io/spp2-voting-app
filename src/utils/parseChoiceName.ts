import { BudgetType, ParsedChoice } from "./types";

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
    choiceName.toLowerCase().includes("none") &&
    (choiceName.toLowerCase().includes("below") ||
      choiceName.toLowerCase().includes("of the"))
  ) {
    return { name: choiceName, budgetType: "none" };
  }

  // Check if the choice name contains " - " to indicate a budget type
  if (choiceName.includes(" - ")) {
    const [name, budgetType] = choiceName.split(" - ");

    // Convert "ext" to "extended" but keep "basic" as is
    const normalizedBudgetType: BudgetType =
      budgetType.toLowerCase() === "ext" ? "extended" : "basic";

    return { name: name.trim(), budgetType: normalizedBudgetType };
  }

  // If no budget type specified, default to "basic"
  return { name: choiceName.trim(), budgetType: "basic" };
}
