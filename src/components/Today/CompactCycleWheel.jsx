import React, { useState, useEffect } from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import Svg, { Circle, Text as SvgText, Line } from "react-native-svg";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
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
  showCenterText = true,
}) {
  const { colors } = useAppTheme();
  const [showTooltip, setShowTooltip] = useState(false);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const tooltipOpacity = useSharedValue(0);

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

  // Show tooltip when there's no period data
  useEffect(() => {
    if (!hasData && onAddPeriod) {
      setShowTooltip(true);
      tooltipOpacity.value = withTiming(1, { duration: 300 });

      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        dismissTooltip();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setShowTooltip(false);
      tooltipOpacity.value = 0;
    }
  }, [hasData, onAddPeriod]);

  const dismissTooltip = () => {
    tooltipOpacity.value = withTiming(0, { duration: 300 });
    setTimeout(() => {
      setShowTooltip(false);
    }, 300);
  };

  const handlePress = () => {
    if (showTooltip) {
      dismissTooltip();
    }
    if (onAddPeriod) {
      onAddPeriod();
    }
  };

  const animatedPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedTooltipStyle = useAnimatedStyle(() => ({
    opacity: tooltipOpacity.value,
  }));

  const wheelContent = (
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
      {hasData && showCenterText && (
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
      )}
    </Svg>
  );

  return (
    <View style={{ alignItems: "center", position: "relative" }}>
      {onAddPeriod ? (
        <Pressable
          onPress={handlePress}
          onPressIn={() => {
            scale.value = withSpring(0.98);
            opacity.value = withTiming(0.8, { duration: 100 });
          }}
          onPressOut={() => {
            scale.value = withSpring(1);
            opacity.value = withTiming(1, { duration: 100 });
          }}
          style={{ position: "relative" }}
        >
          <Animated.View style={[styles.wheelContainer, animatedPressStyle]}>
            {wheelContent}
          </Animated.View>

          {showTooltip && (
            <Animated.View style={[styles.tooltip, animatedTooltipStyle]}>
              <Text style={styles.tooltipText}>
                Tap the wheel to log your period
              </Text>
            </Animated.View>
          )}
        </Pressable>
      ) : (
        <View style={styles.wheelContainer}>{wheelContent}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wheelContainer: {},
  tooltip: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -80 }, { translateY: -20 }],
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    maxWidth: 160,
  },
  tooltipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Montserrat_600SemiBold",
    textAlign: "center",
  },
});
