import { useState } from "react";
import { Alert } from "react-native";
import { format, parseISO } from "date-fns";
import { useCycleStore } from "./stores/useCycleStore";
import {
  validateNewCycleDate,
  recalculateCycleLengths,
  updateOutlierFlags,
} from "./cycleStatistics";

/**
 * Promise-based wrapper around Alert.alert for confirmation dialogs
 */
const confirmAlert = (title, message) =>
  new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      { text: "Continue", onPress: () => resolve(true) },
    ]);
  });

/**
 * Preview whether a create/update/delete would introduce new outlier cycles.
 * Uses pure functions only — no side effects, no store writes.
 *
 * @param {Array} currentCycles - Current cycles array from store
 * @param {Object} change - { type: "create"|"update"|"delete", startDate, cycleId }
 * @returns {{ wouldCreateOutliers: boolean, newOutliers: Array<{start_date, cycle_length, reason}> }}
 */
const previewOutlierImpact = (currentCycles, change) => {
  // Build a hypothetical cycles array based on the change type
  let hypothetical;
  if (change.type === "create") {
    hypothetical = [
      ...currentCycles,
      { id: "__preview__", start_date: change.startDate, cycle_length: 0 },
    ];
  } else if (change.type === "update") {
    hypothetical = currentCycles.map((c) =>
      c.id === change.cycleId ? { ...c, start_date: change.startDate } : c,
    );
  } else if (change.type === "delete") {
    hypothetical = currentCycles.filter((c) => c.id !== change.cycleId);
  } else {
    return { wouldCreateOutliers: false, newOutliers: [] };
  }

  // Run the same pure functions the store uses after saving
  const withLengths = recalculateCycleLengths(hypothetical);
  const withFlags = updateOutlierFlags(withLengths);

  // Find cycles that would become newly-outlier (weren't outliers before)
  const currentOutlierIds = new Set(
    currentCycles.filter((c) => c.is_outlier).map((c) => c.id),
  );
  const newOutliers = withFlags.filter(
    (c) => c.is_outlier && !currentOutlierIds.has(c.id),
  );

  return {
    wouldCreateOutliers: newOutliers.length > 0,
    newOutliers: newOutliers.map((c) => ({
      start_date: c.start_date,
      cycle_length: c.cycle_length,
      reason: c.outlier_reason,
    })),
  };
};

/**
 * Format outlier impact for display in confirmation dialogs
 */
const formatOutlierWarning = (newOutliers) =>
  newOutliers
    .map(
      (o) =>
        `• ${format(parseISO(o.start_date), "MMM d")}: ${o.cycle_length} days (unusually ${o.reason === "shorter" ? "short" : "long"})`,
    )
    .join("\n");

