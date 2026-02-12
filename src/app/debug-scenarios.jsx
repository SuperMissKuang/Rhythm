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
import { AlertTriangle, Play } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { CYCLE_SCENARIOS } from "@/utils/debug/cycleScenarios";
import { useCycleStore } from "@/utils/stores/useCycleStore";

export default function DebugScenariosScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { cycles, loadDebugScenario } = useCycleStore();

  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  // Guard for production
  if (!__DEV__) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ color: colors.primary, fontFamily: "Montserrat_600SemiBold", fontSize: 16, textAlign: "center" }}>
          Debug scenarios are only available in development mode.
        </Text>
      </View>
    );
  }

  const handleLoadScenario = (scenario) => {
    Alert.alert(
      "Load Scenario",
      `This will replace all your current cycle data with "${scenario.title}" test data.\n\nCurrent cycles: ${cycles.length}\nNew cycles: ${scenario.cycleCount}\n\nThis cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Load",
          style: "destructive",
          onPress: async () => {
            const generatedCycles = scenario.generate();
            const result = await loadDebugScenario(generatedCycles);

            if (result.success) {
              Toast.show({
                type: "success",
                text1: "Scenario Loaded",
                text2: `Loaded "${scenario.title}" with ${generatedCycles.length} cycles`,
                position: "bottom",
                visibilityTime: 3000,
              });
            } else {
              Toast.show({
                type: "error",
                text1: "Failed to Load",
                text2: result.errors[0] || "Unknown error",
                position: "bottom",
                visibilityTime: 3000,
              });
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Debug Scenarios",
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
        {/* Warning Banner */}
        <View
          style={{
            backgroundColor: "#FEF3C7",
            borderRadius: 12,
            padding: 16,
            flexDirection: "row",
            alignItems: "flex-start",
            marginBottom: 20,
            borderWidth: 1,
            borderColor: "#F59E0B",
          }}
        >
          <AlertTriangle size={20} color="#D97706" style={{ marginRight: 12, marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Montserrat_600SemiBold",
                color: "#92400E",
                marginBottom: 4,
              }}
            >
              Development Only
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: "Montserrat_500Medium",
                color: "#92400E",
                lineHeight: 18,
              }}
            >
              These scenarios replace all existing cycle data. Use for testing different app states.
            </Text>
          </View>
        </View>

        {/* Current Status */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: colors.borderLight,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Montserrat_500Medium",
              color: colors.secondary,
            }}
          >
            Current cycle count:{" "}
            <Text style={{ fontFamily: "Montserrat_600SemiBold", color: colors.primary }}>
              {cycles.length}
            </Text>
          </Text>
        </View>

        {/* Scenario Cards */}
        <View style={{ gap: 12 }}>
          {CYCLE_SCENARIOS.map((scenario) => (
            <TouchableOpacity
              key={scenario.id}
              onPress={() => handleLoadScenario(scenario)}
              activeOpacity={0.7}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.borderLight,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: "Montserrat_600SemiBold",
                      color: colors.primary,
                    }}
                  >
                    {scenario.title}
                  </Text>
                  <View
                    style={{
                      backgroundColor: "#E0E7FF",
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      marginLeft: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: "Montserrat_600SemiBold",
                        color: "#4F46E5",
                      }}
                    >
                      {scenario.cycleCount} cycles
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: "Montserrat_500Medium",
                    color: colors.secondary,
                    lineHeight: 18,
                  }}
                >
                  {scenario.description}
                </Text>
              </View>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#E6F7F0",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: 12,
                }}
              >
                <Play size={18} color="#10B981" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
