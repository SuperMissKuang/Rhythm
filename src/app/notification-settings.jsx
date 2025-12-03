import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import {
  useFonts,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from '@expo-google-fonts/montserrat';
import { useAppTheme } from '@/utils/theme';
import { Bell, BellOff, AlertCircle, Trash2 } from 'lucide-react-native';
import { useNotificationStore } from '@/utils/stores/useNotificationStore';
import Toast from 'react-native-toast-message';

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const settings = useNotificationStore((state) => state.settings);
  const saveSettings = useNotificationStore((state) => state.saveSettings);
  const clearHistory = useNotificationStore((state) => state.clearHistory);
  const history = useNotificationStore((state) => state.history);

  const [autoNotify, setAutoNotify] = useState(true);
  const [requireConfirm, setRequireConfirm] = useState(true);

  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  useEffect(() => {
    if (settings) {
      setAutoNotify(settings.autoNotifyEnabled !== false);
      setRequireConfirm(settings.requireConfirmation !== false);
    }
  }, [settings]);

  if (!fontsLoaded) {
    return null;
  }

  const handleAutoNotifyChange = async (value) => {
    setAutoNotify(value);
    await saveSettings({
      ...settings,
      autoNotifyEnabled: value,
    });
    Toast.show({
      type: 'success',
      text1: value ? 'Auto-notify enabled' : 'Auto-notify disabled',
      text2: value
        ? 'You\'ll be prompted when your phase changes'
        : 'You can still send notifications manually',
    });
  };

  const handleRequireConfirmChange = async (value) => {
    setRequireConfirm(value);
    await saveSettings({
      ...settings,
      requireConfirmation: value,
    });
    Toast.show({
      type: 'success',
      text1: 'Setting updated',
      text2: value
        ? 'You\'ll be asked before sending'
        : 'Notifications will send automatically',
    });
  };

  const handleClearHistory = () => {
    if (history.length === 0) {
      Toast.show({
        type: 'info',
        text1: 'No History',
        text2: 'Your notification history is already empty',
      });
      return;
    }

    Alert.alert(
      'Clear History',
      `Delete all ${history.length} notification records? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const result = await clearHistory();
            if (result.success) {
              Toast.show({
                type: 'success',
                text1: 'History Cleared',
                text2: 'All notification records have been deleted',
              });
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Settings',
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
        {/* Notification Settings */}
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Montserrat_600SemiBold',
              color: colors.secondary,
              marginBottom: 12,
              textTransform: 'uppercase',
            }}
          >
            Notification Settings
          </Text>

          {/* Auto-Notify Toggle */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 20,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.borderLight,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: autoNotify ? '#E6F7F0' : colors.borderLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                {autoNotify ? (
                  <Bell size={20} color="#10B981" />
                ) : (
                  <BellOff size={20} color={colors.secondary} />
                )}
              </View>

              <View style={{ flex: 1, marginRight: 12 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'Montserrat_600SemiBold',
                    color: colors.primary,
                    marginBottom: 4,
                  }}
                >
                  Automatic Detection
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Montserrat_500Medium',
                    color: colors.secondary,
                    lineHeight: 18,
                  }}
                >
                  Detect phase changes and prompt you to send notifications
                </Text>
              </View>

              <Switch
                value={autoNotify}
                onValueChange={handleAutoNotifyChange}
                trackColor={{ false: colors.borderLight, true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Require Confirmation Toggle */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.borderLight,
              opacity: autoNotify ? 1 : 0.5,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: requireConfirm ? '#FEF3C7' : colors.borderLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <AlertCircle
                  size={20}
                  color={requireConfirm ? '#F59E0B' : colors.secondary}
                />
              </View>

              <View style={{ flex: 1, marginRight: 12 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'Montserrat_600SemiBold',
                    color: colors.primary,
                    marginBottom: 4,
                  }}
                >
                  Require Confirmation
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Montserrat_500Medium',
                    color: colors.secondary,
                    lineHeight: 18,
                  }}
                >
                  {autoNotify
                    ? 'Ask before sending notifications'
                    : 'Enable automatic detection to use this setting'}
                </Text>
              </View>

              <Switch
                value={requireConfirm}
                onValueChange={handleRequireConfirmChange}
                disabled={!autoNotify}
                trackColor={{ false: colors.borderLight, true: '#F59E0B' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Data Management */}
        <View>
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Montserrat_600SemiBold',
              color: colors.secondary,
              marginBottom: 12,
              textTransform: 'uppercase',
            }}
          >
            Data Management
          </Text>

          {/* Clear History Button */}
          <TouchableOpacity
            onPress={handleClearHistory}
            activeOpacity={0.7}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.borderLight,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#FEE2E2',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Trash2 size={20} color="#EF4444" />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Montserrat_600SemiBold',
                  color: colors.primary,
                  marginBottom: 4,
                }}
              >
                Clear Notification History
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Montserrat_500Medium',
                  color: colors.secondary,
                }}
              >
                {history.length === 0
                  ? 'No history to clear'
                  : `Delete all ${history.length} records`}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View
          style={{
            backgroundColor: colors.surfaceVariant,
            borderRadius: 16,
            padding: 16,
            marginTop: 24,
            borderWidth: 1,
            borderColor: colors.borderLight,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Montserrat_500Medium',
              color: colors.secondary,
              lineHeight: 18,
            }}
          >
            <Text style={{ fontFamily: 'Montserrat_600SemiBold' }}>Tip:</Text>{' '}
            With automatic detection enabled, Rhythm will monitor your cycle and
            suggest sending notifications when you enter a new phase. You can
            always send notifications manually from the main screen.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
