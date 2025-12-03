import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import {
  useFonts,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from '@expo-google-fonts/montserrat';
import { useAppTheme } from '@/utils/theme';
import ContactForm from '@/components/NoticeFriends/ContactForm';
import ContactList from '@/components/NoticeFriends/ContactList';
import OptInRequestDialog from '@/components/NoticeFriends/OptInRequestDialog';
import { useNotificationStore } from '@/utils/stores/useNotificationStore';
import { sendOptInRequest } from '@/utils/notifications/smsService';
import Toast from 'react-native-toast-message';

export default function ManageContactsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [optInDialogVisible, setOptInDialogVisible] = useState(false);
  const [pendingContact, setPendingContact] = useState(null);

  const contacts = useNotificationStore((state) => state.contacts);
  const addContact = useNotificationStore((state) => state.addContact);
  const updateContact = useNotificationStore((state) => state.updateContact);
  const deleteContact = useNotificationStore((state) => state.deleteContact);

  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleAddContact = () => {
    setEditingContact(null);
    setModalVisible(true);
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setModalVisible(true);
  };

  const handleSaveContact = async (contactData) => {
    if (editingContact) {
      // Update existing contact
      await updateContact(editingContact.id, contactData);
      setModalVisible(false);
      Toast.show({
        type: 'success',
        text1: 'Contact Updated',
        text2: `${contactData.name} has been updated`,
      });
    } else {
      // Add new contact
      const result = await addContact(contactData);
      setModalVisible(false);

      if (result.success && result.contact) {
        // Show opt-in request dialog
        setPendingContact(result.contact);
        setOptInDialogVisible(true);
      }
    }
  };

  const handleSendOptIn = async () => {
    if (!pendingContact) return;

    const result = await sendOptInRequest(pendingContact);

    setOptInDialogVisible(false);

    if (result.success) {
      Toast.show({
        type: 'success',
        text1: 'Opt-In Request Sent',
        text2: `${pendingContact.name} will receive a confirmation SMS`,
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Send Failed',
        text2: result.error || 'Failed to send opt-in request',
      });
    }

    setPendingContact(null);
  };

  const handleDeleteContact = async (contactId) => {
    await deleteContact(contactId);
  };

  const handleResendOptIn = async (contact) => {
    // Show opt-in dialog for resending
    setPendingContact(contact);
    setOptInDialogVisible(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Manage Contacts',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.primary,
          headerTitleStyle: {
            fontFamily: 'Montserrat_600SemiBold',
          },
        }}
      />
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header with Add Button */}
      <View
        style={{
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        }}
      >
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Montserrat_500Medium',
              color: colors.secondary,
            }}
          >
            {contacts.length === 0
              ? 'Add contacts to notify'
              : `${contacts.length} contact${contacts.length !== 1 ? 's' : ''}`}
          </Text>

          <TouchableOpacity
            onPress={handleAddContact}
            style={{
              backgroundColor: '#FCE7F3',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.borderLight,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Montserrat_600SemiBold',
                color: colors.primary,
              }}
            >
              + Add
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <ContactList
          contacts={contacts}
          onEdit={handleEditContact}
          onDelete={handleDeleteContact}
          onResendOptIn={handleResendOptIn}
        />
      </ScrollView>

      {/* Contact Form Modal */}
      <ContactForm
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveContact}
        contact={editingContact}
      />

      {/* Opt-In Request Dialog */}
      {pendingContact && (
        <OptInRequestDialog
          visible={optInDialogVisible}
          onClose={() => {
            setOptInDialogVisible(false);
            setPendingContact(null);
          }}
          onConfirm={handleSendOptIn}
          contactName={pendingContact.name}
          contactPhone={pendingContact.phone}
        />
      )}
    </View>
  );
}
