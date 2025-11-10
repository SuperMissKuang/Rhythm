import { useMemo } from "react";
import { format } from "date-fns";
import { TIME_SLOTS } from "@/utils/constants";
import { useActivityStore } from "./stores/useActivityStore";
import { useAnxietyStore } from "./stores/useAnxietyStore";
import { useSelfCareStore } from "./stores/useSelfCareStore";

export function useDayData(date) {
  const dayString = format(date, "yyyy-MM-dd");

  // Get all data from stores (not filtered)
  const activities = useActivityStore((state) => state.activities);
  const allAnxietyEntries = useAnxietyStore((state) => state.entries);
  const allSelfCareEntries = useSelfCareStore((state) => state.entries);

  // Filter entries for the specified day (memoized to prevent infinite loops)
  const anxietyEntries = useMemo(
    () => allAnxietyEntries.filter((entry) => entry.entryDate === dayString),
    [allAnxietyEntries, dayString]
  );

  const selfCareEntries = useMemo(
    () => allSelfCareEntries.filter((entry) => entry.entry_date === dayString),
    [allSelfCareEntries, dayString]
  );

  // Normalize data format to match API response format
  const activitiesData = { activities };
  const anxietyData = { entries: anxietyEntries };
  const selfCareData = { entries: selfCareEntries };

  const getTimeSlotData = () => {
    const slotData = {};

    TIME_SLOTS.forEach((slot) => {
      slotData[slot.id] = {
        anxiety: [],
        selfCare: [],
      };
    });

    // Create activity color lookup
    const activityColors = {};
    activitiesData?.activities?.forEach((activity) => {
      activityColors[activity.name.toLowerCase()] = activity.color_hex;
    });

    anxietyData?.entries?.forEach((entry) => {
      const timeSlot = TIME_SLOTS.find((slot) =>
        slot.timeDescriptors.includes(entry.time_descriptor),
      );
      if (timeSlot) {
        slotData[timeSlot.id].anxiety.push({
          ...entry,
          color: activityColors["anxiety"] || "#FF6B6B",
        });
      }
    });

    selfCareData?.entries?.forEach((entry) => {
      if (entry.activity_times) {
        Object.entries(entry.activity_times).forEach(
          ([activityId, timeDescriptor]) => {
            const timeSlot = TIME_SLOTS.find((slot) =>
              slot.timeDescriptors.includes(timeDescriptor),
            );
            if (timeSlot) {
              // Determine activity category based on activity_id
              let activityCategory = "hair"; // default
              if (
                activityId.includes("exfoliation") ||
                activityId.includes("face_mask") ||
                activityId.includes("moisturize")
              ) {
                activityCategory = "skin";
              }

              slotData[timeSlot.id].selfCare.push({
                activity: activityId,
                timeDescriptor,
                color: activityColors[activityCategory] || "#4ECDC4",
              });
            }
          },
        );
      } else {
        const timeSlot = TIME_SLOTS.find((slot) =>
          slot.timeDescriptors.includes(entry.time_descriptor),
        );
        if (timeSlot) {
          entry.activities.forEach((activity) => {
            // Determine activity category based on activity name
            let activityCategory = "hair"; // default
            if (
              activity.includes("exfoliation") ||
              activity.includes("face_mask") ||
              activity.includes("moisturize")
            ) {
              activityCategory = "skin";
            }

            slotData[timeSlot.id].selfCare.push({
              activity,
              timeDescriptor: entry.time_descriptor,
              color: activityColors[activityCategory] || "#4ECDC4",
            });
          });
        }
      }
    });

    return slotData;
  };

  const timeSlotData = getTimeSlotData();

  return { timeSlotData };
}
