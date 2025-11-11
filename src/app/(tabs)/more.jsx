import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useFonts,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from "@expo-google-fonts/montserrat";
import { useAppTheme } from "@/utils/theme";
import { Plus, Edit, Trash2, Palette, Download, Upload } from "lucide-react-native";
import ActivityModal from "../../components/More/ActivityModal";
import { SELFCARE_CATEGORIES } from "@/utils/selfcareConstants";
import { useActivityStore } from "@/utils/stores/useActivityStore";
import { exportAndShare, getExportStats } from "@/utils/storage/dataExport";
import { importFromFile } from "@/utils/storage/dataImport";

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  // Get custom activities from store
  const customActivities = useActivityStore((state) => state.activities);

  // Delete activity function
  const deleteActivity = async (activityId) => {
    setIsDeleting(true);
    try {
      console.log("Attempting to delete activity with ID:", activityId);
      await useActivityStore.getState().deleteActivity(activityId);
      console.log("Delete successful");
      setIsDeleting(false);
    } catch (error) {
      console.error("Delete error:", error);
      setIsDeleting(false);
      Alert.alert(
        "Error",
        error.message || "Failed to delete activity. Please try again.",
      );
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  const handleAddActivity = () => {
    setEditingActivity(null);
    setModalVisible(true);
  };

  const handleEditActivity = (activity) => {
    setEditingActivity(activity);
    setModalVisible(true);
  };

  const handleDeleteActivity = (activity) => {
    Alert.alert(
      "Delete Activity",
      `Are you sure you want to delete "${activity.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteActivity(activity.id),
        },
      ],
    );
  };

  const handleExportData = async () => {
    try {
      const stats = getExportStats();
      const totalItems =
        stats.cyclesCount +
        stats.selfCareEntriesCount +
        stats.anxietyEntriesCount +
        stats.customActivitiesCount;

      if (totalItems === 0) {
        Alert.alert(
          "No Data",
          "You don't have any data to export yet. Start tracking to build your data!"
        );
        return;
      }

      await exportAndShare();
      Alert.alert(
        "Success",
        `Exported ${totalItems} items successfully!`
      );
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Error", "Failed to export data. Please try again.");
    }
  };

  const handleImportData = async () => {
    try {
      const result = await importFromFile({ merge: true });

      if (result.canceled) {
        return;
      }

      if (result.success) {
        const { stats } = result;
        const totalImported =
          stats.cyclesImported +
          stats.selfCareEntriesImported +
          stats.anxietyEntriesImported +
          stats.customActivitiesImported;

        Alert.alert(
          "Import Successful",
          `Imported ${totalImported} items:\n` +
            `• ${stats.cyclesImported} cycles\n` +
            `• ${stats.selfCareEntriesImported} self-care entries\n` +
            `• ${stats.anxietyEntriesImported} anxiety entries\n` +
            `• ${stats.customActivitiesImported} custom activities`
        );
      }
    } catch (error) {
      console.error("Import error:", error);
      Alert.alert("Error", "Failed to import data. Please check the file format.");
    }
  };

  // Filter out Period and Anxiety from custom activities
  const customSelfCareActivities = customActivities.filter(
    (activity) => activity.name !== "Anxiety" && activity.name !== "Period"
  );

  // Combine default activities with custom activities
  let activities = [...SELFCARE_CATEGORIES, ...customSelfCareActivities];

  // Add Period and Anxiety as special built-in activities (non-editable)
  const periodActivity = {
    id: "period",
    name: "Period",
    color_hex: "#F8BBD9",
    isBuiltIn: true,
  };

  const anxietyActivity = {
    id: "anxiety",
    name: "Anxiety",
    color_hex: "#5F27CD",
    isBuiltIn: true,
  };

  // Combine built-in activities with all activities (default + custom)
  activities = [periodActivity, anxietyActivity, ...activities];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{ paddingTop: insets.top, backgroundColor: colors.background }}
      >
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontFamily: "Montserrat_600SemiBold",
              color: colors.primary,
            }}
          >
            Customize Activities
          </Text>

          <TouchableOpacity
            onPress={handleAddActivity}
            style={{
              backgroundColor: "#F8BBD9",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.borderLight,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Montserrat_600SemiBold",
                color: colors.primary,
              }}
            >
              + Add
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={false}
      >
        {/* Activity Management Section */}
        <View style={{ marginBottom: 32 }}>
          {/* Activities List */}
          <View style={{ gap: 12 }}>
            {activities.map((activity) => (
              <View
                key={activity.id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                }}
              >
                {/* Activity Header */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                    }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        backgroundColor: activity.color_hex,
                        borderRadius: 10,
                        marginRight: 12,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: "Montserrat_600SemiBold",
                        color: colors.primary,
                        flex: 1,
                      }}
                    >
                      {activity.name}
                    </Text>
                  </View>

                  {/* Only show edit/delete for non-built-in activities */}
                  {!activity.isBuiltIn && (
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => handleEditActivity(activity)}
                        style={{
                          padding: 8,
                          borderRadius: 8,
                          backgroundColor: colors.background,
                        }}
                      >
                        <Edit size={16} color={colors.secondary} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDeleteActivity(activity)}
                        style={{
                          padding: 8,
                          borderRadius: 8,
                          backgroundColor: colors.background,
                        }}
                      >
                        <Trash2 size={16} color="#E53E3E" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Sub-activities */}
                <View style={{ marginBottom: 12 }}>
                  <View style={{ gap: 8 }}>
                    {activity.items && activity.items.length > 0 ? (
                      <>
                        {activity.items.slice(0, 3).map((item) => (
                          <Text
                            key={item.id}
                            style={{
                              fontSize: 14,
                              fontFamily: "Montserrat_500Medium",
                              color: colors.secondary,
                            }}
                          >
                            {item.name}
                          </Text>
                        ))}
                        {activity.items.length > 3 && (
                          <Text
                            style={{
                              fontSize: 14,
                              fontFamily: "Montserrat_500Medium",
                              color: colors.secondary,
                              fontStyle: "italic",
                            }}
                          >
                            +{activity.items.length - 3} more items
                          </Text>
                        )}
                      </>
                    ) : (
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: "Montserrat_500Medium",
                          color: colors.secondary,
                        }}
                      >
                        {activity.isBuiltIn
                          ? (activity.name === "Period"
                              ? "Track your menstrual cycle"
                              : "Log anxiety attacks and severity")
                          : activity.name}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Frequency Settings */}
                <View>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "Montserrat_500Medium",
                      color: colors.secondary,
                      marginBottom: 6,
                    }}
                  >
                    Frequency Ranges:
                  </Text>
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}
                  >
                    <View
                      style={{
                        backgroundColor: `${activity.color_hex}20`,
                        borderRadius: 8,
                        paddingHorizontal: 6,
                        paddingVertical: 3,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontFamily: "Montserrat_500Medium",
                          color: colors.primary,
                        }}
                      >
                        Light: {activity.light_saturation_min}-
                        {activity.light_saturation_max}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: `${activity.color_hex}50`,
                        borderRadius: 8,
                        paddingHorizontal: 6,
                        paddingVertical: 3,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontFamily: "Montserrat_500Medium",
                          color: colors.primary,
                        }}
                      >
                        Medium: {activity.medium_saturation_min}-
                        {activity.medium_saturation_max}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: activity.color_hex,
                        borderRadius: 8,
                        paddingHorizontal: 6,
                        paddingVertical: 3,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontFamily: "Montserrat_500Medium",
                          color: "#FFFFFF",
                        }}
                      >
                        Dark: {activity.dark_saturation_min}+
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}

            {activities.length === 0 && (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 32,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                }}
              >
                <Palette size={48} color={colors.placeholder} />
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: "Montserrat_600SemiBold",
                    color: colors.primary,
                    marginTop: 12,
                    marginBottom: 8,
                  }}
                >
                  No Activities
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Montserrat_500Medium",
                    color: colors.secondary,
                    textAlign: "center",
                    marginBottom: 16,
                  }}
                >
                  Add your first activity to start tracking patterns
                </Text>
                <TouchableOpacity
                  onPress={handleAddActivity}
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Montserrat_600SemiBold",
                      color: isDark ? "#000000" : "#FFFFFF",
                    }}
                  >
                    Add Activity
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Data Management Section */}
        <View style={{ marginTop: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Montserrat_600SemiBold",
              color: colors.primary,
              marginBottom: 16,
            }}
          >
            Data Management
          </Text>

          <View style={{ gap: 12 }}>
            {/* Export Button */}
            <TouchableOpacity
              onPress={handleExportData}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.borderLight,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "#E6F7F0",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Download size={20} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Montserrat_600SemiBold",
                      color: colors.primary,
                      marginBottom: 4,
                    }}
                  >
                    Export Data
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "Montserrat_500Medium",
                      color: colors.secondary,
                    }}
                  >
                    Backup all your data to a file
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Import Button */}
            <TouchableOpacity
              onPress={handleImportData}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.borderLight,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "#EDE9FE",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Upload size={20} color="#8B5CF6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Montserrat_600SemiBold",
                      color: colors.primary,
                      marginBottom: 4,
                    }}
                  >
                    Import Data
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "Montserrat_500Medium",
                      color: colors.secondary,
                    }}
                  >
                    Load data from a backup file
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Activity Modal */}
      <ActivityModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        activity={editingActivity}
      />
    </View>
  );
}
