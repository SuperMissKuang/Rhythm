import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useFonts,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from "@expo-google-fonts/montserrat";
import { useAppTheme } from "@/utils/theme";
import {
  X,
  Plus,
  Trash2,
  Check,
  Palette,
  Hash,
  Minus,
} from "lucide-react-native";
import { useActivityStore } from "@/utils/stores/useActivityStore";

// Predefined color palette - 8 bright and distinct colors
const COLOR_PALETTE = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#47761E", // Dark Green
  "#FECA57", // Yellow
  "#FF1493", // Deep Pink
  "#5F27CD", // Purple
  "#FF9F43", // Orange
];

// Utility function to calculate color luminance for contrast
const calculateLuminance = (hexColor) => {
  if (!hexColor || !hexColor.startsWith("#")) return 0.5;

  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16) / 255;
  const g = parseInt(hexColor.slice(3, 5), 16) / 255;
  const b = parseInt(hexColor.slice(5, 7), 16) / 255;

  // Apply gamma correction
  const gamma = (c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  // Calculate relative luminance
  return 0.2126 * gamma(r) + 0.7152 * gamma(g) + 0.0722 * gamma(b);
};

// Get text color based on background luminance
const getContrastTextColor = (backgroundColor) => {
  const luminance = calculateLuminance(backgroundColor);
  return luminance > 0.4 ? "#000000" : "#FFFFFF";
};

