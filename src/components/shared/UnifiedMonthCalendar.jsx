import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  isAfter,
  startOfDay,
  differenceInDays,
  parseISO,
} from "date-fns";
import { useAppTheme } from "@/utils/theme";

/**
 * UnifiedMonthCalendar — the one calendar component used everywhere.
 *
 * Two modes:
 *  1. "period" mode (from Today tab): shows period days highlighted, tap to select start date
 *  2. "activity" mode (from Pattern tab): shows activity dots, tap to view day detail
 *
 * Props:
 * - month: Date object for which month to display
 * - cycles: array of cycle objects (for period day highlighting)
 * - mode: "period" | "activity"
 *
 * Period mode props:
 * - selectedDate: currently selected start date (string "yyyy-MM-dd")
 * - onSelectDate: callback(dateString) when user taps a day
 *
 * Activity mode props:
 * - activityDots: function(date) => array of { id, color_hex } for dots below day
 * - onDayPress: callback(date) when user taps a day with data
 */
export function UnifiedMonthCalendar({
  month,
  cycles = [],
  mode = "period",
  // Period mode
  selectedDate = null,
  onSelectDate,
  // Activity mode
  activityDots,
  onDayPress,
}) {
  const { colors } = useAppTheme();
  const today = startOfDay(new Date());

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = useMemo(
    () => eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    [calendarStart.getTime(), calendarEnd.getTime()],
  );

  const weeks = useMemo(() => {
    const w = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      w.push(calendarDays.slice(i, i + 7));
    }
    return w;
  }, [calendarDays]);

  // Build a set of period date strings for fast lookup
  const periodDays = useMemo(() => {
    const set = new Map(); // dateString -> { dayNum (1-5), isStart }
    cycles.forEach((cycle) => {
      const cycleStart = parseISO(cycle.start_date);
      for (let i = 0; i < 5; i++) {
        const d = new Date(cycleStart);
        d.setDate(d.getDate() + i);
        const ds = format(d, "yyyy-MM-dd");
        set.set(ds, { dayNum: i + 1, isStart: i === 0 });
      }
    });
    return set;
  }, [cycles]);

  const DAY_SIZE = 40;

  const getDayStyle = (day, isInMonth) => {
    const dateString = format(day, "yyyy-MM-dd");
    const isFuture = isAfter(startOfDay(day), today);
    const isCurrentDay = isSameDay(day, today);
    const periodInfo = periodDays.get(dateString);
    const isSelected = selectedDate === dateString;

    if (!isInMonth || isFuture) {
      return {
        container: {
          opacity: 0.3,
          backgroundColor: "transparent",
          borderWidth: 0,
        },
        text: { color: colors.secondary },
        disabled: true,
      };
    }

    // Selected date (period mode)
    if (mode === "period" && isSelected) {
      return {
        container: {
          backgroundColor: "#F8BBD9",
          borderWidth: 2,
          borderColor: "#E91E63",
          borderRadius: 8,
        },
        text: { color: "#000000", fontWeight: "700" },
        disabled: false,
      };
    }

    // Period day
    if (periodInfo) {
      return {
        container: {
          backgroundColor: periodInfo.isStart ? "#F8BBD9" : "#FDE4E7",
          borderRadius: 8,
          borderWidth: isCurrentDay ? 2 : 0,
          borderColor: isCurrentDay ? colors.primary : "transparent",
        },
        text: {
          color: "#000000",
          fontWeight: periodInfo.isStart ? "700" : "500",
        },
        disabled: false,
      };
    }

    // Today
    if (isCurrentDay) {
      return {
        container: {
          borderWidth: 2,
          borderColor: colors.primary,
          borderRadius: 8,
          backgroundColor: "transparent",
        },
        text: { color: colors.primary, fontWeight: "700" },
        disabled: false,
      };
    }

    // Normal day
    return {
      container: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: 4,
      },
      text: { color: colors.primary },
      disabled: false,
    };
  };

  const handleDayPress = (day) => {
    const dateString = format(day, "yyyy-MM-dd");
    if (mode === "period") {
      onSelectDate?.(dateString);
    } else {
      onDayPress?.(day);
    }
  };

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.borderLight,
      }}
    >
      {/* Day headers */}
      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <View key={d} style={{ flex: 1, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Montserrat_600SemiBold",
                color: colors.secondary,
              }}
            >
              {d}
            </Text>
          </View>
        ))}
      </View>

      {/* Weeks */}
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={{ flexDirection: "row", marginBottom: 8 }}>
          {week.map((day) => {
            const isInMonth = isSameMonth(day, month);
            const style = getDayStyle(day, isInMonth);
            const dateString = format(day, "yyyy-MM-dd");
            const isFuture = isAfter(startOfDay(day), today);
            const dots =
              mode === "activity" && isInMonth && !isFuture
                ? activityDots?.(day) || []
                : [];

            return (
              <View
                key={day.toISOString()}
                style={{
                  flex: 1,
                  height: DAY_SIZE + (mode === "activity" ? 16 : 0),
                  alignItems: "center",
                  justifyContent: "flex-start",
                }}
              >
                <TouchableOpacity
                  onPress={() => handleDayPress(day)}
                  disabled={style.disabled}
                  style={{
                    width: DAY_SIZE,
                    height: DAY_SIZE,
                    justifyContent: "center",
                    alignItems: "center",
                    ...style.container,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Montserrat_500Medium",
                      ...style.text,
                    }}
                  >
                    {day.getDate()}
                  </Text>
                </TouchableOpacity>

                {/* Activity dots */}
                {dots.length > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 2,
                      marginTop: 2,
                    }}
                  >
                    {dots.slice(0, 4).map((dot, i) => (
                      <View
                        key={`${dot.id}-${i}`}
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 2.5,
                          backgroundColor: dot.color_hex,
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
  );
}
