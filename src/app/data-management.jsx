import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import {
  useFonts,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from "@expo-google-fonts/montserrat";
import { useAppTheme } from "@/utils/theme";
import { Download, Upload } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { exportAndShare, getExportStats } from "@/utils/storage/dataExport";
import { importFromFile } from "@/utils/storage/dataImport";

export default function DataManagementScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

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
      Toast.show({
        type: "success",
        text1: "Export successful!",
        text2: `Exported ${totalItems} items`,
        position: "bottom",
        visibilityTime: 3000,
      });
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

        Toast.show({
          type: "success",
          text1: "Import successful!",
          text2: `Imported ${totalImported} items from backup`,
          position: "bottom",
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      Alert.alert("Error", "Failed to import data. Please check the file format.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Data Management",
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.primary,
          headerTitleStyle: {
            fontFamily: "Montserrat_600SemiBold",
          },
        }}
      />
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Description */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Montserrat_500Medium",
              color: colors.secondary,
              lineHeight: 20,
            }}
          >
            Backup and restore your tracking data. Export creates a file you can save or share, and import allows you to restore from a backup.
          </Text>
        </View>

        {/* Data Management Options */}
        <View style={{ gap: 16 }}>
          {/* Export Button */}
          <TouchableOpacity
            onPress={handleExportData}
            activeOpacity={0.7}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.borderLight,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: "#E6F7F0",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <Download size={24} color="#10B981" />
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
                    fontSize: 13,
                    fontFamily: "Montserrat_500Medium",
                    color: colors.secondary,
                    lineHeight: 18,
                  }}
                >
                  Backup all your tracking data to a file
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Import Button */}
          <TouchableOpacity
            onPress={handleImportData}
            activeOpacity={0.7}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.borderLight,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: "#EDE9FE",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <Upload size={24} color="#8B5CF6" />
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
                    fontSize: 13,
                    fontFamily: "Montserrat_500Medium",
                    color: colors.secondary,
                    lineHeight: 18,
                  }}
                >
                  Restore your data from a backup file
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View
          style={{
            marginTop: 32,
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.borderLight,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Montserrat_600SemiBold",
              color: colors.primary,
              marginBottom: 8,
            }}
          >
            What gets backed up?
          </Text>
          <View style={{ gap: 6 }}>
            <Text
              style={{
                fontSize: 13,
                fontFamily: "Montserrat_500Medium",
                color: colors.secondary,
                lineHeight: 18,
              }}
            >
              • Cycle tracking entries
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: "Montserrat_500Medium",
                color: colors.secondary,
                lineHeight: 18,
              }}
            >
              • Self-care activity logs
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: "Montserrat_500Medium",
                color: colors.secondary,
                lineHeight: 18,
              }}
            >
              • Anxiety tracking data
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: "Montserrat_500Medium",
                color: colors.secondary,
                lineHeight: 18,
              }}
            >
              • Custom activities and settings
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
