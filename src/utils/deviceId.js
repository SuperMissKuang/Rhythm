import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = '@rhythm:device-id';

/**
 * Get or create a unique device ID for this installation.
 * This ID is used to identify the user across Supabase operations
 * without requiring authentication.
 *
 * @returns {Promise<string>} The device ID
 */
export async function getDeviceId() {
  try {
    // Try to get existing device ID
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
      // Generate new device ID if none exists
      deviceId = uuidv4();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
      console.log('Generated new device ID:', deviceId);
    } else {
      console.log('Retrieved existing device ID:', deviceId);
    }

    return deviceId;
  } catch (error) {
    console.error('Error getting/creating device ID:', error);
    // Fallback: use a random ID for this session only (won't persist)
    return `temp-${uuidv4()}`;
  }
}

/**
 * Reset the device ID (useful for testing or factory reset scenarios)
 * WARNING: This will make the user unable to access their cloud data
 */
export async function resetDeviceId() {
  try {
    await AsyncStorage.removeItem(DEVICE_ID_KEY);
    console.log('Device ID reset');
  } catch (error) {
    console.error('Error resetting device ID:', error);
  }
}
