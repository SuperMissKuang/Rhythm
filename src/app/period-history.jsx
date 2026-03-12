import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react-native";
import { format, parseISO } from "date-fns";
import { router } from "expo-router";
import { useAppTheme } from "@/utils/theme";
import { useCycleStore } from "@/utils/stores/useCycleStore";

export default function PeriodHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const cycles = useCycleStore((state) => state.cycles);

  // Group cycles by year, sorted newest first
  const cyclesByYear = useMemo(() => {
    const sorted = [...cycles].sort(
      (a, b) => parseISO(b.start_date) - parseISO(a.start_date),
    );

    const grouped = {};
    sorted.forEach((cycle) => {
      const year = parseISO(cycle.start_date).getFullYear();
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(cycle);
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year, items]) => ({ year: Number(year), cycles: items }));
  }, [cycles]);

  // Most recent year starts expanded
  const [expandedYears, setExpandedYears] = useState(() => {
    if (cyclesByYear.length > 0) {
      return new Set([cyclesByYear[0].year]);
    }
    return new Set();
  });

  const toggleYear = (year) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  };

  const handleEditCycle = (cycle) => {
    router.push({
      pathname: "/period-log",
      params: { editId: cycle.id, startDate: cycle.start_date },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderLight,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <ArrowLeft size={22} color={colors.primary} />
            <Text
              style={{
                fontSize: 15,
                fontFamily: "Montserrat_500Medium",
                color: colors.primary,
              }}
            >
              Back
            </Text>
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 18,
              fontFamily: "Montserrat_600SemiBold",
              color: colors.primary,
              flex: 1,
              textAlign: "center",
              marginRight: 60, // offset the back button for centering
            }}
          >
            Period History
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {cyclesByYear.length === 0 && (
          <Text
            style={{
              fontSize: 15,
              fontFamily: "Montserrat_500Medium",
              color: colors.secondary,
              textAlign: "center",
              marginTop: 40,
            }}
          >
            No period data yet
          </Text>
        )}

        {cyclesByYear.map(({ year, cycles: yearCycles }) => {
          const isExpanded = expandedYears.has(year);

          return (
            <View key={year} style={{ marginBottom: 12 }}>
              {/* Year header — tap to expand/collapse */}
              <TouchableOpacity
                onPress={() => toggleYear(year)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 12,
                  paddingHorizontal: 4,
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Text
                    style={{
                      fontSize: 17,
                      fontFamily: "Montserrat_600SemiBold",
                      color: colors.primary,
                    }}
                  >
                    {year}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: "Montserrat_500Medium",
                      color: colors.secondary,
                    }}
                  >
                    {yearCycles.length}{" "}
                    {yearCycles.length === 1 ? "period" : "periods"}
                  </Text>
                </View>
                {isExpanded ? (
                  <ChevronDown size={20} color={colors.secondary} />
                ) : (
                  <ChevronRight size={20} color={colors.secondary} />
                )}
              </TouchableOpacity>

              {/* Cycle rows */}
              {isExpanded &&
                yearCycles.map((cycle, index) => {
                  const start = parseISO(cycle.start_date);
                  const daysDiff = Math.floor(
                    (new Date() - start) / (1000 * 60 * 60 * 24),
                  );

                  return (
                    <TouchableOpacity
                      key={cycle.id}
                      onPress={() => handleEditCycle(cycle)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: colors.surface,
                        borderRadius: 10,
                        padding: 14,
                        marginBottom: 6,
                        borderWidth: 1,
                        borderColor: colors.borderLight,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontFamily: "Montserrat_600SemiBold",
                            color: colors.primary,
                          }}
                        >
                          {format(start, "MMMM d")}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            fontFamily: "Montserrat_500Medium",
                            color: colors.secondary,
                            marginTop: 2,
                          }}
                        >
                          {daysDiff <= 7
                            ? "Current period"
                            : cycle.cycle_length
                              ? `${cycle.cycle_length} day cycle`
                              : ""}
                        </Text>
                      </View>
                      <ChevronRight size={16} color={colors.placeholder} />
                    </TouchableOpacity>
                  );
                })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
