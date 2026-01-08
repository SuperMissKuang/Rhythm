import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Trash2 } from "lucide-react-native";
import { Calendar } from "react-native-calendars";
import { format, parseISO } from "date-fns";
import { useAppTheme } from "@/utils/theme";

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
  return luminance > 0.3 ? "#000000" : "#FFFFFF";
};

export function PeriodCalendarModal({
  visible,
  onClose,
  cycles,
  createCycle,
  isCreatingCycle,
  updateCycle,
  isUpdatingCycle,
  editingPeriod,
  setEditingPeriod,
  onDeletePeriod,
  isDeletingCycle,
  initialMonth = null, // Optional: Date object to open calendar to specific month
}) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const [selectedPeriodDate, setSelectedPeriodDate] = useState(null);
  const [selectedPeriodWeek, setSelectedPeriodWeek] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [calendarDate, setCalendarDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    if (editingPeriod) {
      setSelectedPeriodDate(editingPeriod.start_date);
      setCalendarDate(editingPeriod.start_date);
    } else {
      setSelectedPeriodDate(null);
      // Use initialMonth if provided, otherwise default to current date
      const dateToUse = initialMonth ? format(initialMonth, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
      setCalendarDate(dateToUse);
    }
  }, [editingPeriod, initialMonth]);

  const getPeriodDisplayName = (startDate, allCycles, index) => {
    const today = new Date();
    const periodStart = parseISO(startDate);
    const daysDiff = Math.floor((today - periodStart) / (1000 * 60 * 60 * 24));

    // Current period (within 7 days)
    if (daysDiff <= 7) {
      return "Current Period";
    }

    // Last period - only the first non-current period
    if (index === 0 && daysDiff > 7) {
      return "Last Period";
    } else if (
      index === 1 &&
      allCycles[0] &&
      Math.floor(
        (today - new Date(allCycles[0].start_date)) / (1000 * 60 * 60 * 24),
      ) <= 7
    ) {
      return "Last Period";
    }

    // Get month and year for this period
    const periodMonth = periodStart.getMonth();
    const periodYear = periodStart.getFullYear();
    const monthName = format(periodStart, "MMMM");

    // Check if there are multiple periods in the same month
    const sameMonthPeriods = allCycles
      .filter((cycle) => {
        const cycleDate = parseISO(cycle.start_date);
        return (
          cycleDate.getMonth() === periodMonth &&
          cycleDate.getFullYear() === periodYear
        );
      })
      .sort((a, b) => parseISO(a.start_date) - parseISO(b.start_date));

    if (sameMonthPeriods.length > 1) {
      // Find position of this period in the month
      const positionInMonth = sameMonthPeriods.findIndex(
        (cycle) => cycle.start_date === startDate,
      );
      const dayOfMonth = periodStart.getDate();

      if (dayOfMonth <= 15) {
        return `Early ${monthName} Period`;
      } else {
        return `Late ${monthName} Period`;
      }
    }

    // Single period in month - just use month name
    const currentYear = today.getFullYear();
    if (periodYear === currentYear) {
      return `${monthName} Period`;
    } else {
      return `${monthName} ${periodYear} Period`;
    }
  };

  const handleClose = () => {
    setSelectedPeriodDate(null);
    setEditingPeriod(null);
    setSelectedPeriodWeek(null);
    setCalendarDate(format(new Date(), "yyyy-MM-dd"));
    onClose();
  };

  const handlePeriodDateSelect = (day) => {
    setSelectedPeriodDate(day.dateString);
    setSelectedPeriodWeek(null);
  };

  const handlePeriodWeekSelect = (cycle) => {
    setSelectedPeriodWeek(cycle);
    setSelectedPeriodDate(null);
    setCalendarDate(cycle.start_date);
  };

  const handleSavePeriodDate = () => {
    if (!selectedPeriodDate) {
      Alert.alert("Missing Information", "Please select a period start date");
      return;
    }

    if (editingPeriod) {
      updateCycle(
        {
          id: editingPeriod.id,
          data: {
            userId: "default-user",
            start_date: selectedPeriodDate,
            cycle_length: editingPeriod.cycle_length,
          },
        },
        { onSuccess: handleClose },
      );
    } else {
      createCycle(
        {
          userId: "default-user",
          start_date: selectedPeriodDate,
          cycle_length: 28, // Default
        },
        { onSuccess: handleClose },
      );
    }
  };

  const handleDeletePeriod = (cycle) => {
    setDeleteConfirmation(cycle);
  };

  const confirmDelete = () => {
    if (deleteConfirmation) {
      onDeletePeriod(deleteConfirmation.id);
      if (selectedPeriodWeek?.id === deleteConfirmation.id) {
        setSelectedPeriodWeek(null);
      }
      setDeleteConfirmation(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  // Get unique period weeks (deduplicate by start_date)
  const getUniquePeriodWeeks = () => {
    const uniqueWeeks = new Map();

    // Sort cycles by start_date descending (latest first)
    const sortedCycles = [...cycles].sort(
      (a, b) => parseISO(b.start_date) - parseISO(a.start_date),
    );

    // Keep only the first occurrence of each start_date
    sortedCycles.forEach((cycle) => {
      const startDate = cycle.start_date;
      if (!uniqueWeeks.has(startDate)) {
        uniqueWeeks.set(startDate, cycle);
      }
    });

    return Array.from(uniqueWeeks.values());
  };

  const getMarkedDates = () => {
    const marked = {};

    // Mark all period days for all cycles
    cycles.forEach((cycle) => {
      const cycleStart = parseISO(cycle.start_date);
      for (let i = 0; i < 5; i++) {
        const periodDate = new Date(cycleStart);
        periodDate.setDate(periodDate.getDate() + i);
        const dateString = format(periodDate, "yyyy-MM-dd");

        marked[dateString] = {
          customStyles: {
            container: {
              backgroundColor: i === 0 ? "#F8BBD9" : "#FDE4E7",
              borderRadius: 6,
            },
            text: { color: "#000000", fontWeight: i === 0 ? "600" : "500" },
          },
        };
      }
    });

    // Highlight selected period week
    if (selectedPeriodWeek) {
      const weekStart = parseISO(selectedPeriodWeek.start_date);
      for (let i = 0; i < 5; i++) {
        const periodDate = new Date(weekStart);
        periodDate.setDate(periodDate.getDate() + i);
        const dateString = format(periodDate, "yyyy-MM-dd");

        marked[dateString] = {
          customStyles: {
            container: {
              backgroundColor: i === 0 ? "#F8BBD9" : "#FDE4E7",
              borderRadius: 6,
              borderWidth: 2,
              borderColor: "#E91E63",
            },
            text: { color: "#000000", fontWeight: "600" },
          },
        };
      }
    }

    // Highlight selected new date
    if (selectedPeriodDate) {
      marked[selectedPeriodDate] = {
        ...marked[selectedPeriodDate],
        selected: true,
        selectedColor: "#F8BBD9",
        customStyles: {
          container: {
            backgroundColor: "#F8BBD9",
            borderRadius: 6,
            borderWidth: 2,
            borderColor: "#E91E63",
          },
          text: { color: "#000000", fontWeight: "600" },
        },
      };
    }

    return marked;
  };

  const getPeriodWeekDateRange = (startDate) => {
    const start = parseISO(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 4); // 5 days total (0-4)

    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView style={{ flex: 1 }}>
          <View
            style={{
              paddingTop: insets.top,
              backgroundColor: colors.background,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderLight,
              }}
            >
              <TouchableOpacity onPress={handleClose}>
                <X size={24} color={colors.primary} />
              </TouchableOpacity>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "Montserrat_600SemiBold",
                  color: colors.primary,
                }}
              >
                {editingPeriod
                  ? "Edit Period Start Date"
                  : "+ Period Start Date"}
              </Text>
              <TouchableOpacity
                onPress={handleSavePeriodDate}
                disabled={
                  !selectedPeriodDate || isCreatingCycle || isUpdatingCycle
                }
                style={{
                  backgroundColor: selectedPeriodDate
                    ? "#F8BBD9"
                    : colors.placeholder,
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
                    color: selectedPeriodDate
                      ? getContrastTextColor("#F8BBD9")
                      : "#FFFFFF",
                  }}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "Montserrat_500Medium",
                  color: colors.secondary,
                  marginBottom: 20,
                  textAlign: "center",
                }}
              >
                {editingPeriod
                  ? "Select a new start date for this period"
                  : "Select the date when your period started"}
              </Text>

              <Calendar
                key={calendarDate}
                initialDate={calendarDate}
                onDayPress={handlePeriodDateSelect}
                markedDates={getMarkedDates()}
                markingType={"custom"}
                theme={{
                  backgroundColor: colors.background,
                  calendarBackground: colors.background,
                  textSectionTitleColor: colors.primary,
                  selectedDayBackgroundColor: "#F8BBD9",
                  selectedDayTextColor: colors.primary,
                  todayTextColor: colors.primary,
                  dayTextColor: colors.primary,
                  textDisabledColor: colors.placeholder,
                  dotColor: "#F8BBD9",
                  selectedDotColor: colors.primary,
                  arrowColor: colors.primary,
                  monthTextColor: colors.primary,
                  indicatorColor: colors.primary,
                  textDayFontFamily: "Montserrat_500Medium",
                  textMonthFontFamily: "Montserrat_600SemiBold",
                  textDayHeaderFontFamily: "Montserrat_500Medium",
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                  textDayHeaderFontSize: 14,
                }}
                enableSwipeMonths={true}
                hideExtraDays={true}
                firstDay={0}
                maxDate={today}
              />

              {selectedPeriodDate && (
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    marginTop: 20,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Montserrat_500Medium",
                      color: colors.secondary,
                      marginBottom: 4,
                    }}
                  >
                    Selected Period Start Date:
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Montserrat_600SemiBold",
                      color: colors.primary,
                    }}
                  >
                    {format(parseISO(selectedPeriodDate), "EEEE, MMMM d, yyyy")}
                  </Text>
                </View>
              )}

              {/* Period History List */}
              {cycles.length > 0 && !editingPeriod && (
                <View style={{ marginTop: 24 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Montserrat_600SemiBold",
                      color: colors.primary,
                      marginBottom: 12,
                    }}
                  >
                    Your Period History
                  </Text>
                  {getUniquePeriodWeeks()
                    .slice(0, 8)
                    .map((cycle, index) => (
                      <TouchableOpacity
                        key={cycle.id}
                        onPress={() => handlePeriodWeekSelect(cycle)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          backgroundColor:
                            selectedPeriodWeek?.id === cycle.id
                              ? "#F8F4FF"
                              : colors.surface,
                          borderRadius: 12,
                          padding: 16,
                          marginBottom: 8,
                          borderWidth:
                            selectedPeriodWeek?.id === cycle.id ? 2 : 1,
                          borderColor:
                            selectedPeriodWeek?.id === cycle.id
                              ? "#E91E63"
                              : colors.borderLight,
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
                            {getPeriodDisplayName(
                              cycle.start_date,
                              getUniquePeriodWeeks(),
                              index,
                            )}
                          </Text>
                          <Text
                            style={{
                              fontSize: 13,
                              fontFamily: "Montserrat_500Medium",
                              color: colors.secondary,
                              marginTop: 2,
                            }}
                          >
                            {getPeriodWeekDateRange(cycle.start_date)}
                          </Text>
                          {/* Only show cycle length for completed cycles (not the most recent one) */}
                          {index > 0 && (
                            <Text
                              style={{
                                fontSize: 11,
                                fontFamily: "Montserrat_500Medium",
                                color: colors.placeholder,
                                marginTop: 1,
                              }}
                            >
                              {cycle.cycle_length} day cycle
                            </Text>
                          )}
                        </View>

                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDeletePeriod(cycle);
                          }}
                          disabled={isDeletingCycle}
                          style={{
                            backgroundColor: "#FFEBEE",
                            borderRadius: 8,
                            padding: 8,
                            opacity: isDeletingCycle ? 0.5 : 1,
                          }}
                        >
                          <Trash2 size={16} color="#D32F2F" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                </View>
              )}

              {editingPeriod && (
                <TouchableOpacity
                  onPress={() => {
                    setEditingPeriod(null);
                    setSelectedPeriodDate(null);
                  }}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 12,
                    marginTop: 16,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
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
                    Cancel Editing
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Custom Delete Confirmation Modal */}
        {deleteConfirmation && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
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
                Delete Period Week
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
                Are you sure you want to delete the period week from{" "}
                {format(parseISO(deleteConfirmation.start_date), "MMM d, yyyy")}
                ? This action cannot be undone.
              </Text>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={cancelDelete}
                  style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Montserrat_600SemiBold",
                      color: colors.secondary,
                      textAlign: "center",
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={confirmDelete}
                  disabled={isDeletingCycle}
                  style={{
                    flex: 1,
                    backgroundColor: "#FF5252",
                    borderRadius: 12,
                    padding: 16,
                    opacity: isDeletingCycle ? 0.5 : 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Montserrat_600SemiBold",
                      color: "#FFFFFF",
                      textAlign: "center",
                    }}
                  >
                    {isDeletingCycle ? "Deleting..." : "Delete"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
