import { useMemo } from "react";
import { useCycleStore } from "@/utils/stores/useCycleStore";
import {
  predictNextPeriodStart,
  getPeriodWarningStatus,
  getCurrentCycleInfo,
} from "@/utils/cycleUtils";

/**
 * Hook to get period prediction and warning status
 * Provides prediction data, warning messages, and current cycle status
 *
 * @param {Object} options - Configuration options
 * @param {number} options.warningDays - Days before period to trigger warning (default: 7)
 * @returns {{
 *   prediction: { predictedDate: Date|null, daysUntil: number|null, confidence: string|null, basedOnCycles: number },
 *   warning: { shouldWarn: boolean, message: string|null, daysUntil: number|null },
 *   currentCycle: { cycleDay: number|null, isExtended: boolean, statusMessage: string|null },
 *   isLoading: boolean,
 *   hasData: boolean
 * }}
 */
export function usePeriodPrediction(options = {}) {
  const { warningDays = 7 } = options;

  const cycles = useCycleStore((state) => state.cycles);
  const isInitialized = useCycleStore((state) => state.isInitialized);
  const isLoading = useCycleStore((state) => state.isLoading);

  // Memoize prediction calculation
  const prediction = useMemo(() => {
    if (!cycles || cycles.length === 0) {
      return {
        predictedDate: null,
        daysUntil: null,
        confidence: null,
        basedOnCycles: 0,
      };
    }
    return predictNextPeriodStart(cycles);
  }, [cycles]);

  // Memoize warning status
  const warning = useMemo(() => {
    if (!cycles || cycles.length === 0) {
      return {
        shouldWarn: false,
        daysUntil: null,
        predictedDate: null,
        message: null,
      };
    }
    return getPeriodWarningStatus(cycles, warningDays);
  }, [cycles, warningDays]);

  // Memoize current cycle info
  const currentCycleInfo = useMemo(() => {
    if (!cycles || cycles.length === 0) {
      return {
        cycleDay: null,
        isExtended: false,
        statusMessage: null,
        hasData: false,
      };
    }
    const info = getCurrentCycleInfo(cycles);
    return {
      cycleDay: info.cycleDay,
      isExtended: info.isExtended,
      statusMessage: info.statusMessage,
      hasData: info.hasData,
      effectiveCycleLength: info.effectiveCycleLength,
      isHardLimitViolation: info.isHardLimitViolation,
    };
  }, [cycles]);

  return {
    prediction: {
      predictedDate: prediction.predictedDate,
      daysUntil: prediction.daysUntil,
      confidence: prediction.confidence,
      basedOnCycles: prediction.basedOnCycles,
    },
    warning: {
      shouldWarn: warning.shouldWarn,
      message: warning.message,
      daysUntil: warning.daysUntil,
    },
    currentCycle: {
      cycleDay: currentCycleInfo.cycleDay,
      isExtended: currentCycleInfo.isExtended,
      statusMessage: currentCycleInfo.statusMessage,
      effectiveCycleLength: currentCycleInfo.effectiveCycleLength,
      isHardLimitViolation: currentCycleInfo.isHardLimitViolation,
    },
    isLoading: isLoading || !isInitialized,
    hasData: currentCycleInfo.hasData,
  };
}