export function useMenstrualCycles() {
  const cycles = useCycleStore((state) => state.cycles);
  const isLoadingCycles = useCycleStore((state) => state.isLoading);

  const [isCreatingCycle, setIsCreatingCycle] = useState(false);
  const [isUpdatingCycle, setIsUpdatingCycle] = useState(false);
  const [isDeletingCycle, setIsDeletingCycle] = useState(false);

  const createCycle = async (data, options = {}) => {
    // Validate before calling the store — read cycles fresh from store to avoid stale closures
    const startDate = data.start_date || data.startDate;
    const currentCycles = useCycleStore.getState().cycles;
    const validation = validateNewCycleDate(startDate, currentCycles);

    if (!validation.isValid) {
      Alert.alert("Cannot Log Period", validation.message);
      if (options.onError) {
        options.onError(new Error(validation.message));
      }
      return;
    }

    // Preview outlier impact — warn if this would create unusual cycle lengths
    const impact = previewOutlierImpact(currentCycles, {
      type: "create",
      startDate,
    });
    if (impact.wouldCreateOutliers) {
      const confirmed = await confirmAlert(
        "Unusual Cycle Length",
        `Saving this date would create unusual cycle lengths:\n\n${formatOutlierWarning(impact.newOutliers)}\n\nContinue anyway?`,
      );
      if (!confirmed) return;
    }

    setIsCreatingCycle(true);
    try {
      const result = await useCycleStore.getState().createCycle(data);
      setIsCreatingCycle(false);

      if (!result.success) {
        const errorMessage = result.errors?.join("\n") || "Could not save period.";
        Alert.alert("Cannot Log Period", errorMessage);
        if (options.onError) {
          options.onError(new Error(errorMessage));
        }
        return;
      }

      if (options.onSuccess) {
        options.onSuccess(result);
      }
    } catch (error) {
      console.error("Error creating cycle:", error);
      setIsCreatingCycle(false);
      Alert.alert(
        "Error",
        "Failed to save period start date. Please try again."
      );
      if (options.onError) {
        options.onError(error);
      }
    }
  };

  const updateCycle = async (data, options = {}) => {
    const { id, ...updates } = data;
    const updateData = updates.data || updates;
    const startDate = updateData.start_date || updateData.startDate;

    // Validate if start_date is being changed — read cycles fresh from store to avoid stale closures
    if (startDate) {
      const currentCycles = useCycleStore.getState().cycles;
      const currentCycle = currentCycles.find((c) => c.id === id);
      if (currentCycle && startDate !== currentCycle.start_date) {
        const otherCycles = currentCycles.filter((c) => c.id !== id);
        const validation = validateNewCycleDate(startDate, otherCycles);

        if (!validation.isValid) {
          Alert.alert("Cannot Update Period", validation.message);
          if (options.onError) {
            options.onError(new Error(validation.message));
          }
          return;
        }

        // Preview outlier impact — warn if this would create unusual cycle lengths
        const impact = previewOutlierImpact(currentCycles, {
          type: "update",
          cycleId: id,
          startDate,
        });
        if (impact.wouldCreateOutliers) {
          const confirmed = await confirmAlert(
            "Unusual Cycle Length",
            `Saving this date would create unusual cycle lengths:\n\n${formatOutlierWarning(impact.newOutliers)}\n\nContinue anyway?`,
          );
          if (!confirmed) return;
        }
      }
    }

    setIsUpdatingCycle(true);
    try {
      const result = await useCycleStore.getState().updateCycle(id, updateData);
      setIsUpdatingCycle(false);

      if (!result.success) {
        const errorMessage = result.errors?.join("\n") || "Could not update period.";
        Alert.alert("Cannot Update Period", errorMessage);
        if (options.onError) {
          options.onError(new Error(errorMessage));
        }
        return;
      }

      if (options.onSuccess) {
        options.onSuccess(result);
      }
    } catch (error) {
      console.error("Error updating cycle:", error);
      setIsUpdatingCycle(false);
      Alert.alert("Error", "Failed to update period entry. Please try again.");
      if (options.onError) {
        options.onError(error);
      }
    }
  };

  const deleteCycle = async (id, options = {}) => {
    // Preview outlier impact — warn if deleting would make neighbors into outliers
    const currentCycles = useCycleStore.getState().cycles;
    const impact = previewOutlierImpact(currentCycles, {
      type: "delete",
      cycleId: id,
    });
    if (impact.wouldCreateOutliers) {
      const confirmed = await confirmAlert(
        "This Will Affect Other Cycles",
        `Deleting this period will create unusual cycle lengths:\n\n${formatOutlierWarning(impact.newOutliers)}\n\nContinue with deletion?`,
      );
      if (!confirmed) return;
    }

    setIsDeletingCycle(true);
    try {
      await useCycleStore.getState().deleteCycle(id);
      setIsDeletingCycle(false);
      if (options.onSuccess) {
        options.onSuccess();
      }
    } catch (error) {
      console.error("Error deleting cycle:", error);
      setIsDeletingCycle(false);
      Alert.alert("Error", "Failed to delete period entry. Please try again.");
      if (options.onError) {
        options.onError(error);
      }
    }
  };

  return {
    cycles,
    isLoadingCycles,
    createCycle,
    isCreatingCycle,
    updateCycle,
    isUpdatingCycle,
    deleteCycle,
    isDeletingCycle,
  };
}
