import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  useFonts,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from "@expo-google-fonts/montserrat";
import { useAppTheme } from "@/utils/theme";
import { Palette, Users, Database, ChevronRight } from "lucide-react-native";

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const menuItems = [
    {
      id: "activities",
      title: "Edit or Add Activities",
      description: "Customize your tracking activities and categories",
      icon: Palette,
      iconColor: "#F472B6",
      iconBgColor: "#FCE7F3",
      route: "/edit-activities",
    },
    {
      id: "friends",
      title: "Notice Friends About Your Cycle",
      description: "Share your cycle updates with trusted contacts",
      icon: Users,
      iconColor: "#8B5CF6",
      iconBgColor: "#EDE9FE",
      route: "/notice-friends",
    },
    {
      id: "data",
      title: "Data Management",
      description: "Export and import your tracking data",
      icon: Database,
      iconColor: "#10B981",
      iconBgColor: "#E6F7F0",
      route: "/data-management",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{ paddingTop: insets.top, backgroundColor: colors.background }}
      >
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 16,
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontFamily: "Montserrat_600SemiBold",
              color: colors.primary,
            }}
          >
            More
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Montserrat_500Medium",
              color: colors.secondary,
              marginTop: 4,
            }}
          >
            Manage your activities and settings
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Menu Cards */}
        <View style={{ gap: 16 }}>
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
      </ScrollView>
    </View>
  );
}
