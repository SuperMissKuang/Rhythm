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
        gap: 16,
        marginBottom: 20,
      }}
    >
      <TouchableOpacity
        onPress={() => router.push("/log-anxiety")}
        style={{
          backgroundColor: "#EDE6FF",
          borderRadius: 25,
          paddingHorizontal: 20,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          flex: 1,
          justifyContent: "center",
          maxWidth: 150,
        }}
      >
        <Plus size={16} color="#5F27CD" />
        <Text
          style={{
            fontSize: 14,
            fontFamily: "Montserrat_600SemiBold",
            color: "#5F27CD",
            marginLeft: 8,
          }}
        >
          Anxiety
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push("/log-selfcare")}
        style={{
          backgroundColor: "#E6F7E6",
          borderRadius: 25,
          paddingHorizontal: 20,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          flex: 1,
          justifyContent: "center",
          maxWidth: 150,
        }}
      >
        <Plus size={16} color="#2E7D32" />
        <Text
          style={{
            fontSize: 14,
            fontFamily: "Montserrat_600SemiBold",
            color: "#2E7D32",
            marginLeft: 8,
          }}
        >
          Self-Care
        </Text>
      </TouchableOpacity>
    </View>
  );
}
