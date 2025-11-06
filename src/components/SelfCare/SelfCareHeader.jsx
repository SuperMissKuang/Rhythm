import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ChevronLeft, Save } from "lucide-react-native";
import { router } from "expo-router";

// Utility function to calculate color luminance for contrast
const calculateLuminance = (hexColor) => {
  if (!hexColor || !hexColor.startsWith("#")) return 0.5;

  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16) / 255;
  const g = parseInt(hexColor.slice(3, 5), 16) / 255;
  const b = parseInt(hexColor.slice(5, 7), 16) / 255;

  // Apply gamma correction
  const gamma = (c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  // Calculate relative luminance
  return 0.2126 * gamma(r) + 0.7152 * gamma(g) + 0.0722 * gamma(b);
};

// Get text color based on background luminance
const getContrastTextColor = (backgroundColor) => {
  const luminance = calculateLuminance(backgroundColor);
  return luminance > 0.3 ? "#000000" : "#FFFFFF";
};

export function SelfCareHeader({
  colors,
  isDark,
  onSave,
  isDisabled,
  isLoading,
  activityColor,
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
      }}
    >
      <TouchableOpacity onPress={() => router.back()}>
        <ChevronLeft size={24} color={colors.primary} />
      </TouchableOpacity>

      <Text
        style={{
          fontSize: 20,
          fontFamily: "Montserrat_600SemiBold",
          color: colors.primary,
        }}
      >
        Log Self-Care Activity
      </Text>

      <TouchableOpacity
        onPress={onSave}
        disabled={isLoading || isDisabled}
        style={{
          backgroundColor: !isDisabled ? activityColor : colors.placeholder,
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderWidth: 1,
          borderColor: colors.borderLight,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontFamily: "Montserrat_600SemiBold",
            color: !isDisabled
              ? getContrastTextColor(activityColor)
              : "#FFFFFF",
          }}
        >
          Save
        </Text>
      </TouchableOpacity>
    </View>
  );
}
