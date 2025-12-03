import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/utils/theme';
import { AlertCircle, Send, X, User } from 'lucide-react-native';
import {
  useFonts,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from '@expo-google-fonts/montserrat';

export default function PhaseConfirmationDialog({
  visible,
  onClose,
  onConfirm,
  phaseName,
  contacts,
  message,
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const [isSending, setIsSending] = useState(false);

  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleConfirm = async () => {
    setIsSending(true);
    await onConfirm();
    setIsSending(false);
  };

  const phaseColor = phaseName === 'luteal' ? '#FEF3C7' : '#FCE7F3';
  const phaseBorderColor = phaseName === 'luteal' ? '#FDE68A' : '#FBCFE8';
  const phaseTextColor = phaseName === 'luteal' ? '#92400E' : '#9F1239';
  const phaseLabel = phaseName === 'luteal' ? 'Luteal Phase' : 'Period';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
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
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: phaseColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <AlertCircle size={18} color={phaseTextColor} />
              </View>
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: 'Montserrat_600SemiBold',
                  color: colors.primary,
                }}
              >
                Phase Change Detected
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={isSending}>
              <X size={24} color={colors.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Phase Badge */}
            <View
              style={{
                backgroundColor: phaseColor,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 16,
                alignSelf: 'flex-start',
                borderWidth: 1,
                borderColor: phaseBorderColor,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Montserrat_600SemiBold',
                  color: phaseTextColor,
                }}
              >
                {phaseLabel}
              </Text>
            </View>

            {/* Description */}
            <Text
              style={{
                fontSize: 15,
                fontFamily: 'Montserrat_500Medium',
                color: colors.primary,
                lineHeight: 22,
                marginBottom: 20,
              }}
            >
              You've entered your {phaseLabel.toLowerCase()}. Would you like to
              notify your contacts?
            </Text>

            {/* Message Preview */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Montserrat_600SemiBold',
                  color: colors.secondary,
                  marginBottom: 8,
                  textTransform: 'uppercase',
                }}
              >
                Message
              </Text>
              <View
                style={{
                  backgroundColor: colors.surfaceVariant,
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Montserrat_500Medium',
                    color: colors.primary,
                    lineHeight: 20,
                  }}
                >
                  {message}
                </Text>
              </View>
            </View>

            {/* Contacts List */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Montserrat_600SemiBold',
                  color: colors.secondary,
                  marginBottom: 8,
                  textTransform: 'uppercase',
                }}
              >
                Will notify ({contacts.length})
              </Text>
              <View style={{ gap: 8 }}>
                {contacts.map((contact) => (
                  <View
                    key={contact.id}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                      padding: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: colors.borderLight,
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: '#FCE7F3',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <User size={16} color="#F472B6" />
                    </View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Montserrat_600SemiBold',
                        color: colors.primary,
                      }}
                    >
                      {contact.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={handleConfirm}
                disabled={isSending}
                activeOpacity={0.7}
                style={{
                  backgroundColor: isSending ? colors.borderLight : '#F472B6',
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isSending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Send
                      size={20}
                      color="#FFFFFF"
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: 'Montserrat_600SemiBold',
                        color: '#FFFFFF',
                      }}
                    >
                      Send Notifications
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                disabled={isSending}
                activeOpacity={0.7}
                style={{
                  backgroundColor: colors.surfaceVariant,
                  borderRadius: 16,
                  padding: 16,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'Montserrat_600SemiBold',
                    color: colors.primary,
                  }}
                >
                  Not Now
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
