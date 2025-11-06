import React from "react";
import { View, Text } from "react-native";
import {
  useFonts,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from "@expo-google-fonts/montserrat";

export function SelectedActivitiesSummary({
  colors,
  selectedActivities,
  selfCareActivities = [],
}) {
  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  if (!fontsLoaded || selectedActivities.length === 0) {
    return null;
  }

  return (
    <View
      style={{
        backgroundColor: colors.greenLight,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
      }}
    >
      <Text
        style={{
          fontSize: 16,
          fontFamily: "Montserrat_600SemiBold",
          color: colors.primary,
          marginBottom: 8,
        }}
      >
        Selected Activities ({selectedActivities.length})
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {selectedActivities.map((activityId) => {
          // Look for the activity in the dynamic selfCareActivities
          let activityName = activityId;

          for (const category of selfCareActivities) {
            // Check if it's a sub-activity
            const subActivity = category.items?.find(
              (item) => item.activity_key === activityId,
            );
            if (subActivity) {
              activityName = subActivity.name;
              break;
            }

            // Check if it's a main activity (no sub-activities)
            const mainActivityKey = category.name
              .toLowerCase()
              .replace(/\s+/g, "_")
              .replace(/[^a-z0-9_]/g, "");
            if (mainActivityKey === activityId) {
              activityName = category.name;
              break;
            }
          }

          return (
            <View
              key={activityId}
              style={{
                backgroundColor: colors.green,
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "Montserrat_500Medium",
                  color: colors.primary,
                }}
              >
                {activityName}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
