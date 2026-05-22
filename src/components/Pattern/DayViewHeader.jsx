import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { format } from "date-fns";
import { X, ChevronLeft, ChevronRight } from "lucide-react-native";
import { router } from "expo-router";
import { useAppTheme } from "@/utils/theme";
import { CompactCycleWheel } from "@/components/Today/CompactCycleWheel";

export function DayViewHeader({
  date,
  cycleDay,
  currentPhase,
  totalDays,
  scaledPhases,
  onPreviousDay,
  onNextDay,
  isToday,
  isHardLimitViolation = false,
  isBeforeFirstCycle = false,
  onAddPeriod,
  centerMessage = null,
  daysLate = 0,
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const formattedDate = format(date, "EEE, MMM d, yyyy");

  return (
    <View style={{ backgroundColor: colors.background, paddingTop: insets.top + 8 }}>
      {/* Header Row: [X] [<] Date [>] */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
          marginBottom: 16,
        }}
      >
        {/* X button on left */}
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color={colors.primary} />
        </TouchableOpacity>

        {/* Center group: [<] Date [>] */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <TouchableOpacity
            onPress={onPreviousDay}
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
              marginHorizontal: 16,
              textAlign: "center",
            }}
          >
            {formattedDate}
          </Text>

          <TouchableOpacity
            onPress={onNextDay}
            disabled={isToday}
            style={{
              padding: 8,
              backgroundColor: colors.surface,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: colors.borderLight,
              opacity: isToday ? 0.3 : 1,
            }}
          >
            <ChevronRight size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Spacer on right to balance X button */}
        <View style={{ width: 24 }} />
      </View>

      {/* Cycle Wheel Section */}
      <View
        style={{
          alignItems: "center",
          paddingVertical: 20,
          paddingHorizontal: 20,
        }}
      >
        <CompactCycleWheel
          cycleDay={cycleDay}
          totalDays={totalDays}
          scaledPhases={scaledPhases}
          size={145}
          isHardLimitViolation={isHardLimitViolation}
          isBeforeFirstCycle={isBeforeFirstCycle}
          onAddPeriod={onAddPeriod}
          centerMessage={centerMessage}
          daysLate={daysLate}
        />
        {currentPhase && !isBeforeFirstCycle && (
          <>
            <Text
              style={{
                fontSize: 18,
                fontFamily: "Montserrat_600SemiBold",
                color: colors.primary,
                marginTop: 16,
                marginBottom: 4,
              }}
            >
              {currentPhase.name} Phase
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Montserrat_500Medium",
                color: colors.secondary,
                textAlign: "center",
              }}
            >
              {currentPhase.description}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}
