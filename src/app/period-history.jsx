import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, FlatList, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import {
  format,
  parseISO,
  differenceInDays,
  startOfMonth,
  startOfDay,
  subMonths,
  isAfter,
} from "date-fns";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { useAppTheme } from "@/utils/theme";
import { useCycleStore } from "@/utils/stores/useCycleStore";
import { useMenstrualCycles } from "@/utils/useMenstrualCycles";
import { DATA_INTEGRITY } from "@/utils/cycleStatistics";
import { UnifiedMonthCalendar } from "@/components/shared/UnifiedMonthCalendar";

export default function PeriodHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const cycles = useCycleStore((state) => state.cycles);
  const {
    createCycle,
    updateCycle,
    deleteCycle,
    isCreatingCycle,
    isUpdatingCycle,
    isDeletingCycle,
  } = useMenstrualCycles();

  const [selectedDate, setSelectedDate] = useState(null);
  const isBusy = isCreatingCycle || isUpdatingCycle || isDeletingCycle;

  const today = useMemo(() => startOfDay(new Date()), []);
  const todayStr = useMemo(() => format(today, "yyyy-MM-dd"), [today]);

  // Month list ordered newest first (data[0] = current month). Used with
  // FlatList's `inverted` so the newest month renders at the visual bottom
  // and is the initial scroll position. Bound: months covering the 6 most
  // recent cycles only.
  const months = useMemo(() => {
    const sorted = [...cycles].sort(
      (a, b) => parseISO(b.start_date) - parseISO(a.start_date),
    );

    let oldestMonth;
    if (sorted.length >= 6) {
      oldestMonth = startOfMonth(parseISO(sorted[5].start_date));
    } else if (sorted.length > 0) {
      oldestMonth = startOfMonth(
        parseISO(sorted[sorted.length - 1].start_date),
      );
    } else {
      oldestMonth = subMonths(startOfMonth(today), 5);
    }
    const newestMonth = startOfMonth(today);

    const list = [];
    let cursor = newestMonth;
    while (!isAfter(oldestMonth, cursor)) {
      list.push(cursor);
      cursor = subMonths(cursor, 1);
    }
    return list;
  }, [cycles, today]);

  // Resolve action from the currently-selected date.
  const resolved = useMemo(() => {
    if (!selectedDate) return { action: null, target: null };

    const exact = cycles.find((c) => c.start_date === selectedDate);
    if (exact) return { action: "remove", target: exact };

    const selected = parseISO(selectedDate);
    let target = null;
    let bestGap = Infinity;
    for (const c of cycles) {
      const gap = Math.abs(differenceInDays(selected, parseISO(c.start_date)));
      if (gap > 0 && gap < DATA_INTEGRITY.MIN_GAP_FROM_PREVIOUS) {
        if (
          gap < bestGap ||
          (gap === bestGap &&
            parseISO(c.start_date) > parseISO(target.start_date))
        ) {
          target = c;
          bestGap = gap;
        }
      }
    }
    if (target) return { action: "update", target };

    return { action: "create", target: null };
  }, [selectedDate, cycles]);

  const handleDateTap = (dateString) => {
    if (dateString > todayStr) return;
    setSelectedDate(dateString);
  };

  const showSuccess = (text1) => {
    Toast.show({
      type: "success",
      text1,
      position: "bottom",
      visibilityTime: 2000,
    });
  };

  const dispatchAction = () => {
    if (!resolved.action || isBusy) return;

    if (resolved.action === "remove") {
      const startLabel = format(
        parseISO(resolved.target.start_date),
        "MMM d",
      );
      Alert.alert(
        "Remove Cycle",
        `Remove this cycle starting ${startLabel}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: () =>
              deleteCycle(resolved.target.id, {
                onSuccess: () => {
                  showSuccess("Cycle removed");
                  setSelectedDate(null);
                },
              }),
          },
        ],
      );
      return;
    }

    if (resolved.action === "update") {
      const oldLabel = format(parseISO(resolved.target.start_date), "MMM d");
      const newLabel = format(parseISO(selectedDate), "MMM d");
      Alert.alert(
        "Update Period",
        `Update period from ${oldLabel} to ${newLabel}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Update",
            onPress: () =>
              updateCycle(
                { id: resolved.target.id, start_date: selectedDate },
                {
                  onSuccess: () => {
                    showSuccess("Period updated");
                    setSelectedDate(null);
                  },
                },
              ),
          },
        ],
      );
      return;
    }

    if (resolved.action === "create") {
      const newLabel = format(parseISO(selectedDate), "MMM d");
      Alert.alert(
        "Create New Period",
        `Create a new period starting ${newLabel}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Create",
            onPress: () =>
              createCycle(
                {
                  userId: "default-user",
                  start_date: selectedDate,
                  cycle_length: 28,
                },
                {
                  onSuccess: () => {
                    showSuccess("New period logged");
                    setSelectedDate(null);
                  },
                },
              ),
          },
        ],
      );
    }
  };

  const buttonLabel =
    resolved.action === "remove"
      ? "Remove Cycle"
      : resolved.action === "create"
        ? "Create"
        : "Update";

  const buttonDisabled = !resolved.action || isBusy;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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

          <Text
            style={{
              fontSize: 17,
              fontFamily: "Montserrat_600SemiBold",
              color: colors.primary,
              flex: 1,
              textAlign: "center",
            }}
          >
            Edit Period History
          </Text>

          <TouchableOpacity
            onPress={dispatchAction}
            disabled={buttonDisabled}
            style={{
              backgroundColor: buttonDisabled ? colors.placeholder : "#F8BBD9",
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 8,
              minWidth: 88,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontFamily: "Montserrat_600SemiBold",
                color: buttonDisabled ? "#FFFFFF" : "#000000",
              }}
            >
              {buttonLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={months}
        inverted
        keyExtractor={(item) => format(item, "yyyy-MM")}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 32,
          paddingBottom: 16,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 16,
                fontFamily: "Montserrat_600SemiBold",
                color: colors.primary,
                marginBottom: 8,
                marginLeft: 4,
              }}
            >
              {format(item, "MMMM yyyy")}
            </Text>
            <UnifiedMonthCalendar
              month={item}
              cycles={cycles}
              mode="period"
              selectedDate={selectedDate}
              onSelectDate={handleDateTap}
            />
          </View>
        )}
      />
    </View>
  );
}
