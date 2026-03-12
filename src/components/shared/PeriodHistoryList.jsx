import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { format, parseISO } from "date-fns";
import { Pencil } from "lucide-react-native";
import { router } from "expo-router";
import { useAppTheme } from "@/utils/theme";

/**
 * PeriodHistoryList — read-only display of recent period cycles.
 *
 * Used in:
 *  - Period Log screen (context while logging, tap = jump calendar)
 *  - Pattern month view (context for current month, tap = jump calendar)
 *
 * Both show an "Edit History" button → navigates to /period-history
 *
 * Props:
 * - cycles: array of cycle objects
 * - maxItems: how many to show (default 6)
 * - onTapCycle: callback when a cycle row is tapped (receives cycle object)
 * - highlightedCycleId: id of cycle to highlight with pink border
 * - showTitle: whether to show heading row (default true)
 */
export function PeriodHistoryList({
  cycles = [],
  maxItems = 6,
  onTapCycle,
  highlightedCycleId,
  showTitle = true,
}) {
  const { colors } = useAppTheme();

  if (cycles.length === 0) return null;

  const sorted = [...cycles].sort(
    (a, b) => parseISO(b.start_date) - parseISO(a.start_date),
  );
  const visible = sorted.slice(0, maxItems);

  const getLabel = (cycle, index) => {
    const start = parseISO(cycle.start_date);
    const daysDiff = Math.floor(
      (new Date() - start) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff <= 7) return "Current Period";

    if (index === 0 && daysDiff > 7) return "Last Period";
    if (
      index === 1 &&
      visible[0] &&
      Math.floor(
        (new Date() - parseISO(visible[0].start_date)) /
          (1000 * 60 * 60 * 24),
      ) <= 7
    )
      return "Last Period";

    return `${format(start, "MMMM yyyy")} Period`;
  };

  return (
    <View>
      {showTitle && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontFamily: "Montserrat_600SemiBold",
              color: colors.primary,
            }}
          >
            Period History
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/period-history")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Pencil size={13} color={colors.secondary} />
            <Text
              style={{
                fontSize: 13,
                fontFamily: "Montserrat_500Medium",
                color: colors.secondary,
              }}
            >
              Edit History
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {visible.map((cycle, index) => {
        const start = parseISO(cycle.start_date);
        const isHighlighted = highlightedCycleId === cycle.id;

        return (
          <TouchableOpacity
            key={cycle.id}
            onPress={() => onTapCycle?.(cycle)}
            activeOpacity={onTapCycle ? 0.7 : 1}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 10,
              padding: 14,
              marginBottom: 6,
              borderWidth: 1,
              borderColor: isHighlighted ? "#F8BBD9" : colors.borderLight,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Montserrat_600SemiBold",
                color: colors.primary,
              }}
            >
              {getLabel(cycle, index)}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Montserrat_500Medium",
                color: colors.secondary,
                marginTop: 2,
              }}
            >
              {format(start, "MMM d, yyyy")}
              {cycle.cycle_length && index > 0
                ? `  \u00B7  ${cycle.cycle_length} day cycle`
                : ""}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
