import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/utils/theme';
import { AlertCircle, Send, X, Phone } from 'lucide-react-native';
import {
  useFonts,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from '@expo-google-fonts/montserrat';

export default function OptInRequestDialog({
  visible,
  onClose,
  onConfirm,
  contactName,
  contactPhone,
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

  const formatPhoneDisplay = (phone) => {
    if (phone && phone.startsWith('+1') && phone.length === 12) {
      return `+1 (${phone.slice(2, 5)}) ${phone.slice(5, 8)}-${phone.slice(8)}`;
    }
    return phone;
  };

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
            paddingHorizontal: 20,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#FEF3C7',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <AlertCircle size={18} color="#F59E0B" />
              </View>
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: 'Montserrat_600SemiBold',
                  color: colors.primary,
                }}
              >
                Send Opt-In Request?
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={isSending}>
              <X size={24} color={colors.secondary} />
            </TouchableOpacity>
          </View>

          {/* Contact Info */}
          <View
            style={{
              backgroundColor: colors.surfaceVariant,
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: colors.borderLight,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Montserrat_600SemiBold',
                color: colors.primary,
                marginBottom: 4,
              }}
            >
              {contactName}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Phone size={12} color={colors.secondary} style={{ marginRight: 6 }} />
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Montserrat_500Medium',
                  color: colors.secondary,
                }}
              >
                {formatPhoneDisplay(contactPhone)}
              </Text>
            </View>
          </View>

          {/* Explanation */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 15,
                fontFamily: 'Montserrat_500Medium',
                color: colors.primary,
                lineHeight: 22,
                marginBottom: 16,
              }}
            >
              {contactName} will receive an SMS asking them to confirm they want to
              receive cycle notifications.
            </Text>

            <View
              style={{
                backgroundColor: '#FEF3C7',
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: '#FDE68A',
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Montserrat_600SemiBold',
                  color: '#92400E',
                  marginBottom: 6,
                }}
              >
                ⚠️ Important
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Montserrat_500Medium',
                  color: '#92400E',
                  lineHeight: 18,
                }}
              >
                You can only send cycle notifications after they reply YES to opt-in.
              </Text>
            </View>
          </View>

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
              Message Preview
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: colors.borderLight,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Montserrat_500Medium',
                  color: colors.primary,
                  lineHeight: 18,
                }}
              >
                Rhythm: You've been invited to receive cycle updates for support. Reply
                YES to opt-in. Reply STOP to decline. Msg & data rates may apply.
              </Text>
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
                  <Send size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: 'Montserrat_600SemiBold',
                      color: '#FFFFFF',
                    }}
                  >
                    Send Opt-In Request
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
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
