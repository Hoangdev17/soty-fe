import { useWebSocketStore } from "~/stores/websocket/websocket.store";

export default defineNuxtPlugin(() => {
  // Initialize WebSocket store unread state when app starts
  if (import.meta.client) {
    const wsStore = useWebSocketStore();

    // Expose to window for debugging
    if (typeof window !== "undefined") {
      (window as any).debugWebSocketStore = wsStore;
    }

    // Ensure we have joined rooms for any restored unread channels
    (async () => {
      try {
        const restoredChannels = Object.keys(wsStore.unreadByChannel || {});
        if (restoredChannels.length > 0) {
          await Promise.all(
            restoredChannels.map((ch) =>
              wsStore.ensureRoomJoined(`channel_${ch}`)
            )
          );
        }

        // Sync unread state with server after a short delay
        setTimeout(() => {
          wsStore.syncUnreadState();
        }, 1000);
      } catch (e) {}
    })();
  }
});
