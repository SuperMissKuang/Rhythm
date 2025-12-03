import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import {
  useFonts,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from '@expo-google-fonts/montserrat';
import { useAppTheme } from '@/utils/theme';
import { MessageCircle, CheckCircle, XCircle, Clock, Phone } from 'lucide-react-native';
import { useNotificationStore } from '@/utils/stores/useNotificationStore';
import { format } from 'date-fns';

export default function NotificationHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const history = useNotificationStore((state) => state.history);

  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle size={16} color="#10B981" />;
      case 'failed':
        return <XCircle size={16} color="#EF4444" />;
      default:
        return <Clock size={16} color={colors.secondary} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return '#10B981';
      case 'failed':
        return '#EF4444';
      default:
        return colors.secondary;
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return '#E6F7F0';
      case 'failed':
        return '#FEE2E2';
      default:
        return colors.borderLight;
    }
  };

  const getPhaseColor = (phase) => {
    return phase === 'luteal' ? '#FEF3C7' : '#FCE7F3';
  };

  const getPhaseBorderColor = (phase) => {
    return phase === 'luteal' ? '#FDE68A' : '#FBCFE8';
  };

  const getPhaseTextColor = (phase) => {
    return phase === 'luteal' ? '#92400E' : '#9F1239';
  };

  const formatPhoneDisplay = (phone) => {
    if (phone.startsWith('+1') && phone.length === 12) {
      return `+1 (${phone.slice(2, 5)}) ${phone.slice(5, 8)}-${phone.slice(8)}`;
    }
    return phone;
  };

  // Group history by date
  const groupedHistory = history.reduce((groups, item) => {
    const date = format(new Date(item.sentAt), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedHistory).sort((a, b) => b.localeCompare(a));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notification History',
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {history.length === 0 ? (
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
              <MessageCircle size={40} color={colors.secondary} />
            </View>
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Montserrat_600SemiBold',
                color: colors.primary,
                marginBottom: 8,
              }}
            >
              No History Yet
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Montserrat_500Medium',
                color: colors.secondary,
                textAlign: 'center',
              }}
            >
              Notifications you send will appear here
            </Text>
          </View>
        ) : (
          <View>
            {sortedDates.map((date) => (
              <View key={date} style={{ marginBottom: 24 }}>
                {/* Date Header */}
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Montserrat_600SemiBold',
                    color: colors.secondary,
                    marginBottom: 12,
                    textTransform: 'uppercase',
                  }}
                >
                  {format(new Date(date), 'MMMM d, yyyy')}
                </Text>

                {/* Notifications for this date */}
                <View style={{ gap: 12 }}>
                  {groupedHistory[date].map((item) => (
                    <View
                      key={item.id}
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: 16,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: colors.borderLight,
                      }}
                    >
                      {/* Header Row */}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 12,
                        }}
                      >
                        {/* Phase Badge */}
                        <View
                          style={{
                            backgroundColor: getPhaseColor(item.phase),
                            paddingHorizontal: 12,
                            paddingVertical: 4,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: getPhaseBorderColor(item.phase),
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontFamily: 'Montserrat_600SemiBold',
                              color: getPhaseTextColor(item.phase),
                            }}
                          >
                            {item.phase === 'luteal' ? 'LUTEAL' : 'PERIOD'}
                          </Text>
                        </View>

                        {/* Status Badge */}
                        <View
                          style={{
                            backgroundColor: getStatusBgColor(item.deliveryStatus),
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          {getStatusIcon(item.deliveryStatus)}
                          <Text
                            style={{
                              fontSize: 11,
                              fontFamily: 'Montserrat_600SemiBold',
                              color: getStatusColor(item.deliveryStatus),
                            }}
                          >
                            {item.deliveryStatus.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      {/* Contact Info */}
                      <View style={{ marginBottom: 12 }}>
                        <Text
                          style={{
                            fontSize: 16,
                            fontFamily: 'Montserrat_600SemiBold',
                            color: colors.primary,
                            marginBottom: 4,
                          }}
                        >
                          {item.contactName}
                        </Text>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                        >
                          <Phone
                            size={12}
                            color={colors.secondary}
                            style={{ marginRight: 6 }}
                          />
                          <Text
                            style={{
                              fontSize: 13,
                              fontFamily: 'Montserrat_500Medium',
                              color: colors.secondary,
                            }}
                          >
                            {formatPhoneDisplay(item.contactPhone)}
                          </Text>
                        </View>
                      </View>

                      {/* Message */}
                      <View
                        style={{
                          backgroundColor: colors.surfaceVariant,
                          borderRadius: 12,
                          padding: 12,
                          borderWidth: 1,
                          borderColor: colors.borderLight,
                          marginBottom: 8,
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
                          {item.message}
                        </Text>
                      </View>

                      {/* Timestamp */}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <Clock
                          size={12}
                          color={colors.secondary}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            fontFamily: 'Montserrat_500Medium',
                            color: colors.secondary,
                          }}
                        >
                          {format(new Date(item.sentAt), 'h:mm a')}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
