import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONTACTS_KEY = '@rhythm:notification-contacts';
const SETTINGS_KEY = '@rhythm:notification-settings';
const HISTORY_KEY = '@rhythm:notification-history';

/**
 * Zustand store for managing notification data with AsyncStorage persistence
 * Follows the same pattern as useCycleStore, useSelfCareStore, etc.
 */
export const useNotificationStore = create((set, get) => ({
  // State
  contacts: [],
  settings: null,
  history: [],
  isLoading: false,
  isInitialized: false,

  /**
   * Initialize store by loading data from AsyncStorage
   * Should be called once on app startup
   */
  init: async () => {
    set({ isLoading: true });
    try {
      // Load contacts
      const contactsStored = await AsyncStorage.getItem(CONTACTS_KEY);
      const contacts = contactsStored ? JSON.parse(contactsStored) : [];

      // Load settings
      const settingsStored = await AsyncStorage.getItem(SETTINGS_KEY);
      const settings = settingsStored ? JSON.parse(settingsStored) : null;

      // Load history
      const historyStored = await AsyncStorage.getItem(HISTORY_KEY);
      const history = historyStored ? JSON.parse(historyStored) : [];

      console.log('Loaded notification data from storage');
      console.log('- Contacts:', contacts.length);
      console.log('- Settings:', settings ? 'exists' : 'none');
      console.log('- History:', history.length);

      set({
        contacts,
        settings,
        history,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      console.error('Error loading notification data from storage:', error);
      set({
        contacts: [],
        settings: null,
        history: [],
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  /**
   * Save or update settings
   * @param {Object} settingsData - The settings to save
   */
  saveSettings: async (settingsData) => {
    try {
      const settings = {
        userName: settingsData.userName,
        autoNotifyEnabled: settingsData.autoNotifyEnabled !== false, // default true
        requireConfirmation: settingsData.requireConfirmation !== false, // default true
        messageTone: settingsData.messageTone || 'casual', // default tone
        lutealTemplate: settingsData.lutealTemplate || '{userName} is entering her luteal phase and may be more tired or irritable than usual. Thank you for understanding! - Rhythm',
        periodTemplate: settingsData.periodTemplate || '{userName}\'s period started today. She might need some extra rest and support. - Rhythm',
        lastKnownPhase: settingsData.lastKnownPhase || null,
        lastNotificationDate: settingsData.lastNotificationDate || null,
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      set({ settings });

      console.log('Settings saved successfully');
      return { success: true };
    } catch (error) {
      console.error('Error saving settings:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get message template based on tone and phase
   * @param {string} tone - Message tone (casual, proper, playful)
   * @param {string} phase - Cycle phase (luteal, period)
   * @param {string} userName - User's name to insert into template
   * @returns {string} The formatted message
   */
  getMessageTemplate: (tone, phase, userName) => {
    const templates = {
      casual: {
        luteal: `Hey! ${userName} is entering her luteal phase and may be feeling a bit more tired or moody than usual. Thanks for being understanding! - Rhythm`,
        period: `Hi! ${userName}'s period started today. She might need some extra comfort and support right now. - Rhythm`,
      },
      proper: {
        luteal: `${userName} wanted to let you know she's entering her luteal phase and may experience increased fatigue or mood changes. Your understanding is appreciated. - Rhythm`,
        period: `${userName}'s menstrual cycle has begun. She may benefit from additional rest and consideration during this time. - Rhythm`,
      },
      playful: {
        luteal: `FYI: ${userName}'s luteal phase is kicking in! She might be extra tired or cranky, so maybe bring snacks? 😊 - Rhythm`,
        period: `Period alert for ${userName}! Time for extra TLC, cozy blankets, and chocolate. You know the drill! - Rhythm`,
      },
    };

    return templates[tone]?.[phase] || templates.casual[phase];
  },

  /**
   * Add a new contact
   * @param {Object} contactData - {name, phone, optInStatus}
   */
  addContact: async (contactData) => {
    try {
      const newContact = {
        id: Date.now().toString(),
        name: contactData.name,
        phone: contactData.phone,
        optInStatus: contactData.optInStatus || 'pending', // 'pending' | 'confirmed' | 'declined'
        optInSentAt: contactData.optInSentAt || new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      const updatedContacts = [...get().contacts, newContact];
      await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(updatedContacts));
      set({ contacts: updatedContacts });

      console.log('Contact added successfully:', newContact.name);
      return { success: true, contact: newContact };
    } catch (error) {
      console.error('Error adding contact:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update an existing contact
   * @param {string} contactId - The contact ID to update
   * @param {Object} updates - {name?, phone?}
   */
  updateContact: async (contactId, updates) => {
    try {
      const updatedContacts = get().contacts.map((contact) =>
        contact.id === contactId
          ? {
              ...contact,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : contact
      );

      await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(updatedContacts));
      set({ contacts: updatedContacts });

      const updatedContact = updatedContacts.find((c) => c.id === contactId);
      console.log('Contact updated successfully:', updatedContact.name);
      return { success: true, contact: updatedContact };
    } catch (error) {
      console.error('Error updating contact:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete a contact
   * @param {string} contactId - The contact ID to delete
   */
  deleteContact: async (contactId) => {
    try {
      const updatedContacts = get().contacts.filter((c) => c.id !== contactId);
      await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(updatedContacts));
      set({ contacts: updatedContacts });

      console.log('Contact deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('Error deleting contact:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update a contact's opt-in status
   * @param {string} contactId - The contact ID to update
   * @param {string} status - New status: 'pending' | 'confirmed' | 'declined'
   */
  updateOptInStatus: async (contactId, status) => {
    try {
      const updatedContacts = get().contacts.map((contact) =>
        contact.id === contactId
          ? {
              ...contact,
              optInStatus: status,
              optInConfirmedAt: status === 'confirmed' ? new Date().toISOString() : contact.optInConfirmedAt,
              updatedAt: new Date().toISOString(),
            }
          : contact
      );

      await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(updatedContacts));
      set({ contacts: updatedContacts });

      const updatedContact = updatedContacts.find((c) => c.id === contactId);
      console.log('Opt-in status updated:', updatedContact.name, status);
      return { success: true, contact: updatedContact };
    } catch (error) {
      console.error('Error updating opt-in status:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get confirmed contacts only (opted-in)
   * @returns {Array} Contacts with optInStatus === 'confirmed'
   */
  getConfirmedContacts: () => {
    return get().contacts.filter((c) => c.optInStatus === 'confirmed');
  },

  /**
   * Log a sent notification to history
   * @param {Object} logData - {contactId, contactName, contactPhone, phase, message, deliveryStatus}
   */
  logNotification: async (logData) => {
    try {
      const newLog = {
        id: Date.now().toString(),
        contactId: logData.contactId,
        contactName: logData.contactName,
        contactPhone: logData.contactPhone,
        phase: logData.phase,
        message: logData.message,
        deliveryStatus: logData.deliveryStatus || 'sent',
        sentAt: new Date().toISOString(),
      };

      const updatedHistory = [newLog, ...get().history]; // Newest first
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
      set({ history: updatedHistory });

      console.log('Notification logged to history');
      return { success: true };
    } catch (error) {
      console.error('Error logging notification:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Clear notification history
   */
  clearHistory: async () => {
    try {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify([]));
      set({ history: [] });
      console.log('Notification history cleared');
      return { success: true };
    } catch (error) {
      console.error('Error clearing history:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update last known phase (for detecting changes)
   * @param {string} phase - The current phase
   */
  updateLastKnownPhase: async (phase) => {
    try {
      const settings = get().settings;
      if (!settings) {
        console.warn('No settings found, cannot update phase');
        return;
      }

      await get().saveSettings({
        ...settings,
        lastKnownPhase: phase,
      });
    } catch (error) {
      console.error('Error updating last known phase:', error);
    }
  },

  /**
   * Update last notification date
   */
  updateLastNotificationDate: async () => {
    try {
      const settings = get().settings;
      if (!settings) {
        console.warn('No settings found, cannot update notification date');
        return;
      }

      await get().saveSettings({
        ...settings,
        lastNotificationDate: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating last notification date:', error);
    }
  },
}));
