import { Sunrise, Moon, CloudSun, Sun, Sunset } from "lucide-react-native";

export const CYCLE_PHASES = [
  {
    name: "Menstrual",
    color: "#F8BBD9",
    description: "Gentle, nurturing energy",
    duration: 5,
  },
  {
    name: "Follicular",
    color: "#E4E4E4",
    description: "Fresh, calming growth",
    duration: 7,
  },
  {
    name: "Ovulation",
    color: "#FED7AA",
    description: "Soft radiant peak energy",
    duration: 4,
  },
  {
    name: "Luteal",
    color: "#E4E4E4",
    description: "Refined, peaceful winding down",
    duration: 12,
  },
];

// Activity colors for special activities not in SELFCARE_CATEGORIES
export const ACTIVITY_COLORS = {
  anxiety: "#5F27CD", // Anxiety's specific purple color
};

export const TIME_SLOTS = [
  {
    id: "early_morning",
    label: "6am",
    fullLabel: "Early Morning",
    icon: Sunrise,
    timeDescriptors: ["Early Morning"],
  },
  {
    id: "late_morning",
    label: "9am",
    fullLabel: "Late Morning",
    icon: CloudSun,
    timeDescriptors: ["Late Morning"],
  },
  {
    id: "afternoon",
    label: "noon",
    fullLabel: "Afternoon",
    icon: Sun,
    timeDescriptors: ["Afternoon"],
  },
  {
    id: "evening",
    label: "6pm",
    fullLabel: "Evening",
    icon: Sunset,
    timeDescriptors: ["Evening"],
  },
  {
    id: "night",
    label: "sleep",
    fullLabel: "Night",
    icon: Moon,
    timeDescriptors: ["Night"],
  },
];
