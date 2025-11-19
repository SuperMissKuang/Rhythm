import React from "react";
import { View, Text, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import {
  useFonts,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from "@expo-google-fonts/montserrat";
import { useAppTheme } from "@/utils/theme";
import { Users } from "lucide-react-native";

export default function NoticeFriendsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

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
          paddingTop: 40,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Placeholder Content */}
        <View style={{ alignItems: "center" }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "#EDE9FE",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <Users size={40} color="#8B5CF6" />
          </View>

          <Text
            style={{
              fontSize: 24,
              fontFamily: "Montserrat_600SemiBold",
              color: colors.primary,
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            Notice Friends About Your Cycle
          </Text>

          <Text
            style={{
              fontSize: 14,
              fontFamily: "Montserrat_500Medium",
              color: colors.secondary,
              textAlign: "center",
              lineHeight: 20,
              marginBottom: 32,
            }}
          >
            This feature will allow you to share cycle updates with trusted contacts. You'll be able to choose contacts and customize the message.
          </Text>

          {/* Feature Preview */}
          <View
            style={{
              width: "100%",
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.borderLight,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: "Montserrat_600SemiBold",
                color: colors.primary,
                marginBottom: 16,
              }}
            >
              Coming Soon:
            </Text>
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Montserrat_500Medium",
                    color: colors.primary,
                    marginRight: 8,
                  }}
                >
                  •
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Montserrat_500Medium",
                    color: colors.secondary,
                    flex: 1,
                    lineHeight: 20,
                  }}
                >
                  Select contacts from your phone
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Montserrat_500Medium",
                    color: colors.primary,
                    marginRight: 8,
                  }}
                >
                  •
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Montserrat_500Medium",
                    color: colors.secondary,
                    flex: 1,
                    lineHeight: 20,
                  }}
                >
                  Customize notification messages
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Montserrat_500Medium",
                    color: colors.primary,
                    marginRight: 8,
                  }}
                >
                  •
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Montserrat_500Medium",
                    color: colors.secondary,
                    flex: 1,
                    lineHeight: 20,
                  }}
                >
                  Set automatic reminders for cycle updates
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Montserrat_500Medium",
                    color: colors.primary,
                    marginRight: 8,
                  }}
                >
                  •
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Montserrat_500Medium",
                    color: colors.secondary,
                    flex: 1,
                    lineHeight: 20,
                  }}
                >
                  Share via SMS, email, or messaging apps
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
