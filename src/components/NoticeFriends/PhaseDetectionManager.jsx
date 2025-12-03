import React, { useState, useEffect } from 'react';
import { usePhaseDetection } from '@/utils/hooks/usePhaseDetection';
import { useNotificationStore } from '@/utils/stores/useNotificationStore';
import PhaseConfirmationDialog from './PhaseConfirmationDialog';
import { sendNotificationsToContacts } from '@/utils/notifications/smsService';
import Toast from 'react-native-toast-message';

/**
 * Manager component that monitors phase changes and shows confirmation dialog
 * Should be rendered once at app level
 */
export default function PhaseDetectionManager() {
  const phaseInfo = usePhaseDetection();
  const contacts = useNotificationStore((state) => state.contacts);
  const getConfirmedContacts = useNotificationStore((state) => state.getConfirmedContacts);
  const settings = useNotificationStore((state) => state.settings);
  const getMessageTemplate = useNotificationStore((state) => state.getMessageTemplate);
  const updateLastNotificationDate = useNotificationStore((state) => state.updateLastNotificationDate);

  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const confirmedContacts = getConfirmedContacts();

    // Only show dialog if:
    // 1. Phase should notify (luteal or period)
    // 2. Auto-notify is enabled
    // 3. Require confirmation is enabled
    // 4. There are confirmed contacts to notify
    // 5. Settings exist and user name is set
    if (
      phaseInfo.shouldNotify &&
      settings?.autoNotifyEnabled &&
      settings?.requireConfirmation &&
      confirmedContacts.length > 0 &&
      settings?.userName
    ) {
      setShowDialog(true);
    }

    // If auto-notify is enabled but confirmation is disabled, send immediately
    if (
      phaseInfo.shouldNotify &&
      settings?.autoNotifyEnabled &&
      !settings?.requireConfirmation &&
      confirmedContacts.length > 0 &&
      settings?.userName
    ) {
      handleAutoSend();
    }
  }, [phaseInfo.shouldNotify, phaseInfo.notificationPhase]);

  const handleAutoSend = async () => {
    if (!settings?.userName || !phaseInfo.notificationPhase) {
      return;
    }

    const tone = settings.messageTone || 'casual';
    const message = getMessageTemplate(tone, phaseInfo.notificationPhase, settings.userName);

    // Only send to confirmed contacts
    const confirmedContacts = getConfirmedContacts();
    const result = await sendNotificationsToContacts(confirmedContacts, message, phaseInfo.notificationPhase);

    await updateLastNotificationDate();

    Toast.show({
      type: result.successCount > 0 ? 'success' : 'error',
      text1: result.successCount > 0 ? 'Notifications Sent' : 'Send Failed',
      text2:
        result.successCount > 0
          ? `Notified ${result.successCount} contact${result.successCount !== 1 ? 's' : ''}`
          : 'Failed to send notifications',
    });
  };

  const handleConfirm = async () => {
    if (!settings?.userName || !phaseInfo.notificationPhase) {
      setShowDialog(false);
      return;
    }

    const tone = settings.messageTone || 'casual';
    const message = getMessageTemplate(tone, phaseInfo.notificationPhase, settings.userName);

    // Only send to confirmed contacts
    const confirmedContacts = getConfirmedContacts();
    const result = await sendNotificationsToContacts(confirmedContacts, message, phaseInfo.notificationPhase);

    await updateLastNotificationDate();

    setShowDialog(false);

    Toast.show({
      type: result.successCount > 0 ? 'success' : 'error',
      text1: result.successCount > 0 ? 'Notifications Sent' : 'Send Failed',
      text2:
        result.successCount > 0
          ? `Notified ${result.successCount} contact${result.successCount !== 1 ? 's' : ''}`
          : result.failureCount > 0
          ? `${result.failureCount} notification${result.failureCount !== 1 ? 's' : ''} failed`
          : 'Failed to send notifications',
    });
  };

  const handleClose = () => {
    setShowDialog(false);
  };

  if (!showDialog || !settings?.userName || !phaseInfo.notificationPhase) {
    return null;
  }

  const tone = settings.messageTone || 'casual';
  const message = getMessageTemplate(tone, phaseInfo.notificationPhase, settings.userName);
  const confirmedContacts = getConfirmedContacts();

  return (
    <PhaseConfirmationDialog
      visible={showDialog}
      onClose={handleClose}
      onConfirm={handleConfirm}
      phaseName={phaseInfo.notificationPhase}
      contacts={confirmedContacts}
      message={message}
    />
  );
}
