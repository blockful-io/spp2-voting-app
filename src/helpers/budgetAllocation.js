/**
 * Budget allocation logic for the Service Provider Program
 */

const { 
  TWO_YEAR_STREAM_RATIO, 
  ONE_YEAR_STREAM_RATIO 
} = require('./config');

/**
 * Allocates budgets to service providers based on the program rules
 * 
 * Allocation Rules:
 * 1. SPP1 projects can get 2-year streams with extended budget
 * 2. Any remaining 2-year budget transfers to 1-year stream
 * 3. Other projects can get 1-year streams with extended budget
 * 4. If extended budget doesn't fit, try basic budget
 * 
 * @param {Array} projects - Ranked list of service provider projects
 * @param {Number} yearlyBudget - Total program budget per year
 * @returns {Object} Allocation results and summary statistics
 */
function allocateBudgets(projects, yearlyBudget) {
  // Check if the program should be renewed at all
  if (yearlyBudget === 0) {
    return {
      allocations: projects.map(project => ({
        name: project.name,
        score: project.score,
        averageSupport: project.averageSupport || 0,
        basicBudget: project.basicBudget || 0,
        extendedBudget: project.extendedBudget || 0,
        allocated: false,
        streamDuration: null,
        allocatedBudget: 0,
        rejectionReason: "Program not renewed"
      })),
      summary: {
        votedBudget: 0,
        twoYearStreamBudget: 0,
        oneYearStreamBudget: 0,
        remainingTwoYearBudget: 0,
        remainingOneYearBudget: 0,
        totalAllocated: 0,
        allocatedProjects: 0,
        rejectedProjects: projects.length
      }
    };
  }
  
  // Calculate stream budgets based on the predefined ratios
  const twoYearStreamBudget = yearlyBudget * TWO_YEAR_STREAM_RATIO;
  const oneYearStreamBudget = yearlyBudget * ONE_YEAR_STREAM_RATIO;
  
  // Track remaining budgets
  let remainingTwoYearBudget = twoYearStreamBudget;
  let remainingOneYearBudget = oneYearStreamBudget;
  let transferredBudget = 0;
  
  // Results storage
  const allocations = [];
  
  // Flag to track if any projects qualified for 2-year stream
  let anyQualifiedFor2YearStream = false;
  
  // FIRST PASS: Check for 2-year stream eligibility (SPP1 members only)
  for (const project of projects) {
    // Skip non-SPP1 projects
    if (!project.isSpp1) {
      continue;
    }
    
    // Check if this SPP1 project can get a 2-year stream
    if (project.extendedBudget <= remainingTwoYearBudget) {
      anyQualifiedFor2YearStream = true;
      remainingTwoYearBudget -= project.extendedBudget;
      
      allocations.push({
        name: project.name,
        score: project.score,
        averageSupport: project.averageSupport,
        basicBudget: project.basicBudget,
        extendedBudget: project.extendedBudget,
        allocated: true,
        streamDuration: "2-year",
        allocatedBudget: project.extendedBudget,
        rejectionReason: null
      });
    }
  }
  
  // BUDGET TRANSFER: Move remaining 2-year budget to 1-year stream
  // If no projects qualified for 2-year stream, transfer all 2-year budget to 1-year stream
  if (!anyQualifiedFor2YearStream) {
    transferredBudget = twoYearStreamBudget;
    remainingOneYearBudget += transferredBudget;
    remainingTwoYearBudget = 0;
  }
  // Otherwise, transfer just the remaining 2-year budget to 1-year budget
  else if (remainingTwoYearBudget > 0) {
    transferredBudget = remainingTwoYearBudget;
    remainingOneYearBudget += transferredBudget;
    remainingTwoYearBudget = 0;
  }
  
  // SECOND PASS: Process all projects for 1-year stream
  for (const project of projects) {
    // Skip projects already allocated to 2-year stream
    if (allocations.some(p => p.name === project.name)) {
      continue;
    }
    
    // Initialize allocation data for this project
    const allocation = {
      name: project.name,
      score: project.score,
      averageSupport: project.averageSupport || 0,
      basicBudget: project.basicBudget,
      extendedBudget: project.extendedBudget,
      allocated: false,
      streamDuration: null,
      allocatedBudget: 0,
      rejectionReason: null
    };
    
    // Try to allocate from 1-year stream
    // First try extended budget
    if (project.extendedBudget <= remainingOneYearBudget) {
      allocation.streamDuration = "1-year";
      allocation.allocatedBudget = project.extendedBudget;
      remainingOneYearBudget -= project.extendedBudget;
      allocation.allocated = true;
    } 
    // Then try basic budget
    else if (project.basicBudget <= remainingOneYearBudget) {
      allocation.streamDuration = "1-year";
      allocation.allocatedBudget = project.basicBudget;
      remainingOneYearBudget -= project.basicBudget;
      allocation.allocated = true;
    }
    // Set rejection reason if not allocated
    else {
      allocation.rejectionReason = "Insufficient budget remaining";
    }
    
    allocations.push(allocation);
  }
  
  // Calculate summary statistics
  const totalAllocated = twoYearStreamBudget - remainingTwoYearBudget + 
                         oneYearStreamBudget - remainingOneYearBudget;
  
  const summary = {
    votedBudget: yearlyBudget,
    // Initial budgets
    twoYearStreamBudget,
    oneYearStreamBudget,
    // Budget transfers
    transferredBudget,
    // Adjusted budgets after transfers
    adjustedTwoYearBudget: twoYearStreamBudget - transferredBudget,
    adjustedOneYearBudget: oneYearStreamBudget + transferredBudget,
    // Remaining budgets after allocation
    remainingTwoYearBudget,
    remainingOneYearBudget,
    // Overall statistics
    totalAllocated,
    unspentBudget: remainingTwoYearBudget + remainingOneYearBudget,
    allocatedProjects: allocations.filter(p => p.allocated).length,
    rejectedProjects: allocations.filter(p => !p.allocated).length
  };
  
  return { allocations, summary };
}

module.exports = {
  allocateBudgets
}; 