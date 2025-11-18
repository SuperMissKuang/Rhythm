import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Plus } from "lucide-react-native";
import { router } from "expo-router";

export function ActionButtons() {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        gap: 12,
        marginBottom: 16,
      }}
    >
      <TouchableOpacity
        onPress={() => router.push("/log-anxiety")}
        style={{
          backgroundColor: "#EDE6FF",
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 8,
          flexDirection: "row",
          alignItems: "center",
          flex: 1,
          justifyContent: "center",
          maxWidth: 140,
        }}
      >
        <Plus size={14} color="#5F27CD" />
        <Text
          style={{
            fontSize: 13,
            fontFamily: "Montserrat_600SemiBold",
            color: "#5F27CD",
            marginLeft: 6,
          }}
        >
          Anxiety
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push("/log-selfcare")}
        style={{
          backgroundColor: "#E6F7E6",
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 8,
          flexDirection: "row",
          alignItems: "center",
          flex: 1,
          justifyContent: "center",
          maxWidth: 140,
        }}
      >
        <Plus size={14} color="#2E7D32" />
        <Text
          style={{
            fontSize: 13,
            fontFamily: "Montserrat_600SemiBold",
            color: "#2E7D32",
            marginLeft: 6,
          }}
        >
          Self-Care
        </Text>
      </TouchableOpacity>
    </View>
  );
}
