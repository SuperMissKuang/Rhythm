import React from 'react';
import { View, Text, Pressable, TouchableOpacity, Alert } from 'react-native';
import { useAppTheme } from '@/utils/theme';
import { User, Edit2, Trash2, Phone, CheckCircle, Clock, XCircle, RotateCw } from 'lucide-react-native';
import { useFonts, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';

export default function ContactList({ contacts, onEdit, onDelete, onResendOptIn }) {
  const { colors } = useAppTheme();

  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const formatPhoneDisplay = (phone) => {
    // Format +15551234567 to +1 (555) 123-4567
    if (phone.startsWith('+1') && phone.length === 12) {
      return `+1 (${phone.slice(2, 5)}) ${phone.slice(5, 8)}-${phone.slice(8)}`;
    }
    return phone;
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'confirmed':
        return {
          label: 'Confirmed',
          icon: CheckCircle,
          color: '#10B981',
          bgColor: '#E6F7F0',
        };
      case 'declined':
        return {
          label: 'Declined',
          icon: XCircle,
          color: '#EF4444',
          bgColor: '#FEE2E2',
        };
      case 'pending':
      default:
        return {
          label: 'Pending',
          icon: Clock,
          color: '#F59E0B',
          bgColor: '#FEF3C7',
        };
    }
  };

  const handleDeletePress = (contact) => {
    Alert.alert(
      'Delete Contact',
      `Remove ${contact.name} from your notification contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(contact.id),
        },
      ]
    );
  };

  if (contacts.length === 0) {
    return (
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 32,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.borderLight,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.borderLight,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <User size={40} color={colors.secondary} />
        </View>
        <Text
          style={{
            fontSize: 16,
            fontFamily: 'Montserrat_600SemiBold',
            color: colors.primary,
            marginBottom: 8,
          }}
        >
          No Contacts Yet
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'Montserrat_500Medium',
            color: colors.secondary,
            textAlign: 'center',
          }}
        >
          Add trusted contacts to notify about your cycle phases
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      {contacts.map((contact) => {
        const isConfirmed = contact.optInStatus === 'confirmed';
        return (
          <View
            key={contact.id}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.borderLight,
              opacity: isConfirmed ? 1 : 0.7,
            }}
          >
          {/* Contact Info */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            {/* Avatar */}
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#FCE7F3',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <User size={20} color="#F472B6" />
            </View>

            {/* Name & Phone */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'Montserrat_600SemiBold',
                    color: colors.primary,
                    marginRight: 8,
                  }}
                >
                  {contact.name}
                </Text>
                {(() => {
                  const status = getStatusInfo(contact.optInStatus || 'pending');
                  const StatusIcon = status.icon;
                  return (
                    <View
                      style={{
                        backgroundColor: status.bgColor,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <StatusIcon size={10} color={status.color} />
                      <Text
                        style={{
                          fontSize: 10,
                          fontFamily: 'Montserrat_600SemiBold',
                          color: status.color,
                        }}
                      >
                        {status.label.toUpperCase()}
                      </Text>
                    </View>
                  );
                })()}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Phone size={12} color={colors.secondary} style={{ marginRight: 6 }} />
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Montserrat_500Medium',
                    color: colors.secondary,
                  }}
                >
                  {formatPhoneDisplay(contact.phone)}
                </Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={{ gap: 8 }}>
            {/* Resend Opt-In Button - Show for pending/declined */}
            {(contact.optInStatus === 'pending' || contact.optInStatus === 'declined') && (
              <TouchableOpacity
                onPress={() => onResendOptIn(contact)}
                style={{
                  backgroundColor: '#EDE9FE',
                  borderRadius: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: '#C4B5FD',
                }}
              >
                <RotateCw size={14} color="#8B5CF6" style={{ marginRight: 6 }} />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Montserrat_600SemiBold',
                    color: '#8B5CF6',
                  }}
                >
                  {contact.optInStatus === 'declined' ? 'Resend Opt-In Request' : 'Send Reminder'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Edit & Delete Row */}
            <View
              style={{
                flexDirection: 'row',
                gap: 8,
              }}
            >
              <TouchableOpacity
                onPress={() => onEdit(contact)}
                style={{
                  flex: 1,
                  backgroundColor: colors.surfaceVariant,
                  borderRadius: 12,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                }}
              >
                <Edit2 size={14} color={colors.primary} style={{ marginRight: 6 }} />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Montserrat_600SemiBold',
                    color: colors.primary,
                  }}
                >
                  Edit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDeletePress(contact)}
                style={{
                  flex: 1,
                  backgroundColor: colors.surfaceVariant,
                  borderRadius: 12,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                }}
              >
                <Trash2 size={14} color="#EF4444" style={{ marginRight: 6 }} />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Montserrat_600SemiBold',
                    color: '#EF4444',
                  }}
                >
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        );
      })}
    </View>
  );
}
