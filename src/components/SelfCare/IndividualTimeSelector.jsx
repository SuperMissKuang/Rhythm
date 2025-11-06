import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { TIME_OPTIONS } from "@/utils/selfcareConstants";
import {
  useFonts,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from "@expo-google-fonts/montserrat";

export function IndividualTimeSelector({
  colors,
  selectedActivities,
  activityTimes,
  onSetActivityTime,
  selfCareActivities = [],
}) {
  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

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
        When did you do each activity?
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
            fontSize: 14,
            fontFamily: "Montserrat_500Medium",
            color: colors.secondary,
            marginBottom: 16,
          }}
        >
          Set individual times for each activity:
        </Text>

        <View style={{ gap: 16 }}>
          {selectedActivities.map((activityId) => {
            // Look for the activity in the dynamic selfCareActivities
            let activityName = activityId;
            let activityColor = "#14B8A6"; // Default teal fallback

            for (const category of selfCareActivities) {
              // Check if it's a sub-activity
              const subActivity = category.items?.find(
                (item) => item.activity_key === activityId,
              );
              if (subActivity) {
                activityName = subActivity.name;
                activityColor = category.color_hex;
                break;
              }

              // Check if it's a main activity (no sub-activities)
              const mainActivityKey = category.name
                .toLowerCase()
                .replace(/\s+/g, "_")
                .replace(/[^a-z0-9_]/g, "");
              if (mainActivityKey === activityId) {
                activityName = category.name;
                activityColor = category.color_hex;
                break;
              }
            }

            const currentTime = activityTimes[activityId] || null;

            return (
              <View
                key={activityId}
                style={{
                  backgroundColor: colors.background,
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Montserrat_600SemiBold",
                    color: colors.primary,
                    marginBottom: 12,
                  }}
                >
                  {activityName}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => onSetActivityTime(activityId, "Now")}
                    style={{
                      backgroundColor:
                        currentTime === "Now"
                          ? `${activityColor}15`
                          : colors.surface,
                      borderRadius: 16,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderWidth: 1.5,
                      borderColor:
                        currentTime === "Now"
                          ? activityColor
                          : colors.borderLight,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: "Montserrat_500Medium",
                        color:
                          currentTime === "Now"
                            ? activityColor
                            : colors.secondary,
                      }}
                    >
                      Now
                    </Text>
                  </TouchableOpacity>
                  {TIME_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={`${activityId}-${option.value}`}
                      onPress={() =>
                        onSetActivityTime(activityId, option.value)
                      }
                      style={{
                        backgroundColor:
                          currentTime === option.value
                            ? `${activityColor}15`
                            : colors.surface,
                        borderRadius: 16,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderWidth: 1.5,
                        borderColor:
                          currentTime === option.value
                            ? activityColor
                            : colors.borderLight,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: "Montserrat_500Medium",
                          color:
                            currentTime === option.value
                              ? activityColor
                              : colors.secondary,
                        }}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
