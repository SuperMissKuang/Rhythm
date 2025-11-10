import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@rhythm:custom-activities";

/**
 * Zustand store for managing custom activity definitions with AsyncStorage persistence
 */
export const useActivityStore = create((set, get) => ({
  activities: [],
  isLoading: false,
  isInitialized: false,

  /**
   * Initialize store by loading data from AsyncStorage
   * Should be called once on app startup
   */
  init: async () => {
    set({ isLoading: true });
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const activities = stored ? JSON.parse(stored) : [];
      set({ activities, isLoading: false, isInitialized: true });
    } catch (error) {
      console.error("Error loading custom activities from storage:", error);
      set({ activities: [], isLoading: false, isInitialized: true });
    }
  },

  /**
   * Create a new custom activity
   * @param {Object} activityData - The activity data (name, color_hex, items, frequency config)
   * @returns {Object} The created activity with generated ID
   */
  createActivity: async (activityData) => {
    try {
      const newActivity = {
        id: Date.now().toString(),
        userId: "default-user",
        createdAt: new Date().toISOString(),
        ...activityData,
      };

      const updatedActivities = [...get().activities, newActivity];
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedActivities)
      );
      set({ activities: updatedActivities });

      return newActivity;
    } catch (error) {
      console.error("Error creating custom activity:", error);
      throw error;
    }
  },

  /**
   * Update an existing custom activity
   * @param {string} id - The activity ID to update
   * @param {Object} updates - The fields to update
   * @returns {Object} The updated activity
   */
  updateActivity: async (id, updates) => {
    try {
      const updatedActivities = get().activities.map((activity) =>
        activity.id === id
          ? { ...activity, ...updates, updatedAt: new Date().toISOString() }
          : activity
      );

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedActivities)
      );
      set({ activities: updatedActivities });

      return updatedActivities.find((a) => a.id === id);
    } catch (error) {
      console.error("Error updating custom activity:", error);
      throw error;
    }
  },

  /**
   * Delete a custom activity
   * @param {string} id - The activity ID to delete
   */
  deleteActivity: async (id) => {
    try {
      const updatedActivities = get().activities.filter(
        (activity) => activity.id !== id
      );
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedActivities)
      );
      set({ activities: updatedActivities });
    } catch (error) {
      console.error("Error deleting custom activity:", error);
      throw error;
    }
  },

  /**
   * Get all activities
   * @returns {Array} All custom activities
   */
  getActivities: () => {
    return get().activities;
  },

  /**
   * Get activity by ID
   * @param {string} id - The activity ID
   * @returns {Object|undefined} The activity if found
   */
  getActivityById: (id) => {
    return get().activities.find((activity) => activity.id === id);
  },

  /**
   * Clear all custom activity data (useful for testing or reset)
   */
  clearAll: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      set({ activities: [] });
    } catch (error) {
      console.error("Error clearing custom activities:", error);
      throw error;
    }
  },
}));
