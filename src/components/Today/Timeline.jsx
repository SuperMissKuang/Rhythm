import React, { useState } from "react";
import { View, Text } from "react-native";
import { TIME_SLOTS } from "@/utils/constants";
import { ActivityPill } from "@/components/Today/ActivityPill";
import { EditAnxietyModal } from "@/components/Today/EditAnxietyModal";
import { useAppTheme } from "@/utils/theme";
import { useAnxietyStore } from "@/utils/stores/useAnxietyStore";
import { Alert } from "react-native";

export function Timeline({ timeSlotData }) {
  const { colors } = useAppTheme();
  const [selectedAnxietyEntry, setSelectedAnxietyEntry] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeletingEntry, setIsDeletingEntry] = useState(false);

  const handleAnxietyPress = (entry) => {
    setSelectedAnxietyEntry(entry);
    setIsEditModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsEditModalVisible(false);
    setSelectedAnxietyEntry(null);
  };

  const handleDeleteAnxiety = async (entryId) => {
    setIsDeletingEntry(true);
    try {
      await useAnxietyStore.getState().deleteEntry(entryId);
      setIsDeletingEntry(false);
      handleCloseModal();
      Alert.alert("Success", "Anxiety entry deleted successfully");
    } catch (error) {
      console.error("Error deleting anxiety entry:", error);
      setIsDeletingEntry(false);
      Alert.alert("Error", "Failed to delete anxiety entry. Please try again.");
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
                      />
                    ))}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <EditAnxietyModal
        visible={isEditModalVisible}
        onClose={handleCloseModal}
        onDelete={handleDeleteAnxiety}
        anxietyEntry={selectedAnxietyEntry}
        isDeletingEntry={isDeletingEntry}
      />
    </View>
  );
}
