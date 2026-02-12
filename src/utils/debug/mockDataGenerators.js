/**
 * Mock data generators for debug/preview mode
 * Only used in development (__DEV__)
 */

import { subDays, format } from "date-fns";

/**
 * Generate a single cycle object
 * @param {Date} startDate - Start date of the cycle
 * @param {number} cycleLength - Length of the cycle in days
 * @param {number} index - Index for generating unique ID
 * @returns {Object} Cycle object
 */
export function generateCycle(startDate, cycleLength, index) {
  const startDateStr = format(startDate, "yyyy-MM-dd");

  return {
    id: `debug-${Date.now()}-${index}`,
    userId: "default-user",
    start_date: startDateStr,
    cycle_length: cycleLength,
    end_date: null,
    is_outlier: false,
    outlier_reason: null,
    is_hard_limit_violation: false,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Generate multiple cycles going backwards from a date
 * @param {number} count - Number of cycles to generate
 * @param {number[]} lengths - Array of cycle lengths (will cycle through if count > lengths.length)
 * @param {Date} endDate - The start date of the most recent cycle
 * @returns {Object[]} Array of cycle objects
 */
export function generateCycleHistory(count, lengths, endDate = new Date()) {
  const cycles = [];
  let currentDate = endDate;

  for (let i = 0; i < count; i++) {
    const cycleLength = lengths[i % lengths.length];
    const cycle = generateCycle(currentDate, cycleLength, i);
    cycles.push(cycle);

    // Move backwards for the next (older) cycle
    currentDate = subDays(currentDate, cycleLength);
  }

  // Return in chronological order (oldest first)
  return cycles.reverse();
}
