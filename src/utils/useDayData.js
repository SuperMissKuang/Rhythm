import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { TIME_SLOTS } from "@/utils/constants";

const API_BASE_URL = process.env.EXPO_PUBLIC_PROXY_BASE_URL || "";

export function useDayData(date) {
  const dayString = format(date, "yyyy-MM-dd");

  const { data: activitiesData } = useQuery({
    queryKey: ["custom-activities"],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/custom-activities?userId=default-user`,
      );
      if (!response.ok) throw new Error("Failed to fetch custom activities");
      return response.json();
    },
    refetchOnWindowFocus: true,
  });

  const { data: anxietyData } = useQuery({
    queryKey: ["anxiety-entries", dayString],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/anxiety-entries?userId=default-user&startDate=${dayString}&endDate=${dayString}`,
      );
      if (!response.ok) throw new Error("Failed to fetch anxiety entries");
      return response.json();
    },
    refetchOnWindowFocus: true,
  });

  const { data: selfCareData } = useQuery({
    queryKey: ["selfcare-entries", dayString],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/selfcare-entries?userId=default-user&startDate=${dayString}&endDate=${dayString}`,
      );
      if (!response.ok) throw new Error("Failed to fetch self-care entries");
      return response.json();
    },
    refetchOnWindowFocus: true,
  });

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
