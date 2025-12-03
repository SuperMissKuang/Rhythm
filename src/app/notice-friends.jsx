import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import {
  useFonts,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from "@expo-google-fonts/montserrat";
import { useAppTheme } from "@/utils/theme";
import {
  Users,
  MessageSquare,
  Settings,
  History,
  ChevronRight,
  Send,
} from "lucide-react-native";
import { useNotificationStore } from "@/utils/stores/useNotificationStore";
import { useCycleStore } from "@/utils/stores/useCycleStore";
import { getCurrentCycleInfo } from "@/utils/cycleUtils";
import PhaseConfirmationDialog from "@/components/NoticeFriends/PhaseConfirmationDialog";
import { sendNotificationsToContacts } from "@/utils/notifications/smsService";
import Toast from "react-native-toast-message";

export default function NoticeFriendsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const router = useRouter();

  const contacts = useNotificationStore((state) => state.contacts);
  const getConfirmedContacts = useNotificationStore((state) => state.getConfirmedContacts);
  const settings = useNotificationStore((state) => state.settings);
  const getMessageTemplate = useNotificationStore((state) => state.getMessageTemplate);
  const updateLastNotificationDate = useNotificationStore((state) => state.updateLastNotificationDate);
  const cycles = useCycleStore((state) => state.cycles);

  const [showManualDialog, setShowManualDialog] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(null);

  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const menuItems = [
    {
      id: "contacts",
      title: "Manage Contacts",
      description: `${contacts.length} contact${contacts.length !== 1 ? "s" : ""} saved`,
      icon: Users,
      iconColor: "#F472B6",
      iconBgColor: "#FCE7F3",
      route: "/manage-contacts",
    },
    {
      id: "templates",
      title: "Message Templates",
      description: "Customize your notification messages",
      icon: MessageSquare,
      iconColor: "#8B5CF6",
      iconBgColor: "#EDE9FE",
      route: "/message-templates",
    },
    {
      id: "settings",
      title: "Settings",
      description: "Configure automatic notifications",
      icon: Settings,
      iconColor: "#10B981",
      iconBgColor: "#E6F7F0",
      route: "/notification-settings",
    },
    {
      id: "history",
      title: "Notification History",
      description: "View sent notifications",
      icon: History,
      iconColor: "#F59E0B",
      iconBgColor: "#FEF3C7",
      route: "/notification-history",
    },
  ];

  const handleManualSend = () => {
    // Check if user has completed setup
    if (contacts.length === 0) {
      Toast.show({
        type: 'info',
        text1: 'No Contacts',
        text2: 'Add contacts first to send notifications',
      });
      return;
    }

    // Check if there are any confirmed contacts
    const confirmedContacts = getConfirmedContacts();
    if (confirmedContacts.length === 0) {
      Toast.show({
        type: 'info',
        text1: 'No Confirmed Contacts',
        text2: 'Wait for contacts to confirm opt-in before sending',
      });
      return;
    }

    if (!settings?.userName) {
      Toast.show({
        type: 'info',
        text1: 'Setup Required',
        text2: 'Set your name in Message Templates first',
      });
      return;
    }

    // Get current cycle phase
    const cycleInfo = getCurrentCycleInfo(cycles);
    if (!cycleInfo || !cycleInfo.currentPhase) {
      Toast.show({
        type: 'info',
        text1: 'No Cycle Data',
        text2: 'Log your cycle first to send phase notifications',
      });
      return;
    }

    // Determine notification phase based on current phase
    const phaseName = cycleInfo.currentPhase.name;
    let notificationPhase = null;

    if (phaseName === 'Luteal Phase') {
      notificationPhase = 'luteal';
    } else if (phaseName === 'Menstrual') {
      notificationPhase = 'period';
    } else {
      Toast.show({
        type: 'info',
        text1: 'No Notification Needed',
        text2: `You're in ${phaseName}. Notifications are for luteal phase and period only.`,
      });
      return;
    }

    setCurrentPhase(notificationPhase);
    setShowManualDialog(true);
  };

  const handleManualConfirm = async () => {
    if (!settings?.userName || !currentPhase) {
      setShowManualDialog(false);
      return;
    }

    const tone = settings.messageTone || 'casual';
    const message = getMessageTemplate(tone, currentPhase, settings.userName);

    // Only send to confirmed contacts
    const confirmedContacts = getConfirmedContacts();
    const result = await sendNotificationsToContacts(confirmedContacts, message, currentPhase);

    await updateLastNotificationDate();

    setShowManualDialog(false);

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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Notice Friends",
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.primary,
          headerTitleStyle: {
            fontFamily: "Montserrat_600SemiBold",
          },
        }}
      />
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View
          style={{
            backgroundColor: colors.surfaceVariant,
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: colors.borderLight,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Montserrat_500Medium",
              color: colors.secondary,
              lineHeight: 20,
            }}
          >
            Share cycle updates with trusted contacts. Set up automatic
            notifications or send them manually when you need support.
          </Text>
        </View>

        {/* Menu Cards */}
        <View style={{ gap: 12, marginBottom: 24 }}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => router.push(item.route)}
              activeOpacity={0.7}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: colors.borderLight,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              {/* Icon */}
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: item.iconBgColor,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <item.icon size={24} color={item.iconColor} />
              </View>

              {/* Content */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: "Montserrat_600SemiBold",
                    color: colors.primary,
                    marginBottom: 4,
                  }}
                >
                  {item.title}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: "Montserrat_500Medium",
                    color: colors.secondary,
                    lineHeight: 18,
                  }}
                >
                  {item.description}
                </Text>
              </View>

              {/* Chevron */}
              <ChevronRight size={20} color={colors.secondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Manual Send Button */}
        <TouchableOpacity
          onPress={handleManualSend}
          disabled={contacts.length === 0}
          activeOpacity={0.7}
          style={{
            backgroundColor: contacts.length === 0 ? colors.borderLight : "#F472B6",
            borderRadius: 16,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Send
            size={20}
            color={contacts.length === 0 ? colors.secondary : "#FFFFFF"}
            style={{ marginRight: 8 }}
          />
          <Text
            style={{
              fontSize: 16,
              fontFamily: "Montserrat_600SemiBold",
              color: contacts.length === 0 ? colors.secondary : "#FFFFFF",
            }}
          >
            Send Notifications Now
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Manual Send Confirmation Dialog */}
      {currentPhase && settings?.userName && (
        <PhaseConfirmationDialog
          visible={showManualDialog}
          onClose={() => setShowManualDialog(false)}
          onConfirm={handleManualConfirm}
          phaseName={currentPhase}
          contacts={getConfirmedContacts()}
          message={getMessageTemplate(settings.messageTone || 'casual', currentPhase, settings.userName)}
        />
      )}
    </View>
  );
}
