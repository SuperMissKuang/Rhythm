import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useCycleStore } from "@/utils/stores/useCycleStore";
import { useSelfCareStore } from "@/utils/stores/useSelfCareStore";
import { useAnxietyStore } from "@/utils/stores/useAnxietyStore";
import { useActivityStore } from "@/utils/stores/useActivityStore";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize all stores on app startup
    async function initializeStores() {
      try {
        await Promise.all([
          useCycleStore.getState().init(),
          useSelfCareStore.getState().init(),
          useAnxietyStore.getState().init(),
          useActivityStore.getState().init(),
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
      <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
        <Stack.Screen name="index" />
      </Stack>
    </GestureHandlerRootView>
  );
}
