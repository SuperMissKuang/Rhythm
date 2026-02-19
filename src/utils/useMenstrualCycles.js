import { useState } from "react";
import { Alert } from "react-native";
import { useCycleStore } from "./stores/useCycleStore";
import { validateNewCycleDate } from "./cycleStatistics";

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

    if (validation.action === "adjust_previous") {
      const confirmed = await confirmAlert(
        "Shorter Than Typical",
        "This is shorter than your typical cycle. Continue?"
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

        if (validation.action === "adjust_previous") {
          const confirmed = await confirmAlert(
            "Shorter Than Typical",
            "This is shorter than your typical cycle. Continue?"
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
