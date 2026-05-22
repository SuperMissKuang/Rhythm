import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  sortCyclesChronologically,
  recalculateCycleLengths,
  updateOutlierFlags,
  checkDataIntegrity,
} from "@/utils/cycleStatistics";
import {
  readVersioned,
  writeVersioned,
} from "@/utils/storage/versionedStorage";

const STORAGE_KEY = "@rhythm:menstrual-cycles";

/**
 * Current schema version for persisted cycle data.
 *
 * Bump this (and add an entry to MIGRATIONS) any time the shape of a cycle
 * record changes in a way old installs wouldn't handle gracefully — e.g.
 * adding a required field, renaming a field, changing a field's type.
 *
 * Pure additive changes (a new optional field that defaults to null) don't
 * strictly require a bump, but bumping is cheap and makes intent explicit.
 */
const CURRENT_SCHEMA_VERSION = 1;

/**
 * Migration registry. Each entry: { [targetVersion]: (oldData) => newData }.
 * Migrations run in order from storedVersion+1 up to CURRENT_SCHEMA_VERSION.
 *
 * v1 has no migration entry: legacy storage was a raw array of cycles, which
 * is exactly the shape v1 expects (we're just wrapping it in an envelope).
 * The versionedStorage helper treats a missing entry as a no-op.
 *
 * Example for a future v2 that adds `period_length`:
 *   2: (v1cycles) => v1cycles.map(c => ({ ...c, period_length: null })),
 */
