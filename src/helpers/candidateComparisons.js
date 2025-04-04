/**
 * Helper functions for extracting candidate comparison data for the frontend
 */

/**
 * Get all head-to-head match results for a specific candidate
 * 
 * This function extracts all matches involving a specific candidate 
 * and formats them for display in the frontend. Results are sorted 
 * by votes in favor of the specified candidate (descending).
 * 
 * @param {String} candidateName - The name of the candidate to get results for
 * @param {Array} headToHeadMatches - Array of head-to-head match results from processCopelandRanking
 * @returns {Array} - Formatted array of match results for the candidate
 */
function getCandidateHeadToHeadResults(candidateName, headToHeadMatches) {
  if (!candidateName || !headToHeadMatches || !Array.isArray(headToHeadMatches)) {
    console.error(`Invalid arguments: candidateName=${candidateName}, headToHeadMatches=${typeof headToHeadMatches}`);
    return [];
  }
  
  // Find all matches where this candidate is involved
  const candidateMatches = headToHeadMatches.filter(match => 
    match.candidate1 === candidateName || match.candidate2 === candidateName
  );
  
  if (candidateMatches.length === 0) {
    console.warn(`No matches found for candidate: ${candidateName}`);
    return [];
  }
  
  // Format each match with the target candidate always as "candidate1"
  const formattedMatches = candidateMatches.map(match => {
    if (match.candidate1 === candidateName) {
      return {
        candidate1: {
          name: match.candidate1,
          candidateVotes: match.candidate1Votes
        },
        candidate2: {
          name: match.candidate2,
          candidateVotes: match.candidate2Votes
        },
        totalVotes: match.totalVotes,
        winner: match.winner
      };
    } else {
      return {
        candidate1: {
          name: match.candidate2,
          candidateVotes: match.candidate2Votes
        },
        candidate2: {
          name: match.candidate1,
          candidateVotes: match.candidate1Votes
        },
        totalVotes: match.totalVotes,
        winner: match.winner === match.candidate1 ? match.candidate1 : 
               match.winner === match.candidate2 ? match.candidate2 : 
               "Tie"
      };
    }
  });
  
  // Sort the results by votes in favor of the specified candidate (descending)
  formattedMatches.sort((a, b) => b.candidate1.candidateVotes - a.candidate1.candidateVotes);
  
  return formattedMatches;
}

module.exports = {
  getCandidateHeadToHeadResults
}; 