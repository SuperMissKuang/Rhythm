import React, { useState, useMemo } from "react";
import { View, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from "@expo-google-fonts/montserrat";
import { differenceInDays } from "date-fns";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/utils/theme";
import { getCurrentCycleInfo } from "@/utils/cycleUtils";
import { useMenstrualCycles } from "@/utils/useMenstrualCycles";
import { useTodayData } from "@/utils/useTodayData";

import { TodayHeader } from "@/components/Today/TodayHeader";
import { ActionButtons } from "@/components/Today/ActionButtons";
import { Timeline } from "@/components/Today/Timeline";
import { PeriodCalendarModal } from "@/components/Today/PeriodCalendarModal";
import { EditPeriodModal } from "@/components/Today/EditPeriodModal";

export default function TodayScreen() {
  const { isDark, colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);

  const {
    cycles,
    createCycle,
    isCreatingCycle,
    updateCycle,
    isUpdatingCycle,
    deleteCycle,
    isDeletingCycle,
  } = useMenstrualCycles();

  const { timeSlotData } = useTodayData();

  const { cycleDay, currentPhase, totalDays, scaledPhases, hasData } = useMemo(
    () => getCurrentCycleInfo(cycles),
    [cycles],
  );

  const handleDeletePeriod = (id) => {
    deleteCycle(id, {
      onSuccess: () => {
        // Additional success handling if needed
      },
    });
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <TodayHeader
        onAddPeriod={() => {
          setEditingPeriod(null);
          setShowCalendarModal(true);
        }}
        cycleDay={cycleDay}
        currentPhase={currentPhase}
        totalDays={totalDays}
        scaledPhases={scaledPhases}
        hasData={hasData}
      />

      <ActionButtons />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Timeline timeSlotData={timeSlotData} />
      </ScrollView>

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
      />
    </View>
  );
}
