import React, { useEffect } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, withRepeat, withSequence, Easing } from "react-native-reanimated";
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
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const currentDayAngle = ((cycleDay - 1) / totalDays) * 360 - 90;
  const angleRad = (currentDayAngle * Math.PI) / 180;
  const indicatorX = size / 2 + radius * Math.cos(angleRad);
  const indicatorY = size / 2 + radius * Math.sin(angleRad);

  // Subtle pulse animation when there's no period data
  useEffect(() => {
    if (!hasData) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // Infinite repeat
        false
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = 1;
      pulseOpacity.value = 0.6;
    }
  }, [hasData]);

  const handlePress = () => {
    if (onAddPeriod) {
      onAddPeriod();
    }
  };

  const animatedPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
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
      {/* Render gray phases first (Follicular, Luteal) */}
      {scaledPhases.map((phase, index) => {
        const isGrayPhase = phase.name === "Follicular" || phase.name === "Luteal";
        if (!isGrayPhase) return null;
        let startDay = 1;
        for (let i = 0; i < index; i++) {
          startDay += scaledPhases[i].duration;
        }
        const startAngle = ((startDay - 1) / totalDays) * 360;
        const phaseDuration = phase.duration;
        const phaseCircumference =
          (phaseDuration / totalDays) * circumference;
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
      })}
      {/* Render colored phases on top (Menstrual, Ovulation) */}
      {scaledPhases.map((phase, index) => {
        const isColoredPhase = phase.name === "Menstrual" || phase.name === "Ovulation";
        if (!isColoredPhase) return null;
        let startDay = 1;
        for (let i = 0; i < index; i++) {
          startDay += scaledPhases[i].duration;
        }
        const startAngle = ((startDay - 1) / totalDays) * 360;
        const phaseDuration = phase.duration;
        const phaseCircumference =
          (phaseDuration / totalDays) * circumference;
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
      })}
      {hasData && (
        <Circle cx={indicatorX} cy={indicatorY} r={6} fill="#FFFFFF" />
      )}
      {hasData && showCenterText && (() => {
        const daysUntilPeriod = totalDays - cycleDay + 1;
        const showCountdown = currentPhase !== "Menstrual" && daysUntilPeriod <= 7;

        if (showCountdown) {
          return (
            <>
              <SvgText
                x={size / 2}
                y={size / 2 - 10}
                fontSize="16"
                fontWeight="600"
                fill="#000000"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                Period in
              </SvgText>
              <SvgText
                x={size / 2}
                y={size / 2 + 12}
                fontSize="16"
                fontWeight="600"
                fill="#000000"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {`${daysUntilPeriod} ${daysUntilPeriod === 1 ? "day" : "days"}`}
              </SvgText>
            </>
          );
        }

        return (
          <SvgText
            x={size / 2}
            y={size / 2}
            fontSize="20"
            fontWeight="600"
            fill={colors.primary}
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {`Day ${cycleDay}`}
          </SvgText>
        );
      })()}
      {!hasData && (
        <SvgText
          x={size / 2}
          y={size / 2}
          fontSize="13"
          fontWeight="500"
          fill={colors.secondary}
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          Tap to log period
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
          {!hasData ? (
            <Animated.View style={[styles.wheelContainer, animatedPressStyle, animatedPulseStyle]}>
              {wheelContent}
            </Animated.View>
          ) : (
            <Animated.View style={[styles.wheelContainer, animatedPressStyle]}>
              {wheelContent}
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
});
