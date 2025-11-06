import React from "react";
import { View } from "react-native";
import Svg, { Circle, Text as SvgText, Line, Path } from "react-native-svg";
import { CYCLE_PHASES } from "@/utils/constants";
import { useAppTheme } from "@/utils/theme";

export function CompactCycleWheel({
  cycleDay,
  totalDays = 28,
  scaledPhases = CYCLE_PHASES,
  size = 160,
  hasData = true,
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
  const innerRadius = radius * 0.35; // Start the arm further from center
  const innerX = size / 2 + innerRadius * Math.cos(angleRad);
  const innerY = size / 2 + innerRadius * Math.sin(angleRad);

  return (
    <View style={{ alignItems: "center" }}>
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
        {hasData ? (
          <SvgText
            x={size / 2}
            y={size / 2}
            fontSize="20"
            fontWeight="600"
            fill={colors.primary}
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            Day {cycleDay}
          </SvgText>
        ) : (
          <Path
            d={`M ${size / 2} ${size / 2 - 12} 
                C ${size / 2 - 6} ${size / 2 - 18} ${size / 2 - 18} ${size / 2 - 18} ${size / 2 - 18} ${size / 2 - 6}
                C ${size / 2 - 18} ${size / 2 + 6} ${size / 2} ${size / 2 + 18} ${size / 2} ${size / 2 + 18}
                C ${size / 2} ${size / 2 + 18} ${size / 2 + 18} ${size / 2 + 6} ${size / 2 + 18} ${size / 2 - 6}
                C ${size / 2 + 18} ${size / 2 - 18} ${size / 2 + 6} ${size / 2 - 18} ${size / 2} ${size / 2 - 12} Z`}
            fill="#F8BBD9"
            opacity={0.6}
          />
        )}
      </Svg>
    </View>
  );
}
