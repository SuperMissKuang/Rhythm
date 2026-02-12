import React, { useMemo, useState, useEffect } from "react";
import { View } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { router, useLocalSearchParams } from "expo-router";
import { parseISO, format, addDays, subDays, isSameDay, isAfter, startOfDay } from "date-fns";
import { useAppTheme } from "@/utils/theme";
import { getCurrentCycleInfo } from "@/utils/cycleUtils";
import { useDayData } from "@/utils/useDayData";
import { useCycleStore } from "@/utils/stores/useCycleStore";
import { useMenstrualCycles } from "@/utils/useMenstrualCycles";
import { DayViewHeader } from "@/components/Pattern/DayViewHeader";
import { DayViewTimeline } from "@/components/Pattern/DayViewTimeline";
import { PeriodCalendarModal } from "@/components/Today/PeriodCalendarModal";

export default function PatternDayScreen() {
  const { colors } = useAppTheme();
  const params = useLocalSearchParams();

  // Get cycles from store
  const cycles = useCycleStore((state) => state.cycles);

  // Modal state
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);

  // Cycle mutation hooks
  const {
    createCycle,
    isCreatingCycle,
    updateCycle,
    isUpdatingCycle,
    deleteCycle,
    isDeletingCycle,
  } = useMenstrualCycles();

  // Parse the date from params (format: "yyyy-MM-dd")
  const selectedDate = params.date ? parseISO(params.date) : new Date();
  const today = startOfDay(new Date());

  // Redirect if trying to view a future date
  useEffect(() => {
    if (isAfter(startOfDay(selectedDate), today)) {
      router.back();
    }
  }, [selectedDate]);

  const { timeSlotData } = useDayData(selectedDate);

  const { cycleDay, currentPhase, totalDays, scaledPhases, isExtended, daysLate, isHardLimitViolation, isBeforeFirstCycle } = useMemo(
    () => getCurrentCycleInfo(cycles, selectedDate),
    [cycles, selectedDate],
  );

  const isToday = isSameDay(selectedDate, new Date());

  const handleAddPeriod = () => {
    setEditingPeriod(null);
    setShowCalendarModal(true);
  };

  const handleDeletePeriod = (id) => {
    deleteCycle(id);
  };

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
            isToday={isToday}
            isHardLimitViolation={isHardLimitViolation}
            centerMessage={isToday && isExtended ? "Period may start today" : null}
            daysLate={daysLate}
            isBeforeFirstCycle={isBeforeFirstCycle}
            onAddPeriod={handleAddPeriod}
          />

          <DayViewTimeline timeSlotData={timeSlotData} date={selectedDate} />
        </View>
      </GestureDetector>

      <PeriodCalendarModal
        visible={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        cycles={cycles}
        createCycle={createCycle}
        isCreatingCycle={isCreatingCycle}
        updateCycle={updateCycle}
        isUpdatingCycle={isUpdatingCycle}
        editingPeriod={editingPeriod}
        setEditingPeriod={setEditingPeriod}
        onDeletePeriod={handleDeletePeriod}
        isDeletingCycle={isDeletingCycle}
        initialMonth={selectedDate}
      />
    </View>
  );
}
