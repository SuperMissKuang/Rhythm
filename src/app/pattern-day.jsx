import React, { useMemo } from "react";
import { View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { parseISO } from "date-fns";
import { useAppTheme } from "@/utils/theme";
import { getCurrentCycleInfo } from "@/utils/cycleUtils";
import { useDayData } from "@/utils/useDayData";
import { useCycleStore } from "@/utils/stores/useCycleStore";
import { DayViewHeader } from "@/components/Pattern/DayViewHeader";
import { DayViewTimeline } from "@/components/Pattern/DayViewTimeline";

export default function PatternDayScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const params = useLocalSearchParams();

  // Get cycles from store
  const cycles = useCycleStore((state) => state.cycles);

  // Parse the date from params (format: "yyyy-MM-dd")
  const selectedDate = params.date ? parseISO(params.date) : new Date();

  const { timeSlotData } = useDayData(selectedDate);

  const { cycleDay, currentPhase, totalDays, scaledPhases } = useMemo(
    () => getCurrentCycleInfo(cycles, selectedDate),
    [cycles, selectedDate],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header with back button */}
      <View
        style={{
          paddingTop: insets.top,
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ alignSelf: "flex-start" }}>
          <ChevronLeft size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Day view content */}
      <DayViewHeader
        date={selectedDate}
        cycleDay={cycleDay}
        currentPhase={currentPhase}
        totalDays={totalDays}
        scaledPhases={scaledPhases}
      />

      <DayViewTimeline timeSlotData={timeSlotData} date={selectedDate} />
    </View>
  );
}
