import { useMemo } from "react";
import { useCycleStore } from "@/utils/stores/useCycleStore";
import {
  sortCyclesChronologically,
  calculateStatistics,
  filterOutliers,
  OUTLIER_CONFIG,
} from "@/utils/cycleStatistics";

/**
 * Hook to get cycle statistics and outlier information
 * Provides statistical analysis of user's cycle history
 *
 * @returns {{
 *   statistics: { mean: number, stdDev: number, totalCycles: number, validCycles: number },
 *   outliers: Array<{ id: string, start_date: string, cycle_length: number, reason: string }>,
 *   hasEnoughData: boolean,
 *   isLoading: boolean
 * }}
 */
export function useCycleStatistics() {
  const cycles = useCycleStore((state) => state.cycles);
  const isInitialized = useCycleStore((state) => state.isInitialized);
  const isLoading = useCycleStore((state) => state.isLoading);

  const result = useMemo(() => {
    if (!cycles || cycles.length === 0) {
      return {
        statistics: { mean: 28, stdDev: 0, totalCycles: 0, validCycles: 0 },
        outliers: [],
        hasEnoughData: false,
      };
    }

    const sorted = sortCyclesChronologically(cycles);
    const allLengths = sorted.map((c) => c.cycle_length).filter((l) => l > 0);
    const { validLengths, outlierIds, outlierInfo } = filterOutliers(sorted);
    const { mean, stdDev } = calculateStatistics(validLengths);

    // Build outlier details with gentle messaging
    const outlierCycles = sorted
      .filter((c) => outlierIds.includes(c.id))
      .map((c) => {
        const info = outlierInfo.find((o) => o.id === c.id);
        return {
          id: c.id,
          start_date: c.start_date,
          cycle_length: c.cycle_length,
          reason: info?.reason || null,
          // Gentle message for UI
          message:
            info?.reason === "longer"
              ? "Longer than your usual cycle"
              : info?.reason === "shorter"
                ? "Shorter than your usual cycle"
                : null,
        };
      });

    return {
      statistics: {
        mean,
        stdDev,
        totalCycles: sorted.length,
        validCycles: validLengths.length,
      },
      outliers: outlierCycles,
      hasEnoughData: sorted.length >= OUTLIER_CONFIG.MIN_CYCLES_FOR_DETECTION,
    };
  }, [cycles]);

  return {
    statistics: result.statistics,
    outliers: result.outliers,
    hasEnoughData: result.hasEnoughData,
    isLoading: isLoading || !isInitialized,
  };
}

/**
 * Hook to get outlier status for a specific cycle
 * @param {string} cycleId - The cycle ID to check
 * @returns {{ isOutlier: boolean, reason: string|null, message: string|null }}
 */
export function useCycleOutlierStatus(cycleId) {
  const cycles = useCycleStore((state) => state.cycles);

  return useMemo(() => {
    if (!cycleId || !cycles || cycles.length === 0) {
      return { isOutlier: false, reason: null, message: null };
    }

    const cycle = cycles.find((c) => c.id === cycleId);
    if (!cycle) {
      return { isOutlier: false, reason: null, message: null };
    }

    const isOutlier = cycle.is_outlier || false;
    const reason = cycle.outlier_reason || null;

    let message = null;
    if (isOutlier) {
      message =
        reason === "longer"
          ? "Longer than your usual cycle"
          : reason === "shorter"
            ? "Shorter than your usual cycle"
            : "Unusual cycle length";
    }

    return { isOutlier, reason, message };
  }, [cycleId, cycles]);
}
