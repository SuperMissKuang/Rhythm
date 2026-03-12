import React, { useState, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react-native";
import {
  format,
  parseISO,
  addMonths,
  subMonths,
  isSameMonth,
} from "date-fns";
import { router, useLocalSearchParams } from "expo-router";
import { useAppTheme } from "@/utils/theme";
import { useCycleStore } from "@/utils/stores/useCycleStore";
import { useMenstrualCycles } from "@/utils/useMenstrualCycles";
import { UnifiedMonthCalendar } from "@/components/shared/UnifiedMonthCalendar";
import { PeriodHistoryList } from "@/components/shared/PeriodHistoryList";

export default function PeriodLogScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { editId, startDate } = useLocalSearchParams();

  const cycles = useCycleStore((state) => state.cycles);
  const {
    createCycle,
    isCreatingCycle,
    updateCycle,
    isUpdatingCycle,
    deleteCycle,
    isDeletingCycle,
  } = useMenstrualCycles();

  const isEditMode = !!editId;
  const isSaving = isCreatingCycle || isUpdatingCycle;

  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  // Track which cycle is highlighted when tapping from history list
  const [highlightedCycleId, setHighlightedCycleId] = useState(null);

  // In edit mode, pre-select the cycle's start date and navigate to its month
  useEffect(() => {
    if (isEditMode && startDate) {
      setSelectedDate(startDate);
      setCurrentMonth(parseISO(startDate));
    }
  }, [editId, startDate]);

  const today = new Date();
  const isCurrentMonth = isSameMonth(currentMonth, today);

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

    if (isEditMode) {
      updateCycle(
        { id: editId, start_date: selectedDate },
        { onSuccess: () => router.back() },
      );
    } else {
      createCycle(
        {
          userId: "default-user",
          start_date: selectedDate,
          cycle_length: 28,
        },
        { onSuccess: () => router.back() },
      );
    }
  };

  const handleDelete = () => {
    if (!editId) return;
    deleteCycle(editId, {
      onSuccess: () => router.back(),
    });
  };

  const hasChanges = isEditMode ? selectedDate !== startDate : !!selectedDate;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top }}>
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
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <ArrowLeft size={22} color={colors.primary} />
            <Text
              style={{
                fontSize: 15,
                fontFamily: "Montserrat_500Medium",
                color: colors.primary,
              }}
            >
              Back
            </Text>
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 18,
              fontFamily: "Montserrat_600SemiBold",
              color: colors.primary,
            }}
          >
            {isEditMode ? "Edit Period" : "Log Period"}
          </Text>

          <TouchableOpacity
            onPress={handleSave}
            disabled={!hasChanges || isSaving}
            style={{
              backgroundColor: hasChanges ? "#F8BBD9" : colors.placeholder,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Montserrat_600SemiBold",
                color: hasChanges ? "#000000" : "#FFFFFF",
              }}
            >
              {isSaving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Instruction */}
        <Text
          style={{
            fontSize: 15,
            fontFamily: "Montserrat_500Medium",
            color: colors.secondary,
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          {isEditMode
            ? "Tap a new date to change when this period started"
            : "Tap the date when your period started"}
        </Text>

        {/* Month navigation */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
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
              marginHorizontal: 20,
              minWidth: 160,
              textAlign: "center",
            }}
          >
            {format(currentMonth, "MMMM yyyy")}
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

        {/* Calendar */}
        <UnifiedMonthCalendar
          month={currentMonth}
          cycles={cycles}
          mode="period"
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          highlightedCycleId={highlightedCycleId}
        />

        {/* Selected date confirmation */}
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
              {isEditMode ? "New start date:" : "Period start date:"}
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

        {/* Period History — read-only, tap to jump calendar */}
        {!isEditMode && (
          <View style={{ marginTop: 24 }}>
            <PeriodHistoryList
              cycles={cycles}
              maxItems={6}
              onTapCycle={handleTapCycle}
              highlightedCycleId={highlightedCycleId}
            />
          </View>
        )}

        {/* Delete button — edit mode only */}
        {isEditMode && (
          <TouchableOpacity
            onPress={handleDelete}
            disabled={isDeletingCycle}
            style={{
              backgroundColor: "#FFEBEE",
              borderRadius: 12,
              padding: 16,
              marginTop: 32,
              alignItems: "center",
              opacity: isDeletingCycle ? 0.5 : 1,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontFamily: "Montserrat_600SemiBold",
                color: "#D32F2F",
              }}
            >
              {isDeletingCycle ? "Deleting..." : "Delete This Period"}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
