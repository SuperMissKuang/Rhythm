import { useColorScheme } from "react-native";

export const useAppTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const lightTheme = {
    // Base colors
    primary: "#1F2937",
    secondary: "#6B7280",
    tertiary: "#9CA3AF",

    // Background colors
    background: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceVariant: "#F9FAFB",

    // Border colors
    border: "#E5E7EB",
    borderLight: "#F3F4F6",

    // Utility colors
    placeholder: "#D1D5DB",
    dragHandle: "#E5E7EB",

    // Accent colors
    purple: "#F3E8FF",
    pinkVariant: "#EC4899",
    pink: "#FDF2F8",
    yellow: "#FEF3C7",
    yellowStar: "#FCD34D",
    blue: "#DBEAFE",
    orange: "#FED7AA",
    green: "#D1FAE5",

    // Light variants
    purpleLight: "#F3E8FF",
    blueLight: "#DBEAFE",
    orangeLight: "#FED7AA",
    greenLight: "#D1FAE5",
    yellowLight: "#FEF3C7",

    // Profile specific colors
    profileGreen: "#D1FAE5",
    profileBlue: "#DBEAFE",
    profileOrange: "#FED7AA",

    // Cycle phase colors (energy-based)
    menstrual: "#F8D7DA",
    follicular: "#95B3A0",
    ovulation: "#F7E98E",
    luteal: "#C8C8C8",

    // Wellness colors
    anxietyLow: "#FFD700",
    anxietyMedium: "#FFA500",
    anxietyHigh: "#FF4444",
    selfCareOne: "#90EE90",
    selfCareMultiple: "#32CD32",
    noData: "#E0E0E0",
  };

  const darkTheme = {
    ...lightTheme,
    // Override dark mode specific colors
    primary: "#FFFFFF",
    secondary: "#9CA3AF",
    tertiary: "#6B7280",

    background: "#111827",
    surface: "#1F2937",
    surfaceVariant: "#374151",

    border: "#374151",
    borderLight: "#4B5563",

    placeholder: "#6B7280",
    dragHandle: "#6B7280",
  };

  return {
    colors: isDark ? darkTheme : lightTheme,
    isDark,
  };
};
