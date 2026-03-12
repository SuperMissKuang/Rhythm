import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  format,
  parseISO,
  addMonths,
  subMonths,
  isSameMonth,
  isAfter,
  startOfDay,
  differenceInDays,
} from "date-fns";
import { useAppTheme } from "@/utils/theme";
import { useActivityStore } from "@/utils/stores/useActivityStore";
import { useCycleStore } from "@/utils/stores/useCycleStore";
import { useAnxietyStore } from "@/utils/stores/useAnxietyStore";
import { useSelfCareStore } from "@/utils/stores/useSelfCareStore";
import { UnifiedMonthCalendar } from "@/components/shared/UnifiedMonthCalendar";
import { PeriodHistoryList } from "@/components/shared/PeriodHistoryList";

// Calculate relative luminance with gamma correction
const calculateLuminance = (hexColor) => {
  if (!hexColor || !hexColor.startsWith("#")) return 0.5;
  const r = parseInt(hexColor.slice(1, 3), 16) / 255;
  const g = parseInt(hexColor.slice(3, 5), 16) / 255;
  const b = parseInt(hexColor.slice(5, 7), 16) / 255;

  const gamma = (c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * gamma(r) + 0.7152 * gamma(g) + 0.0722 * gamma(b);
};

const getContrastTextColor = (backgroundColor) => {
  const luminance = calculateLuminance(backgroundColor);
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
};

export default function PatternMonthScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const params = useLocalSearchParams();

  const [enabledActivities, setEnabledActivities] = useState(new Set());
  const [showMoreActivities, setShowMoreActivities] = useState(false);
  const [highlightedCycleId, setHighlightedCycleId] = useState(null);

  // Get data from stores
  const customActivities = useActivityStore((state) => state.activities);
  const cycles = useCycleStore((state) => state.cycles);
  const anxietyEntries = useAnxietyStore((state) => state.entries);
  const selfCareEntries = useSelfCareStore((state) => state.entries);

  // Parse the month from params (format: "2025-01")
  const selectedMonth = params.month
    ? parseISO(`${params.month}-01`)
    : new Date();

  const isCurrentMonth = isSameMonth(selectedMonth, new Date());

  const handlePreviousMonth = () => {
    const previousMonth = subMonths(selectedMonth, 1);
    router.setParams({ month: format(previousMonth, "yyyy-MM") });
  };

  const handleNextMonth = () => {
    if (isCurrentMonth) return;
    const nextMonth = addMonths(selectedMonth, 1);
    router.setParams({ month: format(nextMonth, "yyyy-MM") });
  };

  // All activities including period
  const periodActivity = {
    id: "period",
    name: "Period",
    color_hex: "#F8BBD9",
  };

  const activities = [periodActivity, ...customActivities];

  // Initialize enabled activities
  useEffect(() => {
    setEnabledActivities(new Set(activities.map((a) => a.id)));
  }, []);

  const today = startOfDay(new Date());

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

  // Build activity dots for a given date
  const getActivityDots = useCallback(
    (date) => {
      const dateString = format(date, "yyyy-MM-dd");
      const dots = [];

      activities.forEach((activity) => {
        if (!enabledActivities.has(activity.id)) return;

        if (activity.name === "Period") {
          // Check if this date is a period day
          for (const cycle of cycles) {
            const cycleStart = parseISO(cycle.start_date);
            const daysSinceStart = differenceInDays(date, cycleStart);
            if (daysSinceStart >= 0 && daysSinceStart < 5) {
              dots.push({ id: activity.id, color_hex: activity.color_hex });
              break;
            }
          }
        } else if (activity.name === "Anxiety") {
          const hasAnxiety = anxietyEntries?.some(
            (entry) => entry.entry_date === dateString,
          );
          if (hasAnxiety) {
            dots.push({ id: activity.id, color_hex: activity.color_hex });
          }
        } else {
          // Custom activity
          const activityKeys =
            activity.items?.map((item) => item.activity_key) || [];
          if (activityKeys.length === 0) return;

          const hasActivity = selfCareEntries?.some((entry) => {
            if (entry.entry_date !== dateString) return false;
            if (entry.activity_times) {
              return Object.keys(entry.activity_times).some((key) =>
                activityKeys.includes(key),
              );
            } else if (entry.activities) {
              return entry.activities.some((a) => activityKeys.includes(a));
            }
            return false;
          });

          if (hasActivity) {
            dots.push({ id: activity.id, color_hex: activity.color_hex });
          }
        }
      });

      return dots;
    },
    [activities, enabledActivities, cycles, anxietyEntries, selfCareEntries],
  );

  const handleDayPress = useCallback(
    (day) => {
      router.push({
        pathname: "/pattern-day",
        params: { date: format(day, "yyyy-MM-dd") },
      });
    },
    [],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ paddingTop: insets.top + 8 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderLight,
              marginBottom: 16,
            }}
          >
            <TouchableOpacity onPress={() => router.back()}>
              <X size={24} color={colors.primary} />
            </TouchableOpacity>

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

            <View style={{ width: 24 }} />
          </View>

          {/* Activity Toggles */}
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <View style={{ position: "relative" }}>
              <View
                style={{ flexDirection: "row", gap: 6, flexWrap: "nowrap" }}
              >
                {(() => {
                  const maxVisibleBeforeMore = 4;
                  const visibleActivities = activities.slice(
                    0,
                    activities.length <= 5
                      ? activities.length
                      : maxVisibleBeforeMore,
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
                                color: isEnabled
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
                          onPress={() =>
                            setShowMoreActivities(!showMoreActivities)
                          }
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

              {/* Dropdown */}
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
                          backgroundColor: isEnabled
                            ? `${activity.color_hex}20`
                            : "transparent",
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

          {/* Calendar — same component as period logging, but in activity mode */}
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <UnifiedMonthCalendar
              month={selectedMonth}
              cycles={cycles}
              mode="activity"
              activityDots={getActivityDots}
              onDayPress={handleDayPress}
            />
          </View>

          {/* Legend */}
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              {activities
                .filter((a) => enabledActivities.has(a.id))
                .map((activity) => (
                  <View
                    key={activity.id}
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: activity.color_hex,
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
                      {activity.name}
                    </Text>
                  </View>
                ))}
            </View>
          </View>

          {/* Period History (when Period toggle is on) */}
          {enabledActivities.has("period") && cycles.length > 0 && (
            <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
              <PeriodHistoryList
                cycles={cycles.filter((c) => {
                  // Show cycles up to and including the month in view
                  const cycleDate = parseISO(c.start_date);
                  const endOfViewedMonth = new Date(
                    selectedMonth.getFullYear(),
                    selectedMonth.getMonth() + 1,
                    0,
                  );
                  return cycleDate <= endOfViewedMonth;
                })}
                maxItems={6}
                onTapCycle={(cycle) => {
                  const cycleMonth = parseISO(cycle.start_date);
                  router.setParams({
                    month: format(cycleMonth, "yyyy-MM"),
                  });
                  setHighlightedCycleId(cycle.id);
                }}
                highlightedCycleId={highlightedCycleId}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
