import { parseISO, differenceInDays } from "date-fns";

/**
 * Configuration for outlier detection
 */
export const OUTLIER_CONFIG = {
  MIN_CYCLES_FOR_DETECTION: 3, // Need 3+ cycles for statistical detection
  STD_DEV_THRESHOLD: 2, // Flag if >2 std deviations from mean
};

/**
 * Data integrity limits (not medical judgments - "probably a typo" checks)
 */
export const DATA_INTEGRITY = {
  MIN_CYCLE_LENGTH: 10, // BLOCK: Shorter is likely same bleeding episode
  MAX_CYCLE_LENGTH: 60, // WARN: Longer likely means missed logging
  MIN_GAP_FROM_PREVIOUS: 10, // Days from previous cycle start to allow new cycle
};

/**
 * Sort cycles chronologically by start_date (oldest first)
 * @param {Array} cycles - Array of cycle objects
 * @returns {Array} Sorted cycles array (does not mutate original)
 */
export const sortCyclesChronologically = (cycles) => {
  if (!cycles || !Array.isArray(cycles) || cycles.length === 0) return [];

  return [...cycles].sort((a, b) => {
    const dateA = parseISO(a.start_date);
    const dateB = parseISO(b.start_date);
    return dateA.getTime() - dateB.getTime();
  });
};

/**
 * Calculate mean and standard deviation of cycle lengths
 * @param {Array<number>} lengths - Array of cycle lengths
 * @returns {{ mean: number, stdDev: number }}
 */