export default function ActivityModal({ visible, onClose, activity = null }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(""); // Remove pre-selection
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Frequency configuration
  const [lightMin, setLightMin] = useState(1);
  const [lightMax, setLightMax] = useState(2);
  const [mediumMin, setMediumMin] = useState(2);
  const [mediumMax, setMediumMax] = useState(3);
  const [darkMin, setDarkMin] = useState(4);

  // Store original values for change detection
  const [originalValues, setOriginalValues] = useState(null);

  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  // Activity mutation functions
  const createActivity = async (data) => {
    setIsLoading(true);
    try {
      console.log("Creating activity with data:", data);
      const result = await useActivityStore.getState().createActivity(data);
      console.log("Create activity success:", result);
      setIsLoading(false);
      onClose();
      resetForm();
    } catch (error) {
      console.error("Create activity error:", error);
      setIsLoading(false);
      Alert.alert("Error", `Failed to create activity: ${error.message}`);
    }
  };

  const updateActivity = async (data) => {
    setIsLoading(true);
    try {
      const { id, ...updates } = data;
      await useActivityStore.getState().updateActivity(id, updates);
      setIsLoading(false);
      onClose();
      resetForm();
    } catch (error) {
      console.error("Update activity error:", error);
      setIsLoading(false);
      Alert.alert("Error", "Failed to update activity. Please try again.");
    }
  };

  // Load activity data when editing
  useEffect(() => {
    if (activity) {
      const initialValues = {
        name: activity.name || "",
        selectedColor: activity.color_hex || "",
        items:
          activity.items?.map((item) => ({
            name: item.name,
            activityKey: item.activity_key,
          })) || [],
        lightMin: activity.light_saturation_min || 1,
        lightMax: activity.light_saturation_max || 2,
        mediumMin: activity.medium_saturation_min || 2,
        mediumMax: activity.medium_saturation_max || 3,
        darkMin: activity.dark_saturation_min || 4,
      };

      // Set form values
      setName(initialValues.name);
      setSelectedColor(initialValues.selectedColor);
      setItems(initialValues.items);
      setLightMin(initialValues.lightMin);
      setLightMax(initialValues.lightMax);
      setMediumMin(initialValues.mediumMin);
      setMediumMax(initialValues.mediumMax);
      setDarkMin(initialValues.darkMin);

      // Store original values for change detection
      setOriginalValues(initialValues);
    } else {
      resetForm();
      setOriginalValues(null);
    }
  }, [activity, visible]);

  const resetForm = () => {
    setName("");
    setSelectedColor(""); // Remove pre-selection
    setItems([]);
    setNewItemName("");
    setLightMin(1);
    setLightMax(2);
    setMediumMin(2);
    setMediumMax(3);
    setDarkMin(4);
  };

  // Check if there are changes compared to original values (for editing mode)
  const hasChanges = () => {
    if (!originalValues) return false; // New activity, no changes to detect

    // Compare current values with original values
    const currentItems = items.map((item) => ({
      name: item.name,
      activityKey: item.activityKey,
    }));

    return (
      name !== originalValues.name ||
      selectedColor !== originalValues.selectedColor ||
      JSON.stringify(currentItems) !== JSON.stringify(originalValues.items) ||
      lightMin !== originalValues.lightMin ||
      lightMax !== originalValues.lightMax ||
      mediumMin !== originalValues.mediumMin ||
      mediumMax !== originalValues.mediumMax ||
      darkMin !== originalValues.darkMin
    );
  };

  // Check if form is valid and ready for save
  const getSaveButtonState = () => {
    const hasName = name.trim().length > 0;
    const hasColor = selectedColor.length > 0;

    if (activity) {
      // Editing mode: need valid form AND changes
      const isEnabled = hasName && hasColor && hasChanges();
      return {
        isEnabled,
        color: isEnabled ? selectedColor : colors.placeholder,
        textColor: isEnabled ? getContrastTextColor(selectedColor) : "#FFFFFF",
      };
    } else {
      // Adding mode: need valid form (name + color)
      const isEnabled = hasName && hasColor;
      return {
        isEnabled,
        color: isEnabled ? selectedColor : colors.placeholder,
        textColor: isEnabled ? getContrastTextColor(selectedColor) : "#FFFFFF",
      };
    }
  };

  const saveButtonState = getSaveButtonState();

  if (!fontsLoaded) {
    return null;
  }

  const addItem = () => {
    if (newItemName.trim()) {
      const activity_key = newItemName
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

      setItems([
        ...items,
        {
          name: newItemName.trim(),
          activity_key,
        },
      ]);
      setNewItemName("");
    }
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    console.log("handleSave called with:", { name: name.trim(), selectedColor });
    
    if (!name.trim()) {
      Alert.alert("Missing Information", "Please enter an activity name");
      return;
    }

    if (!selectedColor) {
      Alert.alert("Missing Information", "Please select a color");
      return;
    }

    // For editing mode, check if there are any changes
    if (activity && !hasChanges()) {
      Alert.alert("No Changes", "No changes to save");
      return;
    }

    // Validate frequency ranges
    if (lightMax < lightMin) {
      Alert.alert(
        "Invalid Range",
        "Light saturation max must be greater than or equal to min",
      );
      return;
    }

    if (mediumMax < mediumMin) {
      Alert.alert(
        "Invalid Range",
        "Medium saturation max must be greater than or equal to min",
      );
      return;
    }

    // If no items provided, create a default item using the activity name
    const finalItems =
      items.length > 0
        ? items
        : [
            {
              name: name.trim(),
              activity_key: name
                .toLowerCase()
                .replace(/\s+/g, "_")
                .replace(/[^a-z0-9_]/g, ""),
            },
          ];

    const data = {
      name: name.trim(),
      color_hex: selectedColor,
      items: finalItems,
      activities: finalItems, // Some APIs might expect both
      light_saturation_min: lightMin,
      light_saturation_max: lightMax,
      medium_saturation_min: mediumMin,
      medium_saturation_max: mediumMax,
      dark_saturation_min: darkMin,
    };

    console.log("About to call mutation with final data:", data);

    if (activity) {
      // Update existing activity
      console.log("Updating existing activity");
      updateActivity({ ...data, id: activity.id });
    } else {
      // Create new activity
      console.log("Creating new activity");
      createActivity({ ...data, userId: "default-user" });
    }
  };

  const adjustValue = (value, setter, min = 0, max = 20) => {
    return {
      increment: () => {
        if (value < max) setter(value + 1);
      },
      decrement: () => {
        if (value > min) setter(value - 1);
      },
    };
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top,
            backgroundColor: colors.background,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderLight,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingVertical: 16,
            }}
          >
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.primary} />
            </TouchableOpacity>

            <Text
              style={{
                fontSize: 18,
                fontFamily: "Montserrat_600SemiBold",
                color: colors.primary,
              }}
            >
              {activity ? "Edit Activity" : "Add Activity"}
            </Text>

            <TouchableOpacity
              onPress={handleSave}
              disabled={isLoading}
              style={{
                backgroundColor: saveButtonState.color,
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: colors.borderLight,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Montserrat_600SemiBold",
                  color: saveButtonState.textColor,
                }}
              >
                Save
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
          {/* Activity Name */}
          <View style={{ marginBottom: 24, marginTop: 20 }}>
            <Text
              style={{
                fontSize: 16,
                fontFamily: "Montserrat_600SemiBold",
                color: colors.primary,
                marginBottom: 12,
              }}
            >
              Activity Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter activity name..."
              placeholderTextColor={colors.placeholder}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 15,
                fontFamily: "Montserrat_500Medium",
                color: colors.primary,
                borderWidth: 1,
                borderColor: colors.borderLight,
              }}
            />
          </View>

          {/* Color Selection */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 16,
                fontFamily: "Montserrat_600SemiBold",
                color: colors.primary,
                marginBottom: 12,
              }}
            >
              Color
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              {COLOR_PALETTE.map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: color,
                    borderRadius: 20,
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 3,
                    borderColor:
                      selectedColor === color ? colors.primary : "transparent",
                  }}
                >
                  {selectedColor === color && (
                    <Check size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sub-activities */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 16,
                fontFamily: "Montserrat_600SemiBold",
                color: colors.primary,
                marginBottom: 12,
              }}
            >
              Sub-activities
            </Text>

            {/* Existing Items */}
            <View style={{ gap: 8, marginBottom: 12 }}>
              {items.map((item, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontFamily: "Montserrat_500Medium",
                      color: colors.primary,
                    }}
                  >
                    {item.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeItem(index)}
                    style={{ padding: 4 }}
                  >
                    <Trash2 size={16} color="#E53E3E" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Add New Item */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <TextInput
                value={newItemName}
                onChangeText={setNewItemName}
                placeholder="Add sub-activity..."
                placeholderTextColor={colors.placeholder}
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  fontSize: 14,
                  fontFamily: "Montserrat_500Medium",
                  color: colors.primary,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                }}
                returnKeyType="done"
                onSubmitEditing={addItem}
              />
              <TouchableOpacity
                onPress={addItem}
                disabled={!newItemName.trim()}
                style={{
                  backgroundColor: newItemName.trim()
                    ? colors.primary
                    : colors.placeholder,
                  borderRadius: 12,
                  padding: 8,
                }}
              >
                <Check size={16} color={isDark ? "#000000" : "#FFFFFF"} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Frequency Configuration */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 16,
                fontFamily: "Montserrat_600SemiBold",
                color: colors.primary,
                marginBottom: 8,
              }}
            >
              Frequency Settings
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Montserrat_500Medium",
                color: colors.secondary,
                marginBottom: 16,
              }}
            >
              Configure how many activities trigger each color saturation
            </Text>

            {/* Light Saturation */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: colors.borderLight,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    backgroundColor: `${selectedColor}40`,
                    borderRadius: 8,
                    marginRight: 8,
                  }}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Montserrat_600SemiBold",
                    color: colors.primary,
                  }}
                >
                  Light Saturation
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity
                    onPress={
                      adjustValue(lightMin, setLightMin, 0, 20).decrement
                    }
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 8,
                      padding: 8,
                    }}
                  >
                    <Minus size={16} color={colors.secondary} />
                  </TouchableOpacity>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Montserrat_600SemiBold",
                      color: colors.primary,
                      marginHorizontal: 12,
                      minWidth: 20,
                      textAlign: "center",
                    }}
                  >
                    {lightMin}
                  </Text>
                  <TouchableOpacity
                    onPress={
                      adjustValue(lightMin, setLightMin, 0, 20).increment
                    }
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 8,
                      padding: 8,
                    }}
                  >
                    <Plus size={16} color={colors.secondary} />
                  </TouchableOpacity>
                </View>

                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Montserrat_500Medium",
                    color: colors.secondary,
                  }}
                >
                  to
                </Text>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity
                    onPress={
                      adjustValue(lightMax, setLightMax, 0, 20).decrement
                    }
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 8,
                      padding: 8,
                    }}
                  >
                    <Minus size={16} color={colors.secondary} />
                  </TouchableOpacity>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Montserrat_600SemiBold",
                      color: colors.primary,
                      marginHorizontal: 12,
                      minWidth: 20,
                      textAlign: "center",
                    }}
                  >
                    {lightMax}
                  </Text>
                  <TouchableOpacity
                    onPress={
                      adjustValue(lightMax, setLightMax, 0, 20).increment
                    }
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 8,
                      padding: 8,
                    }}
                  >
                    <Plus size={16} color={colors.secondary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Medium Saturation */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: colors.borderLight,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    backgroundColor: `${selectedColor}80`,
                    borderRadius: 8,
                    marginRight: 8,
                  }}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Montserrat_600SemiBold",
                    color: colors.primary,
                  }}
                >
                  Medium Saturation
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity
                    onPress={
                      adjustValue(mediumMin, setMediumMin, 0, 20).decrement
                    }
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 8,
                      padding: 8,
                    }}
                  >
                    <Minus size={16} color={colors.secondary} />
                  </TouchableOpacity>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Montserrat_600SemiBold",
                      color: colors.primary,
                      marginHorizontal: 12,
                      minWidth: 20,
                      textAlign: "center",
                    }}
                  >
                    {mediumMin}
                  </Text>
                  <TouchableOpacity
                    onPress={
                      adjustValue(mediumMin, setMediumMin, 0, 20).increment
                    }
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 8,
                      padding: 8,
                    }}
                  >
                    <Plus size={16} color={colors.secondary} />
                  </TouchableOpacity>
                </View>

                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Montserrat_500Medium",
                    color: colors.secondary,
                  }}
                >
                  to
                </Text>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity
                    onPress={
                      adjustValue(mediumMax, setMediumMax, 0, 20).decrement
                    }
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 8,
                      padding: 8,
                    }}
                  >
                    <Minus size={16} color={colors.secondary} />
                  </TouchableOpacity>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Montserrat_600SemiBold",
                      color: colors.primary,
                      marginHorizontal: 12,
                      minWidth: 20,
                      textAlign: "center",
                    }}
                  >
                    {mediumMax}
                  </Text>
                  <TouchableOpacity
                    onPress={
                      adjustValue(mediumMax, setMediumMax, 0, 20).increment
                    }
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 8,
                      padding: 8,
                    }}
                  >
                    <Plus size={16} color={colors.secondary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Dark Saturation */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.borderLight,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    backgroundColor: selectedColor,
                    borderRadius: 8,
                    marginRight: 8,
                  }}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Montserrat_600SemiBold",
                    color: colors.primary,
                  }}
                >
                  Dark Saturation
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TouchableOpacity
                  onPress={adjustValue(darkMin, setDarkMin, 1, 20).decrement}
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 8,
                    padding: 8,
                  }}
                >
                  <Minus size={16} color={colors.secondary} />
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: "Montserrat_600SemiBold",
                    color: colors.primary,
                    marginHorizontal: 12,
                    minWidth: 20,
                    textAlign: "center",
                  }}
                >
                  {darkMin}
                </Text>
                <TouchableOpacity
                  onPress={adjustValue(darkMin, setDarkMin, 1, 20).increment}
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 8,
                    padding: 8,
                  }}
                >
                  <Plus size={16} color={colors.secondary} />
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Montserrat_500Medium",
                    color: colors.secondary,
                    marginLeft: 8,
                  }}
                >
                  or more
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
