import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  differenceInDays,
  isSameMonth,
  parseISO,
} from "date-fns";
import { useAppTheme } from "@/utils/theme";
import { DayViewModal } from "@/components/Pattern/DayViewModal";

const NO_DATA_COLOR = "#E0E0E0";

// Calculate relative luminance with gamma correction
const calculateLuminance = (hexColor) => {
  if (!hexColor || !hexColor.startsWith("#")) return 0.5;
  const r = parseInt(hexColor.slice(1, 3), 16) / 255;
  const g = parseInt(hexColor.slice(3, 5), 16) / 255;
  const b = parseInt(hexColor.slice(5, 7), 16) / 255;

  const gamma = (c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * gamma(r) + 0.7152 * gamma(g) + 0.0722 * gamma(b);
};

// Get contrast text color (black or white) based on background luminance
const getContrastTextColor = (backgroundColor) => {
  const luminance = calculateLuminance(backgroundColor);
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
};

export function MonthDetailModal({
  visible,
  onClose,
  selectedMonth,
  activities = [],
  anxietyData = {},
  selfCareData = {},
  cyclesData = {},
}) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const [enabledActivities, setEnabledActivities] = useState(new Set());
  const [selectedDay, setSelectedDay] = useState(null);
  const [isDayViewVisible, setIsDayViewVisible] = useState(false);
  const [showMoreActivities, setShowMoreActivities] = useState(false);

  // Initialize enabled activities when modal opens
  useEffect(() => {
    if (visible && selectedMonth) {
      // Enable all activities by default (including period and database activities)
      setEnabledActivities(new Set(activities.map((a) => a.id)));
    }
  }, [visible, selectedMonth, activities]);

  const handleDayPress = (day, hasData) => {
    if (hasData) {
      setSelectedDay(day);
      setIsDayViewVisible(true);
    }
  };

  const handleCloseDayView = () => {
    setIsDayViewVisible(false);
    setSelectedDay(null);
  };

  if (!selectedMonth) return null;

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // Group days into weeks
  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const getPeriodDayForDate = (date) => {
    const dateString = format(date, "yyyy-MM-dd");
    const cycles = cyclesData?.cycles || [];

    for (const cycle of cycles) {
      const cycleStart = parseISO(cycle.start_date);
      const daysSinceStart = differenceInDays(date, cycleStart);

      if (daysSinceStart >= 0 && daysSinceStart < 5) {
        return daysSinceStart + 1;
      }
    }
    return null;
  };

  const getActivityDataForDate = (date, activity) => {
    const dateString = format(date, "yyyy-MM-dd");

    if (activity.name === "Period") {
      const periodDay = getPeriodDayForDate(date);
      return { count: periodDay || 0, hasData: periodDay !== null };
    }

    if (activity.name === "Anxiety") {
      const anxietyEntries =
        anxietyData?.entries?.filter(
          (entry) => entry.entry_date === dateString,
        ) || [];

      const anxietyScore = anxietyEntries.reduce(
        (sum, entry) => sum + entry.severity,
        0,
      );
      return { count: anxietyScore, hasData: anxietyEntries.length > 0 };
    }

    // Custom activity
    const activityKeys = activity.items?.map((item) => item.activity_key) || [];
    if (activityKeys.length === 0) {
      return { count: 0, hasData: false };
    }

    const selfCareEntries =
      selfCareData?.entries?.filter(
        (entry) => entry.entry_date === dateString,
      ) || [];

    const activityCount = selfCareEntries.reduce((sum, entry) => {
      // Handle both new format (activity_times) and legacy format (activities)
      if (entry.activity_times) {
        // New format: activity_times is an object with activity keys
        const entryActivityKeys = Object.keys(entry.activity_times);
        const matchingCount = entryActivityKeys.filter((key) =>
          activityKeys.includes(key),
        ).length;
        return sum + matchingCount;
      } else if (entry.activities) {
        // Legacy format: activities is an array
        const matchingActivities = entry.activities.filter((activity) =>
          activityKeys.includes(activity),
        );
        return sum + matchingActivities.length;
      }
      return sum;
    }, 0);

    return { count: activityCount, hasData: activityCount > 0 };
  };

  const getActivitiesForDate = (date) => {
    const dateActivities = [];

    activities.forEach((activity) => {
      if (!enabledActivities.has(activity.id)) return;

      const data = getActivityDataForDate(date, activity);
      if (data.hasData && data.count > 0) {
        dateActivities.push({
          ...activity,
          count: data.count,
        });
      }
    });

    // Keep the original order from activities array instead of sorting by count
    // This ensures consistent visual order across all days
    return dateActivities;
  };

  const toggleActivity = (activityId) => {
    setEnabledActivities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  const renderCascadingSquares = (activities, daySize) => {
    if (activities.length === 0) return null;

    const baseSize = daySize; // Use full day size for largest square to match gray background
    const activityCount = activities.length;

    return (
      <View
        style={{
          position: "absolute",
          width: daySize,
          height: daySize,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {activities.map((activity, index) => {
          // Proportional sizing: largest is full size, each subsequent is proportionally smaller
          const sizeRatio = (activityCount - index) / activityCount;
          const squareSize = Math.max(8, baseSize * sizeRatio);
          return (
            <View
              key={`${activity.id}-${index}`}
              style={{
                position: "absolute",
                width: squareSize,
                height: squareSize,
                backgroundColor: activity.color_hex,
                borderRadius: 6,
              }}
            />
          );
        })}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView style={{ flex: 1 }}>
          <View style={{ paddingTop: insets.top }}>
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderLight,
              }}
            >
              <TouchableOpacity onPress={onClose}>
                <X size={24} color={colors.primary} />
              </TouchableOpacity>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "Montserrat_600SemiBold",
                  color: colors.primary,
                }}
              >
                {format(selectedMonth, "MMMM yyyy")}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Activity Toggles */}
            <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "Montserrat_600SemiBold",
                  color: colors.primary,
                  marginBottom: 12,
                }}
              >
                Activities
              </Text>

              <View style={{ position: "relative" }}>
                <View style={{ flexDirection: "row", gap: 6, flexWrap: "nowrap" }}>
                  {(() => {
                    const maxVisibleBeforeMore = 4;
                    const visibleActivities = activities.slice(
                      0,
                      activities.length <= 5 ? activities.length : maxVisibleBeforeMore,
                    );
                    const showMorePill = activities.length >= 6;

                    return (
                      <>
                        {visibleActivities.map((activity) => {
                          const isEnabled = enabledActivities.has(activity.id);
                          return (
                            <TouchableOpacity
                              key={activity.id}
                              onPress={() => toggleActivity(activity.id)}
                              style={{
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                borderRadius: 20,
                                backgroundColor: isEnabled
                                  ? activity.color_hex
                                  : colors.surface,
                                borderWidth: 1,
                                borderColor: isEnabled
                                  ? activity.color_hex
                                  : colors.borderLight,
                              }}
                            >
                              <Text
                                numberOfLines={1}
                                style={{
                                  fontSize: 14,
                                  fontFamily: "Montserrat_600SemiBold",
                                  color: isEnabled ? getContrastTextColor(activity.color_hex) : colors.secondary,
                                  textAlign: "center",
                                }}
                              >
                                {activity.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}

                        {showMorePill && (
                          <TouchableOpacity
                            onPress={() => setShowMoreActivities(!showMoreActivities)}
                            style={{
                              paddingVertical: 8,
                              paddingHorizontal: 12,
                              borderRadius: 20,
                              backgroundColor: colors.surface,
                              borderWidth: 1,
                              borderColor: colors.borderLight,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 14,
                                fontFamily: "Montserrat_600SemiBold",
                                color: colors.secondary,
                              }}
                            >
                              More
                            </Text>
                          </TouchableOpacity>
                        )}
                      </>
                    );
                  })()}
                </View>

                {/* Dropdown menu for additional activities */}
                {showMoreActivities && activities.length > 5 && (
                  <View
                    style={{
                      position: "absolute",
                      top: 48,
                      right: 0,
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                      padding: 12,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 5,
                      borderWidth: 1,
                      borderColor: colors.borderLight,
                      minWidth: 150,
                      zIndex: 1000,
                    }}
                  >
                    {activities.slice(4).map((activity) => {
                      const isEnabled = enabledActivities.has(activity.id);
                      return (
                        <TouchableOpacity
                          key={activity.id}
                          onPress={() => {
                            toggleActivity(activity.id);
                            setShowMoreActivities(false);
                          }}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingVertical: 8,
                            paddingHorizontal: 8,
                            borderRadius: 8,
                            backgroundColor: isEnabled ? `${activity.color_hex}20` : "transparent",
                          }}
                        >
                          <View
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 6,
                              backgroundColor: activity.color_hex,
                              marginRight: 8,
                            }}
                          />
                          <Text
                            style={{
                              fontSize: 14,
                              fontFamily: "Montserrat_600SemiBold",
                              color: colors.primary,
                            }}
                          >
                            {activity.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>

            {/* Calendar */}
            <View style={{ paddingHorizontal: 20 }}>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                }}
              >
                {/* Days of week header */}
                <View style={{ flexDirection: "row", marginBottom: 12 }}>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <View key={day} style={{ flex: 1, alignItems: "center" }}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontFamily: "Montserrat_600SemiBold",
                            color: colors.secondary,
                          }}
                        >
                          {day}
                        </Text>
                      </View>
                    ),
                  )}
                </View>

                {/* Calendar weeks */}
                {weeks.map((week, weekIndex) => (
                  <View
                    key={weekIndex}
                    style={{ flexDirection: "row", marginBottom: 12 }}
                  >
                    {week.map((day) => {
                      const isCurrentMonth = isSameMonth(day, selectedMonth);
                      const dayActivities = getActivitiesForDate(day);
                      const daySize = 40; // Fixed day size
                      const hasData = dayActivities.length > 0;

                      return (
                        <View
                          key={day.toISOString()}
                          style={{
                            flex: 1,
                            height: daySize + 20, // Extra height for dots below
                            alignItems: "center",
                            justifyContent: "flex-start",
                            position: "relative",
                          }}
                        >
                          {/* Day background - clickable if has data */}
                          <TouchableOpacity
                            onPress={() =>
                              handleDayPress(day, hasData && isCurrentMonth)
                            }
                            disabled={!hasData || !isCurrentMonth}
                            style={{
                              width: daySize,
                              height: daySize,
                              backgroundColor: "transparent",
                              borderRadius: 4,
                              justifyContent: "center",
                              alignItems: "center",
                              borderWidth: isCurrentMonth ? 1 : 0,
                              borderColor: colors.borderLight,
                              opacity: isCurrentMonth ? 1 : 0.3,
                            }}
                          >
                            {/* Always show day number */}
                            <Text
                              style={{
                                fontSize: 14,
                                fontFamily: "Montserrat_500Medium",
                                color: isCurrentMonth
                                  ? colors.primary
                                  : colors.secondary,
                              }}
                            >
                              {day.getDate()}
                            </Text>
                          </TouchableOpacity>

                          {/* Activity dots (under the date) - now includes period */}
                          {isCurrentMonth && dayActivities.length > 0 && (
                            <View
                              style={{
                                position: "absolute",
                                top: daySize + 2,
                                flexDirection: "row",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              {dayActivities.map((activity, index) => (
                                <View
                                  key={`${activity.id}-${index}`}
                                  style={{
                                    width: 6,
                                    height: 6,
                                    backgroundColor: activity.color_hex,
                                    borderRadius: 3,
                                  }}
                                />
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>

              {/* Legend */}
              <View style={{ marginTop: 16, marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Montserrat_600SemiBold",
                    color: colors.primary,
                    marginBottom: 8,
                  }}
                >
                  Legend
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      backgroundColor: colors.primary,
                      borderRadius: 2,
                      marginRight: 8,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "Montserrat_500Medium",
                      color: colors.secondary,
                    }}
                  >
                    Activity Data (tap to view details)
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      backgroundColor: NO_DATA_COLOR,
                      borderRadius: 2,
                      marginRight: 8,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "Montserrat_500Medium",
                      color: colors.secondary,
                    }}
                  >
                    No Activity Data
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Day View Modal */}
        <DayViewModal
          visible={isDayViewVisible}
          onClose={handleCloseDayView}
          selectedDate={selectedDay}
          cycles={cyclesData?.cycles || []}
        />
      </View>
    </Modal>
  );
}
