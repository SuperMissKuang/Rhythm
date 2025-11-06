import { differenceInDays } from "date-fns";
import { CYCLE_PHASES } from "@/utils/constants";

// Calculate average cycle length from recent cycles (last 3 or all if less than 3)
export const getAverageCycleLength = (cycles) => {
  if (!cycles || cycles.length === 0) {
    return 28; // Default fallback
  }

  // Use most recent cycle if only one exists
  if (cycles.length === 1) {
    return cycles[0].cycle_length || 28;
  }

  // Calculate average of last 3 cycles (or all if less than 3)
  const recentCycles = cycles.slice(0, Math.min(3, cycles.length));
  const validCycleLengths = recentCycles
    .map((c) => c.cycle_length)
    .filter((length) => length && length > 0);

  if (validCycleLengths.length === 0) {
    return 28; // Default fallback
  }

  const average =
    validCycleLengths.reduce((sum, length) => sum + length, 0) /
    validCycleLengths.length;

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

export const getCurrentCycleInfo = (cycles, targetDate) => {
  if (!cycles || cycles.length === 0) {
    return { cycleDay: null, currentPhase: null, totalDays: 28, hasData: false };
  }

  const dateToCheck = targetDate ? new Date(targetDate) : new Date();

  // Find the cycle that contains the target date
  let relevantCycle = null;

  for (const cycle of cycles) {
    const startDate = new Date(cycle.start_date);
    const cycleLength = cycle.cycle_length || 28;

    // Calculate the end date of this cycle
    const endDate = cycle.end_date
      ? new Date(cycle.end_date)
      : new Date(startDate.getTime() + cycleLength * 24 * 60 * 60 * 1000);

    // Check if the target date falls within this cycle
    if (dateToCheck >= startDate && dateToCheck <= endDate) {
      relevantCycle = cycle;
      break;
    }
  }

  // If no cycle contains the date, use the most recent cycle that started before the target date
  if (!relevantCycle) {
    for (const cycle of cycles) {
      const startDate = new Date(cycle.start_date);
      if (dateToCheck >= startDate) {
        relevantCycle = cycle;
        break;
      }
    }
  }

  // If still no cycle found, use the latest cycle
  if (!relevantCycle) {
    relevantCycle = cycles[0];
  }

  const startDate = new Date(relevantCycle.start_date);
  const daysSinceStart = differenceInDays(dateToCheck, startDate);

  // Use average cycle length for more accurate calculations
  const avgCycleLength = getAverageCycleLength(cycles);
  const scaledPhases = getScaledPhaseDurations(avgCycleLength);

  // If we're beyond the cycle length, we're in a new cycle (Day 1)
  if (daysSinceStart >= avgCycleLength) {
    return {
      cycleDay: 1,
      currentPhase: scaledPhases[0],
      totalDays: avgCycleLength,
      scaledPhases,
      hasData: true,
    };
  }

  const cycleDay = daysSinceStart + 1;

  // Find current phase based on scaled durations
  let currentDay = 1;
  for (const phase of scaledPhases) {
    if (cycleDay >= currentDay && cycleDay < currentDay + phase.duration) {
      return {
        cycleDay,
        currentPhase: phase,
        totalDays: avgCycleLength,
        scaledPhases,
        hasData: true,
      };
    }
    currentDay += phase.duration;
  }

  return {
    cycleDay,
    currentPhase: scaledPhases[3], // Luteal phase as fallback
    totalDays: avgCycleLength,
    scaledPhases,
    hasData: true,
  };
};

// Helper function to get cycle day for a specific date
export const getCycleDay = (date, cycles) => {
  if (!cycles || cycles.length === 0) return null;

  const targetDate = new Date(date);

  // Find the cycle that contains this date
  for (const cycle of cycles) {
    const startDate = new Date(cycle.start_date);
    const endDate = cycle.end_date
      ? new Date(cycle.end_date)
      : new Date(
          startDate.getTime() + cycle.cycle_length * 24 * 60 * 60 * 1000,
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
