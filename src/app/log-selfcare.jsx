import React from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useFonts,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from "@expo-google-fonts/montserrat";
import { useAppTheme } from "@/utils/theme";
import { useSelfCareEntry } from "@/utils/useSelfCareEntry";
import { SelfCareHeader } from "@/components/SelfCare/SelfCareHeader";
import { ActivityCategories } from "@/components/SelfCare/ActivityCategories";
import { TimingApproachSelector } from "@/components/SelfCare/TimingApproachSelector";
import { SingleTimeSelector } from "@/components/SelfCare/SingleTimeSelector";
import { IndividualTimeSelector } from "@/components/SelfCare/IndividualTimeSelector";

export default function LogSelfCareScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const {
    timeDescriptor,
    setTimeDescriptor,
    selectedActivities,
    expandedCategories,
    useIndividualTimes,
    setUseIndividualTimes,
    activityTimes,
    setActivityTimes,
    showTimeOptions,
    setShowTimeOptions,
    toggleCategory,
    toggleActivity,
    handleSave,
    isLoading,
    selfCareActivities,
  } = useSelfCareEntry();

  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleSetActivityTime = (activityId, time) => {
    setActivityTimes((prev) => ({
      ...prev,
      [activityId]: time,
    }));
  };

  // Get the color of the currently selected activity category
  const getActivityColor = () => {
    if (selectedActivities.length === 0) return "#F8BBD9"; // Default pink if no activities

    // Find the category of the first selected activity (all selected activities should be from same category)
    for (const category of selfCareActivities) {
      // Check if it's a direct category match
      const categoryKey = category.name
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

      if (selectedActivities.includes(categoryKey)) {
        return category.color_hex;
      }

      // Check if it's in the category's items
      if (category.items && category.items.length > 0) {
        const matchedItem = category.items.find((item) =>
          selectedActivities.includes(item.activity_key),
        );
        if (matchedItem) {
          return category.color_hex;
        }
      }
    }
    return "#F8BBD9"; // Fallback to pink
  };

  // Calculate if save button should be disabled
  const getSaveButtonDisabled = () => {
    // No activities selected
    if (selectedActivities.length === 0) return true;

    // Multiple activities - must choose timing approach first
    if (selectedActivities.length > 1) {
      // No timing approach selected yet
      if (useIndividualTimes === null) return true;

      // Individual times selected - check if all activities have times set
      if (useIndividualTimes === true) {
        return selectedActivities.some(
          (activityId) => !activityTimes[activityId],
        );
      }

      // Same time selected - require time selection
      if (useIndividualTimes === false) {
        return !timeDescriptor;
      }
    }

    // Single activity - require time selection
    return !timeDescriptor;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{ paddingTop: insets.top, backgroundColor: colors.background }}
      >
        <SelfCareHeader
          colors={colors}
          isDark={isDark}
          onSave={handleSave}
          isDisabled={getSaveButtonDisabled()}
          isLoading={isLoading}
          activityColor={getActivityColor()}
        />
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
        {/* Activity Categories */}
        <ActivityCategories
          colors={colors}
          isDark={isDark}
          selectedActivities={selectedActivities}
          expandedCategories={expandedCategories}
          onToggleCategory={toggleCategory}
          onToggleActivity={toggleActivity}
          selfCareActivities={selfCareActivities}
        />

        {/* Timing Approach Selection - Only show if multiple activities are selected */}
        {selectedActivities.length > 1 && (
          <TimingApproachSelector
            colors={colors}
            useIndividualTimes={useIndividualTimes}
            onToggle={setUseIndividualTimes}
            selectedActivities={selectedActivities}
            selfCareActivities={selfCareActivities}
          />
        )}

        {/* Single Time Selection - Show for single activity OR multiple activities with same time */}
        {selectedActivities.length > 0 &&
          (selectedActivities.length === 1 || useIndividualTimes === false) && (
            <SingleTimeSelector
              colors={colors}
              timeDescriptor={timeDescriptor}
              showTimeOptions={showTimeOptions}
              selectedActivitiesCount={selectedActivities.length}
              selectedActivities={selectedActivities}
              selfCareActivities={selfCareActivities}
              onSetTimeDescriptor={setTimeDescriptor}
              onToggleTimeOptions={setShowTimeOptions}
            />
          )}

        {/* Individual Time Selection - Show for multiple activities with different times */}
        {selectedActivities.length > 1 && useIndividualTimes === true && (
          <IndividualTimeSelector
            colors={colors}
            selectedActivities={selectedActivities}
            activityTimes={activityTimes}
            onSetActivityTime={handleSetActivityTime}
            selfCareActivities={selfCareActivities}
          />
        )}
      </ScrollView>
    </View>
  );
}
