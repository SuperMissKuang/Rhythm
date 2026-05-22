import React, { useMemo } from "react";
import { View, TouchableOpacity, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { useAppTheme } from "@/utils/theme";
import { getCurrentCycleInfo } from "@/utils/cycleUtils";
import { useDayData } from "@/utils/useDayData";
import { DayViewHeader } from "@/components/Pattern/DayViewHeader";
import { DayViewTimeline } from "@/components/Pattern/DayViewTimeline";

export function DayViewModal({ visible, onClose, selectedDate, cycles = [] }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const { timeSlotData } = useDayData(selectedDate || new Date());

  const { cycleDay, currentPhase, totalDays, scaledPhases, isExtended, daysLate, isHardLimitViolation } = useMemo(
    () => getCurrentCycleInfo(cycles, selectedDate),
    [cycles, selectedDate],
  );

  if (!selectedDate) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header with close button */}
        <View
          style={{
            paddingTop: insets.top,
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderLight,
          }}
        >
          <TouchableOpacity onPress={onClose} style={{ alignSelf: "flex-end" }}>
            <X size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Day view content - same as Today page but without ActionButtons */}
        <DayViewHeader
          date={selectedDate}
          cycleDay={cycleDay}
          currentPhase={currentPhase}
          totalDays={totalDays}
          scaledPhases={scaledPhases}
          isHardLimitViolation={isHardLimitViolation}
          centerMessage={isExtended ? "Period may start today" : null}
          daysLate={daysLate}
        />

        <DayViewTimeline timeSlotData={timeSlotData} date={selectedDate} />
      </View>
    </Modal>
  );
}