export const calculateStatistics = (lengths) => {
  if (!lengths || lengths.length === 0) {
    return { mean: 28, stdDev: 0 };
  }

  const validLengths = lengths.filter((l) => l && l > 0);
  if (validLengths.length === 0) {
    return { mean: 28, stdDev: 0 };
  }

  const mean = validLengths.reduce((sum, len) => sum + len, 0) / validLengths.length;

  if (validLengths.length < 2) {
    return { mean: Math.round(mean * 10) / 10, stdDev: 0 };
  }

  const squaredDiffs = validLengths.map((len) => Math.pow(len - mean, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / validLengths.length;
  const stdDev = Math.sqrt(variance);

  return {
    mean: Math.round(mean * 10) / 10,
    stdDev: Math.round(stdDev * 10) / 10,
  };
};

/**
 * Determine if a cycle length is an outlier based on user's personal history
 * Uses purely statistical detection (2 std dev) - no hard limits on what's "normal"
 * @param {number} cycleLength - The cycle length to check
 * @param {Array<number>} allLengths - All historical cycle lengths
 * @returns {{ isOutlier: boolean, reason: string|null }}
 */
export const isOutlierCycle = (cycleLength, allLengths) => {
  if (!cycleLength || cycleLength <= 0) {
    return { isOutlier: false, reason: null };
  }

  // Need minimum data for statistical outlier detection
  if (!allLengths || allLengths.length < OUTLIER_CONFIG.MIN_CYCLES_FOR_DETECTION) {
    return { isOutlier: false, reason: null };
  }

  const { mean, stdDev } = calculateStatistics(allLengths);

  // If stdDev is very small (consistent cycles), use a minimum threshold
  const threshold = stdDev > 0 ? OUTLIER_CONFIG.STD_DEV_THRESHOLD * stdDev : 3;

  const deviation = Math.abs(cycleLength - mean);

  if (deviation > threshold) {
    return {
      isOutlier: true,
      reason: cycleLength > mean ? "longer" : "shorter",
    };
  }

  return { isOutlier: false, reason: null };
};

/**
 * Check if a cycle length violates data integrity limits
 * These are "probably a typo" checks, not medical judgments
 * @param {number} cycleLength - The cycle length to check
 * @returns {{ isError: boolean, shouldBlock: boolean, reason: string|null }}
 */
export const checkDataIntegrity = (cycleLength) => {
  if (!cycleLength || cycleLength <= 0) {
    return { isError: true, shouldBlock: true, reason: "invalid" };
  }

  if (cycleLength < DATA_INTEGRITY.MIN_CYCLE_LENGTH) {
    return {
      isError: true,
      shouldBlock: true,
      reason: "Too short - likely the same bleeding episode",
    };
  }

  if (cycleLength > DATA_INTEGRITY.MAX_CYCLE_LENGTH) {
    return {
      isError: true,
      shouldBlock: false, // Warn but allow
      reason: "Very long - you may have missed logging a period",
    };
  }

  return { isError: false, shouldBlock: false, reason: null };
};

/**
 * Filter out outlier cycles from an array
 * @param {Array} cycles - Array of cycle objects with cycle_length
 * @returns {{ validLengths: Array<number>, outlierIds: Array<string>, outlierInfo: Array }}
 */
export const filterOutliers = (cycles) => {
  if (!cycles || cycles.length === 0) {
    return { validLengths: [], outlierIds: [], outlierInfo: [] };
  }

  // Not enough data for outlier detection
  if (cycles.length < OUTLIER_CONFIG.MIN_CYCLES_FOR_DETECTION) {
    return {
      validLengths: cycles.map((c) => c.cycle_length).filter((l) => l > 0),
      outlierIds: [],
      outlierInfo: [],
    };
  }

  const allLengths = cycles.map((c) => c.cycle_length).filter((l) => l > 0);
  const { mean, stdDev } = calculateStatistics(allLengths);

  const validLengths = [];
  const outlierIds = [];
  const outlierInfo = [];

  cycles.forEach((cycle) => {
    const length = cycle.cycle_length;
    if (!length || length <= 0) return;

    const { isOutlier, reason } = isOutlierCycle(length, allLengths);

    if (isOutlier) {
      outlierIds.push(cycle.id);
      outlierInfo.push({ id: cycle.id, length, reason });
    } else {
      validLengths.push(length);
    }
  });

  return { validLengths, outlierIds, outlierInfo };
};

/**
 * Recalculate all cycle lengths based on chronological order
 * Cycle length = days from this cycle's start to next cycle's start
 * @param {Array} cycles - Array of cycles (will be sorted internally)
 * @returns {Array} Cycles with recalculated lengths
 */
export const recalculateCycleLengths = (cycles) => {
  if (!cycles || cycles.length === 0) return [];

  const sorted = sortCyclesChronologically(cycles);

  return sorted.map((cycle, index) => {
    // If there's a next cycle, calculate length from it
    if (index < sorted.length - 1) {
      const nextCycle = sorted[index + 1];
      const currentStart = parseISO(cycle.start_date);
      const nextStart = parseISO(nextCycle.start_date);
      const calculatedLength = differenceInDays(nextStart, currentStart);

      return { ...cycle, cycle_length: calculatedLength };
    }

    // For the most recent cycle, keep existing length or use default
    return { ...cycle, cycle_length: cycle.cycle_length || 28 };
  });
};

/**
 * Update outlier flags for all cycles based on current data
 * @param {Array} cycles - Array of cycles with cycle_length
 * @returns {Array} Cycles with updated is_outlier and outlier_reason fields
 */
export const updateOutlierFlags = (cycles) => {
  if (!cycles || cycles.length === 0) return [];

  const allLengths = cycles.map((c) => c.cycle_length).filter((l) => l > 0);

  return cycles.map((cycle) => {
    const { isOutlier, reason } = isOutlierCycle(cycle.cycle_length, allLengths);
    const integrityCheck = checkDataIntegrity(cycle.cycle_length);

    return {
      ...cycle,
      is_outlier: isOutlier,
      outlier_reason: reason,
      is_hard_limit_violation: integrityCheck.isError,
    };
  });
};

/**
 * Validate a new cycle date against existing cycles
 * @param {string} newStartDate - ISO date string for new cycle
 * @param {Array} existingCycles - Existing cycles array
 * @returns {{ isValid: boolean, action: string, message: string|null, previousCycleId: string|null }}
 */
export const validateNewCycleDate = (newStartDate, existingCycles) => {
  if (!newStartDate) {
    return {
      isValid: false,
      action: "block",
      message: "Start date is required",
      previousCycleId: null,
    };
  }

  const newDate = parseISO(newStartDate);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // Check if date is in the future
  if (newDate > today) {
    return {
      isValid: false,
      action: "block",
      message: "Cannot log a period in the future",
      previousCycleId: null,
    };
  }

  if (!existingCycles || existingCycles.length === 0) {
    return { isValid: true, action: "ok", message: null, previousCycleId: null };
  }

  const sorted = sortCyclesChronologically(existingCycles);

  // Find the cycle that starts before the new date
  let previousCycle = null;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const cycleStart = parseISO(sorted[i].start_date);
    if (cycleStart < newDate) {
      previousCycle = sorted[i];
      break;
    }
  }

  if (!previousCycle) {
    // New cycle is before all existing cycles - that's fine
    return { isValid: true, action: "ok", message: null, previousCycleId: null };
  }

  const previousStart = parseISO(previousCycle.start_date);
  const gap = differenceInDays(newDate, previousStart);

  // Check minimum gap
  if (gap < DATA_INTEGRITY.MIN_GAP_FROM_PREVIOUS) {
    return {
      isValid: false,
      action: "block",
      message: `Too close to previous period (${gap} days). This may be the same bleeding episode.`,
      previousCycleId: previousCycle.id,
    };
  }

  // Check if within previous cycle's expected range
  const previousLength = previousCycle.cycle_length || 28;
  if (gap < previousLength) {
    return {
      isValid: true,
      action: "adjust_previous",
      message: `Previous cycle will be adjusted to ${gap} days`,
      previousCycleId: previousCycle.id,
    };
  }

  return { isValid: true, action: "ok", message: null, previousCycleId: null };
};
