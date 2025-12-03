import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useCycleStore } from "@/utils/stores/useCycleStore";
import { useSelfCareStore } from "@/utils/stores/useSelfCareStore";
import { useAnxietyStore } from "@/utils/stores/useAnxietyStore";
import { useActivityStore } from "@/utils/stores/useActivityStore";
import { useNotificationStore } from "@/utils/stores/useNotificationStore";
import PhaseDetectionManager from "@/components/NoticeFriends/PhaseDetectionManager";
import Toast from "react-native-toast-message";
import { getDeviceId } from "@/utils/deviceId";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize all stores on app startup
    async function initializeStores() {
      try {
        // Initialize device ID first (needed for Supabase operations)
        const deviceId = await getDeviceId();
        console.log('App initialized with device ID:', deviceId);

        // Then initialize all stores
        await Promise.all([
          useCycleStore.getState().init(),
          useSelfCareStore.getState().init(),
          useAnxietyStore.getState().init(),
          useActivityStore.getState().init(),
          useNotificationStore.getState().init(),
        ]);
        setIsReady(true);
      } catch (error) {
        console.error("Error initializing stores:", error);
        setIsReady(true); // Still set ready even on error to avoid blocking
      }
    }

    initializeStores();
  }, []);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
          <Stack.Screen name="index" />
        </Stack>
        <PhaseDetectionManager />
        <Toast />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
