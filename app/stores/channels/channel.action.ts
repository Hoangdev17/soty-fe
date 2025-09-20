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

  async createChannel(data: {
    guildId: string;
    name: string;
    type: string;
    parentId?: string;
    topic?: string;
    nsfw?: boolean;
    rateLimitPerUser?: number;
  }) {
    const { fetchWithAuth } = useFetchWithAuth();

    // Chỉ gửi những trường có giá trị thực sự
    const payload: any = {
      name: data.name,
      type: data.type,
    };

    if (
      data.parentId &&
      typeof data.parentId === "string" &&
      data.parentId.trim() !== ""
    ) {
      payload.parentId = data.parentId.trim();
    }

    if (
      data.topic &&
      typeof data.topic === "string" &&
      data.topic.trim() !== ""
    ) {
      payload.topic = data.topic.trim();
    }

    if (data.nsfw === true) {
      payload.nsfw = true;
    }

    if (
      typeof data.rateLimitPerUser === "number" &&
      data.rateLimitPerUser > 0
    ) {
      payload.rateLimitPerUser = data.rateLimitPerUser;
    }

    const res = await fetchWithAuth<Channel>(`/channels/${data.guildId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const channelStore = useChannelStore();
    channelStore.channels.push(res);

    // Join WebSocket room for this new channel
    joinRoom(`channel_${res.id}`);

    return res;
  },

  async createCategory(data: {
    guildId: string;
    name: string;
    topic?: string;
    parentId?: string;
    position?: number;
  }) {
    const { fetchWithAuth } = useFetchWithAuth();

    const categoryData = {
      name: data.name,
      topic: data.topic,
      position: data.position === -1 ? undefined : data.position,
      parentId: data.parentId,
    };

    const category = await fetchWithAuth<Channel>(
      `/channels/${data.guildId}/categories`,
      {
        method: "POST",
        body: JSON.stringify(categoryData),
      }
    );

    const channelStore = useChannelStore();
    channelStore.channels.push(category);

    return category;
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
