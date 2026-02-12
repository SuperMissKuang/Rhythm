/**
 * Debug cycle scenarios for testing different app states
 * Only used in development (__DEV__)
 */

import { subDays } from "date-fns";
import { generateCycleHistory } from "./mockDataGenerators";

/**
 * Available debug scenarios
 */
export const CYCLE_SCENARIOS = [
  {
    id: "new-user",
    title: "New User",
    description: "Empty state - no cycles logged yet",
    cycleCount: 0,
    generate: () => [],
  },
  {
    id: "single-cycle",
    title: "Single Cycle",
    description: "One cycle started 10 days ago",
    cycleCount: 1,
    generate: () => {
      const startDate = subDays(new Date(), 10);
      return generateCycleHistory(1, [28], startDate);
    },
  },
  {
    id: "regular-cycles",
    title: "6 Regular Cycles",
    description: "Consistent 28-30 day cycles over 6 months",
    cycleCount: 6,
    generate: () => {
      const startDate = subDays(new Date(), 5);
      return generateCycleHistory(6, [28, 29, 28, 30, 28, 29], startDate);
    },
  },
  {
    id: "irregular-cycles",
    title: "Irregular Cycles",
    description: "Variable lengths: 21, 35, 28, 45 days",
    cycleCount: 4,
    generate: () => {
      const startDate = subDays(new Date(), 8);
      return generateCycleHistory(4, [21, 35, 28, 45], startDate);
    },
  },
  {
    id: "mid-period",
    title: "Mid-Period Now",
    description: "Currently on day 3 of period",
    cycleCount: 4,
    generate: () => {
      const startDate = subDays(new Date(), 2);
      return generateCycleHistory(4, [28, 29, 27, 28], startDate);
    },
  },
  {
    id: "skipped-months",
    title: "Skipped 2 Months",
    description: "Last period was 60 days ago",
    cycleCount: 3,
    generate: () => {
      const startDate = subDays(new Date(), 60);
      return generateCycleHistory(3, [28, 30, 29], startDate);
    },
  },
];

/**
 * Get a scenario by ID
 * @param {string} id - Scenario ID
 * @returns {Object|undefined} Scenario object or undefined
 */
export function getScenarioById(id) {
  return CYCLE_SCENARIOS.find((s) => s.id === id);
}
