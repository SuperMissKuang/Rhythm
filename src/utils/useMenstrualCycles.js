import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";

const API_BASE_URL = process.env.EXPO_PUBLIC_PROXY_BASE_URL || "";

export function useMenstrualCycles() {
  const queryClient = useQueryClient();

  const { data: cyclesData, isLoading: isLoadingCycles } = useQuery({
    queryKey: ["menstrual-cycles"],
    queryFn: async () => {
      console.log(
        "Fetching cycles from:",
        `${API_BASE_URL}/api/menstrual-cycles?userId=default-user`,
      );
      const response = await fetch(
        `${API_BASE_URL}/api/menstrual-cycles?userId=default-user`,
      );
      console.log(
        "Fetch response status:",
        response.status,
        response.statusText,
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Fetch error details:", errorText);
        throw new Error(
          `Failed to fetch cycles: ${response.status} ${response.statusText}`,
        );
      }
      const data = await response.json();
      console.log("Cycles data received:", data);
      return data;
    },
  });

  const createCycleMutation = useMutation({
    mutationFn: async (data) => {
      console.log("Creating cycle with data:", data);
      console.log("API URL:", `${API_BASE_URL}/api/menstrual-cycles`);
      const response = await fetch(`${API_BASE_URL}/api/menstrual-cycles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      console.log(
        "Create response status:",
        response.status,
        response.statusText,
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Create error details:", errorText);
        throw new Error(
          `Failed to create menstrual cycle: ${response.status} ${response.statusText}`,
        );
      }
      const result = await response.json();
      console.log("Create result:", result);
      return result;
    },
    onSuccess: () => {
      console.log("Create mutation succeeded, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["menstrual-cycles"] });
    },
    onError: (error) => {
      console.error("Error creating cycle:", error);
      Alert.alert(
        "Error",
        "Failed to save period start date. Please try again.",
      );
    },
  });

  const updateCycleMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      console.log("Updating cycle:", id, "with data:", data);
      console.log("API URL:", `${API_BASE_URL}/api/menstrual-cycles`);
      const response = await fetch(`${API_BASE_URL}/api/menstrual-cycles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      console.log(
        "Update response status:",
        response.status,
        response.statusText,
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Update error details:", errorText);
        throw new Error(
          `Failed to update menstrual cycle: ${response.status} ${response.statusText}`,
        );
      }
      const result = await response.json();
      console.log("Update result:", result);
      return result;
    },
    onSuccess: () => {
      console.log("Update mutation succeeded, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["menstrual-cycles"] });
    },
    onError: (error) => {
      console.error("Error updating cycle:", error);
      Alert.alert("Error", "Failed to update period entry. Please try again.");
    },
  });

  const deleteCycleMutation = useMutation({
    mutationFn: async (id) => {
      console.log("Deleting cycle:", id);
      console.log("API URL:", `${API_BASE_URL}/api/menstrual-cycles`);
      const response = await fetch(`${API_BASE_URL}/api/menstrual-cycles`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId: "default-user" }),
      });
      console.log(
        "Delete response status:",
        response.status,
        response.statusText,
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Delete error details:", errorText);
        throw new Error(
          `Failed to delete menstrual cycle: ${response.status} ${response.statusText}`,
        );
      }
      const result = await response.json();
      console.log("Delete result:", result);
      return result;
    },
    onSuccess: () => {
      console.log("Delete mutation succeeded, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["menstrual-cycles"] });
    },
    onError: (error) => {
      console.error("Error deleting cycle:", error);
      Alert.alert("Error", "Failed to delete period entry. Please try again.");
    },
  });

  const createCycle = (data, options = {}) => {
    createCycleMutation.mutate(data, {
      onSuccess: (result) => {
        if (options.onSuccess) {
          options.onSuccess(result);
        }
      },
      onError: (error) => {
        if (options.onError) {
          options.onError(error);
        }
      },
    });
  };

  const updateCycle = (data, options = {}) => {
    updateCycleMutation.mutate(data, {
      onSuccess: (result) => {
        if (options.onSuccess) {
          options.onSuccess(result);
        }
      },
      onError: (error) => {
        if (options.onError) {
          options.onError(error);
        }
      },
    });
  };

  const deleteCycle = (id, options = {}) => {
    deleteCycleMutation.mutate(id, {
      onSuccess: (result) => {
        if (options.onSuccess) {
          options.onSuccess(result);
        }
      },
      onError: (error) => {
        if (options.onError) {
          options.onError(error);
        }
      },
    });
  };

  return {
    cycles: cyclesData?.cycles || [],
    isLoadingCycles,
    createCycle,
    isCreatingCycle: createCycleMutation.isPending,
    updateCycle,
    isUpdatingCycle: updateCycleMutation.isPending,
    deleteCycle,
    isDeletingCycle: deleteCycleMutation.isPending,
  };
}
