import { differenceInDays, parseISO, addDays } from "date-fns";
import { CYCLE_PHASES } from "@/utils/constants";
import {
  sortCyclesChronologically,
  filterOutliers,
  calculateStatistics,
  checkDataIntegrity,
  OUTLIER_CONFIG,
  DATA_INTEGRITY,
} from "@/utils/cycleStatistics";

/**
 * Calculate average cycle length from recent cycles, excluding outliers
 * @param {Array} cycles - Array of cycle objects
 * @param {Object} options - Configuration options
 * @param {number} options.maxCycles - Maximum number of recent cycles to consider (default: 6)
 * @param {boolean} options.excludeOutliers - Whether to exclude outliers (default: true)
 * @returns {number} Average cycle length in days
 */
export const getAverageCycleLength = (cycles, options = {}) => {
  const { maxCycles = 6, excludeOutliers = true } = options;

  if (!cycles || cycles.length === 0) {
    return 28; // Default fallback
  }

  // Sort chronologically and exclude the ongoing (most recent) cycle
  // The ongoing cycle's length isn't determined yet
  const sortedCycles = sortCyclesChronologically(cycles);
  const completedCycles = sortedCycles.slice(0, -1);

  if (completedCycles.length === 0) {
    return 28; // Only have ongoing cycle, no history yet
  }

  const recentCycles = completedCycles.slice(-maxCycles); // Take last N completed cycles

  if (recentCycles.length === 1) {
    return recentCycles[0].cycle_length || 28;
  }

  let validLengths;

  if (excludeOutliers && recentCycles.length >= OUTLIER_CONFIG.MIN_CYCLES_FOR_DETECTION) {
    const filtered = filterOutliers(recentCycles);
    validLengths = filtered.validLengths;
  } else {
    validLengths = recentCycles
      .map((c) => c.cycle_length)
      .filter((length) => length && length > 0);
  }

  if (validLengths.length === 0) {
    return 28; // Default fallback
  }

  const average = validLengths.reduce((sum, length) => sum + length, 0) / validLengths.length;
  return Math.round(average);
};

// Get scaled phase durations based on actual cycle length
// Uses proportional scaling to maintain phase relationships
export const getScaledPhaseDurations = (actualCycleLength) => {
  const standardCycleLength = 28;
  const scaleFactor = actualCycleLength / standardCycleLength;

  return CYCLE_PHASES.map((phase) => ({
    ...phase,
    duration: Math.round(phase.duration * scaleFactor),
  }));
};

/**
 * Get current cycle information for a given date
 * @param {Array} cycles - Array of cycle objects
 * @param {Date|string} targetDate - The date to check (defaults to today)
 * @returns {Object} Cycle information including new fields for extended cycles
 */
export const getCurrentCycleInfo = (cycles, targetDate) => {
  if (!cycles || cycles.length === 0) {
    return {
      cycleDay: null,
      currentPhase: null,
      totalDays: 28,
      hasData: false,
      isExtended: false,
      effectiveCycleLength: 28,
      statusMessage: null,
      isHardLimitViolation: false,
      isBeforeFirstCycle: false,
      daysLate: 0,
    };
  }

  const dateToCheck = targetDate ? new Date(targetDate) : new Date();
  const sortedCycles = sortCyclesChronologically(cycles);

  // Check if the date is before the first cycle
  const firstCycle = sortedCycles[0];
  const firstCycleStart = parseISO(firstCycle.start_date);
  if (dateToCheck < firstCycleStart) {
    return {
      cycleDay: null,
      currentPhase: null,
      totalDays: 28,
      hasData: true, // We have cycle data, just not for this date
      isExtended: false,
      effectiveCycleLength: 28,
      statusMessage: null,
      isHardLimitViolation: false,
      isBeforeFirstCycle: true,
      daysLate: 0,
    };
  }

  // Find the most recent cycle that started on or before the target date
  // A date belongs to whichever cycle started most recently before it
  // (cycle_length is historical data about duration, not a boundary for matching)
  let relevantCycle = null;

  for (let i = sortedCycles.length - 1; i >= 0; i--) {
    const cycle = sortedCycles[i];
    const startDate = parseISO(cycle.start_date);
    if (dateToCheck >= startDate) {
      relevantCycle = cycle;
      break;
    }
  }

  // If no cycle found (date is before all cycles), use the earliest cycle
  if (!relevantCycle) {
    relevantCycle = sortedCycles[0];
  }

  // Check if this is the ongoing (most recent) cycle
  const isOngoingCycle = relevantCycle.id === sortedCycles[sortedCycles.length - 1].id;

  const startDate = parseISO(relevantCycle.start_date);
  const daysSinceStart = differenceInDays(dateToCheck, startDate);

  // Get expected cycle length (average, excluding outliers)
  const expectedLength = getAverageCycleLength(cycles);

  // Check for hard limit violations
  const actualCycleLength = relevantCycle.cycle_length || 28;
  const integrityCheck = checkDataIntegrity(actualCycleLength);
  const isHardLimitViolation = integrityCheck.isError;

  // Determine if cycle is extended (past expected length)
  // ONLY applies to the ongoing cycle - completed cycles have known lengths
  const isExtended = isOngoingCycle && daysSinceStart >= expectedLength;

  // Calculate how many days late (0 if not extended)
  const daysLate = isExtended ? (daysSinceStart - expectedLength + 1) : 0;

  // Calculate effective cycle length for phase calculations
  let effectiveCycleLength;
  let statusMessage = null;

  if (isExtended) {
    // Period is "late" - extend the cycle length to actual days (ongoing cycle only)
    effectiveCycleLength = daysSinceStart + 1;
    statusMessage = "Your period may start today";
  } else if (isOngoingCycle) {
    // Ongoing cycle but not yet extended - use expected length for phases
    effectiveCycleLength = expectedLength;
  } else {
    // Completed cycle - use its actual known length for phases
    effectiveCycleLength = actualCycleLength;
  }

  const scaledPhases = getScaledPhaseDurations(effectiveCycleLength);
  const cycleDay = daysSinceStart + 1;

  // Find current phase based on scaled durations
  let currentPhase = scaledPhases[scaledPhases.length - 1]; // Default to last phase (Luteal)
  let currentDay = 1;

  for (const phase of scaledPhases) {
    if (cycleDay >= currentDay && cycleDay < currentDay + phase.duration) {
      currentPhase = phase;
      break;
    }
    currentDay += phase.duration;
  }

  // If extended, always show as late luteal (just before menstrual)
  if (isExtended) {
    currentPhase = scaledPhases[scaledPhases.length - 1]; // Luteal
  }

  return {
    cycleDay,
    currentPhase,
    totalDays: effectiveCycleLength,
    scaledPhases,
    hasData: true,
    isExtended,
    effectiveCycleLength,
    statusMessage,
    isHardLimitViolation,
    isBeforeFirstCycle: false,
    daysLate,
    relevantCycle, // Include the cycle object for reference
  };
};

