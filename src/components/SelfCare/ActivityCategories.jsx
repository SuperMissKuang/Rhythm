import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ChevronDown, ChevronUp, Check } from "lucide-react-native";

export function ActivityCategories({
  colors,
  isDark,
  selectedActivities,
  expandedCategories,
  onToggleCategory,
  onToggleActivity,
  selfCareActivities = [], // Receive activities as prop
}) {
  // Helper to find which category an activity belongs to
  const findActivityCategory = (activityKey) => {
    for (const category of selfCareActivities) {
      const categoryKey = category.name
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

      if (activityKey === categoryKey) {
        return category;
      }

      if (category.items && category.items.length > 0) {
        const matchedItem = category.items.find(
          (item) => item.activity_key === activityKey,
        );
        if (matchedItem) {
          return category;
        }
      }
    }
    return null;
  };

  // Get the currently active category (has selections)
  const activeCategory =
    selectedActivities.length > 0
      ? findActivityCategory(selectedActivities[0])
      : null;

  return (
    <View style={{ marginBottom: 32 }}>
      <Text
        style={{
          fontSize: 18,
          fontFamily: "Montserrat_600SemiBold",
          color: colors.primary,
          marginBottom: 16,
        }}
      >
        Which activity did you do?
      </Text>

      {selfCareActivities.length > 0 ? (
        <View style={{ gap: 16 }}>
          {selfCareActivities.map((category) => {
            const isExpanded = expandedCategories.includes(
              category.id.toString(),
            );
            const categoryActivities =
              category.items && category.items.length > 0
                ? category.items.filter((item) => {
                    const itemKey = item.activity_key ||
                      item.name?.toLowerCase()
                        .replace(/\s+/g, "_")
                        .replace(/[^a-z0-9_]/g, "");
                    return selectedActivities.includes(itemKey);
                  }) || []
                : selectedActivities.includes(
                      category.name
                        .toLowerCase()
                        .replace(/\s+/g, "_")
                        .replace(/[^a-z0-9_]/g, ""),
                    )
                  ? [{ name: category.name }]
                  : [];

            // Determine if this category is inactive (grayed out)
            const isInactive =
              activeCategory && activeCategory.id !== category.id;
            const categoryOpacity = isInactive ? 0.4 : 1;

            return (
              <View
                key={category.id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                  overflow: "hidden",
                  opacity: categoryOpacity,
                }}
              >
                {/* Category Header */}
                <TouchableOpacity
                  onPress={() => onToggleCategory(category.id.toString())}
                  disabled={false} // Always allow expand/collapse
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 16,
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
                        width: 16,
                        height: 16,
                        backgroundColor: category.color_hex,
                        borderRadius: 8,
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
                      {category.name}
                    </Text>

                    {categoryActivities.length > 0 && (
                      <View
                        style={{
                          backgroundColor: category.color_hex,
                          borderRadius: 10,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          marginRight: 12,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontFamily: "Montserrat_600SemiBold",
                            color: "#FFFFFF",
                          }}
                        >
                          {categoryActivities.length}
                        </Text>
                      </View>
                    )}
                  </View>

                  {isExpanded ? (
                    <ChevronUp size={20} color={colors.secondary} />
                  ) : (
                    <ChevronDown size={20} color={colors.secondary} />
                  )}
                </TouchableOpacity>

                {/* Activities List */}
                {isExpanded && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                    {category.items && category.items.length > 0 ? (
                      category.items.map((activity, index) => {
                        // Ensure activity_key exists, fallback to generating from name
                        const activityKey = activity.activity_key ||
                          activity.name?.toLowerCase()
                            .replace(/\s+/g, "_")
                            .replace(/[^a-z0-9_]/g, "");

                        console.log("Rendering activity item:", {
                          name: activity.name,
                          activity_key: activity.activity_key,
                          computed: activityKey
                        });

                        const isSelected = selectedActivities.includes(activityKey);

                        return (
                          <TouchableOpacity
                            key={activity.id || `${category.id}-${index}`}
                            onPress={() =>
                              !isInactive &&
                              onToggleActivity(activityKey)
                            }
                            disabled={isInactive} // Disable if category is inactive
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              paddingVertical: 12,
                              paddingHorizontal: 12,
                              borderRadius: 12,
                              backgroundColor: isSelected
                                ? `${category.color_hex}20`
                                : "transparent",
                              marginTop: index > 0 ? 8 : 0,
                            }}
                          >
                            <View
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                borderWidth: 2,
                                borderColor: isSelected
                                  ? category.color_hex
                                  : colors.borderLight,
                                backgroundColor: isSelected
                                  ? category.color_hex
                                  : "transparent",
                                marginRight: 12,
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              {isSelected && (
                                <Check size={12} color="#FFFFFF" />
                              )}
                            </View>

                            <Text
                              style={{
                                fontSize: 15,
                                fontFamily: "Montserrat_500Medium",
                                color: colors.primary,
                                flex: 1,
                              }}
                            >
                              {activity.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      // If no sub-activities, show the main activity as selectable
                      <TouchableOpacity
                        onPress={() =>
                          !isInactive &&
                          onToggleActivity(
                            category.name
                              .toLowerCase()
                              .replace(/\s+/g, "_")
                              .replace(/[^a-z0-9_]/g, ""),
                          )
                        }
                        disabled={isInactive} // Disable if category is inactive
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 12,
                          paddingHorizontal: 12,
                          borderRadius: 12,
                          backgroundColor: selectedActivities.includes(
                            category.name
                              .toLowerCase()
                              .replace(/\s+/g, "_")
                              .replace(/[^a-z0-9_]/g, ""),
                          )
                            ? `${category.color_hex}20`
                            : "transparent",
                        }}
                      >
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            borderWidth: 2,
                            borderColor: selectedActivities.includes(
                              category.name
                                .toLowerCase()
                                .replace(/\s+/g, "_")
                                .replace(/[^a-z0-9_]/g, ""),
                            )
                              ? category.color_hex
                              : colors.borderLight,
                            backgroundColor: selectedActivities.includes(
                              category.name
                                .toLowerCase()
                                .replace(/\s+/g, "_")
                                .replace(/[^a-z0-9_]/g, ""),
                            )
                              ? category.color_hex
                              : "transparent",
                            marginRight: 12,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          {selectedActivities.includes(
                            category.name
                              .toLowerCase()
                              .replace(/\s+/g, "_")
                              .replace(/[^a-z0-9_]/g, ""),
                          ) && <Check size={12} color="#FFFFFF" />}
                        </View>

                        <Text
                          style={{
                            fontSize: 15,
                            fontFamily: "Montserrat_500Medium",
                            color: colors.primary,
                            flex: 1,
                          }}
                        >
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ) : (
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
          <Text
            style={{
              fontSize: 16,
              fontFamily: "Montserrat_600SemiBold",
              color: colors.primary,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            No Self-Care Activities Available
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Montserrat_500Medium",
              color: colors.secondary,
              textAlign: "center",
            }}
          >
            Go to the More tab to add your first self-care activity.
          </Text>
        </View>
      )}
    </View>
  );
}
