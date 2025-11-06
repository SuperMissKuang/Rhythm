import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

export function TimingApproachSelector({
  colors,
  useIndividualTimes,
  onToggle,
  selectedActivities = [], // Add selected activities
  selfCareActivities = [], // Add self-care activities to get colors
}) {
  // Function to get the appropriate color for the selected activities
  const getActivityColor = () => {
    if (selectedActivities.length === 0) {
      return "#14B8A6"; // Default teal fallback
    }

    // Find the first activity's color
    for (const category of selfCareActivities) {
      const categoryKey = category.name
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

      if (selectedActivities[0] === categoryKey) {
        return category.color_hex;
      }

      if (category.items && category.items.length > 0) {
        const matchedItem = category.items.find(
          (item) => item.activity_key === selectedActivities[0],
        );
        if (matchedItem) {
          return category.color_hex;
        }
      }
    }

    return "#14B8A6"; // Default teal fallback
  };

  const activityColor = getActivityColor();

  return (
    <View style={{ marginBottom: 32 }}>
      <Text
        style={{
          fontSize: 18,
          fontFamily: "Montserrat_600SemiBold",
          color: colors.primary,
          marginBottom: 16,
        }}
      >
        Timing
      </Text>

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.borderLight,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontFamily: "Montserrat_500Medium",
            color: colors.primary,
            marginBottom: 16,
          }}
        >
          Did you do all these activities at the same time?
        </Text>

        <View
          style={{
            flexDirection: "row",
            gap: 8,
            alignSelf: "flex-start",
          }}
        >
          <TouchableOpacity
            onPress={() => onToggle(false)}
            style={{
              backgroundColor:
                useIndividualTimes === false
                  ? `${activityColor}15`
                  : colors.background,
              borderRadius: 20,
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderWidth: 1.5,
              borderColor:
                useIndividualTimes === false
                  ? activityColor
                  : colors.borderLight,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontFamily: "Montserrat_600SemiBold",
                color:
                  useIndividualTimes === false
                    ? activityColor
                    : colors.secondary,
              }}
            >
              Yes, same time
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onToggle(true)}
            style={{
              backgroundColor:
                useIndividualTimes === true
                  ? `${activityColor}15`
                  : colors.background,
              borderRadius: 20,
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderWidth: 1.5,
              borderColor:
                useIndividualTimes === true
                  ? activityColor
                  : colors.borderLight,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontFamily: "Montserrat_600SemiBold",
                color:
                  useIndividualTimes === true
                    ? activityColor
                    : colors.secondary,
              }}
            >
              No, different times
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
