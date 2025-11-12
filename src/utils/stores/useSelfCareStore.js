import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format, parseISO, isAfter, isBefore } from "date-fns";

const STORAGE_KEY = "@rhythm:selfcare-entries";

/**
 * Normalize entry data to use snake_case field names
 */
const normalizeEntry = (entry) => {
  if (!entry) return null;

  return {
    ...entry,
    // Normalize field names to snake_case
    entry_date: entry.entry_date || entry.entryDate,
    time_descriptor: entry.time_descriptor || entry.timeDescriptor,
    activity_times: entry.activity_times || entry.activityTimes,
    use_individual_times: entry.use_individual_times ?? entry.useIndividualTimes,
    cycle_day: entry.cycle_day ?? entry.cycleDay,
    exact_time: entry.exact_time || entry.exactTime,
    // Remove camelCase versions if they exist
    entryDate: undefined,
    timeDescriptor: undefined,
    activityTimes: undefined,
    useIndividualTimes: undefined,
    cycleDay: undefined,
    exactTime: undefined,
  };
};

/**
 * Zustand store for managing self-care entry data with AsyncStorage persistence
 */
export const useSelfCareStore = create((set, get) => ({
  entries: [],
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
      let entries = stored ? JSON.parse(stored) : [];

      // Normalize and validate entries data
      entries = entries
        .filter(entry => entry && (entry.entry_date || entry.entryDate))
        .map(normalizeEntry)
        .filter(entry => entry && entry.entry_date);

      // Migrate legacy format to new format
      let migrationCount = 0;
      entries = entries.map(entry => {
        // Check if entry uses legacy format (has activities array but no activity_times)
        if (entry.activities && Array.isArray(entry.activities) && !entry.activity_times) {
          migrationCount++;

          // Convert legacy activities array to activity_times object
          const activity_times = {};
          entry.activities.forEach(activityKey => {
            if (activityKey) {
              activity_times[activityKey] = {
                timeDescriptor: entry.time_descriptor || "Afternoon"
              };
            }
          });

          // Return migrated entry without the legacy activities field
          const { activities, ...rest } = entry;
          return {
            ...rest,
            activity_times,
            use_individual_times: false, // Legacy entries used single time for all
            updatedAt: new Date().toISOString()
          };
        }
        return entry;
      });

      // Save migrated data if any migrations occurred
      if (migrationCount > 0) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
        console.log(`Migrated ${migrationCount} self-care entries from legacy format to activity_times format`);
      }

      console.log("Loaded self-care entries from storage:", entries.length);
      set({ entries, isLoading: false, isInitialized: true });
    } catch (error) {
      console.error("Error loading self-care entries from storage:", error);
      // Clear corrupt data
      await AsyncStorage.removeItem(STORAGE_KEY);
      set({ entries: [], isLoading: false, isInitialized: true });
    }
  },

  /**
   * Create a new self-care entry
   * @param {Object} entryData - The entry data to create
   * @returns {Object} The created entry with generated ID
   */
  createEntry: async (entryData) => {
    try {
      // Normalize the entry data first
      const normalizedData = normalizeEntry(entryData);

      const newEntry = {
        id: Date.now().toString(),
        userId: "default-user",
        createdAt: new Date().toISOString(),
        ...normalizedData,
      };

      console.log("Creating self-care entry with data:", newEntry);

      const updatedEntries = [...get().entries, newEntry];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
      set({ entries: updatedEntries });

      return newEntry;
    } catch (error) {
      console.error("Error creating self-care entry:", error);
      throw error;
    }
  },

  /**
   * Update an existing self-care entry
   * @param {string} id - The entry ID to update
   * @param {Object} updates - The fields to update
   * @returns {Object} The updated entry
   */
  updateEntry: async (id, updates) => {
    try {
      // Normalize the updates
      const normalizedUpdates = normalizeEntry(updates);

      const updatedEntries = get().entries.map((entry) =>
        entry.id === id
          ? normalizeEntry({ ...entry, ...normalizedUpdates, updatedAt: new Date().toISOString() })
          : entry
      );

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
      set({ entries: updatedEntries });

      return updatedEntries.find((e) => e.id === id);
    } catch (error) {
      console.error("Error updating self-care entry:", error);
      throw error;
    }
  },

  /**
   * Delete a self-care entry
   * @param {string} id - The entry ID to delete
   */
  deleteEntry: async (id) => {
    try {
      const updatedEntries = get().entries.filter((entry) => entry.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
      set({ entries: updatedEntries });
    } catch (error) {
      console.error("Error deleting self-care entry:", error);
      throw error;
    }
  },

  /**
   * Get all entries
   * @returns {Array} All self-care entries
   */
  getEntries: () => {
    return get().entries;
  },

  /**
   * Get entries for a specific date
   * @param {string} date - Date string in YYYY-MM-DD format
   * @returns {Array} Entries for that date
   */
  getEntriesForDate: (date) => {
    return get().entries.filter((entry) => entry.entry_date === date);
  },

  /**
   * Get entries within a date range
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Array} Entries within the date range
   */
  getEntriesForDateRange: (startDate, endDate) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    return get().entries.filter((entry) => {
      const entryDate = parseISO(entry.entry_date);
      return (
        (isAfter(entryDate, start) || entryDate.getTime() === start.getTime()) &&
        (isBefore(entryDate, end) || entryDate.getTime() === end.getTime())
      );
    });
  },

  /**
   * Clear all self-care data (useful for testing or reset)
   */
  clearAll: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      set({ entries: [] });
    } catch (error) {
      console.error("Error clearing self-care entries:", error);
      throw error;
    }
  },
}));
