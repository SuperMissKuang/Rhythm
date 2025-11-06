import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  useFonts,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from "@expo-google-fonts/montserrat";
import { useAppTheme } from "@/utils/theme";

export default function EmptyStateCard({
  icon: Icon,
  title,
  description,
  primaryButtonText,
  primaryButtonIcon: PrimaryIcon,
  onPrimaryPress,
  secondaryButtonText,
  onSecondaryPress,
  containerStyle,
}) {
  const { colors, isDark } = useAppTheme();

  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: 20,
          padding: 32,
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.borderLight,
        },
        containerStyle,
      ]}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: colors.surfaceVariant,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        {Icon && <Icon size={32} color={colors.placeholder} />}
      </View>

      <Text
        style={{
          fontSize: 18,
          fontFamily: "Montserrat_600SemiBold",
          color: colors.primary,
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        {title}
      </Text>

      <Text
        style={{
          fontSize: 14,
          fontFamily: "Montserrat_500Medium",
          color: colors.secondary,
          textAlign: "center",
          lineHeight: 20,
          marginBottom: 24,
        }}
      >
        {description}
      </Text>

      {primaryButtonText && (
        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            borderRadius: 16,
            paddingHorizontal: 24,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
            marginBottom: secondaryButtonText ? 16 : 0,
          }}
          onPress={onPrimaryPress}
        >
          {PrimaryIcon && (
            <PrimaryIcon
              size={16}
              color={isDark ? "#000000" : "#FFFFFF"}
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Montserrat_600SemiBold",
              color: isDark ? "#000000" : "#FFFFFF",
            }}
          >
            {primaryButtonText}
          </Text>
        </TouchableOpacity>
      )}

      {secondaryButtonText && (
        <TouchableOpacity
          style={{
            backgroundColor: "transparent",
            borderRadius: 16,
            paddingHorizontal: 24,
            paddingVertical: 8,
          }}
          onPress={onSecondaryPress}
        >
          <Text
            style={{
              fontSize: 12,
              fontFamily: "Montserrat_500Medium",
              color: colors.secondary,
            }}
          >
            {secondaryButtonText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
