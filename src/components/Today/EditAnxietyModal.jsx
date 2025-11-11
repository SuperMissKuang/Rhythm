import React from "react";
import { View, Text, TouchableOpacity, Modal, Alert } from "react-native";
import { format, parseISO } from "date-fns";
import { useAppTheme } from "@/utils/theme";
import { router } from "expo-router";

export function EditAnxietyModal({
  visible,
  onClose,
  onDelete,
  anxietyEntry,
  isDeletingEntry,
}) {
  const { colors } = useAppTheme();

  if (!visible || !anxietyEntry) {
    return null;
  }

  const handleEdit = () => {
    onClose();
    // Navigate to edit anxiety screen (we'll pass the entry ID as a parameter)
    router.push({
      pathname: "/log-anxiety",
      params: { editId: anxietyEntry.id },
    });
  };

  const handleDelete = () => {
    const severityLabel = ["Very Mild", "Mild", "Moderate", "Severe", "Very Severe"][anxietyEntry.severity - 1];
    Alert.alert(
      "Delete Anxiety Entry",
      `Are you sure you want to delete this ${severityLabel} anxiety entry? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel", onPress: onClose },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(anxietyEntry.id),
        },
      ],
    );
  };

  const severityLabel = ["Very Mild", "Mild", "Moderate", "Severe", "Very Severe"][anxietyEntry.severity - 1];
  const entryDate = parseISO(anxietyEntry.entry_date);

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
            Anxiety Entry Options
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
              color: "#5F27CD",
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            {severityLabel} • {anxietyEntry.time_descriptor}
          </Text>

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
