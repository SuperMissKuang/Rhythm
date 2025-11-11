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
   * Ensures default activities are present
   */
  init: async () => {
    set({ isLoading: true });
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      let activities = stored ? JSON.parse(stored) : [];

      const { SELFCARE_CATEGORIES } = require("@/utils/selfcareConstants");
      const { ACTIVITY_COLORS } = require("@/utils/constants");

      // Check which default activities are missing or need updating
      const existingActivityMap = new Map(activities.map(a => [a.name, a]));
      const defaultsToAdd = [];
      const activitiesToUpdate = [];

      // Check each default self-care category
      SELFCARE_CATEGORIES.forEach((category) => {
        const existing = existingActivityMap.get(category.name);

        if (!existing) {
          // Activity doesn't exist, add it
          defaultsToAdd.push({
            id: `default-${category.id}`,
            userId: "default-user",
            createdAt: new Date().toISOString(),
            name: category.name,
            color_hex: category.color_hex,
            items: category.items || [],
            light_saturation_min: category.light_saturation_min || 1,
            light_saturation_max: category.light_saturation_max || 2,
            medium_saturation_min: category.medium_saturation_min || 3,
            medium_saturation_max: category.medium_saturation_max || 4,
            dark_saturation_min: category.dark_saturation_min || 5,
          });
        } else {
          // Activity exists - check if items need fixing
          const needsItemsFix = !existing.items || existing.items.length === 0 ||
            existing.items.some(item => !item.activity_key);

          if (needsItemsFix) {
            // Replace items with correct structure
            existing.items = category.items || [];
            activitiesToUpdate.push(existing);
            console.log(`Fixing items for ${existing.name}`);
          }
        }
      });

      // Check Anxiety activity
      const existingAnxiety = existingActivityMap.get("Anxiety");
      if (!existingAnxiety) {
        defaultsToAdd.push({
          id: "default-anxiety",
          userId: "default-user",
          createdAt: new Date().toISOString(),
          name: "Anxiety",
          color_hex: ACTIVITY_COLORS.anxiety,
          items: [{ id: "anxiety", name: "Anxiety", activity_key: "anxiety" }],
          light_saturation_min: 1,
          light_saturation_max: 2,
          medium_saturation_min: 3,
          medium_saturation_max: 4,
          dark_saturation_min: 5,
        });
      } else if (!existingAnxiety.items || existingAnxiety.items.length === 0) {
        existingAnxiety.items = [{ id: "anxiety", name: "Anxiety", activity_key: "anxiety" }];
        activitiesToUpdate.push(existingAnxiety);
      }

      // Add missing defaults and update existing ones
      if (defaultsToAdd.length > 0 || activitiesToUpdate.length > 0) {
        activities = [...defaultsToAdd, ...activities];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
        console.log(`Migration: Added ${defaultsToAdd.length} missing default activities, updated ${activitiesToUpdate.length} existing activities`);
        console.log("Activities after migration:", activities.map(a => ({
          name: a.name,
          itemsCount: a.items?.length || 0
        })));
      }

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
