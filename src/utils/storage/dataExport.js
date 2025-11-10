import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { format } from "date-fns";
import { useCycleStore } from "../stores/useCycleStore";
import { useSelfCareStore } from "../stores/useSelfCareStore";
import { useAnxietyStore } from "../stores/useAnxietyStore";
import { useActivityStore } from "../stores/useActivityStore";

/**
 * Export all app data to a JSON file
 * @returns {Promise<string>} The file URI of the exported data
 */
export async function exportAllData() {
  try {
    // Gather all data from stores
    const data = {
      exportDate: new Date().toISOString(),
      version: "1.0",
      cycles: useCycleStore.getState().cycles,
      selfCareEntries: useSelfCareStore.getState().entries,
      anxietyEntries: useAnxietyStore.getState().entries,
      customActivities: useActivityStore.getState().activities,
    };

    // Create filename with current date
    const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
    const filename = `rhythm-backup-${timestamp}.json`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

    // Write JSON to file
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data, null, 2));

    return fileUri;
  } catch (error) {
    console.error("Error exporting data:", error);
    throw error;
  }
}

/**
 * Share the exported data file
 * @param {string} fileUri - The URI of the file to share
 */
export async function shareExportedData(fileUri) {
  try {
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "application/json",
        dialogTitle: "Export Rhythm Data",
        UTI: "public.json",
      });
    } else {
      throw new Error("Sharing is not available on this device");
    }
  } catch (error) {
    console.error("Error sharing exported data:", error);
    throw error;
  }
}

/**
 * Export and share all data in one operation
 * @returns {Promise<void>}
 */
export async function exportAndShare() {
  try {
    const fileUri = await exportAllData();
    await shareExportedData(fileUri);
  } catch (error) {
    console.error("Error in export and share:", error);
    throw error;
  }
}

/**
 * Get export statistics
 * @returns {Object} Statistics about the data to be exported
 */
export function getExportStats() {
  return {
    cyclesCount: useCycleStore.getState().cycles.length,
    selfCareEntriesCount: useSelfCareStore.getState().entries.length,
    anxietyEntriesCount: useAnxietyStore.getState().entries.length,
    customActivitiesCount: useActivityStore.getState().activities.length,
  };
}
