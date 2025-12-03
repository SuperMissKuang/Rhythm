import { useEffect, useState } from 'react';
import { useCycleStore } from '@/utils/stores/useCycleStore';
import { useNotificationStore } from '@/utils/stores/useNotificationStore';
import { getCurrentCycleInfo } from '@/utils/cycleUtils';

/**
 * Hook to detect cycle phase changes
 * Returns information about the current phase and whether it has changed
 *
 * Triggers notifications when:
 * - Entering luteal phase (phase name: "Luteal Phase")
 * - Starting period (phase name: "Menstrual")
 */
export function usePhaseDetection() {
  const cycles = useCycleStore((state) => state.cycles);
  const settings = useNotificationStore((state) => state.settings);
  const updateLastKnownPhase = useNotificationStore((state) => state.updateLastKnownPhase);

  const [phaseInfo, setPhaseInfo] = useState({
    currentPhase: null,
    phaseName: null,
    hasChanged: false,
    shouldNotify: false,
    notificationPhase: null, // 'luteal' or 'period'
  });

  useEffect(() => {
    if (!cycles || cycles.length === 0) {
      setPhaseInfo({
        currentPhase: null,
        phaseName: null,
        hasChanged: false,
        shouldNotify: false,
        notificationPhase: null,
      });
      return;
    }

    // Get current cycle info
    const cycleInfo = getCurrentCycleInfo(cycles);

    if (!cycleInfo || !cycleInfo.currentPhase) {
      return;
    }

    const currentPhaseName = cycleInfo.currentPhase.name;
    const lastKnownPhase = settings?.lastKnownPhase;

    // Check if phase has changed
    const hasChanged = lastKnownPhase && lastKnownPhase !== currentPhaseName;

    // Determine if we should notify
    // Notify when entering luteal phase or menstrual phase (period start)
    let shouldNotify = false;
    let notificationPhase = null;

    if (hasChanged) {
      if (currentPhaseName === 'Luteal Phase') {
        shouldNotify = true;
        notificationPhase = 'luteal';
      } else if (currentPhaseName === 'Menstrual') {
        shouldNotify = true;
        notificationPhase = 'period';
      }
    }

    setPhaseInfo({
      currentPhase: cycleInfo.currentPhase,
      phaseName: currentPhaseName,
      hasChanged,
      shouldNotify,
      notificationPhase,
    });

    // Update last known phase if it changed
    if (hasChanged) {
      updateLastKnownPhase(currentPhaseName);
    }
  }, [cycles, settings?.lastKnownPhase]);

  return phaseInfo;
}
