import { useChannelStore } from "./channel.store";
import type { Channel } from "./channel.type";
import { joinRoom, leaveRoom } from "../websocket/websocket.action";

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
    const { fetchWithAuth } = useFetchWithAuth();
    const channelStore = useChannelStore();

    const newChannel = await fetchWithAuth<Channel>(
      `/channels/${data.guildId}`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );

    channelStore.channels.push(newChannel);

    return newChannel;
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
};
