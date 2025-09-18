import { useChannelStore } from "./channel.store";
import type { Channel } from "./channel.type";
import { joinRoom, leaveRoom } from "../websocket/websocket.action";
import { useFetchWithAuth } from "~/composables/useFetchWithAuth";

export const channelActions = {
  async fetchAllChannelsByGuildId(guildId: string) {
    const { fetchWithAuth } = useFetchWithAuth();

    const channels = await fetchWithAuth<Channel[]>(`/channels/${guildId}`, {
      method: "GET",
    });

    const channelStore = useChannelStore();
    channelStore.channels = channels;

    return channels;
  },

  async createChannel(data: { guildId: string; name: string; type: string }) {
    const { createChannel } = useWebSocket();

    return createChannel({
      guildId: data.guildId,
      name: data.name,
      type: data.type as any,
      nsfw: false,
      manageable: true,
    });
  },

  async fetchChannelById(guildId: string, channelId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const channelStore = useChannelStore();

    // Leave previous channel room if exists
    if (channelStore.currentChannel) {
      leaveRoom(`channel_${channelStore.currentChannel.id}`);
    }

    const channel = await fetchWithAuth<Channel>(
      `/channels/${guildId}/${channelId}`,
      {
        method: "GET",
      }
    );

    channelStore.currentChannel = channel;

    // Join WebSocket room for this channel
    joinRoom(`channel_${channelId}`);

    return channel;
  },

  async fetchChannelDMByUserId() {
    const { fetchWithAuth } = useFetchWithAuth();
    const channelStore = useChannelStore();

    const channel = await fetchWithAuth<Channel[]>(`/dm/channels`, {
      method: "GET",
    });

    channelStore.channelDM = channel;
    return channel;
  },

  async createChannelDm(userIds: string[]) {
    const { fetchWithAuth } = useFetchWithAuth();
    const channelStore = useChannelStore();

    const channelDM = await fetchWithAuth<Channel>(`/dm/channels`, {
      method: "POST",
      body: JSON.stringify({ userIds }),
    });

    channelStore.channelDM.push(channelDM);

    return channelDM;
  },

  async fetchChannelDmById(channelId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const channelStore = useChannelStore();

    // Leave previous channel room if exists
    if (channelStore.currentChannel) {
      leaveRoom(`channel_${channelStore.currentChannel.id}`);
    }

    const channelDM = await fetchWithAuth<Channel>(
      `/dm/channels/${channelId}`,
      {
        method: "GET",
      }
    );

    channelStore.currentChannel = channelDM;

    // Join WebSocket room for this channel
    joinRoom(`channel_${channelId}`);

    return channelDM;
  },
};
