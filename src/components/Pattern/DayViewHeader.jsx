import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { format } from "date-fns";
import { X, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react-native";
import { router } from "expo-router";
import { useAppTheme } from "@/utils/theme";
import { CompactCycleWheel } from "@/components/Today/CompactCycleWheel";
import { useCycleStore } from "@/utils/stores/useCycleStore";

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
  isOutlier = false,
  outlierAcknowledged = null,
  cycleId = null,
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const formattedDate = format(date, "EEE, MMM d, yyyy");
  const acknowledgeCycleOutlier = useCycleStore((state) => state.acknowledgeCycleOutlier);

  // Determine if we should hide phase info (outlier marked as mistake)
  const hidePhaseInfo = isOutlier && outlierAcknowledged === "mistake";
  // Show the prompt if outlier and not yet acknowledged
  const showOutlierPrompt = isOutlier && outlierAcknowledged === null;
  // For mistake cycles, render the wheel with all-gray phases (no colored segments)
  const displayPhases = hidePhaseInfo && scaledPhases
    ? scaledPhases.map((phase) => ({ ...phase, color: "#E4E4E4" }))
    : scaledPhases;

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
          scaledPhases={displayPhases}
          size={145}
          isHardLimitViolation={isHardLimitViolation}
          isBeforeFirstCycle={isBeforeFirstCycle}
          onAddPeriod={onAddPeriod}
          centerMessage={centerMessage}
          daysLate={daysLate}
        />
        {currentPhase && !isBeforeFirstCycle && !hidePhaseInfo && (
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

      {/* Outlier cycle prompt */}
      {showOutlierPrompt && (
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 16,
            padding: 16,
            backgroundColor: colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.borderLight,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <AlertCircle size={18} color={colors.secondary} />
            <Text
              style={{
                fontSize: 15,
                fontFamily: "Montserrat_600SemiBold",
                color: colors.primary,
                marginLeft: 8,
              }}
            >
              Unusually long cycle ({totalDays} days)
            </Text>
          </View>
          <Text
            style={{
              fontSize: 13,
              fontFamily: "Montserrat_500Medium",
              color: colors.secondary,
              marginBottom: 12,
            }}
          >
            Did you miss logging a period, or was this cycle really this long?
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={() => acknowledgeCycleOutlier(cycleId, "mistake")}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.borderLight,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: "Montserrat_600SemiBold",
                  color: colors.secondary,
                }}
              >
                Missed a period
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => acknowledgeCycleOutlier(cycleId, "confirmed")}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 8,
                backgroundColor: colors.primary,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: "Montserrat_600SemiBold",
                  color: colors.background,
                }}
              >
                It was this long
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Outlier acknowledged as mistake - show info note */}
      {hidePhaseInfo && (
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 16,
            paddingVertical: 8,
            paddingHorizontal: 12,
            backgroundColor: colors.surface,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.borderLight,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <AlertCircle size={14} color={colors.secondary} />
          <Text
            style={{
              fontSize: 12,
              fontFamily: "Montserrat_500Medium",
              color: colors.secondary,
              marginLeft: 6,
            }}
          >
            Phase info hidden — this cycle may have a logging gap
          </Text>
        </View>
      )}
    </View>
  );
}
