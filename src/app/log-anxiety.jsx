import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useFonts,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from "@expo-google-fonts/montserrat";
import {
  ChevronLeft,
  Save,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAppTheme } from "@/utils/theme";
import { format } from "date-fns";
import { useAnxietyStore } from "@/utils/stores/useAnxietyStore";

const TIME_OPTIONS = [
  { value: "Early Morning", label: "Early Morning (6-9 AM)" },
  { value: "Late Morning", label: "Late Morning (9 AM-12 PM)" },
  { value: "Afternoon", label: "Afternoon (12-5 PM)" },
  { value: "Evening", label: "Evening (5-9 PM)" },
  { value: "Night", label: "Night (9 PM+)" },
];

const SEVERITY_LEVELS = [
  { value: 1, label: "1. Very Mild", description: "Barely noticeable" },
  { value: 2, label: "2. Mild", description: "Slightly uncomfortable" },
  { value: 3, label: "3. Moderate", description: "Clearly noticeable" },
  { value: 4, label: "4. Severe", description: "Very distressing" },
  { value: 5, label: "5. Very Severe", description: "Overwhelming" },
];

// Anxiety color - using Anxiety's specific color
const ANXIETY_COLOR = "#5F27CD"; // Anxiety's specific purple color;

// Utility function to calculate color luminance for contrast
const calculateLuminance = (hexColor) => {
  if (!hexColor || !hexColor.startsWith("#")) return 0.5;

  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16) / 255;
  const g = parseInt(hexColor.slice(3, 5), 16) / 255;
  const b = parseInt(hexColor.slice(5, 7), 16) / 255;

  // Apply gamma correction
  const gamma = (c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  // Calculate relative luminance
  return 0.2126 * gamma(r) + 0.7152 * gamma(g) + 0.0722 * gamma(b);
};

// Get text color based on background luminance
const getContrastTextColor = (backgroundColor) => {
  const luminance = calculateLuminance(backgroundColor);
  return luminance > 0.3 ? "#000000" : "#FFFFFF";
};

