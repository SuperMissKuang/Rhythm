import React from "react";
import { View, Text } from "react-native";

// Helper function to convert hex to lighter shade for background
function hexToLightBackground(hex, opacity = 0.2) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function ActivityPill({ activity, type }) {
  const isAnxiety = type === "anxiety";

  // Use activity-specific color or fallback to defaults
  const activityColor = activity.color || (isAnxiety ? "#FF6B6B" : "#4ECDC4");
  const backgroundColor = hexToLightBackground(activityColor, 0.2);
  const textColor = activityColor;

  let displayText = activity;
  if (isAnxiety) {
    displayText = `Anxiety ${activity.severity}`;
  } else {
    // Show sub-activity names instead of main activity names
    const activityNames = {
      hair_wash: "Hair Wash",
      hair_mask: "Hair Mask",
      hair_cut: "Hair Cut",
      exfoliation: "Exfoliation",
      face_mask: "Face Mask",
      moisturize: "Moisturize",
    };
    displayText = activityNames[activity.activity] || activity.activity;
  }

  return (
    <View
      style={{
        backgroundColor,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 6,
        marginBottom: 4,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontFamily: "Montserrat_500Medium",
          color: textColor,
        }}
      >
        {displayText}
      </Text>
    </View>
  );
}
