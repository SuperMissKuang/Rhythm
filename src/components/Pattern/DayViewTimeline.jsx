import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { format } from "date-fns";
import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import { TIME_SLOTS } from "@/utils/constants";
import { ActivityPill } from "@/components/Today/ActivityPill";
import { useAppTheme } from "@/utils/theme";

export function DayViewTimeline({ timeSlotData, date }) {
  const { colors } = useAppTheme();
  const [expandedTimeSlot, setExpandedTimeSlot] = useState(null);

  const isToday =
    format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  const dateString = format(date, "yyyy-MM-dd");

  // Navigate directly to edit pages
  const handleAnxietyPress = (entry) => {
    router.push({
      pathname: "/log-anxiety",
      params: { editId: entry.id },
    });
  };

  const handleSelfCarePress = (entry) => {
    router.push({
      pathname: "/log-selfcare",
      params: { editId: entry.id },
    });
  };

  const handleAddPress = (timeSlotId) => {
    // Toggle expanded state
    setExpandedTimeSlot(expandedTimeSlot === timeSlotId ? null : timeSlotId);
  };

  const handleLogAnxiety = (timeSlotId) => {
    router.push({
      pathname: "/log-anxiety",
      params: { date: dateString, timeSlot: timeSlotId },
    });
    setExpandedTimeSlot(null);
  };

  const handleLogSelfCare = (timeSlotId) => {
    router.push({
      pathname: "/log-selfcare",
      params: { date: dateString, timeSlot: timeSlotId },
    });
    setExpandedTimeSlot(null);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontSize: 16,
            fontFamily: "Montserrat_600SemiBold",
            color: colors.primary,
            marginBottom: 16,
          }}
        >
          Your Day
        </Text>
        {TIME_SLOTS.map((timeSlot, index) => {
          const IconComponent = timeSlot.icon;
          const slotEntries = timeSlotData[timeSlot.id];
          const hasEntries =
            slotEntries.anxiety.length > 0 || slotEntries.selfCare.length > 0;
          const isExpanded = expandedTimeSlot === timeSlot.id;

          return (
            <View
              key={timeSlot.id}
              style={{ flexDirection: "row", marginBottom: 20 }}
            >
              <View
                style={{ alignItems: "center", width: 60, marginRight: 16 }}
              >
                <IconComponent
                  size={20}
                  color={hasEntries ? colors.primary : colors.placeholder}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "Montserrat_500Medium",
                    color: hasEntries ? colors.primary : colors.placeholder,
                    marginTop: 4,
                  }}
                >
                  {timeSlot.label}
                </Text>
              </View>
              <View style={{ alignItems: "center", marginRight: 16 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: hasEntries
                      ? colors.primary
                      : colors.placeholder,
                    marginTop: 6,
                  }}
                />
                {index < TIME_SLOTS.length - 1 && (
                  <View
                    style={{
                      width: 2,
                      height: 40,
                      backgroundColor: colors.borderLight,
                      marginTop: 4,
                    }}
                  />
                )}
              </View>
              <View style={{ flex: 1, paddingTop: 22 }}>
                {!hasEntries ? (
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "Montserrat_500Medium",
                      color: colors.placeholder,
                      fontStyle: "italic",
                      marginBottom: 8,
                    }}
                  >
                    No activities
                  </Text>
                ) : (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
                    {slotEntries.anxiety.map((entry, idx) => (
                      <ActivityPill
                        key={`anxiety-${idx}`}
                        activity={entry}
                        type="anxiety"
                        onPress={() => handleAnxietyPress(entry)}
                      />
                    ))}
                    {slotEntries.selfCare.map((entry, idx) => (
                      <ActivityPill
                        key={`selfcare-${idx}`}
                        activity={entry}
                        type="selfcare"
                        onPress={() => handleSelfCarePress(entry)}
                      />
                    ))}
                  </View>
                )}

                {/* +Add button */}
                {!isExpanded && (
                  <TouchableOpacity
                    onPress={() => handleAddPress(timeSlot.id)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      backgroundColor: colors.surface,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors.borderLight,
                      alignSelf: "flex-start",
                    }}
                  >
                    <Plus size={14} color={colors.primary} />
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: "Montserrat_600SemiBold",
                        color: colors.primary,
                        marginLeft: 4,
                      }}
                    >
                      Add
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Expanded buttons */}
                {isExpanded && (
                  <View style={{ gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => handleLogAnxiety(timeSlot.id)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        backgroundColor: "#EDE6FF",
                        borderRadius: 16,
                        alignSelf: "flex-start",
                      }}
                    >
                      <Plus size={16} color="#5F27CD" />
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: "Montserrat_600SemiBold",
                          color: "#5F27CD",
                          marginLeft: 4,
                        }}
                      >
                        Anxiety
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleLogSelfCare(timeSlot.id)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        backgroundColor: "#D4F4DD",
                        borderRadius: 16,
                        alignSelf: "flex-start",
                      }}
                    >
                      <Plus size={16} color="#27AE60" />
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: "Montserrat_600SemiBold",
                          color: "#27AE60",
                          marginLeft: 4,
                        }}
                      >
                        Self-Care
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setExpandedTimeSlot(null)}
                      style={{
                        paddingVertical: 4,
                        paddingHorizontal: 12,
                        alignSelf: "flex-start",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: "Montserrat_500Medium",
                          color: colors.placeholder,
                        }}
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
