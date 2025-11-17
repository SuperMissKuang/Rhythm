import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import Svg, { Circle, Text as SvgText, Line, Path } from "react-native-svg";
import { CYCLE_PHASES } from "@/utils/constants";
import { useAppTheme } from "@/utils/theme";

export function CompactCycleWheel({
  cycleDay,
  totalDays = 28,
  scaledPhases = CYCLE_PHASES,
  size = 200,
  hasData = true,
  currentPhase,
  onAddPeriod,
}) {
  const { colors } = useAppTheme();
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const currentDayAngle = ((cycleDay - 1) / totalDays) * 360 - 90;
  const angleRad = (currentDayAngle * Math.PI) / 180;
  const indicatorX = size / 2 + radius * Math.cos(angleRad);
  const indicatorY = size / 2 + radius * Math.sin(angleRad);

  const pointerRadius = radius * 0.85;
  const pointerX = size / 2 + pointerRadius * Math.cos(angleRad);
  const pointerY = size / 2 + pointerRadius * Math.sin(angleRad);

  // Calculate inner starting point for the arm to avoid overlapping text
  const innerRadius = radius * 0.55; // Start the arm further from center
  const innerX = size / 2 + innerRadius * Math.cos(angleRad);
  const innerY = size / 2 + innerRadius * Math.sin(angleRad);

  // Determine if user is in menstrual period
  const isInPeriod = currentPhase?.name === "Menstrual";
  const buttonText = isInPeriod ? "Edit Period" : "Add Period";

  return (
    <View style={{ alignItems: "center", position: "relative" }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F5F5F5"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {scaledPhases.map((phase, index) => {
          let startDay = 1;
          for (let i = 0; i < index; i++) {
            startDay += scaledPhases[i].duration;
          }
          const startAngle = ((startDay - 1) / totalDays) * 360;
          const phaseDuration = phase.duration;
          const phaseCircumference =
            (phaseDuration / totalDays) * circumference;
          if (phase.color && phase.color !== "transparent") {
            return (
              <Circle
                key={phase.name}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={phase.color}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={`${phaseCircumference} ${circumference}`}
                strokeLinecap="round"
                transform={`rotate(${startAngle - 90} ${size / 2} ${size / 2})`}
              />
            );
          }
          return null;
        })}
        {hasData && (
          <>
            <Line
              x1={innerX}
              y1={innerY}
              x2={pointerX}
              y2={pointerY}
              stroke="#F5F5F5"
              strokeWidth={3}
              strokeLinecap="round"
            />
            <Circle cx={indicatorX} cy={indicatorY} r={8} fill="#FFFFFF" />
          </>
        )}
        {hasData && (
          <>
            <SvgText
              x={size / 2 - 14}
              y={size / 2 - 10}
              fontSize="20"
              fontWeight="600"
              fill={colors.primary}
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              Day
            </SvgText>
            <SvgText
              x={size / 2 + 16}
              y={size / 2 - 10}
              fontSize="20"
              fontWeight="600"
              fill={colors.primary}
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {cycleDay}
            </SvgText>
          </>
        )}
      </Svg>
      {onAddPeriod && (
        <TouchableOpacity
          onPress={onAddPeriod}
          style={{
            position: "absolute",
            top: hasData ? size / 2 + 6 : size / 2 - 12,
            backgroundColor: "transparent",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#F8BBD9",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontFamily: "Montserrat_600SemiBold",
              color: "#F8BBD9",
            }}
          >
            {hasData ? buttonText : "Add Period"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
