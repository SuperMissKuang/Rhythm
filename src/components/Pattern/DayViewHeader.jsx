import React from "react";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { format } from "date-fns";
import { useAppTheme } from "@/utils/theme";
import { CompactCycleWheel } from "@/components/Today/CompactCycleWheel";

export function DayViewHeader({
  date,
  cycleDay,
  currentPhase,
  totalDays,
  scaledPhases,
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const formattedDate = format(date, "EEE, MMM d");

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
        <Text
          style={{
            fontSize: 20,
            fontFamily: "Montserrat_600SemiBold",
            color: colors.primary,
          }}
        >
          {formattedDate}
        </Text>
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
