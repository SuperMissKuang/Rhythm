import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { TIME_OPTIONS } from "@/utils/selfcareConstants";

export function SingleTimeSelector({
  colors,
  timeDescriptor,
  showTimeOptions,
  selectedActivitiesCount,
  selectedActivities = [], // Add selected activities
  selfCareActivities = [], // Add self-care activities to get colors
  activityColor, // Accept activityColor as a prop
  onSetTimeDescriptor,
  onToggleTimeOptions,
}) {
  // Use the passed activityColor prop, or calculate as fallback
  const finalActivityColor = activityColor || (() => {
    if (selectedActivities.length === 0) {
      return "#14B8A6"; // Default teal fallback
    }

    // If only one activity is selected, use that activity's color
    if (selectedActivities.length === 1) {
      // Find the activity/category that contains this selected activity
      for (const category of selfCareActivities) {
        // Check if it's a direct category match
        const categoryKey = category.name
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "");

        if (selectedActivities[0] === categoryKey) {
          return category.color_hex;
        }

        // Check if it's in the category's items
        if (category.items && category.items.length > 0) {
          const matchedItem = category.items.find(
            (item) => item.activity_key === selectedActivities[0],
          );
          if (matchedItem) {
            return category.color_hex;
          }
        }
      }
    }

    // For multiple activities, use the first activity's color
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
  })();

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
        When did you do{" "}
        {selectedActivitiesCount === 1 ? "this activity" : "these activities"}?
      </Text>

      {/* Now vs Other Time Pills */}
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          marginBottom: 16,
          alignSelf: "flex-start",
        }}
      >
        <TouchableOpacity
          onPress={() => {
            onSetTimeDescriptor("Now");
            onToggleTimeOptions(false);
          }}
          style={{
            backgroundColor:
              timeDescriptor === "Now" ? `${finalActivityColor}15` : colors.surface,
            borderRadius: 20,
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderWidth: 1.5,
            borderColor:
              timeDescriptor === "Now" ? finalActivityColor : colors.borderLight,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontFamily: "Montserrat_600SemiBold",
              color:
                timeDescriptor === "Now"
                  ? (selectedActivities.length > 0 ? finalActivityColor : colors.primary)
                  : colors.primary,
            }}
          >
            Now
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            if (timeDescriptor === "Now" || timeDescriptor === null) {
              onSetTimeDescriptor(null); // Don't auto-select Early Morning
            }
            onToggleTimeOptions(!showTimeOptions);
          }}
          style={{
            backgroundColor:
              showTimeOptions || (timeDescriptor && timeDescriptor !== "Now")
                ? `${finalActivityColor}15`
                : colors.surface,
            borderRadius: 20,
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderWidth: 1.5,
            borderColor:
              showTimeOptions || (timeDescriptor && timeDescriptor !== "Now")
                ? finalActivityColor
                : colors.borderLight,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontFamily: "Montserrat_600SemiBold",
              color:
                showTimeOptions || (timeDescriptor && timeDescriptor !== "Now")
                  ? (selectedActivities.length > 0 ? finalActivityColor : colors.primary)
                  : colors.primary,
              marginRight: 4,
            }}
          >
            Other time
          </Text>
          {showTimeOptions ? (
            <ChevronUp
              size={14}
              color={
                showTimeOptions || (timeDescriptor && timeDescriptor !== "Now")
                  ? (selectedActivities.length > 0 ? finalActivityColor : colors.primary)
                  : colors.primary
              }
            />
          ) : (
            <ChevronDown
              size={14}
              color={
                showTimeOptions || (timeDescriptor && timeDescriptor !== "Now")
                  ? (selectedActivities.length > 0 ? finalActivityColor : colors.primary)
                  : colors.primary
              }
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Descriptive Time Options - Only show when "Other time" is selected */}
      {showTimeOptions && (
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
              fontSize: 14,
              fontFamily: "Montserrat_500Medium",
              color: colors.secondary,
              marginBottom: 12,
            }}
          >
            Select a time period:
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {TIME_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => {
                  onSetTimeDescriptor(option.value);
                  // Remove onToggleTimeOptions(false) to prevent auto-collapse
                }}
                style={{
                  backgroundColor:
                    timeDescriptor === option.value
                      ? `${finalActivityColor}15` // Light activity color background
                      : colors.background,
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderWidth: 1.5,
                  borderColor:
                    timeDescriptor === option.value
                      ? finalActivityColor // Activity color border when selected
                      : colors.borderLight,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Montserrat_500Medium",
                    color:
                      timeDescriptor === option.value
                        ? (selectedActivities.length > 0 ? finalActivityColor : colors.primary) // Activity color when selected and has activities, black otherwise
                        : colors.primary,
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
