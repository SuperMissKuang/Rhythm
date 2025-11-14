import React, { useMemo } from "react";
import { View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { ChevronLeft } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { parseISO, format, addDays, subDays, isSameDay } from "date-fns";
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

  const isToday = isSameDay(selectedDate, new Date());

  const handlePreviousDay = () => {
    const previousDay = subDays(selectedDate, 1);
    router.setParams({ date: format(previousDay, "yyyy-MM-dd") });
  };

  const handleNextDay = () => {
    if (isToday) return; // Prevent navigation to future dates
    const nextDay = addDays(selectedDate, 1);
    router.setParams({ date: format(nextDay, "yyyy-MM-dd") });
  };

  // Swipe gesture handler
  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20]) // Require 20px horizontal movement before activation
    .failOffsetY([-10, 10]) // Prevent activation during vertical scrolls
    .runOnJS(true) // Run navigation on JS thread safely
    .onEnd((event) => {
      const swipeThreshold = 50;

      // Swipe right = previous day
      if (event.translationX > swipeThreshold) {
        handlePreviousDay();
      }
      // Swipe left = next day (only if not today)
      else if (event.translationX < -swipeThreshold && !isToday) {
        handleNextDay();
      }
    });

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

      {/* Day view content with swipe gesture */}
      <GestureDetector gesture={panGesture}>
        <View style={{ flex: 1 }}>
          <DayViewHeader
            date={selectedDate}
            cycleDay={cycleDay}
            currentPhase={currentPhase}
            totalDays={totalDays}
            scaledPhases={scaledPhases}
            onPreviousDay={handlePreviousDay}
            onNextDay={handleNextDay}
          />

          <DayViewTimeline timeSlotData={timeSlotData} date={selectedDate} />
        </View>
      </GestureDetector>
    </View>
  );
}
