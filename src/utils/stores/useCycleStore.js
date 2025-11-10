import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@rhythm:menstrual-cycles";

/**
 * Normalize cycle data to use snake_case field names
 */
const normalizeCycle = (cycle) => {
  if (!cycle) return null;

  return {
    ...cycle,
    // Normalize field names to snake_case
    start_date: cycle.start_date || cycle.startDate,
    cycle_length: cycle.cycle_length || cycle.cycleLength || 28,
    end_date: cycle.end_date || cycle.endDate,
    // Remove camelCase versions if they exist
    startDate: undefined,
    cycleLength: undefined,
    endDate: undefined,
  };
};

/**
 * Zustand store for managing menstrual cycle data with AsyncStorage persistence
 */
export const useCycleStore = create((set, get) => ({
  cycles: [],
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
      let cycles = stored ? JSON.parse(stored) : [];

      // Normalize and validate cycles data
      cycles = cycles
        .filter(cycle => cycle && (cycle.start_date || cycle.startDate))
        .map(normalizeCycle)
        .filter(cycle => cycle && cycle.start_date);

      console.log("Loaded cycles from storage:", cycles.length);
      set({ cycles, isLoading: false, isInitialized: true });
    } catch (error) {
      console.error("Error loading cycles from storage:", error);
      // Clear corrupt data
      await AsyncStorage.removeItem(STORAGE_KEY);
      set({ cycles: [], isLoading: false, isInitialized: true });
    }
  },

  /**
   * Create a new menstrual cycle entry
   * @param {Object} cycleData - The cycle data to create
   * @returns {Object} The created cycle with generated ID
   */
  createCycle: async (cycleData) => {
    try {
      // Normalize the cycle data first
      const normalizedData = normalizeCycle(cycleData);

      const newCycle = {
        id: Date.now().toString(),
        userId: "default-user",
        createdAt: new Date().toISOString(),
        ...normalizedData,
      };

      console.log("Creating cycle with data:", newCycle);

      const updatedCycles = [...get().cycles, newCycle];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCycles));
      set({ cycles: updatedCycles });

      return newCycle;
    } catch (error) {
      console.error("Error creating cycle:", error);
      throw error;
    }
  },

  /**
   * Update an existing menstrual cycle
   * @param {string} id - The cycle ID to update
   * @param {Object} updates - The fields to update
   * @returns {Object} The updated cycle
   */
  updateCycle: async (id, updates) => {
    try {
      // Normalize the updates
      const normalizedUpdates = normalizeCycle(updates);

      const updatedCycles = get().cycles.map((cycle) =>
        cycle.id === id
          ? normalizeCycle({ ...cycle, ...normalizedUpdates, updatedAt: new Date().toISOString() })
          : cycle
      );

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCycles));
      set({ cycles: updatedCycles });

      return updatedCycles.find((c) => c.id === id);
    } catch (error) {
      console.error("Error updating cycle:", error);
      throw error;
    }
  },

  /**
   * Delete a menstrual cycle
   * @param {string} id - The cycle ID to delete
   */
  deleteCycle: async (id) => {
    try {
      const updatedCycles = get().cycles.filter((cycle) => cycle.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCycles));
      set({ cycles: updatedCycles });
    } catch (error) {
      console.error("Error deleting cycle:", error);
      throw error;
    }
  },

  /**
   * Get all cycles
   * @returns {Array} All menstrual cycles
   */
  getCycles: () => {
    return get().cycles;
  },

  /**
   * Clear all cycle data (useful for testing or reset)
   */
  clearAll: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      set({ cycles: [] });
    } catch (error) {
      console.error("Error clearing cycles:", error);
      throw error;
    }
  },
}));
