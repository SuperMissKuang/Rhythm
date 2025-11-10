import React from "react";
import { View, Text, TouchableOpacity, Modal, Alert } from "react-native";
import { format, parseISO } from "date-fns";
import { useAppTheme } from "@/utils/theme";

export function EditPeriodModal({
  visible,
  onClose,
  onEdit,
  onDelete,
  editOptions,
  isDeletingCycle,
}) {
  const { colors } = useAppTheme();

  if (!visible || !editOptions) {
    return null;
  }

  const handleDelete = () => {
    Alert.alert(
      "Delete Period Entry",
      "Are you sure you want to delete this period entry? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel", onPress: onClose },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(editOptions.period.id),
        },
      ],
    );
  };

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
            Period Entry Options
          </Text>

          <Text
            style={{
              fontSize: 14,
              fontFamily: "Montserrat_500Medium",
              color: colors.secondary,
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            {format(parseISO(editOptions.date), "MMMM d, yyyy")}
          </Text>

          <TouchableOpacity
            onPress={onEdit}
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
              ✏️ Edit Period Start Date
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
            disabled={isDeletingCycle}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: "Montserrat_600SemiBold",
                color: "#D32F2F",
                textAlign: "center",
              }}
            >
              🗑️ Delete Period Entry
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