/**
 * Predict when the next period will start
 * @param {Array} cycles - Array of cycle objects
 * @returns {Object} Prediction info
 */
export const predictNextPeriodStart = (cycles) => {
  if (!cycles || cycles.length === 0) {
    return {
      predictedDate: null,
      daysUntil: null,
      confidence: null,
      basedOnCycles: 0,
    };
  }

  const sortedCycles = sortCyclesChronologically(cycles);
  const mostRecentCycle = sortedCycles[sortedCycles.length - 1];

  if (!mostRecentCycle?.start_date) {
    return {
      predictedDate: null,
      daysUntil: null,
      confidence: null,
      basedOnCycles: 0,
    };
  }

  const avgCycleLength = getAverageCycleLength(cycles, { excludeOutliers: true });
  const lastStartDate = parseISO(mostRecentCycle.start_date);
  const predictedDate = addDays(lastStartDate, avgCycleLength);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntil = differenceInDays(predictedDate, today);

  // Determine confidence based on data quality
  let confidence;
  const { validLengths } = filterOutliers(sortedCycles);

  if (validLengths.length >= 6) {
    const { stdDev } = calculateStatistics(validLengths);
    confidence = stdDev <= 2 ? "high" : stdDev <= 4 ? "medium" : "low";
  } else if (validLengths.length >= 3) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  return {
    predictedDate,
    daysUntil,
    confidence,
    basedOnCycles: validLengths.length,
  };
};

/**
 * Check if user should be warned about upcoming period
 * @param {Array} cycles - Array of cycle objects
 * @param {number} warningDays - Days before period to trigger warning (default: 7)
 * @returns {Object} Warning status
 */
export const getPeriodWarningStatus = (cycles, warningDays = 7) => {
  const prediction = predictNextPeriodStart(cycles);

  if (!prediction.predictedDate || prediction.daysUntil === null) {
    return {
      shouldWarn: false,
      daysUntil: null,
      predictedDate: null,
      message: null,
    };
  }

  const shouldWarn = prediction.daysUntil >= 0 && prediction.daysUntil <= warningDays;

  let message = null;
  if (prediction.daysUntil < 0) {
    // Period is late
    message = "Your period may start today";
  } else if (prediction.daysUntil === 0) {
    message = "Your period is predicted to start today";
  } else if (prediction.daysUntil === 1) {
    message = "Period in 1 day";
  } else if (shouldWarn) {
    message = `Period in ${prediction.daysUntil} days`;
  }

  return {
    shouldWarn,
    daysUntil: prediction.daysUntil,
    predictedDate: prediction.predictedDate,
    message,
  };
};

// Helper function to get cycle day for a specific date
export const getCycleDay = (date, cycles) => {
  if (!cycles || cycles.length === 0) return null;

  const targetDate = new Date(date);
  const sortedCycles = sortCyclesChronologically(cycles);

  // Find the cycle that contains this date
  for (const cycle of sortedCycles) {
    const startDate = parseISO(cycle.start_date);
    const endDate = cycle.end_date
      ? parseISO(cycle.end_date)
      : new Date(
          startDate.getTime() + (cycle.cycle_length || 28) * 24 * 60 * 60 * 1000
        );

    if (targetDate >= startDate && targetDate <= endDate) {
      const daysSinceStart = differenceInDays(targetDate, startDate);
      return daysSinceStart + 1; // Cycle day starts at 1
    }
  }

  return null;
};

// Helper function to get cycle phase from cycle day
export const getCyclePhase = (cycleDay) => {
  if (!cycleDay) return null;

  if (cycleDay >= 1 && cycleDay <= 5) return "menstrual";
  if (cycleDay >= 6 && cycleDay <= 13) return "follicular";
  if (cycleDay >= 14 && cycleDay <= 16) return "ovulatory";
  if (cycleDay >= 17 && cycleDay <= 28) return "luteal";

  return "luteal"; // Default to luteal for days beyond 28
};

// Helper function to count complete cycles (cycles with both start_date and end_date)
export const getCompleteCycleCount = (cycles) => {
  if (!cycles || !Array.isArray(cycles)) {
    return 0;
  }

  return cycles.filter((cycle) => {
    // A cycle is complete if it has both start_date and end_date
    return cycle.start_date && cycle.end_date;
  }).length;
};
