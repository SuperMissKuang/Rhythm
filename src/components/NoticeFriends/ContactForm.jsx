import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, User } from 'lucide-react-native';
import { useAppTheme } from '@/utils/theme';
import {
  useFonts,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from '@expo-google-fonts/montserrat';
import * as Contacts from 'expo-contacts';

export default function ContactForm({ visible, onClose, onSave, contact = null }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  // Populate form when editing
  useEffect(() => {
    if (contact) {
      setName(contact.name || '');
      setPhone(contact.phone || '');
    } else {
      setName('');
      setPhone('');
    }
  }, [contact, visible]);

  const formatPhoneNumber = (text) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');

    // Format as E.164 if it looks like a US number
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('+')) {
      return text; // Already formatted
    }

    return cleaned;
  };

  const handleChooseContact = async () => {
    try {
      // Request permission
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to contacts to use this feature.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Open contact picker
      const result = await Contacts.presentContactPickerAsync();

      console.log('Contact picker result:', JSON.stringify(result, null, 2));

      if (!result) {
        console.log('No contact selected');
        return;
      }

      // Check if user cancelled
      if (result.cancelled) {
        console.log('Contact picker cancelled');
        return;
      }

      // Extract name - could be in different formats
      let contactName = '';
      if (result.name) {
        contactName = result.name;
      } else if (result.firstName || result.lastName) {
        contactName = [result.firstName, result.lastName].filter(Boolean).join(' ');
      }

      // Extract phone number
      if (result.phoneNumbers && result.phoneNumbers.length > 0) {
        const selectedPhone = result.phoneNumbers[0].number;
        console.log('Setting name:', contactName, 'phone:', selectedPhone);
        setName(contactName);
        setPhone(selectedPhone);
      } else {
        console.log('No phone numbers found for contact');
        Alert.alert(
          'No Phone Number',
          'This contact does not have a phone number.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error picking contact:', error);
      Alert.alert('Error', 'Failed to select contact. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      return; // Basic validation
    }

    setIsSaving(true);
    const formattedPhone = formatPhoneNumber(phone);

    await onSave({
      name: name.trim(),
      phone: formattedPhone,
    });

    setIsSaving(false);
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setPhone('');
    onClose();
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 20,
              paddingBottom: insets.bottom + 20,
              maxHeight: '80%',
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: 'Montserrat_600SemiBold',
                  color: colors.primary,
                }}
              >
                {contact ? 'Edit Contact' : 'Add Contact'}
              </Text>
              <TouchableOpacity onPress={handleClose}>
                <X size={24} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Choose from Contacts Button */}
              {!contact && (
                <TouchableOpacity
                  onPress={handleChooseContact}
                  style={{
                    backgroundColor: '#EDE9FE',
                    borderRadius: 12,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 24,
                    borderWidth: 1,
                    borderColor: '#C4B5FD',
                  }}
                >
                  <User size={20} color="#8B5CF6" style={{ marginRight: 8 }} />
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: 'Montserrat_600SemiBold',
                      color: '#8B5CF6',
                    }}
                  >
                    Choose from Contacts
                  </Text>
                </TouchableOpacity>
              )}

              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Montserrat_500Medium',
                  color: colors.secondary,
                  textAlign: 'center',
                  marginBottom: 20,
                }}
              >
                {contact ? 'Update contact information' : 'or enter manually'}
              </Text>

              {/* Name Input */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Montserrat_600SemiBold',
                    color: colors.primary,
                    marginBottom: 8,
                  }}
                >
                  Name *
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., John"
                  placeholderTextColor={colors.placeholder}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    fontFamily: 'Montserrat_500Medium',
                    color: colors.primary,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                  }}
                />
              </View>

              {/* Phone Input */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Montserrat_600SemiBold',
                    color: colors.primary,
                    marginBottom: 8,
                  }}
                >
                  Phone Number *
                </Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+1 555-123-4567"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="phone-pad"
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    fontFamily: 'Montserrat_500Medium',
                    color: colors.primary,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                  }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Montserrat_500Medium',
                    color: colors.secondary,
                    marginTop: 6,
                  }}
                >
                  Format: +1 234-567-8900 or 2345678900
                </Text>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSave}
                disabled={!name.trim() || !phone.trim() || isSaving}
                style={{
                  backgroundColor:
                    !name.trim() || !phone.trim() || isSaving
                      ? colors.borderLight
                      : '#F472B6',
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                  marginTop: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'Montserrat_600SemiBold',
                    color: !name.trim() || !phone.trim() || isSaving
                      ? colors.secondary
                      : '#FFFFFF',
                  }}
                >
                  {isSaving ? 'Saving...' : contact ? 'Update Contact' : 'Add Contact'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
