import React, { useMemo } from "react";
import { View, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from "@expo-google-fonts/montserrat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import { useAppTheme } from "@/utils/theme";
import { getCurrentCycleInfo, getPeriodWarningStatus } from "@/utils/cycleUtils";
import { useMenstrualCycles } from "@/utils/useMenstrualCycles";
import { useTodayData } from "@/utils/useTodayData";

import { TodayHeader } from "@/components/Today/TodayHeader";
import { ActionButtons } from "@/components/Today/ActionButtons";
import { Timeline } from "@/components/Today/Timeline";

export default function TodayScreen() {
  const { isDark, colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  const { cycles } = useMenstrualCycles();
  const { timeSlotData } = useTodayData();

  const { cycleDay, currentPhase, totalDays, scaledPhases, hasData, isHardLimitViolation } = useMemo(
    () => getCurrentCycleInfo(cycles),
    [cycles],
  );

  const warningStatus = useMemo(
    () => getPeriodWarningStatus(cycles),
    [cycles],
  );

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <TodayHeader
        onAddPeriod={() => router.push("/period-log")}
        cycleDay={cycleDay}
        currentPhase={currentPhase}
        totalDays={totalDays}
        scaledPhases={scaledPhases}
        hasData={hasData}
        isHardLimitViolation={isHardLimitViolation}
        centerMessage={
          warningStatus.daysUntil <= 0 ? "Period may start today" :
          warningStatus.shouldWarn ? `Period in ${warningStatus.daysUntil} day${warningStatus.daysUntil === 1 ? '' : 's'}` :
          null
        }
        daysLate={warningStatus.daysUntil < 0 ? Math.abs(warningStatus.daysUntil) : 0}
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
    </View>
  );
}
