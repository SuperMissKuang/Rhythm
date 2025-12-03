import { supabase } from '@/utils/supabase';
import { useNotificationStore } from '@/utils/stores/useNotificationStore';

/**
 * Send an SMS message via Supabase Edge Function
 *
 * @param {string} phone - Phone number in E.164 format (e.g., +15551234567)
 * @param {string} message - Message content to send
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendSMS(phone, message) {
  try {
    console.log('Sending SMS to:', phone);

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: {
        phone,
        message,
      },
    });

    if (error) {
      console.error('Edge Function error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send SMS',
      };
    }

    if (!data || !data.success) {
      console.error('SMS send failed:', data);
      return {
        success: false,
        error: data?.error || 'Unknown error occurred',
      };
    }

    console.log('SMS sent successfully:', data.messageId);
    return {
      success: true,
      messageId: data.messageId,
      status: data.status,
    };
  } catch (error) {
    console.error('SMS service error:', error);
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}

/**
 * Log a sent notification to local storage
 *
 * @param {object} params - Notification details
 * @param {string} params.contactId - Contact ID
 * @param {string} params.contactName - Contact name
 * @param {string} params.contactPhone - Contact phone number
 * @param {string} params.phase - Cycle phase (luteal/period)
 * @param {string} params.message - Message that was sent
 * @param {string} params.deliveryStatus - Status (sent/delivered/failed)
 */
export async function logNotification({
  contactId,
  contactName,
  contactPhone,
  phase,
  message,
  deliveryStatus = 'sent',
}) {
  try {
    await useNotificationStore.getState().logNotification({
      contactId,
      contactName,
      contactPhone,
      phase,
      message,
      deliveryStatus,
    });
  } catch (error) {
    console.error('Error logging notification:', error);
  }
}

/**
 * Send opt-in request SMS to a contact
 * Sends the initial consent request message
 *
 * @param {object} contact - Contact object {id, name, phone}
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendOptInRequest(contact) {
  try {
    console.log('Sending opt-in request to:', contact.name);

    const message = `Rhythm: You've been invited to receive cycle updates for support. Reply YES to opt-in. Reply STOP to decline. Msg & data rates may apply.`;

    // Send SMS
    const result = await sendSMS(contact.phone, message);

    // Log the opt-in request
    await logNotification({
      contactId: contact.id,
      contactName: contact.name,
      contactPhone: contact.phone,
      phase: 'opt-in',
      message,
      deliveryStatus: result.success ? 'sent' : 'failed',
    });

    return result;
  } catch (error) {
    console.error('Error sending opt-in request:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send notification to a single contact
 * Sends SMS and logs the notification
 *
 * @param {object} contact - Contact object {id, name, phone}
 * @param {string} message - Message to send
 * @param {string} phase - Cycle phase (luteal/period)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendNotificationToContact(contact, message, phase) {
  try {
    // Send SMS
    const result = await sendSMS(contact.phone, message);

    // Log the notification
    await logNotification({
      contactId: contact.id,
      contactName: contact.name,
      contactPhone: contact.phone,
      phase,
      message,
      deliveryStatus: result.success ? 'sent' : 'failed',
    });

    return result;
  } catch (error) {
    console.error('Error sending notification:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send notifications to multiple contacts
 *
 * @param {Array} contacts - Array of contact objects
 * @param {string} message - Message to send
 * @param {string} phase - Cycle phase (luteal/period)
 * @returns {Promise<{successCount: number, failureCount: number, results: Array}>}
 */
export async function sendNotificationsToContacts(contacts, message, phase) {
  const results = [];
  let successCount = 0;
  let failureCount = 0;

  for (const contact of contacts) {
    const result = await sendNotificationToContact(contact, message, phase);
    results.push({
      contact: contact.name,
      ...result,
    });

    if (result.success) {
      successCount++;
    } else {
      failureCount++;
    }

    // Add small delay between messages to avoid rate limiting
    if (contacts.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return {
    successCount,
    failureCount,
    results,
  };
}
