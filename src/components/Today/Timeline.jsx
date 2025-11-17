import React, { useState } from "react";
import { View, Text } from "react-native";
import { TIME_SLOTS } from "@/utils/constants";
import { ActivityPill } from "@/components/Today/ActivityPill";
import { EditSelfCareModal } from "@/components/Today/EditSelfCareModal";
import { useAppTheme } from "@/utils/theme";
import { useSelfCareStore } from "@/utils/stores/useSelfCareStore";
import { Alert } from "react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";

export function Timeline({ timeSlotData }) {
  const { colors } = useAppTheme();

  const [selectedSelfCareEntry, setSelectedSelfCareEntry] = useState(null);
  const [isEditSelfCareModalVisible, setIsEditSelfCareModalVisible] = useState(false);
  const [isDeletingSelfCareEntry, setIsDeletingSelfCareEntry] = useState(false);

  const handleAnxietyPress = (entry) => {
    // Navigate directly to edit screen
    router.push({
      pathname: "/log-anxiety",
      params: { editId: entry.id, source: "today" },
    });
  };

  const handleSelfCarePress = (entry) => {
    // Navigate directly to edit screen
    router.push({
      pathname: "/log-selfcare",
      params: { editId: entry.id, source: "today" },
    });
  };

  const handleCloseSelfCareModal = () => {
    setIsEditSelfCareModalVisible(false);
    setSelectedSelfCareEntry(null);
  };

  const handleDeleteSelfCare = async (entryId) => {
    setIsDeletingSelfCareEntry(true);
    try {
      await useSelfCareStore.getState().deleteEntry(entryId);
      setIsDeletingSelfCareEntry(false);
      handleCloseSelfCareModal();
      Toast.show({
        type: "success",
        text1: "Entry deleted",
        text2: "Self-care entry removed",
        position: "bottom",
        visibilityTime: 2000,
      });
    } catch (error) {
      console.error("Error deleting self-care entry:", error);
      setIsDeletingSelfCareEntry(false);
      Alert.alert("Error", "Failed to delete self-care entry. Please try again.");
    }
  };

  return (
    <View style={{ paddingHorizontal: 20 }}>
      <Text
        style={{
          fontSize: 16,
          fontFamily: "Montserrat_600SemiBold",
          color: colors.primary,
          marginBottom: 16,
        }}
      >
        Timeline
      </Text>
      <View>
        {TIME_SLOTS.map((timeSlot, index) => {
          const IconComponent = timeSlot.icon;
          const slotEntries = timeSlotData[timeSlot.id];
          const hasEntries =
            slotEntries.anxiety.length > 0 || slotEntries.selfCare.length > 0;

          return (
            <View
              key={timeSlot.id}
              style={{ flexDirection: "row", marginBottom: 20 }}
            >
              <View
                style={{ alignItems: "center", width: 60, marginRight: 16 }}
              >
                <IconComponent
                  size={20}
                  color={hasEntries ? colors.primary : colors.placeholder}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "Montserrat_500Medium",
                    color: hasEntries ? colors.primary : colors.placeholder,
                    marginTop: 4,
                  }}
                >
                  {timeSlot.label}
                </Text>
              </View>
              <View style={{ alignItems: "center", marginRight: 16 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: hasEntries
                      ? colors.primary
                      : colors.placeholder,
                    marginTop: 6,
                  }}
                />
                {index < TIME_SLOTS.length - 1 && (
                  <View
                    style={{
                      width: 2,
                      height: 40,
                      backgroundColor: colors.borderLight,
                      marginTop: 4,
                    }}
                  />
                )}
              </View>
              <View style={{ flex: 1, paddingTop: 22 }}>
                {!hasEntries ? (
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "Montserrat_500Medium",
                      color: colors.placeholder,
                      fontStyle: "italic",
                    }}
                  >
                    No activities
                  </Text>
                ) : (
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {slotEntries.anxiety.map((entry, idx) => (
                      <ActivityPill
                        key={`anxiety-${idx}`}
                        activity={entry}
                        type="anxiety"
                        onPress={() => handleAnxietyPress(entry)}
                      />
                    ))}
                    {slotEntries.selfCare.map((entry, idx) => (
                      <ActivityPill
                        key={`selfcare-${idx}`}
                        activity={entry}
                        type="selfcare"
                        onPress={() => handleSelfCarePress(entry)}
                      />
                    ))}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <EditSelfCareModal
        visible={isEditSelfCareModalVisible}
        onClose={handleCloseSelfCareModal}
        onDelete={handleDeleteSelfCare}
        selfCareEntry={selectedSelfCareEntry}
        isDeletingEntry={isDeletingSelfCareEntry}
      />
    </View>
  );
}
