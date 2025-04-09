# Voting Mechanism and Capital Allocation

This document outlines the proposed algorithm for vote processing and budget allocation in the Service Provider Program 2.

## Copeland Ranking Method

The application employs the Copeland method, a pairwise comparison voting system that ranks candidates based on their performance in head-to-head matchups.

### Vote Processing Algorithm

1. **Preprocessing**: 
   - Votes are reordered to ensure options from the same provider are adjacent in each voter's ranking.
   - For providers with both basic and extended budget options, if a voter ranks one option, the algorithm enforces the other option to be ranked immediately after.
   - If a provider has only one budget option, no special reordering is needed for that provider.
   - This grouping ensures accurate pairwise comparisons between different budget options from the same provider and between different providers.

2. **Pairwise Comparisons**:
   - For each pair of candidates, we calculate the total voting power supporting each candidate over the other.
   - A candidate wins a head-to-head matchup if the total voting power ranking them higher exceeds that of their opponent.
   - Each win contributes to a candidate's Copeland score.
   - Voting power (vp) is considered for each vote rather than simply counting voters, allowing for weighted voting.

3. **"None Below" Handling**:
   - The "None Below" option serves as a cutoff point in a voter's ranking.
   - Candidates ranked above "None Below" are considered preferred.
   - Candidates ranked below "None Below" or not ranked at all are considered rejected by that voter.
   - A ranked candidate always wins against an unranked candidate in pairwise comparisons.

4. **Scoring and Ranking**:
   - Candidates receive 1 point for each head-to-head victory against candidates from different providers.
   - Ties are broken by average voter support (the average number of votes received across all matchups).
   - Candidates are ranked by their Copeland score (descending), with average support as a tiebreaker.

5. **Postprocessing**:
   - After initial ranking, we perform provider-level filtering.
   - For each service provider, only their highest-ranked option is kept in the final results.
   - Head-to-head matches are filtered to include only:
     - Internal matches between options from the same provider
     - Matches between the highest-ranked candidates of different providers
     - Matches involving the "None Below" option

### Allocation Process

1. **Budget Type Determination**:
   - Each provider's budget (basic or extended) is determined by their internal head-to-head match result.

2. **Stream Allocation**:
   - Candidates are processed in Copeland ranking order.
   - Top 5 candidates who participated in SPP1 receive allocations from the 2-year stream.
   - All other candidates receive allocations from the 1-year stream.
   - If a candidate is ranked below "None Below", they're rejected regardless of budget availability.

3. **Budget Transfer Mechanism**:
   - After processing the top 5 candidates, any remaining 2-year budget transfers to the 1-year stream.
   - Final 1-year budget = (Initial 1-year budget) + (Leftover 2-year budget)

4. **Rejection Criteria**:
   - A candidate is rejected if:
     - They're ranked below the "None Below" option
     - There's insufficient budget
