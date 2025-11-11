import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { format } from "date-fns";
import { SELFCARE_CATEGORIES } from "@/utils/selfcareConstants";
import { useSelfCareStore } from "./stores/useSelfCareStore";
import { useActivityStore } from "./stores/useActivityStore";

export function useSelfCareEntry() {
  const { editId } = useLocalSearchParams();
  const [timeDescriptor, setTimeDescriptor] = useState(null);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [useIndividualTimes, setUseIndividualTimes] = useState(null);
  const [activityTimes, setActivityTimes] = useState({});
  const [showTimeOptions, setShowTimeOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Get all activities from store (now includes defaults + custom)
  const allActivities = useActivityStore((state) => state.activities);

  // Filter out anxiety and period
  const selfCareActivities = allActivities.filter(
    (activity) => activity.name !== "Anxiety" && activity.name !== "Period",
  );

  // Debug: Log activities structure
  console.log("=== SELF-CARE ACTIVITIES DEBUG ===");
  console.log("Total activities:", selfCareActivities.length);
  selfCareActivities.forEach(a => {
    console.log(`Activity: ${a.name}`);
    console.log(`  - id: ${a.id}`);
    console.log(`  - items:`, a.items);
    console.log(`  - items count: ${a.items?.length || 0}`);
  });

  // Load existing entry if editing
  useEffect(() => {
    if (editId) {
      const entry = useSelfCareStore.getState().entries.find(e => e.id === editId);
      if (entry) {
        setIsEditMode(true);
        setSelectedActivities(entry.activities || []);

        // Set timing approach
        if (entry.use_individual_times) {
          setUseIndividualTimes(true);
          // Convert activity_times object to proper format
          if (entry.activity_times) {
            const times = {};
            Object.keys(entry.activity_times).forEach(activityKey => {
              const timeData = entry.activity_times[activityKey];
              times[activityKey] = timeData.timeDescriptor || timeData;
            });
            setActivityTimes(times);
          }
        } else {
          setUseIndividualTimes(false);
          setTimeDescriptor(entry.time_descriptor);
          if (entry.time_descriptor !== "Now") {
            setShowTimeOptions(true);
          }
        }
      }
    }
  }, [editId]);

  // Auto-expand categories when they're loaded
  useEffect(() => {
    if (selfCareActivities.length > 0 && expandedCategories.length === 0) {
      setExpandedCategories(
        selfCareActivities.map((activity) => activity.id.toString()),
      );
    }
  }, [selfCareActivities.length]);

  const saveSelfCareEntry = async (data) => {
    setIsLoading(true);
    try {
      if (isEditMode && editId) {
        await useSelfCareStore.getState().updateEntry(editId, data);
        setIsLoading(false);
        Alert.alert("Success", "Self-care entry updated successfully", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        await useSelfCareStore.getState().createEntry(data);
        setIsLoading(false);
        Alert.alert("Success", "Self-care activity saved successfully", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      console.error("Error saving self-care entry:", error);
      setIsLoading(false);
      Alert.alert(
        "Error",
        "Failed to save self-care activity. Please try again.",
      );
    }
  };

  // Helper function to find which category an activity belongs to
  const findActivityCategory = (activityKey) => {
    for (const category of selfCareActivities) {
      // Check if it's a direct category match
      const categoryKey = category.name
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

      if (activityKey === categoryKey) {
        return category;
      }

      // Check if it's in the category's items
      if (category.items && category.items.length > 0) {
        const matchedItem = category.items.find(
          (item) => item.activity_key === activityKey,
        );
        if (matchedItem) {
          return category;
        }
      }
    }
    return null;
  };

  // Helper function to get currently selected category
  const getCurrentlySelectedCategory = () => {
    if (selectedActivities.length === 0) return null;
    return findActivityCategory(selectedActivities[0]);
  };

  const toggleCategory = (categoryId) => {
    // Allow multiple categories to be expanded/collapsed
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const toggleActivity = (activityId) => {
    console.log("toggleActivity called with:", activityId);

    if (!activityId) {
      console.error("toggleActivity received undefined/null activityId");
      return;
    }

    const activityCategory = findActivityCategory(activityId);
    if (!activityCategory) {
      console.error("Could not find category for activity:", activityId);
      return;
    }

    const currentCategory = getCurrentlySelectedCategory();

    // If this is from a different category than currently selected activities
    if (currentCategory && currentCategory.id !== activityCategory.id) {
      // Clear previous selections and select this new activity
      setSelectedActivities([activityId]);
      setActivityTimes({});
      setTimeDescriptor(null);
      setShowTimeOptions(false);
      setUseIndividualTimes(null); // Reset timing approach selection
    } else {
      // Same category or first selection - toggle normally
      const newSelectedActivities = selectedActivities.includes(activityId)
        ? selectedActivities.filter((id) => id !== activityId)
        : [...selectedActivities, activityId];

      setSelectedActivities(newSelectedActivities);

      // If we're removing activities and end up with <= 1, reset timing approach
      if (newSelectedActivities.length <= 1) {
        setUseIndividualTimes(null);
        setActivityTimes({});
      }

      // If removing the last activity, also reset time descriptor
      if (newSelectedActivities.length === 0) {
        setTimeDescriptor(null);
        setShowTimeOptions(false);
      }
    }
  };

  const convertNowToTimeDescriptor = (timeDesc) => {
    if (timeDesc !== "Now") return timeDesc;

    const currentHour = new Date().getHours();
    if (currentHour >= 6 && currentHour < 9) return "Early Morning";
    if (currentHour >= 9 && currentHour < 12) return "Late Morning";
    if (currentHour >= 12 && currentHour < 17) return "Afternoon";
    if (currentHour >= 17 && currentHour < 21) return "Evening";
    return "Night";
  };

  const handleSave = () => {
    console.log("Selected activities before save:", selectedActivities);

    // Filter out any undefined/null values
    const validActivities = selectedActivities.filter(act => act != null);

    if (validActivities.length === 0) {
      Alert.alert("Missing Information", "Please select at least one activity");
      return;
    }

    if (validActivities.length !== selectedActivities.length) {
      console.error("Warning: Found undefined activities in selection:", selectedActivities);
    }

    // For multiple activities, timing approach must be chosen
    if (validActivities.length > 1 && useIndividualTimes === null) {
      Alert.alert("Missing Information", "Please choose a timing approach");
      return;
    }

    // For individual times, validate that all activities have times set
    if (useIndividualTimes === true && validActivities.length > 1) {
      const missingTimes = validActivities.filter(
        (activityId) => !activityTimes[activityId],
      );
      if (missingTimes.length > 0) {
        Alert.alert(
          "Missing Information",
          "Please set times for all activities",
        );
        return;
      }
    } else {
      // For single time approach or single activity, validate that time is selected
      if (!timeDescriptor) {
        Alert.alert("Missing Information", "Please select when this happened");
        return;
      }
    }

    const now = new Date();
    const today = format(now, "yyyy-MM-dd");

    let mutationData;

    if (useIndividualTimes === true && selectedActivities.length > 1) {
      // Individual times approach - convert any "Now" values
      const convertedActivityTimes = {};
      Object.keys(activityTimes).forEach((activityId) => {
        const time = activityTimes[activityId];
        if (time === "Now") {
          convertedActivityTimes[activityId] = {
            timeDescriptor: convertNowToTimeDescriptor("Now"),
            exactTime: format(now, "HH:mm:ss"),
          };
        } else {
          convertedActivityTimes[activityId] = {
            timeDescriptor: time,
            exactTime: null,
          };
        }
      });

      mutationData = {
        userId: "default-user",
        entryDate: today,
        activities: validActivities,
        useIndividualTimes: true,
        activityTimes: convertedActivityTimes,
        cycleDay: null, // TODO: Calculate cycle day
      };
    } else {
      // Single time approach - convert "Now" to actual time descriptor
      const finalTimeDescriptor = convertNowToTimeDescriptor(timeDescriptor);
      const exactTime =
        timeDescriptor === "Now" ? format(now, "HH:mm:ss") : null;

      mutationData = {
        userId: "default-user",
        entryDate: today,
        timeDescriptor: finalTimeDescriptor,
        exactTime,
        activities: validActivities,
        useIndividualTimes: false,
        cycleDay: null, // TODO: Calculate cycle day
      };
    }

    // Don't include entry_date, userId for updates, they should remain unchanged
    if (isEditMode) {
      delete mutationData.entryDate;
      delete mutationData.userId;
    }

    console.log("Saving self-care entry with data:", mutationData);
    saveSelfCareEntry(mutationData);
  };

  return {
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
    isEditMode,
    selfCareActivities, // Export this for use in components
  };
}
