import React, { useEffect } from "react";
import { View, Pressable, StyleSheet, Text } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useAnimatedProps,
  useDerivedValue,
  withSpring,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { CYCLE_PHASES } from "@/utils/constants";
import { useAppTheme } from "@/utils/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedText = Animated.createAnimatedComponent(Text);

export function CompactCycleWheel({
  cycleDay,
  totalDays = 28,
  scaledPhases = CYCLE_PHASES,
  size = 200,
  hasData = true,
  currentPhase,
  onAddPeriod,
  showCenterText = true,
  isExtended = false,
  statusMessage = null,
  isHardLimitViolation = false,
  warningMessage = null, // "Period in X days" message from getPeriodWarningStatus
  isBeforeFirstCycle = false, // Date is before first logged cycle
}) {
  const { colors } = useAppTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Teaser animation shared values (for !hasData state)
  const teaserProgress = useSharedValue(0);
  const teaserTextOpacity = useSharedValue(1);
  const tapTextOpacity = useSharedValue(0);
  const dotOpacity = useSharedValue(1);

  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Ensure cycleDay is valid for angle calculation
  const validCycleDay = cycleDay && cycleDay > 0 ? Math.min(cycleDay, totalDays) : 1;
  const currentDayAngle = ((validCycleDay - 1) / totalDays) * 360 - 90;
  const angleRad = (currentDayAngle * Math.PI) / 180;
  const indicatorX = size / 2 + radius * Math.cos(angleRad);
  const indicatorY = size / 2 + radius * Math.sin(angleRad);

  // Teaser animation: dot runs around wheel and erases all segments
  // Dot travels from day 25 → day 1 (no erase) → full lap (erase all)
  // Total travel: 3 days to reach day 1 + 28 days full lap = 31 days = ~1.107 rotations
  const totalRotations = 31 / 28; // ~1.107

  useEffect(() => {
    if (!hasData) {
      // Reset values
      teaserProgress.value = 0;
      teaserTextOpacity.value = 1;
      tapTextOpacity.value = 0;
      dotOpacity.value = 1;

      const startDelay = 500;
      const animationDuration = 4000; // Longer to accommodate extra travel

      // Animate dot around the wheel (full lap + 3 extra days)
      teaserProgress.value = withDelay(
        startDelay,
        withTiming(totalRotations, { duration: animationDuration, easing: Easing.inOut(Easing.ease) })
      );

      // Fade out "Period in 3 days" after dot reaches day 1
      teaserTextOpacity.value = withDelay(
        startDelay + animationDuration * 0.3,
        withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) })
      );

      // Fade in "Tap to log period"
      tapTextOpacity.value = withDelay(
        startDelay + animationDuration * 0.4,
        withTiming(1, { duration: 500, easing: Easing.in(Easing.ease) })
      );

      // Fade out dot at the end
      dotOpacity.value = withDelay(
        startDelay + animationDuration - 300,
        withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) })
      );
    }
  }, [hasData]);

  // Calculate teaser dot position (starts at day 25 = 3 days before period)
  const teaserStartDay = 25;
  const teaserStartAngle = ((teaserStartDay - 1) / 28) * 360 - 90; // ~218.57°

  const teaserDotX = useDerivedValue(() => {
    const currentAngle = teaserStartAngle + teaserProgress.value * 360;
    const rad = (currentAngle * Math.PI) / 180;
    return size / 2 + radius * Math.cos(rad);
  });

  const teaserDotY = useDerivedValue(() => {
    const currentAngle = teaserStartAngle + teaserProgress.value * 360;
    const rad = (currentAngle * Math.PI) / 180;
    return size / 2 + radius * Math.sin(rad);
  });

  // Animated props for teaser dot (includes opacity for fade out)
  const teaserDotProps = useAnimatedProps(() => ({
    cx: teaserDotX.value,
    cy: teaserDotY.value,
    opacity: dotOpacity.value,
  }));

  // Erase starts when dot reaches day 1 (after traveling 3 days from day 25)
  // eraseProgress: 0 = at day 1, 1 = completed full lap back to day 28
  const day1Angle = -90; // Day 1 is at top of wheel
  const progressToDay1 = 3 / 28; // ~0.107 of a rotation to reach day 1

  // Helper to calculate erase progress (0 when at day 1, 1 when full lap complete)
  const getEraseProgress = (progress) => {
    'worklet';
    if (progress < progressToDay1) return 0; // Haven't reached day 1 yet
    return (progress - progressToDay1) / 1; // Normalize remaining progress
  };

  // Generic wipe function for any segment
  const createSegmentWipe = (segmentStartDay, segmentDuration) => {
    const segmentStartInCycle = (segmentStartDay - 1) / 28; // 0-1 position in cycle
    const segmentEndInCycle = segmentStartInCycle + segmentDuration / 28;
    const arcLength = (segmentDuration / 28) * circumference;

    return useDerivedValue(() => {
      const eraseProgress = getEraseProgress(teaserProgress.value);

      // If erase hasn't started or hasn't reached this segment
      if (eraseProgress <= segmentStartInCycle) {
        return { dasharray: `${arcLength} ${circumference}`, offset: 0, opacity: 1 };
      }

      // If erase has passed this segment completely
      if (eraseProgress >= segmentEndInCycle) {
        return { dasharray: `0 ${circumference}`, offset: 0, opacity: 0 };
      }

      // Erase is currently in this segment - tail wipe effect
      const progressInSegment = (eraseProgress - segmentStartInCycle) / (segmentDuration / 28);
      const passedLength = arcLength * progressInSegment;
      const remainingLength = arcLength - passedLength;

      return { dasharray: `${remainingLength} ${circumference}`, offset: -passedLength, opacity: 1 };
    });
  };

  // Create wipe effects for each segment
  const menstrualWipe = createSegmentWipe(1, 5);   // Days 1-5
  const follicularWipe = createSegmentWipe(6, 7);  // Days 6-12
  const ovulationWipe = createSegmentWipe(13, 4);  // Days 13-16
  const lutealWipe = createSegmentWipe(17, 12);    // Days 17-28

  const menstrualAnimatedProps = useAnimatedProps(() => ({
    strokeDasharray: menstrualWipe.value.dasharray,
    strokeDashoffset: menstrualWipe.value.offset,
    opacity: menstrualWipe.value.opacity,
  }));

  const follicularAnimatedProps = useAnimatedProps(() => ({
    strokeDasharray: follicularWipe.value.dasharray,
    strokeDashoffset: follicularWipe.value.offset,
    opacity: follicularWipe.value.opacity,
  }));

  const ovulationAnimatedProps = useAnimatedProps(() => ({
    strokeDasharray: ovulationWipe.value.dasharray,
    strokeDashoffset: ovulationWipe.value.offset,
    opacity: ovulationWipe.value.opacity,
  }));

  const lutealAnimatedProps = useAnimatedProps(() => ({
    strokeDasharray: lutealWipe.value.dasharray,
    strokeDashoffset: lutealWipe.value.offset,
    opacity: lutealWipe.value.opacity,
  }));

  // Segment start angles for transforms
  const follicularStartAngle = ((6 - 1) / 28) * 360 - 90;
  const ovulationStartAngle = ((13 - 1) / 28) * 360 - 90;
  const lutealStartAngle = ((17 - 1) / 28) * 360 - 90;

  // Animated styles for text transitions
  const teaserTextStyle = useAnimatedStyle(() => ({
    opacity: teaserTextOpacity.value,
  }));

  const tapTextStyle = useAnimatedStyle(() => ({
    opacity: tapTextOpacity.value,
  }));

  const handlePress = () => {
    if (onAddPeriod) {
      onAddPeriod();
    }
  };

  const animatedPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Standard wheel content (when hasData)
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
      <Circle cx={indicatorX} cy={indicatorY} r={6} fill="#FFFFFF" />
      {showCenterText && (() => {
        // Ensure cycleDay is valid (not negative, not null)
        const validCycleDay = cycleDay && cycleDay > 0 ? cycleDay : 1;

        // Use warningMessage prop if provided (from getPeriodWarningStatus)
        // Or show statusMessage if cycle is extended
        if (warningMessage) {
          // Split "Period in X days" into two lines
          const parts = warningMessage.split(" in ");
          if (parts.length === 2) {
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
                  {parts[1]}
                </SvgText>
              </>
            );
          }
          // Single line message (e.g., "Your period may start today")
          return (
            <SvgText
              x={size / 2}
              y={size / 2}
              fontSize="14"
              fontWeight="600"
              fill="#000000"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {warningMessage}
            </SvgText>
          );
        }

        // Show status message if cycle is extended
        if (isExtended && statusMessage) {
          return (
            <SvgText
              x={size / 2}
              y={size / 2}
              fontSize="12"
              fontWeight="600"
              fill="#000000"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {statusMessage}
            </SvgText>
          );
        }

        // Default: show Day X
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
            {`Day ${validCycleDay}`}
          </SvgText>
        );
      })()}
    </Svg>
  );

  // Simple wheel for dates before first cycle - shows "Log Period"
  const beforeFirstCycleContent = (
    <Svg width={size} height={size}>
      {/* Simple gray ring */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#E4E4E4"
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      {/* Log Period text */}
      <SvgText
        x={size / 2}
        y={size / 2 - 8}
        fontSize="13"
        fontWeight="500"
        fill="#666666"
        textAnchor="middle"
        alignmentBaseline="middle"
      >
        Log
      </SvgText>
      <SvgText
        x={size / 2}
        y={size / 2 + 10}
        fontSize="13"
        fontWeight="500"
        fill="#666666"
        textAnchor="middle"
        alignmentBaseline="middle"
      >
        Period
      </SvgText>
    </Svg>
  );

  // Teaser wheel content (when !hasData) - animated demo
  const teaserWheelContent = (
    <Svg width={size} height={size}>
      {/* Base ring */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#F5F5F5"
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      {/* Animated Follicular segment (days 6-12) - wipes away */}
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#E4E4E4"
        strokeWidth={strokeWidth}
        fill="transparent"
        transform={`rotate(${follicularStartAngle} ${size / 2} ${size / 2})`}
        animatedProps={follicularAnimatedProps}
      />
      {/* Animated Luteal segment (days 17-28) - wipes away */}
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#E4E4E4"
        strokeWidth={strokeWidth}
        fill="transparent"
        transform={`rotate(${lutealStartAngle} ${size / 2} ${size / 2})`}
        animatedProps={lutealAnimatedProps}
      />
      {/* Animated Menstrual segment (days 1-5) - wipes away */}
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#F8BBD9"
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        animatedProps={menstrualAnimatedProps}
      />
      {/* Animated Ovulation segment (days 13-16) - wipes away */}
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#FED7AA"
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeLinecap="round"
        transform={`rotate(${ovulationStartAngle} ${size / 2} ${size / 2})`}
        animatedProps={ovulationAnimatedProps}
      />
      {/* Animated dot that runs around the wheel */}
      <AnimatedCircle r={6} fill="#FFFFFF" animatedProps={teaserDotProps} />
    </Svg>
  );

  // Determine which content to show
  const getWheelContent = () => {
    if (!hasData) return "teaser";
    if (isBeforeFirstCycle) return "beforeFirst";
    return "normal";
  };

  const wheelType = getWheelContent();

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
          {wheelType === "teaser" ? (
            <Animated.View style={[styles.wheelContainer, animatedPressStyle]}>
              {teaserWheelContent}
              {/* Animated text overlay for teaser */}
              <View style={styles.textOverlay}>
                <Animated.View style={[styles.textContainer, teaserTextStyle]}>
                  <Text style={styles.teaserText}>Period in</Text>
                  <Text style={styles.teaserTextBold}>3 days</Text>
                </Animated.View>
                <Animated.View style={[styles.textContainer, styles.tapTextContainer, tapTextStyle]}>
                  <Text style={styles.tapText}>Tap to</Text>
                  <Text style={styles.tapText}>log period</Text>
                </Animated.View>
              </View>
            </Animated.View>
          ) : wheelType === "beforeFirst" ? (
            <Animated.View style={[styles.wheelContainer, animatedPressStyle]}>
              {beforeFirstCycleContent}
            </Animated.View>
          ) : (
            <Animated.View style={[styles.wheelContainer, animatedPressStyle]}>
              {wheelContent}
            </Animated.View>
          )}
        </Pressable>
      ) : (
        <View style={styles.wheelContainer}>
          {wheelType === "teaser" ? teaserWheelContent :
           wheelType === "beforeFirst" ? beforeFirstCycleContent :
           wheelContent}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wheelContainer: {
    position: "relative",
  },
  textOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    position: "absolute",
    alignItems: "center",
  },
  tapTextContainer: {
    position: "absolute",
  },
  teaserText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
  },
  teaserTextBold: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    marginTop: 2,
  },
  tapText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666666",
    textAlign: "center",
  },
});
