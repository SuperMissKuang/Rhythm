import React, { useState, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react-native";
import {
  format,
  parseISO,
  addDays,
  addMonths,
  subMonths,
  differenceInDays,
  isSameMonth,
} from "date-fns";
import { router } from "expo-router";
import { useAppTheme } from "@/utils/theme";
import { useCycleStore } from "@/utils/stores/useCycleStore";
import { useMenstrualCycles } from "@/utils/useMenstrualCycles";
import { DATA_INTEGRITY } from "@/utils/cycleStatistics";
import { getAverageCycleLength } from "@/utils/cycleUtils";
import { UnifiedMonthCalendar } from "@/components/shared/UnifiedMonthCalendar";
import { PeriodHistoryList } from "@/components/shared/PeriodHistoryList";

export default function PeriodLogScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  const cycles = useCycleStore((state) => state.cycles);
  const { createCycle, isCreatingCycle } = useMenstrualCycles();

  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [highlightedCycleId, setHighlightedCycleId] = useState(null);

  const today = new Date();
  const isCurrentMonth = isSameMonth(currentMonth, today);

  // The latest cycle's start_date — new periods must be strictly after this.
  // Also passed to the calendar so on-or-before dates are visually disabled.
  const latestCycleStart = useMemo(() => {
    if (cycles.length === 0) return null;
    return cycles.reduce((latest, c) => {
      const d = parseISO(c.start_date);
      return d > latest ? d : latest;
    }, parseISO(cycles[0].start_date));
  }, [cycles]);

  // This screen only logs new periods forward in time. Past edits, deletes,
  // and merges are handled on the period-history screen.
  const validationMessage = useMemo(() => {
    if (!selectedDate) return null;
    const selected = parseISO(selectedDate);

    // Rule: new period must start after the most recent existing cycle.
    if (latestCycleStart && selected <= latestCycleStart) {
      return `New periods must start after your most recent cycle (${format(latestCycleStart, "MMM d, yyyy")}). Use Edit History to update past cycles.`;
    }

    // Rule: must be at least MIN_GAP_FROM_PREVIOUS days from any cycle.
    for (const cycle of cycles) {
      const cycleStart = parseISO(cycle.start_date);
      const gap = Math.abs(differenceInDays(selected, cycleStart));
      if (gap > 0 && gap < DATA_INTEGRITY.MIN_GAP_FROM_PREVIOUS) {
        return `Too close to an existing period (${gap} days apart). This is likely the same bleeding episode.`;
      }
    }
    return null;
  }, [selectedDate, cycles, latestCycleStart]);

  // Build predicted future period dates for the next 6 cycles
  const predictedPeriodDays = useMemo(() => {
    if (!cycles || cycles.length === 0) return null;
    const avgLength = getAverageCycleLength(cycles);
    const sorted = [...cycles].sort(
      (a, b) => a.start_date.localeCompare(b.start_date),
    );
    const lastCycle = sorted[sorted.length - 1];
    if (!lastCycle) return null;

    const lastStart = parseISO(lastCycle.start_date);
    const map = new Map();
    for (let cycle = 1; cycle <= 6; cycle++) {
      const predictedStart = addDays(lastStart, avgLength * cycle);
      for (let i = 0; i < 5; i++) {
        const d = addDays(predictedStart, i);
        const ds = format(d, "yyyy-MM-dd");
        map.set(ds, { dayNum: i + 1, isStart: i === 0 });
      }
    }
    return map;
  }, [cycles]);

  const handlePreviousMonth = () => {
    setCurrentMonth((m) => subMonths(m, 1));
    setHighlightedCycleId(null);
  };

  const handleNextMonth = () => {
    if (!isCurrentMonth) {
      setCurrentMonth((m) => addMonths(m, 1));
      setHighlightedCycleId(null);
    }
  };

  const handleSelectDate = useCallback((dateString) => {
    setSelectedDate(dateString);
    setHighlightedCycleId(null);
  }, []);

  const handleTapCycle = useCallback((cycle) => {
    const cycleMonth = parseISO(cycle.start_date);
    setCurrentMonth(cycleMonth);
    setHighlightedCycleId(cycle.id);
    setSelectedDate(null);
  }, []);

  const handleSave = () => {
    if (!selectedDate) return;
    createCycle(
      {
        userId: "default-user",
        start_date: selectedDate,
        cycle_length: 28,
      },
      { onSuccess: () => router.back() },
    );
  };

  const canSave = !!selectedDate && !validationMessage;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header: [X]  [<] Month [>]  [Save] */}
      <View style={{ paddingTop: insets.top }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderLight,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 4 }}
          >
            <X size={24} color={colors.primary} />
          </TouchableOpacity>

          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TouchableOpacity onPress={handlePreviousMonth} style={{ padding: 8 }}>
              <ChevronLeft size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 17,
                fontFamily: "Montserrat_600SemiBold",
                color: colors.primary,
                marginHorizontal: 4,
                textAlign: "center",
              }}
            >
              {format(currentMonth, "MMM yyyy")}
            </Text>
            <TouchableOpacity
              onPress={handleNextMonth}
              disabled={isCurrentMonth}
              style={{ padding: 8, opacity: isCurrentMonth ? 0.3 : 1 }}
            >
              <ChevronRight size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={!canSave || isCreatingCycle}
            style={{
              backgroundColor: canSave ? "#F8BBD9" : colors.placeholder,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Montserrat_600SemiBold",
                color: canSave ? "#000000" : "#FFFFFF",
              }}
            >
              {isCreatingCycle ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar */}
        <UnifiedMonthCalendar
          month={currentMonth}
          cycles={cycles}
          mode="period"
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          highlightedCycleId={highlightedCycleId}
          predictedPeriodDays={predictedPeriodDays}
          minSelectableDate={latestCycleStart}
        />

        {/* Selected date box */}
        {selectedDate && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginTop: 20,
              borderWidth: 1,
              borderColor: colors.borderLight,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Montserrat_500Medium",
                color: colors.secondary,
                marginBottom: 4,
              }}
            >
              Period start date:
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontFamily: "Montserrat_600SemiBold",
                color: colors.primary,
              }}
            >
              {format(parseISO(selectedDate), "EEEE, MMMM d, yyyy")}
            </Text>
          </View>
        )}

        {/* Too-close warning */}
        {validationMessage && (
          <View
            style={{
              backgroundColor: "#FFF3E0",
              borderRadius: 10,
              padding: 12,
              marginTop: 12,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontFamily: "Montserrat_500Medium",
                color: "#E65100",
                flex: 1,
              }}
            >
              {validationMessage}
            </Text>
          </View>
        )}

        {/* Period History — read-only, tap to jump calendar */}
        <View style={{ marginTop: 24 }}>
          <PeriodHistoryList
            cycles={cycles}
            maxItems={6}
            onTapCycle={handleTapCycle}
            highlightedCycleId={highlightedCycleId}
            showTitle={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}
