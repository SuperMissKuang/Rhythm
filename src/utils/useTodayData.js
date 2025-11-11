import { useMemo } from "react";
import { format } from "date-fns";
import { TIME_SLOTS } from "@/utils/constants";
import { useActivityStore } from "./stores/useActivityStore";
import { useAnxietyStore } from "./stores/useAnxietyStore";
import { useSelfCareStore } from "./stores/useSelfCareStore";

export function useTodayData() {
  const today = format(new Date(), "yyyy-MM-dd");

  // Get all data from stores (not filtered)
  const activities = useActivityStore((state) => state.activities);
  const allAnxietyEntries = useAnxietyStore((state) => state.entries);
  const allSelfCareEntries = useSelfCareStore((state) => state.entries);

  // Filter entries for today (memoized to prevent infinite loops)
  const anxietyEntries = useMemo(
    () => allAnxietyEntries.filter((entry) => entry.entry_date === today),
    [allAnxietyEntries, today]
  );

  const selfCareEntries = useMemo(
    () => allSelfCareEntries.filter((entry) => entry.entry_date === today),
    [allSelfCareEntries, today]
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

    // Create activity color lookup - map both activity names and activity_keys to colors
    const activityColors = {};
    activitiesData?.activities?.forEach((activity) => {
      activityColors[activity.name.toLowerCase()] = activity.color_hex;

      // Also map each item's activity_key to the parent category color
      if (activity.items && activity.items.length > 0) {
        activity.items.forEach((item) => {
          if (item.activity_key) {
            activityColors[item.activity_key] = activity.color_hex;
          }
        });
      }
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
            if (timeSlot && activityId) {
              // Get color directly from activity_key lookup
              const color = activityColors[activityId] || "#4ECDC4";

              slotData[timeSlot.id].selfCare.push({
                activity: activityId,
                timeDescriptor,
                color,
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
            if (!activity) return; // Skip null/undefined activities

            // Get color directly from activity_key lookup
            const color = activityColors[activity] || "#4ECDC4";

            slotData[timeSlot.id].selfCare.push({
              activity,
              timeDescriptor: entry.time_descriptor,
              color,
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
