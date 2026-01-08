import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
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
  addMonths,
  subMonths,
  isAfter,
  startOfDay,
} from "date-fns";
import { useAppTheme } from "@/utils/theme";
import { useActivityStore } from "@/utils/stores/useActivityStore";
import { useCycleStore } from "@/utils/stores/useCycleStore";
import { useAnxietyStore } from "@/utils/stores/useAnxietyStore";
import { useSelfCareStore } from "@/utils/stores/useSelfCareStore";

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

export default function PatternMonthScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const params = useLocalSearchParams();

  const [enabledActivities, setEnabledActivities] = useState(new Set());
  const [showMoreActivities, setShowMoreActivities] = useState(false);

  // Get data from stores
  const customActivities = useActivityStore((state) => state.activities);
  const cycles = useCycleStore((state) => state.cycles);
  const anxietyEntries = useAnxietyStore((state) => state.entries);
  const selfCareEntries = useSelfCareStore((state) => state.entries);

  // Parse the month from params (format: "2025-01")
  const selectedMonth = params.month ? parseISO(`${params.month}-01`) : new Date();

  // Check if we're viewing the current month (disable forward navigation)
  const isCurrentMonth = isSameMonth(selectedMonth, new Date());

  const handlePreviousMonth = () => {
    const previousMonth = subMonths(selectedMonth, 1);
    router.setParams({ month: format(previousMonth, "yyyy-MM") });
  };

  const handleNextMonth = () => {
    if (isCurrentMonth) return; // Prevent navigation to future months
    const nextMonth = addMonths(selectedMonth, 1);
    router.setParams({ month: format(nextMonth, "yyyy-MM") });
  };

  // Normalize data format
  const cyclesData = { cycles };
  const anxietyData = { entries: anxietyEntries };
  const selfCareData = { entries: selfCareEntries };

  // All activities including period
  const periodActivity = {
    id: "period",
    name: "Period",
    color_hex: "#F8BBD9",
    light_saturation_min: 1,
    light_saturation_max: 1,
    medium_saturation_min: 1,
    medium_saturation_max: 1,
    dark_saturation_min: 1,
  };

  const activities = [periodActivity, ...customActivities];

  // Initialize enabled activities
  useEffect(() => {
    setEnabledActivities(new Set(activities.map((a) => a.id)));
  }, []);

  const today = startOfDay(new Date());

  const handleDayPress = (day, isClickable) => {
    if (isClickable) {
      router.push({
        pathname: "/pattern-day",
        params: { date: format(day, "yyyy-MM-dd") },
      });
    }
  };

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
      if (entry.activity_times) {
        const entryActivityKeys = Object.keys(entry.activity_times);
        const matchingCount = entryActivityKeys.filter((key) =>
          activityKeys.includes(key),
        ).length;
        return sum + matchingCount;
      } else if (entry.activities) {
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

  return (
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
            {/* X button on left */}
            <TouchableOpacity onPress={() => router.back()}>
              <X size={24} color={colors.primary} />
            </TouchableOpacity>

            {/* Center group: [<] Month [>] */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flex: 1,
                justifyContent: "center",
              }}
            >
              <TouchableOpacity
                onPress={handlePreviousMonth}
                style={{
                  padding: 8,
                  backgroundColor: colors.surface,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                }}
              >
                <ChevronLeft size={20} color={colors.primary} />
              </TouchableOpacity>

              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "Montserrat_600SemiBold",
                  color: colors.primary,
                  marginHorizontal: 16,
                  textAlign: "center",
                }}
              >
                {format(selectedMonth, "MMMM yyyy")}
              </Text>

              <TouchableOpacity
                onPress={handleNextMonth}
                disabled={isCurrentMonth}
                style={{
                  padding: 8,
                  backgroundColor: colors.surface,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                  opacity: isCurrentMonth ? 0.3 : 1,
                }}
              >
                <ChevronRight size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Spacer on right to balance X button */}
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
                    const isInMonth = isSameMonth(day, selectedMonth);
                    const isFutureDay = isAfter(startOfDay(day), today);
                    const isClickable = isInMonth && !isFutureDay;
                    const dayActivities = getActivitiesForDate(day);
                    const daySize = 40;
                    const hasData = dayActivities.length > 0;

                    return (
                      <View
                        key={day.toISOString()}
                        style={{
                          flex: 1,
                          height: daySize + 20,
                          alignItems: "center",
                          justifyContent: "flex-start",
                          position: "relative",
                        }}
                      >
                        {/* Day background - clickable if in month and not future */}
                        <TouchableOpacity
                          onPress={() =>
                            handleDayPress(day, isClickable)
                          }
                          disabled={!isClickable}
                          style={{
                            width: daySize,
                            height: daySize,
                            backgroundColor: "transparent",
                            borderRadius: 4,
                            justifyContent: "center",
                            alignItems: "center",
                            borderWidth: isInMonth && !isFutureDay ? 1 : 0,
                            borderColor: colors.borderLight,
                            opacity: isInMonth && !isFutureDay ? 1 : 0.3,
                          }}
                        >
                          {/* Always show day number */}
                          <Text
                            style={{
                              fontSize: 14,
                              fontFamily: "Montserrat_500Medium",
                              color: isClickable
                                ? colors.primary
                                : colors.secondary,
                            }}
                          >
                            {day.getDate()}
                          </Text>
                        </TouchableOpacity>

                        {/* Activity dots */}
                        {isClickable && dayActivities.length > 0 && (
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
    </View>
  );
}
