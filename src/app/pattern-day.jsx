import React, { useMemo, useEffect } from "react";
import { View } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { router, useLocalSearchParams } from "expo-router";
import { parseISO, format, addDays, subDays, isSameDay, isAfter, startOfDay } from "date-fns";
import { useAppTheme } from "@/utils/theme";
import { getCurrentCycleInfo } from "@/utils/cycleUtils";
import { useDayData } from "@/utils/useDayData";
import { useCycleStore } from "@/utils/stores/useCycleStore";
import { DayViewHeader } from "@/components/Pattern/DayViewHeader";
import { DayViewTimeline } from "@/components/Pattern/DayViewTimeline";

export default function PatternDayScreen() {
  const { colors } = useAppTheme();
  const params = useLocalSearchParams();

  const cycles = useCycleStore((state) => state.cycles);

  const selectedDate = params.date ? parseISO(params.date) : new Date();
  const today = startOfDay(new Date());

  useEffect(() => {
    if (isAfter(startOfDay(selectedDate), today)) {
      router.back();
    }
  }, [selectedDate]);

  const { timeSlotData } = useDayData(selectedDate);

  const { cycleDay, currentPhase, totalDays, scaledPhases, isExtended, daysLate, isHardLimitViolation, isBeforeFirstCycle, isOutlier, outlierAcknowledged, cycleId } = useMemo(
    () => getCurrentCycleInfo(cycles, selectedDate),
    [cycles, selectedDate],
  );

  const isToday = isSameDay(selectedDate, new Date());

  const handleAddPeriod = () => {
    router.push("/period-log");
  };

  const handlePreviousDay = () => {
    const previousDay = subDays(selectedDate, 1);
    router.setParams({ date: format(previousDay, "yyyy-MM-dd") });
  };

  const handleNextDay = () => {
    if (isToday) return;
    const nextDay = addDays(selectedDate, 1);
    router.setParams({ date: format(nextDay, "yyyy-MM-dd") });
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-10, 10])
    .runOnJS(true)
    .onEnd((event) => {
      const swipeThreshold = 50;

      if (event.translationX > swipeThreshold) {
        handlePreviousDay();
      } else if (event.translationX < -swipeThreshold && !isToday) {
        handleNextDay();
      }
    });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
            isOutlier={isOutlier}
            outlierAcknowledged={outlierAcknowledged}
            cycleId={cycleId}
          />

          <DayViewTimeline timeSlotData={timeSlotData} date={selectedDate} />
        </View>
      </GestureDetector>
    </View>
  );
}
