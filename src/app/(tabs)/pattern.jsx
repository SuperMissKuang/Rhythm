import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useFonts,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from "@expo-google-fonts/montserrat";
import { useAppTheme } from "@/utils/theme";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react-native";
import { router } from "expo-router";
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  differenceInDays,
  startOfWeek,
  endOfWeek,
  parseISO,
} from "date-fns";
import { useActivityStore } from "@/utils/stores/useActivityStore";
import { useCycleStore } from "@/utils/stores/useCycleStore";
import { useAnxietyStore } from "@/utils/stores/useAnxietyStore";
import { useSelfCareStore } from "@/utils/stores/useSelfCareStore";

const NO_DATA_COLOR = "#E0E0E0";

// Utility function to calculate color luminance for text contrast
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
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
};

export default function PatternScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const [selectedFilter, setSelectedFilter] = useState(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showMoreActivities, setShowMoreActivities] = useState(false);

  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  // Get data from stores
  const customActivities = useActivityStore((state) => state.activities);
  const cycles = useCycleStore((state) => state.cycles);
  const anxietyEntries = useAnxietyStore((state) => state.entries);
  const selfCareEntries = useSelfCareStore((state) => state.entries);

  // Normalize data format to match API response format
  const cyclesData = { cycles };
  const anxietyData = { entries: anxietyEntries };
  const selfCareData = { entries: selfCareEntries };

  if (!fontsLoaded) {
    return null;
  }
  
  // All activities are now in the store (defaults + custom)
  // Just need to add Period as a special activity option
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

  // Combine period with all other activities from the store
  const allActivities = [periodActivity, ...customActivities];

  // Set default selected filter to the first activity if none selected
  const currentSelectedFilter =
    selectedFilter || (allActivities.length > 0 ? allActivities[0] : null);

  const handleMonthPress = (month) => {
    router.push({
      pathname: "/pattern-month",
      params: { month: format(month, "yyyy-MM") },
    });
  };

  const handleNextYear = () => {
    setCurrentYear(currentYear + 1);
  };

  const handleGoToCurrentYear = () => {
    setCurrentYear(new Date().getFullYear());
  };

  const handlePreviousYear = () => {
    setCurrentYear(currentYear - 1);
  };

  const getPeriodDayForDate = (date) => {
    const dateString = format(date, "yyyy-MM-dd");
    const cycles = cyclesData?.cycles || [];

    for (const cycle of cycles) {
      const cycleStart = parseISO(cycle.start_date);
      const daysSinceStart = differenceInDays(date, cycleStart);

      // Check if date is within this cycle period (assuming 5 days period length)
      if (daysSinceStart >= 0 && daysSinceStart < 5) {
        return daysSinceStart + 1; // Return period day (1-5)
      }
    }

    return null; // Not a period day
  };

  const getActivityDataForDate = (date, selectedActivity) => {
    const dateString = format(date, "yyyy-MM-dd");

    if (!selectedActivity) {
      return { count: 0, hasData: false };
    }

    if (selectedActivity.name === "Period") {
      const periodDay = getPeriodDayForDate(date);
      return {
        count: periodDay || 0,
        hasData: periodDay !== null,
      };
    }

    if (selectedActivity.name === "Anxiety") {
      const anxietyEntries =
        anxietyData?.entries?.filter(
          (entry) => entry.entry_date === dateString,
        ) || [];

      const anxietyScore = anxietyEntries.reduce(
        (sum, entry) => sum + entry.severity,
        0,
      );
      return {
        count: anxietyScore,
        hasData: anxietyEntries.length > 0,
      };
    }

    // Get activity keys for this custom activity
    const activityKeys =
      selectedActivity.items?.map((item) => item.activity_key) || [];

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

    return {
      count: activityCount,
      hasData: activityCount > 0,
    };
  };

  const getActivityColor = (count, hasData, selectedActivity) => {
    if (!selectedActivity || !hasData || count === 0) return NO_DATA_COLOR;

    const baseColor = selectedActivity.color_hex;

    // Get frequency configuration
    const lightMin = selectedActivity.light_saturation_min || 1;
    const lightMax = selectedActivity.light_saturation_max || 2;
    const mediumMin = selectedActivity.medium_saturation_min || 2;
    const mediumMax = selectedActivity.medium_saturation_max || 3;
    const darkMin = selectedActivity.dark_saturation_min || 4;

    // Determine saturation based on count and frequency config
    if (count >= darkMin) {
      return baseColor; // Full saturation
    } else if (count >= mediumMin && count <= mediumMax) {
      return `${baseColor}80`; // Medium saturation
    } else if (count >= lightMin && count <= lightMax) {
      return `${baseColor}40`; // Light saturation
    }

    return NO_DATA_COLOR;
  };

  const renderYearView = () => {
    const monthsCount = 12;
    const months = Array.from({ length: monthsCount }, (_, monthIndex) => {
      const monthStart = new Date(currentYear, monthIndex, 1);
      const monthEnd = endOfMonth(monthStart);

      // Get the start of the week for the first day of the month (Sunday = 0)
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

      const calendarDays = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd,
      });

      // Group days into weeks (7 days each)
      const weeks = [];
      for (let i = 0; i < calendarDays.length; i += 7) {
        weeks.push(calendarDays.slice(i, i + 7));
      }

      return { month: monthStart, weeks };
    });

    return (
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {months.map(({ month, weeks }) => (
          <TouchableOpacity
            key={month.getMonth()}
            onPress={() => handleMonthPress(month)}
            style={{
              width: "32%",
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: colors.borderLight,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Montserrat_600SemiBold",
                color: colors.primary,
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              {format(month, "MMM")}
            </Text>

            {/* Days of week header */}
            <View style={{ flexDirection: "row", marginBottom: 4, gap: 1 }}>
              {["S", "M", "T", "W", "T", "F", "S"].map((dayLetter, index) => (
                <View key={index} style={{ flex: 1, alignItems: "center" }}>
                  <Text
                    style={{
                      fontSize: 8,
                      fontFamily: "Montserrat_500Medium",
                      color: colors.secondary,
                    }}
                  >
                    {dayLetter}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar weeks */}
            <View style={{ gap: 1 }}>
              {weeks.map((week, weekIndex) => (
                <View key={weekIndex} style={{ flexDirection: "row", gap: 1 }}>
                  {week.map((day) => {
                    const isCurrentMonth = day.getMonth() === month.getMonth();
                    const data = getActivityDataForDate(
                      day,
                      currentSelectedFilter,
                    );

                    return (
                      <View
                        key={day.toISOString()}
                        style={{
                          flex: 1,
                          aspectRatio: 1,
                          backgroundColor: isCurrentMonth
                            ? getActivityColor(
                                data.count,
                                data.hasData,
                                currentSelectedFilter,
                              )
                            : "transparent",
                          borderRadius: 1,
                          opacity: isCurrentMonth ? 1 : 0.2,
                          borderWidth: isCurrentMonth ? 0.5 : 0,
                          borderColor: colors.borderLight,
                        }}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getLegendItems = () => {
    if (!currentSelectedFilter) return [];

    const baseColor = currentSelectedFilter.color_hex;
    const lightMin = currentSelectedFilter.light_saturation_min || 1;
    const lightMax = currentSelectedFilter.light_saturation_max || 2;
    const mediumMin = currentSelectedFilter.medium_saturation_min || 2;
    const mediumMax = currentSelectedFilter.medium_saturation_max || 3;
    const darkMin = currentSelectedFilter.dark_saturation_min || 4;

    if (currentSelectedFilter.name === "Period") {
      return [{ color: baseColor, label: "Period Days" }];
    } else if (currentSelectedFilter.name === "Anxiety") {
      return [
        {
          color: `${baseColor}40`,
          label:
            lightMin === lightMax
              ? `${lightMin} time`
              : `${lightMin}-${lightMax} times`,
        },
        {
          color: `${baseColor}80`,
          label:
            mediumMin === mediumMax
              ? `${mediumMin} times`
              : `${mediumMin}-${mediumMax} times`,
        },
        {
          color: baseColor,
          label: `${darkMin}+ times`,
        },
      ];
    } else {
      return [
        {
          color: `${baseColor}40`,
          label:
            lightMin === lightMax
              ? `${lightMin} time`
              : `${lightMin}-${lightMax} times`,
        },
        {
          color: `${baseColor}80`,
          label:
            mediumMin === mediumMax
              ? `${mediumMin} times`
              : `${mediumMin}-${mediumMax} times`,
        },
        {
          color: baseColor,
          label: `${darkMin}+ times`,
        },
      ];
    }
  };

  const renderActivityPills = () => {
    // Show up to 5 pills total. If we have 6+, show 4 activities + 1 "More" pill
    const maxVisibleBeforeMore = 4;
    const visibleActivities = allActivities.slice(
      0,
      allActivities.length <= 5 ? allActivities.length : maxVisibleBeforeMore,
    );
    const showMorePill = allActivities.length >= 6;

    return (
      <View style={{ position: "relative" }}>
        <View style={{ flexDirection: "row", gap: 6, flexWrap: "nowrap" }}>
          {visibleActivities.map((activity) => {
            return (
              <TouchableOpacity
                key={activity.id}
                onPress={() => setSelectedFilter(activity)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 20,
                  backgroundColor:
                    currentSelectedFilter?.id === activity.id
                      ? activity.color_hex
                      : colors.surface,
                  borderWidth: 1,
                  borderColor:
                    currentSelectedFilter?.id === activity.id
                      ? activity.color_hex
                      : colors.borderLight,
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 14,
                    fontFamily: "Montserrat_600SemiBold",
                    color:
                      currentSelectedFilter?.id === activity.id
                        ? getContrastTextColor(activity.color_hex)
                        : colors.secondary,
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
                backgroundColor:
                  currentSelectedFilter &&
                  !visibleActivities.find(a => a.id === currentSelectedFilter.id)
                    ? currentSelectedFilter.color_hex
                    : colors.surface,
                borderWidth: 1,
                borderColor:
                  currentSelectedFilter &&
                  !visibleActivities.find(a => a.id === currentSelectedFilter.id)
                    ? currentSelectedFilter.color_hex
                    : colors.borderLight,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Montserrat_600SemiBold",
                  color:
                    currentSelectedFilter &&
                    !visibleActivities.find(a => a.id === currentSelectedFilter.id)
                      ? getContrastTextColor(currentSelectedFilter.color_hex)
                      : colors.secondary,
                }}
              >
                More
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Dropdown menu for additional activities */}
        {showMoreActivities && allActivities.length > 5 && (
          <View
            style={{
              position: "absolute",
              top: 48,
              right: 0,
              backgroundColor: colors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.borderLight,
              padding: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 5,
              zIndex: 1000,
              minWidth: 150,
            }}
          >
            {allActivities.slice(maxVisibleBeforeMore).map((activity) => (
              <TouchableOpacity
                key={activity.id}
                onPress={() => {
                  setSelectedFilter(activity);
                  setShowMoreActivities(false);
                }}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor:
                    currentSelectedFilter?.id === activity.id
                      ? `${activity.color_hex}20`
                      : "transparent",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
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
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={false}
      >
        {/* Header with centered navigation */}
        <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <TouchableOpacity
              onPress={handlePreviousYear}
              style={{
                padding: 8,
                backgroundColor: colors.surface,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: colors.borderLight,
              }}
            >
              <ChevronLeft size={24} color={colors.primary} />
            </TouchableOpacity>

            <Text
              style={{
                fontSize: 20,
                fontFamily: "Montserrat_600SemiBold",
                color: colors.primary,
                marginHorizontal: 20,
                minWidth: 100,
                textAlign: "center",
              }}
            >
              {currentYear}
            </Text>

            <TouchableOpacity
              onPress={handleNextYear}
              style={{
                padding: 8,
                backgroundColor: colors.surface,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: colors.borderLight,
              }}
            >
              <ChevronRight size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Activity Pills - left aligned */}
          <View style={{ marginBottom: 24 }}>{renderActivityPills()}</View>

          {/* Legend - left aligned, no title */}
          {currentSelectedFilter && (
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                {getLegendItems().map((item, index) => (
                  <View
                    key={index}
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        backgroundColor: item.color,
                        borderRadius: 2,
                        marginRight: 6,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: "Montserrat_500Medium",
                        color: colors.secondary,
                      }}
                    >
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Calendar Grid */}
          {allActivities.length > 0 ? (
            renderYearView()
          ) : (
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingTop: 40,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "Montserrat_600SemiBold",
                  color: colors.primary,
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                Period Tracking Available
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Montserrat_500Medium",
                  color: colors.secondary,
                  textAlign: "center",
                }}
              >
                You can track your period data now, or go to the More tab to add
                more activities to track patterns.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
