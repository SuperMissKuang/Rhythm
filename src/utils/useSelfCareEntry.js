import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { format } from "date-fns";
import { SELFCARE_CATEGORIES } from "@/utils/selfcareConstants";

const API_BASE_URL = process.env.EXPO_PUBLIC_PROXY_BASE_URL || "";

export function useSelfCareEntry() {
  const queryClient = useQueryClient();
  const [timeDescriptor, setTimeDescriptor] = useState(null);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [useIndividualTimes, setUseIndividualTimes] = useState(null);
  const [activityTimes, setActivityTimes] = useState({});
  const [showTimeOptions, setShowTimeOptions] = useState(false);

  // Fetch custom activities
  const { data: activitiesData } = useQuery({
    queryKey: ["custom-activities"],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/custom-activities?userId=default-user`,
      );
      if (!response.ok) throw new Error("Failed to fetch activities");
      return response.json();
    },
    refetchOnWindowFocus: true,
  });

  const activities = activitiesData?.activities || [];

  // Filter out anxiety from self-care activities
  const customSelfCareActivities = activities.filter(
    (activity) => activity.name !== "Anxiety",
  );

  // Combine default activities with custom activities, prioritizing custom
  const selfCareActivities = customSelfCareActivities.length > 0 
    ? customSelfCareActivities 
    : SELFCARE_CATEGORIES;

  // Auto-expand categories when they're loaded
  useEffect(() => {
    if (selfCareActivities.length > 0 && expandedCategories.length === 0) {
      setExpandedCategories(
        selfCareActivities.map((activity) => activity.id.toString()),
      );
    }
  }, [selfCareActivities.length]);

  const addSelfCareMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch(`${API_BASE_URL}/api/selfcare-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to save self-care entry");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["selfcare-entries"] });
      Alert.alert("Success", "Self-care activity saved successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (error) => {
      Alert.alert(
        "Error",
        "Failed to save self-care activity. Please try again.",
      );
    },
  });

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
    const activityCategory = findActivityCategory(activityId);
    if (!activityCategory) return;

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
    if (selectedActivities.length === 0) {
      Alert.alert("Missing Information", "Please select at least one activity");
      return;
    }

    // For multiple activities, timing approach must be chosen
    if (selectedActivities.length > 1 && useIndividualTimes === null) {
      Alert.alert("Missing Information", "Please choose a timing approach");
      return;
    }

    // For individual times, validate that all activities have times set
    if (useIndividualTimes === true && selectedActivities.length > 1) {
      const missingTimes = selectedActivities.filter(
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
        activities: selectedActivities,
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
        activities: selectedActivities,
        useIndividualTimes: false,
        cycleDay: null, // TODO: Calculate cycle day
      };
    }

    addSelfCareMutation.mutate(mutationData);
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
    isLoading: addSelfCareMutation.isLoading,
    selfCareActivities, // Export this for use in components
  };
}