export default function LogAnxietyScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { editId } = useLocalSearchParams();

  const [severity, setSeverity] = useState(null);
  const [timeDescriptor, setTimeDescriptor] = useState(null);
  const [trigger, setTrigger] = useState("");
  const [showTimeOptions, setShowTimeOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  // Load existing entry if editing
  useEffect(() => {
    if (editId) {
      const entry = useAnxietyStore.getState().entries.find(e => e.id === editId);
      if (entry) {
        setIsEditMode(true);
        setSeverity(entry.severity);
        setTimeDescriptor(entry.time_descriptor);
        setTrigger(entry.trigger_description || "");
        // Show time options if not "Now"
        if (entry.time_descriptor !== "Now") {
          setShowTimeOptions(true);
        }
      }
    }
  }, [editId]);

  const saveAnxietyEntry = async (data) => {
    setIsLoading(true);
    try {
      if (isEditMode && editId) {
        await useAnxietyStore.getState().updateEntry(editId, data);
        setIsLoading(false);
        Alert.alert("Success", "Anxiety entry updated successfully", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        await useAnxietyStore.getState().createEntry(data);
        setIsLoading(false);
        Alert.alert("Success", "Anxiety entry saved successfully", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      console.error("Error saving anxiety entry:", error);
      setIsLoading(false);
      Alert.alert("Error", "Failed to save anxiety entry. Please try again.");
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  const handleSave = () => {
    if (!severity) {
      Alert.alert("Missing Information", "Please select a severity level");
      return;
    }

    if (!timeDescriptor) {
      Alert.alert("Missing Information", "Please select when this happened");
      return;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const today = format(now, "yyyy-MM-dd");

    // Convert "Now" to appropriate time descriptor based on current time
    let finalTimeDescriptor = timeDescriptor;
    let exactTime = null;

    if (timeDescriptor === "Now") {
      exactTime = format(now, "HH:mm:ss");

      // Determine time descriptor based on current hour
      if (currentHour >= 6 && currentHour < 9) {
        finalTimeDescriptor = "Early Morning";
      } else if (currentHour >= 9 && currentHour < 12) {
        finalTimeDescriptor = "Late Morning";
      } else if (currentHour >= 12 && currentHour < 17) {
        finalTimeDescriptor = "Afternoon";
      } else if (currentHour >= 17 && currentHour < 21) {
        finalTimeDescriptor = "Evening";
      } else {
        finalTimeDescriptor = "Night";
      }
    }

    const entryData = {
      userId: "default-user",
      entryDate: today,
      timeDescriptor: finalTimeDescriptor,
      exactTime,
      severity,
      triggerDescription: trigger || null,
      cycleDay: null, // TODO: Calculate cycle day
    };

    // Don't include entry_date for updates, it should remain unchanged
    if (isEditMode) {
      delete entryData.entryDate;
      delete entryData.userId;
    }

    saveAnxietyEntry(entryData);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{ paddingTop: insets.top, backgroundColor: colors.background }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 16,
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={24} color={colors.primary} />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 20,
              fontFamily: "Montserrat_600SemiBold",
              color: colors.primary,
            }}
          >
            {isEditMode ? "Edit Anxiety Entry" : "Log Anxiety Attack"}
          </Text>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading}
            style={{
              backgroundColor:
                severity && timeDescriptor
                  ? ANXIETY_COLOR
                  : colors.placeholder,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: colors.borderLight,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Montserrat_600SemiBold",
                color:
                  severity && timeDescriptor
                    ? getContrastTextColor(ANXIETY_COLOR)
                    : "#FFFFFF",
              }}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 400,
        }}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
        removeClippedSubviews={false}
        keyboardDismissMode="on-drag"
      >
          {/* Severity Selection */}
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontSize: 18,
                fontFamily: "Montserrat_600SemiBold",
                color: colors.primary,
                marginBottom: 16,
              }}
            >
              How severe was your anxiety?
            </Text>

            <View style={{ gap: 12 }}>
              {SEVERITY_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  onPress={() => setSeverity(level.value)}
                  style={{
                    backgroundColor:
                      severity === level.value
                        ? `${ANXIETY_COLOR}20` // Light anxiety color background when selected
                        : colors.surface,
                    borderRadius: 16,
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor:
                        severity === level.value
                          ? ANXIETY_COLOR
                          : colors.borderLight,
                      marginRight: 16,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {severity === level.value ? (
                      <Check size={14} color="#FFFFFF" />
                    ) : (
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: "Montserrat_600SemiBold",
                          color: colors.secondary,
                        }}
                      >
                        {level.value}
                      </Text>
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: "Montserrat_600SemiBold",
                        color: colors.primary, // Keep text black
                        marginBottom: 4,
                      }}
                    >
                      {level.label}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: "Montserrat_500Medium",
                        color: colors.secondary, // Keep description text normal color
                      }}
                    >
                      {level.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Time Selection */}
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontSize: 18,
                fontFamily: "Montserrat_600SemiBold",
                color: colors.primary,
                marginBottom: 16,
              }}
            >
              When did this happen?
            </Text>

            {/* Now vs Other Time Pills */}
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                marginBottom: 16,
                alignSelf: "flex-start",
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setTimeDescriptor("Now");
                  setShowTimeOptions(false);
                }}
                style={{
                  backgroundColor:
                    timeDescriptor === "Now"
                      ? `${ANXIETY_COLOR}15`
                      : colors.surface,
                  borderRadius: 20,
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderWidth: 1.5,
                  borderColor:
                    timeDescriptor === "Now"
                      ? ANXIETY_COLOR
                      : colors.borderLight,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: "Montserrat_600SemiBold",
                    color:
                      timeDescriptor === "Now"
                        ? ANXIETY_COLOR
                        : colors.secondary,
                  }}
                >
                  Now
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (timeDescriptor === "Now" || timeDescriptor === null) {
                    setTimeDescriptor(null); // Don't auto-select Early Morning
                  }
                  setShowTimeOptions(!showTimeOptions);
                }}
                style={{
                  backgroundColor:
                    showTimeOptions ||
                    (timeDescriptor && timeDescriptor !== "Now")
                      ? `${ANXIETY_COLOR}15`
                      : colors.surface,
                  borderRadius: 20,
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderWidth: 1.5,
                  borderColor:
                    showTimeOptions ||
                    (timeDescriptor && timeDescriptor !== "Now")
                      ? ANXIETY_COLOR
                      : colors.borderLight,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: "Montserrat_600SemiBold",
                    color:
                      showTimeOptions ||
                      (timeDescriptor && timeDescriptor !== "Now")
                        ? ANXIETY_COLOR
                        : colors.secondary,
                    marginRight: 4,
                  }}
                >
                  Other time
                </Text>
                {showTimeOptions ? (
                  <ChevronUp
                    size={14}
                    color={
                      showTimeOptions ||
                      (timeDescriptor && timeDescriptor !== "Now")
                        ? ANXIETY_COLOR
                        : colors.secondary
                    }
                  />
                ) : (
                  <ChevronDown
                    size={14}
                    color={
                      showTimeOptions ||
                      (timeDescriptor && timeDescriptor !== "Now")
                        ? ANXIETY_COLOR
                        : colors.secondary
                    }
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Descriptive Time Options - Only show when "Other time" is selected */}
            {showTimeOptions && (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Montserrat_500Medium",
                    color: colors.secondary,
                    marginBottom: 12,
                  }}
                >
                  Select a time period:
                </Text>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  {TIME_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => {
                        setTimeDescriptor(option.value);
                        // Remove setShowTimeOptions(false) to prevent auto-collapse
                      }}
                      style={{
                        backgroundColor:
                          timeDescriptor === option.value
                            ? `${ANXIETY_COLOR}15` // Light anxiety color background
                            : colors.background,
                        borderRadius: 20,
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderWidth: 1.5,
                        borderColor:
                          timeDescriptor === option.value
                            ? ANXIETY_COLOR // Anxiety color border when selected
                            : colors.borderLight,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: "Montserrat_500Medium",
                          color:
                            timeDescriptor === option.value
                              ? ANXIETY_COLOR // Anxiety color text when selected
                              : colors.primary,
                        }}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Trigger Input */}
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontSize: 18,
                fontFamily: "Montserrat_600SemiBold",
                color: colors.primary,
                marginBottom: 16,
              }}
            >
              What triggered this anxiety? (Optional)
            </Text>

            <TextInput
              value={trigger}
              onChangeText={setTrigger}
              placeholder="Describe what you think might have triggered your anxiety..."
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.borderLight,
                fontSize: 16,
                fontFamily: "Montserrat_500Medium",
                color: colors.primary,
                textAlignVertical: "top",
                minHeight: 100,
              }}
            />
          </View>
      </ScrollView>
    </View>
  );
}
