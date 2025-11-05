import { useChannelStore } from "./channel.store";
import type { Channel } from "./channel.type";
import { joinRoom, leaveRoom } from "../websocket/websocket.action";
import { useFetchWithAuth } from "~/composables/useFetchWithAuth";
import { useWebSocketStore } from "../websocket/websocket.store";

export const channelActions = {
  async fetchAllChannelsByGuildId(guildId: string) {
    const { fetchWithAuth } = useFetchWithAuth();

    const channels = await fetchWithAuth<Channel[]>(`/channels/${guildId}`, {
      method: "GET",
    });

    const channelStore = useChannelStore();
    channelStore.channels = channels;

    // Set channel to community mapping for WebSocket store
    const wsStore = useWebSocketStore();
    const mappings: Record<string, string> = {};
    channels.forEach((channel) => {
      if (channel.id) {
        mappings[channel.id] = guildId;
      }
    });
    wsStore.setChannelMappings(mappings);

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

    // Set channel to community mapping for WebSocket store
    const wsStore = useWebSocketStore();
    wsStore.setChannelToCommunityMapping(res.id, data.guildId);

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

    // Set channel to community mapping for WebSocket store
    const wsStore = useWebSocketStore();
    wsStore.setChannelToCommunityMapping(category.id, data.guildId);

    return category;
  },

  async fetchChannelById(guildId: string, channelId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const channelStore = useChannelStore();

    const channel = await fetchWithAuth<Channel>(
      `/channels/${guildId}/${channelId}`,
      {
        method: "GET",
      }
    );

    channelStore.currentChannel = channel;

    // Set channel to community mapping for WebSocket store
    const wsStore = useWebSocketStore();
    wsStore.setChannelToCommunityMapping(channelId, guildId);

    return channel;
  },

  async fetchChannelDMByUserId() {
    const { fetchWithAuth } = useFetchWithAuth();
    const channelStore = useChannelStore();

    const channels = await fetchWithAuth<Channel[]>(`/dm/channels`, {
      method: "GET",
    });

    channelStore.channelDM = channels;

    // Set channel to community mapping for WebSocket store (DM channels don't belong to communities)
    const wsStore = useWebSocketStore();
    const mappings: Record<string, string> = {};
    channels.forEach((channel) => {
      if (channel.id) {
        mappings[channel.id] = "dm"; // Use "dm" as communityId for DM channels
      }
    });
    wsStore.setChannelMappings(mappings);

    return channels;
  },

  async createChannelDm(userIds: string[], icon?: string, groupName?: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const channelStore = useChannelStore();

    const body: any = { userIds };

    // Add icon and groupName only if provided (for group DM)
    if (icon) {
      body.icon = icon;
    }
    if (groupName) {
      body.groupName = groupName;
    }

    const channelDM = await fetchWithAuth<Channel>(`/dm/channels`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    channelStore.channelDM.push(channelDM);

    // Set channel to community mapping for WebSocket store (DM channels don't belong to communities)
    const wsStore = useWebSocketStore();
    wsStore.setChannelToCommunityMapping(channelDM.id, "dm"); // Use "dm" as communityId for DM channels

    return channelDM;
  },

  async fetchChannelDmById(channelId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const channelStore = useChannelStore();

    const channelDM = await fetchWithAuth<Channel>(
      `/dm/channels/${channelId}`,
      {
        method: "GET",
      }
    );

    channelStore.currentChannel = channelDM;

    // Set channel to community mapping for WebSocket store (DM channels don't belong to communities)
    const wsStore = useWebSocketStore();
    wsStore.setChannelToCommunityMapping(channelId, "dm"); // Use "dm" as communityId for DM channels

    // Join WebSocket room for this channel
    joinRoom(`channel_${channelId}`);

    return channelDM;
  },

  async updateChannel(
    guildId: string,
    channelId: string,
    data: Partial<Channel>
  ) {
    const { fetchWithAuth } = useFetchWithAuth();
    const channelStore = useChannelStore();

    const updatedChannel = await fetchWithAuth<Channel>(
      `/channels/${guildId}/${channelId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );

    channelStore.currentChannel = updatedChannel;

    return updatedChannel;
  },

  async deleteChannel(guildId: string, channelId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const channelStore = useChannelStore();

    await fetchWithAuth(`/channels/${guildId}/${channelId}`, {
      method: "DELETE",
    });

    channelStore.channels = channelStore.channels.filter(
      (channel) => channel.id !== channelId
    );

    // Leave WebSocket room for this channel
    leaveRoom(`channel_${channelId}`);
  },
};
