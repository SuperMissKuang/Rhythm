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
import { Plus, Edit, Trash2, Palette } from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ActivityModal from "../../components/More/ActivityModal";
import { SELFCARE_CATEGORIES } from "@/utils/selfcareConstants";

const API_BASE_URL = process.env.EXPO_PUBLIC_PROXY_BASE_URL || "";

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);

  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  // Fetch custom activities
  const { data: activitiesData, isLoading } = useQuery({
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

  // Delete activity mutation
  const deleteActivityMutation = useMutation({
    mutationFn: async (activityId) => {
      console.log("Attempting to delete activity with ID:", activityId);
      const response = await fetch(`${API_BASE_URL}/api/custom-activities`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activityId }),
      });
      console.log("Delete response status:", response.status);
      const data = await response.json();
      console.log("Delete response data:", data);
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete activity");
      }
      return data;
    },
    onSuccess: () => {
      console.log("Delete successful, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["custom-activities"] });
    },
    onError: (error) => {
      console.error("Delete error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to delete activity. Please try again.",
      );
    },
  });

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
          onPress: () => deleteActivityMutation.mutate(activity.id),
        },
      ],
    );
  };

  const customActivities = activitiesData?.activities || [];
  
  // Use default activities if no custom activities are available
  const activities = customActivities.length > 0 ? customActivities : SELFCARE_CATEGORIES;

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
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
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
                        {activity.name}
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

            {activities.length === 0 && !isLoading && (
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