const MIGRATIONS = {};

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
    // Ensure outlier fields exist
    is_outlier: cycle.is_outlier ?? false,
    outlier_reason: cycle.outlier_reason ?? null,
    is_hard_limit_violation: cycle.is_hard_limit_violation ?? false,
    // User acknowledgment of outlier status: null | "mistake" | "confirmed"
    outlier_acknowledged: cycle.outlier_acknowledged ?? null,
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
      const stored = await readVersioned(
        STORAGE_KEY,
        CURRENT_SCHEMA_VERSION,
        MIGRATIONS
      );

      const rawCycles = Array.isArray(stored?.data) ? stored.data : [];
      const envelopeWasMigrated = stored?.wasMigrated ?? false;

      // Normalize and validate cycles data
      let cycles = rawCycles
        .filter((cycle) => cycle && (cycle.start_date || cycle.startDate))
        .map(normalizeCycle)
        .filter((cycle) => cycle && cycle.start_date);

      // Migration: Check if cycles need outlier fields or recalculation.
      // This is separate from schema-version migration — it's a data-correctness
      // backfill that runs on every load. Kept as-is from the pre-versioning code.
      let needsMigration = false;

      // Check for missing outlier fields
      if (cycles.some((c) => c.is_outlier === undefined)) {
        needsMigration = true;
      }

      // Verify cycle lengths are correct by checking against actual date differences
      if (!needsMigration && cycles.length >= 2) {
        const sorted = [...cycles].sort((a, b) =>
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        );

        for (let i = 0; i < sorted.length - 1; i++) {
          const currentStart = new Date(sorted[i].start_date);
          const nextStart = new Date(sorted[i + 1].start_date);
          const actualDays = Math.round((nextStart - currentStart) / (1000 * 60 * 60 * 24));
          const storedDays = sorted[i].cycle_length;

          // If stored length doesn't match actual gap, we need to recalculate
          if (storedDays !== actualDays) {
            console.log(`Migration: Cycle length mismatch - stored ${storedDays}, actual ${actualDays}`);
            needsMigration = true;
            break;
          }
        }
      }

      if (needsMigration && cycles.length > 0) {
        console.log("Migration: Recalculating cycle lengths and outlier flags");
        // Recalculate all cycle lengths based on chronological order
        cycles = recalculateCycleLengths(cycles);
        // Update outlier flags
        cycles = updateOutlierFlags(cycles);
      }

      // Persist if either (a) the schema envelope was upgraded from a legacy
      // or older version, or (b) the data-correctness backfill above made
      // changes. Writing once here guarantees subsequent loads find the
      // current envelope and skip both migrations.
      if (envelopeWasMigrated || (needsMigration && cycles.length > 0)) {
        await writeVersioned(STORAGE_KEY, cycles, CURRENT_SCHEMA_VERSION);
      }

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
   * Create a new menstrual cycle entry with validation and auto-recalculation
   * @param {Object} cycleData - The cycle data to create
   * @returns {{ success: boolean, cycle: Object|null, errors: Array<string>, action: string }}
   */
  createCycle: async (cycleData) => {
    try {
      // Normalize the cycle data first
      const normalizedData = normalizeCycle(cycleData);
      const existingCycles = get().cycles;

      const newCycle = {
        id: Date.now().toString(),
        userId: "default-user",
        createdAt: new Date().toISOString(),
        ...normalizedData,
        is_outlier: false,
        outlier_reason: null,
        is_hard_limit_violation: false,
      };

      console.log("Creating cycle with data:", newCycle);

      // Add new cycle to array
      let allCycles = [...existingCycles, newCycle];

      // Recalculate all cycle lengths based on chronological order
      allCycles = recalculateCycleLengths(allCycles);

      // Update outlier flags for all cycles
      allCycles = updateOutlierFlags(allCycles);

      // Check data integrity for the newly calculated length
      const createdCycle = allCycles.find((c) => c.id === newCycle.id);
      if (createdCycle) {
        const integrityCheck = checkDataIntegrity(createdCycle.cycle_length);
        createdCycle.is_hard_limit_violation = integrityCheck.isError;
      }

      await writeVersioned(STORAGE_KEY, allCycles, CURRENT_SCHEMA_VERSION);
      set({ cycles: allCycles });

      console.log("Created cycle with auto-recalculation:", createdCycle);

      return {
        success: true,
        cycle: createdCycle,
        errors: [],
      };
    } catch (error) {
      console.error("Error creating cycle:", error);
      return {
        success: false,
        cycle: null,
        errors: [error.message],
        action: "error",
      };
    }
  },

  /**
   * Update an existing menstrual cycle
   * @param {string} id - The cycle ID to update
   * @param {Object} updates - The fields to update
   * @returns {{ success: boolean, cycle: Object|null, errors: Array<string> }}
   */
  updateCycle: async (id, updates) => {
    try {
      const existingCycles = get().cycles;
      const cycleToUpdate = existingCycles.find((c) => c.id === id);

      if (!cycleToUpdate) {
        return {
          success: false,
          cycle: null,
          errors: ["Cycle not found"],
        };
      }

      // Normalize the updates
      const normalizedUpdates = normalizeCycle(updates);

      // Update the cycle
      let updatedCycles = existingCycles.map((cycle) =>
        cycle.id === id
          ? normalizeCycle({
              ...cycle,
              ...normalizedUpdates,
              updatedAt: new Date().toISOString(),
            })
          : cycle
      );

      // Recalculate all cycle lengths
      updatedCycles = recalculateCycleLengths(updatedCycles);

      // Update outlier flags
      updatedCycles = updateOutlierFlags(updatedCycles);

      await writeVersioned(STORAGE_KEY, updatedCycles, CURRENT_SCHEMA_VERSION);
      set({ cycles: updatedCycles });

      const updatedCycle = updatedCycles.find((c) => c.id === id);
      return {
        success: true,
        cycle: updatedCycle,
        errors: [],
      };
    } catch (error) {
      console.error("Error updating cycle:", error);
      return {
        success: false,
        cycle: null,
        errors: [error.message],
      };
    }
  },

  /**
   * Delete a menstrual cycle and recalculate affected cycles
   * @param {string} id - The cycle ID to delete
   * @returns {{ success: boolean, errors: Array<string> }}
   */
  deleteCycle: async (id) => {
    try {
      const existingCycles = get().cycles;
      const cycleToDelete = existingCycles.find((c) => c.id === id);

      if (!cycleToDelete) {
        return { success: false, errors: ["Cycle not found"] };
      }

      // Remove the cycle
      let remainingCycles = existingCycles.filter((cycle) => cycle.id !== id);

      if (remainingCycles.length === 0) {
        await writeVersioned(STORAGE_KEY, [], CURRENT_SCHEMA_VERSION);
        set({ cycles: [] });
        return { success: true, errors: [] };
      }

      // Recalculate all cycle lengths
      remainingCycles = recalculateCycleLengths(remainingCycles);

      // Update outlier flags
      remainingCycles = updateOutlierFlags(remainingCycles);

      await writeVersioned(STORAGE_KEY, remainingCycles, CURRENT_SCHEMA_VERSION);
      set({ cycles: remainingCycles });

      console.log("Deleted cycle and recalculated lengths");
      return { success: true, errors: [] };
    } catch (error) {
      console.error("Error deleting cycle:", error);
      return { success: false, errors: [error.message] };
    }
  },

  /**
   * Get all cycles sorted chronologically (oldest first)
   * @returns {Array} Sorted cycles
   */
  getSortedCycles: () => {
    return sortCyclesChronologically(get().cycles);
  },

  /**
   * Get the most recent cycle
   * @returns {Object|null} Most recent cycle or null
   */
  getMostRecentCycle: () => {
    const sorted = sortCyclesChronologically(get().cycles);
    return sorted.length > 0 ? sorted[sorted.length - 1] : null;
  },

  /**
   * Get all cycles (unsorted, for backward compatibility)
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

  /**
   * Load a debug scenario (development only)
   * @param {Array} cycles - Array of cycle objects to load
   * @returns {{ success: boolean, errors: Array<string> }}
   */
  loadDebugScenario: async (cycles) => {
    if (!__DEV__) {
      console.warn("loadDebugScenario is only available in development mode");
      return { success: false, errors: ["Not available in production"] };
    }

    try {
      // Normalize all cycles
      let normalizedCycles = cycles
        .filter((cycle) => cycle && (cycle.start_date || cycle.startDate))
        .map(normalizeCycle)
        .filter((cycle) => cycle && cycle.start_date);

      // Recalculate cycle lengths
      if (normalizedCycles.length > 0) {
        normalizedCycles = recalculateCycleLengths(normalizedCycles);
        normalizedCycles = updateOutlierFlags(normalizedCycles);
      }

      // Save to AsyncStorage and update state
      await writeVersioned(STORAGE_KEY, normalizedCycles, CURRENT_SCHEMA_VERSION);
      set({ cycles: normalizedCycles });

      console.log("Loaded debug scenario with", normalizedCycles.length, "cycles");
      return { success: true, errors: [] };
    } catch (error) {
      console.error("Error loading debug scenario:", error);
      return { success: false, errors: [error.message] };
    }
  },
}));
