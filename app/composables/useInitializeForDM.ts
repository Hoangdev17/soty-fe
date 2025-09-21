/**
 * Composable for initializing DM/personal message functionality
 * Ensures WebSocket connection and proper user room joining for @me routes
 */

import { useAuthStore } from "~/stores/auth/auth.store";
import { useWebSocketStore } from "~/stores/websocket/websocket.store";
import { initializeWebSocket } from "~/stores/websocket/websocket.action";

export const useInitializeForDM = () => {
  const initializeForDM = async () => {
    // Step 1: Ensure WebSocket is connected
    await initializeWebSocket();

    // Step 2: Join user room for DM and notification updates
    const authStore = useAuthStore();
    const wsStore = useWebSocketStore();

    if (authStore.user?.id) {
      const userRoom = `user_${authStore.user.id}`;

      // Wait for connection if not ready yet
      let retries = 0;
      const maxRetries = 10;

      while (!wsStore.isWebSocketConnected && retries < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        retries++;
      }

      if (wsStore.isWebSocketConnected) {
        wsStore.ensureRoomJoined(userRoom);
      } else {
        console.warn(
          `⚠️ Failed to connect WebSocket after ${maxRetries} retries`
        );
        // Try joining anyway - ensureRoomJoined will retry if needed
        wsStore.ensureRoomJoined(userRoom);
      }
    } else {
      console.warn("⚠️ No user ID found, cannot join user room");
    }
  };

  return {
    initializeForDM,
  };
};
