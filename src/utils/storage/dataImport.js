import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useCycleStore } from "../stores/useCycleStore";
import { useSelfCareStore } from "../stores/useSelfCareStore";
import { useAnxietyStore } from "../stores/useAnxietyStore";
import { useActivityStore } from "../stores/useActivityStore";

/**
 * Parse and validate imported data
 * @param {Object} data - The imported data object
 * @returns {Object} Validated and normalized data
 */
function validateImportData(data) {
  const validated = {
    cycles: [],
    selfCareEntries: [],
    anxietyEntries: [],
    customActivities: [],
  };

  // Validate cycles
  if (Array.isArray(data.cycles)) {
    validated.cycles = data.cycles.filter((cycle) => {
      return cycle && (cycle.start_date || cycle.date);
    });
  }

  // Validate self-care entries
  if (Array.isArray(data.selfCareEntries)) {
    validated.selfCareEntries = data.selfCareEntries.filter((entry) => {
      return entry && entry.entry_date && Array.isArray(entry.activities);
    });
  }

  // Validate anxiety entries
  if (Array.isArray(data.anxietyEntries)) {
    validated.anxietyEntries = data.anxietyEntries.filter((entry) => {
      return entry && entry.entry_date && entry.severity;
    });
  }

  // Validate custom activities
  if (Array.isArray(data.customActivities)) {
    validated.customActivities = data.customActivities.filter((activity) => {
      return activity && activity.name;
    });
  }

  return validated;
}

/**
 * Import data from a JSON file picked by the user
 * @param {Object} options - Import options
 * @param {boolean} options.merge - If true, merge with existing data. If false, replace.
 * @returns {Promise<Object>} Import statistics
 */
export async function importFromFile(options = { merge: true }) {
  try {
    // Pick a document
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return { canceled: true };
    }

    // Read the file
    const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
    const data = JSON.parse(fileContent);

    // Validate the data
    const validated = validateImportData(data);

    // Import to stores
    const stats = await importToStores(validated, options.merge);

    return {
      success: true,
      stats,
    };
  } catch (error) {
    console.error("Error importing data:", error);
    throw error;
  }
}

/**
 * Import validated data into stores
 * @param {Object} data - Validated data object
 * @param {boolean} merge - Whether to merge with existing data
 * @returns {Promise<Object>} Import statistics
 */
async function importToStores(data, merge = true) {
  const stats = {
    cyclesImported: 0,
    selfCareEntriesImported: 0,
    anxietyEntriesImported: 0,
    customActivitiesImported: 0,
  };

  try {
    // Import cycles
    if (data.cycles.length > 0) {
      const cycleStore = useCycleStore.getState();
      if (merge) {
        // Merge: add new cycles, avoiding duplicates by date
        const existingDates = new Set(
          cycleStore.cycles.map((c) => c.start_date || c.date)
        );
        for (const cycle of data.cycles) {
          const cycleDate = cycle.start_date || cycle.date;
          if (!existingDates.has(cycleDate)) {
            await cycleStore.createCycle(cycle);
            stats.cyclesImported++;
          }
        }
      } else {
        // Replace: clear and add all
        await cycleStore.clearAll();
        for (const cycle of data.cycles) {
          await cycleStore.createCycle(cycle);
          stats.cyclesImported++;
        }
      }
    }

    // Import self-care entries
    if (data.selfCareEntries.length > 0) {
      const selfCareStore = useSelfCareStore.getState();
      if (merge) {
        // Merge: add new entries, avoiding duplicates by date+activities
        const existingKeys = new Set(
          selfCareStore.entries.map(
            (e) => `${e.entry_date}-${JSON.stringify(e.activities)}`
          )
        );
        for (const entry of data.selfCareEntries) {
          const key = `${entry.entry_date}-${JSON.stringify(entry.activities)}`;
          if (!existingKeys.has(key)) {
            await selfCareStore.createEntry(entry);
            stats.selfCareEntriesImported++;
          }
        }
      } else {
        // Replace: clear and add all
        await selfCareStore.clearAll();
        for (const entry of data.selfCareEntries) {
          await selfCareStore.createEntry(entry);
          stats.selfCareEntriesImported++;
        }
      }
    }

    // Import anxiety entries
    if (data.anxietyEntries.length > 0) {
      const anxietyStore = useAnxietyStore.getState();
      if (merge) {
        // Merge: add new entries
        const existingKeys = new Set(
          anxietyStore.entries.map(
            (e) => `${e.entry_date}-${e.time_descriptor}-${e.severity}`
          )
        );
        for (const entry of data.anxietyEntries) {
          const key = `${entry.entry_date}-${entry.time_descriptor}-${entry.severity}`;
          if (!existingKeys.has(key)) {
            await anxietyStore.createEntry(entry);
            stats.anxietyEntriesImported++;
          }
        }
      } else {
        // Replace: clear and add all
        await anxietyStore.clearAll();
        for (const entry of data.anxietyEntries) {
          await anxietyStore.createEntry(entry);
          stats.anxietyEntriesImported++;
        }
      }
    }

    // Import custom activities
    if (data.customActivities.length > 0) {
      const activityStore = useActivityStore.getState();
      if (merge) {
        // Merge: add new activities, avoiding duplicates by name
        const existingNames = new Set(
          activityStore.activities.map((a) => a.name)
        );
        for (const activity of data.customActivities) {
          if (!existingNames.has(activity.name)) {
            await activityStore.createActivity(activity);
            stats.customActivitiesImported++;
          }
        }
      } else {
        // Replace: clear and add all
        await activityStore.clearAll();
        for (const activity of data.customActivities) {
          await activityStore.createActivity(activity);
          stats.customActivitiesImported++;
        }
      }
    }

    return stats;
  } catch (error) {
    console.error("Error importing to stores:", error);
    throw error;
  }
}

/**
 * Import only menstrual cycle data (for past data upload feature)
 * @param {Array} cycles - Array of cycle objects
 * @returns {Promise<number>} Number of cycles imported
 */
export async function importMenstrualCycles(cycles) {
  try {
    if (!Array.isArray(cycles)) {
      throw new Error("Cycles must be an array");
    }

    const cycleStore = useCycleStore.getState();
    const existingDates = new Set(
      cycleStore.cycles.map((c) => c.start_date || c.date)
    );

    let imported = 0;
    for (const cycle of cycles) {
      const cycleDate = cycle.start_date || cycle.date;
      if (cycleDate && !existingDates.has(cycleDate)) {
        await cycleStore.createCycle(cycle);
        imported++;
      }
    }

    return imported;
  } catch (error) {
    console.error("Error importing menstrual cycles:", error);
    throw error;
  }
}
