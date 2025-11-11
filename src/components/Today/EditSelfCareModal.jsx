import React from "react";
import { View, Text, TouchableOpacity, Modal, Alert } from "react-native";
import { format, parseISO } from "date-fns";
import { useAppTheme } from "@/utils/theme";
import { router } from "expo-router";
import { SELFCARE_CATEGORIES } from "@/utils/selfcareConstants";
import { useActivityStore } from "@/utils/stores/useActivityStore";

export function EditSelfCareModal({
  visible,
  onClose,
  onDelete,
  selfCareEntry,
  isDeletingEntry,
}) {
  const { colors } = useAppTheme();
  const customActivities = useActivityStore((state) => state.activities);

  if (!visible || !selfCareEntry) {
    return null;
  }

  const handleEdit = () => {
    onClose();
    // Navigate to edit self-care screen with the entry ID
    router.push({
      pathname: "/log-selfcare",
      params: { editId: selfCareEntry.id },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Self-Care Entry",
      `Are you sure you want to delete this self-care entry? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel", onPress: onClose },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(selfCareEntry.id),
        },
      ],
    );
  };

  // Helper to get activity name from activity_key
  const getActivityName = (activityKey) => {
    // Check default activities
    for (const category of SELFCARE_CATEGORIES) {
      if (category.items) {
        const item = category.items.find((i) => i.activity_key === activityKey);
        if (item) return item.name;
      }
    }

    // Check custom activities
    const customActivity = customActivities.find((a) => {
      const categoryKey = a.name
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
      return categoryKey === activityKey;
    });

    if (customActivity) return customActivity.name;

    // Fallback: capitalize and format the key
    return activityKey
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Get activity color
  const getActivityColor = () => {
    if (!selfCareEntry.activities || selfCareEntry.activities.length === 0) {
      return "#F8BBD9"; // Default pink
    }

    const firstActivityKey = selfCareEntry.activities[0];

    // Check default categories
    for (const category of SELFCARE_CATEGORIES) {
      if (category.items) {
        const item = category.items.find(
          (i) => i.activity_key === firstActivityKey,
        );
        if (item) return category.color_hex;
      }
    }

    // Check custom activities
    const customActivity = customActivities.find((a) => {
      const categoryKey = a.name
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
      return categoryKey === firstActivityKey;
    });

    if (customActivity) return customActivity.color_hex;

    return "#F8BBD9"; // Fallback
  };

  // Safely parse entry date
  let entryDate;
  try {
    entryDate = selfCareEntry.entry_date ? parseISO(selfCareEntry.entry_date) : new Date();
  } catch (error) {
    console.error("Error parsing entry date:", error);
    entryDate = new Date();
  }

  const activityColor = getActivityColor();

  // Format activities display
  const activitiesDisplay =
    selfCareEntry.activities && selfCareEntry.activities.length > 0
      ? selfCareEntry.activities.map(getActivityName).join(", ")
      : "Activities";

  // Format time display
  let timeDisplay = "";
  if (selfCareEntry.use_individual_times && selfCareEntry.activity_times) {
    // Individual times - show "Multiple times"
    timeDisplay = "Multiple times";
  } else if (selfCareEntry.time_descriptor) {
    // Single time
    timeDisplay = selfCareEntry.time_descriptor;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            backgroundColor: colors.background,
            borderRadius: 16,
            padding: 20,
            margin: 20,
            width: "80%",
            maxWidth: 300,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Montserrat_600SemiBold",
              color: colors.primary,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Self-Care Entry Options
          </Text>

          <Text
            style={{
              fontSize: 14,
              fontFamily: "Montserrat_500Medium",
              color: colors.secondary,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            {format(entryDate, "MMMM d, yyyy")}
          </Text>

          <Text
            style={{
              fontSize: 14,
              fontFamily: "Montserrat_500Medium",
              color: activityColor,
              textAlign: "center",
              marginBottom: 4,
            }}
          >
            {activitiesDisplay}
          </Text>

          {timeDisplay && (
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Montserrat_500Medium",
                color: colors.secondary,
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              {timeDisplay}
            </Text>
          )}

          <TouchableOpacity
            onPress={handleEdit}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.borderLight,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: "Montserrat_600SemiBold",
                color: colors.primary,
                textAlign: "center",
              }}
            >
              ✏️ Edit Entry
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDelete}
            style={{
              backgroundColor: "#FFE6E6",
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: "#FFCCCB",
            }}
            disabled={isDeletingEntry}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: "Montserrat_600SemiBold",
                color: "#D32F2F",
                textAlign: "center",
              }}
            >
              🗑️ Delete Entry
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: "transparent",
              borderRadius: 12,
              padding: 12,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Montserrat_500Medium",
                color: colors.secondary,
                textAlign: "center",
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
