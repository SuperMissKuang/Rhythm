import { useState } from "react";
import { Alert } from "react-native";
import { useCycleStore } from "./stores/useCycleStore";

export function useMenstrualCycles() {
  const cycles = useCycleStore((state) => state.cycles);
  const isLoadingCycles = useCycleStore((state) => state.isLoading);

  const [isCreatingCycle, setIsCreatingCycle] = useState(false);
  const [isUpdatingCycle, setIsUpdatingCycle] = useState(false);
  const [isDeletingCycle, setIsDeletingCycle] = useState(false);

  const createCycle = async (data, options = {}) => {
    setIsCreatingCycle(true);
    try {
      const result = await useCycleStore.getState().createCycle(data);
      setIsCreatingCycle(false);
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
    setIsUpdatingCycle(true);
    try {
      const { id, ...updates } = data;
      const result = await useCycleStore.getState().updateCycle(id, updates);
      setIsUpdatingCycle(false);
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
