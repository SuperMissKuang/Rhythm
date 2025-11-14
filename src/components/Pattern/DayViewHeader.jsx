import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { format, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
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
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const formattedDate = format(date, "EEE, MMM d, yyyy");
  const isToday = isSameDay(date, new Date());

  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: colors.background,
        paddingHorizontal: 20,
        paddingBottom: 16,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
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
            fontSize: 20,
            fontFamily: "Montserrat_600SemiBold",
            color: colors.primary,
            marginHorizontal: 20,
            minWidth: 200,
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

      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <CompactCycleWheel
          cycleDay={cycleDay}
          totalDays={totalDays}
          scaledPhases={scaledPhases}
        />
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
      </View>
    </View>
  );
}
