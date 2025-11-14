import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { format } from "date-fns";
import Toast from "react-native-toast-message";
import { SELFCARE_CATEGORIES } from "@/utils/selfcareConstants";
import { useSelfCareStore } from "./stores/useSelfCareStore";
import { useActivityStore } from "./stores/useActivityStore";

export function useSelfCareEntry() {
  const { editId, date, timeSlot } = useLocalSearchParams();
  const [timeDescriptor, setTimeDescriptor] = useState(timeSlot || null);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [useIndividualTimes, setUseIndividualTimes] = useState(null);
  const [activityTimes, setActivityTimes] = useState({});
  const [showTimeOptions, setShowTimeOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [initialState, setInitialState] = useState(null);

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
    if (editId && selfCareActivities.length > 0) {
      const entry = useSelfCareStore.getState().entries.find(e => e.id === editId);
      if (entry) {
        setIsEditMode(true);

        // Extract activity keys from activity_times (new format) or activities (legacy)
        const activityKeys = entry.activity_times
          ? Object.keys(entry.activity_times)
          : (entry.activities || []);
        setSelectedActivities(activityKeys);

        let loadedTimeDescriptor = null;
        let loadedActivityTimes = {};
        let loadedUseIndividualTimes = null;

        // Set timing approach
        if (entry.use_individual_times) {
          loadedUseIndividualTimes = true;
          setUseIndividualTimes(true);
          // Convert activity_times object to proper format
          if (entry.activity_times) {
            const times = {};
            Object.keys(entry.activity_times).forEach(activityKey => {
              const timeData = entry.activity_times[activityKey];
              times[activityKey] = timeData.timeDescriptor || timeData;
            });
            setActivityTimes(times);
            loadedActivityTimes = times;
          }
        } else {
          loadedUseIndividualTimes = false;
          setUseIndividualTimes(false);
          loadedTimeDescriptor = entry.time_descriptor;
          setTimeDescriptor(entry.time_descriptor);
          if (entry.time_descriptor !== "Now") {
            setShowTimeOptions(true);
          }
        }

        // In edit mode, only expand the category containing the selected activity
        if (activityKeys.length > 0) {
          const selectedActivityCategory = findActivityCategory(activityKeys[0]);
          if (selectedActivityCategory) {
            setExpandedCategories([selectedActivityCategory.id.toString()]);
          }
        }

        // Store initial state for comparison
        setInitialState({
          selectedActivities: activityKeys,
          timeDescriptor: loadedTimeDescriptor,
          useIndividualTimes: loadedUseIndividualTimes,
          activityTimes: loadedActivityTimes,
        });
      }
    }
  }, [editId, selfCareActivities.length]);

  // Auto-expand categories when they're loaded (only in create mode)
  useEffect(() => {
    if (!isEditMode && !editId && selfCareActivities.length > 0 && expandedCategories.length === 0) {
      setExpandedCategories(
        selfCareActivities.map((activity) => activity.id.toString()),
      );
    }
  }, [selfCareActivities.length, isEditMode, editId]);

  // In create mode: collapse other categories when activity is selected, expand all when none selected
  useEffect(() => {
    // Only run in create mode (not edit mode)
    if (!isEditMode && !editId && selfCareActivities.length > 0) {
      if (selectedActivities.length === 0) {
        // No activities selected - expand all categories
        setExpandedCategories(
          selfCareActivities.map((activity) => activity.id.toString()),
        );
      } else {
        // Activity selected - only expand the category containing the selected activity
        const selectedActivityCategory = findActivityCategory(selectedActivities[0]);
        if (selectedActivityCategory) {
          setExpandedCategories([selectedActivityCategory.id.toString()]);
        }
      }
    }
  }, [selectedActivities, isEditMode, editId, selfCareActivities.length]);

  const saveSelfCareEntry = async (data) => {
    console.log("=== SAVE SELF CARE ENTRY CALLED ===");
    console.log("Data to save:", data);
    console.log("Is edit mode:", isEditMode);
    console.log("Edit ID:", editId);

    setIsLoading(true);
    try {
      if (isEditMode && editId) {
        console.log("Calling updateEntry with ID:", editId);
        await useSelfCareStore.getState().updateEntry(editId, data);
        console.log("Update complete");
        setIsLoading(false);
        Toast.show({
          type: "success",
          text1: "Entry updated!",
          text2: "Your self-care entry was saved",
          position: "bottom",
          visibilityTime: 2000,
        });
        router.back();
      } else {
        console.log("Calling createEntry");
        await useSelfCareStore.getState().createEntry(data);
        console.log("Create complete");
        setIsLoading(false);
        Toast.show({
          type: "success",
          text1: "Entry saved!",
          text2: "Self-care activity logged",
          position: "bottom",
          visibilityTime: 2000,
        });
        router.back();
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

      // DON'T reset time descriptor when deselecting - preserve the user's time selection
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

  const handleDelete = () => {
    if (!isEditMode || !editId) return;

    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this self-care entry? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              await useSelfCareStore.getState().deleteEntry(editId);
              setIsLoading(false);
              Toast.show({
                type: "success",
                text1: "Entry deleted",
                text2: "Self-care entry removed",
                position: "bottom",
                visibilityTime: 2000,
              });
              router.back();
            } catch (error) {
              console.error("Error deleting self-care entry:", error);
              setIsLoading(false);
              Alert.alert("Error", "Failed to delete self-care entry. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleSave = () => {
    console.log("=== HANDLE SAVE CALLED ===");
    console.log("Is edit mode:", isEditMode);
    console.log("Edit ID:", editId);
    console.log("Selected activities before save:", selectedActivities);

    // Filter out any undefined/null values
    const validActivities = selectedActivities.filter(act => act != null);
    console.log("Valid activities:", validActivities);

    if (validActivities.length === 0) {
      console.log("No valid activities - showing alert");
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
    // Use provided date parameter or default to today
    const entryDate = date || format(now, "yyyy-MM-dd");

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
        entry_date: entryDate,
        use_individual_times: true,
        activity_times: convertedActivityTimes,
        cycle_day: null, // TODO: Calculate cycle day
      };
    } else {
      // Single time approach - convert "Now" to actual time descriptor
      const finalTimeDescriptor = convertNowToTimeDescriptor(timeDescriptor);
      const exactTime =
        timeDescriptor === "Now" ? format(now, "HH:mm:ss") : null;

      // Convert to activity_times format (same time for all activities)
      const singleTimeActivityTimes = {};
      validActivities.forEach((activityId) => {
        singleTimeActivityTimes[activityId] = {
          timeDescriptor: finalTimeDescriptor,
          exactTime,
        };
      });

      mutationData = {
        userId: "default-user",
        entry_date: entryDate,
        time_descriptor: finalTimeDescriptor,
        exact_time: exactTime,
        activity_times: singleTimeActivityTimes,
        use_individual_times: false,
        cycle_day: null, // TODO: Calculate cycle day
      };
    }

    // Don't include entry_date, userId for updates, they should remain unchanged
    if (isEditMode) {
      delete mutationData.entry_date;
      delete mutationData.userId;
    }

    console.log("Saving self-care entry with data:", mutationData);
    saveSelfCareEntry(mutationData);
  };

  // Check if any changes have been made in edit mode
  const hasChanges = () => {
    if (!isEditMode || !initialState) return true; // Allow save in create mode

    // Compare timeDescriptor
    if (timeDescriptor !== initialState.timeDescriptor) return true;

    // Compare useIndividualTimes
    if (useIndividualTimes !== initialState.useIndividualTimes) return true;

    // Compare activityTimes (for individual times approach)
    if (useIndividualTimes) {
      const currentKeys = Object.keys(activityTimes).sort();
      const initialKeys = Object.keys(initialState.activityTimes).sort();

      if (currentKeys.length !== initialKeys.length) return true;
      if (JSON.stringify(currentKeys) !== JSON.stringify(initialKeys)) return true;

      for (const key of currentKeys) {
        if (activityTimes[key] !== initialState.activityTimes[key]) return true;
      }
    }

    return false;
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
    handleDelete,
    isLoading,
    isEditMode,
    selfCareActivities, // Export this for use in components
    hasChanges, // Export change detection
  };
}
