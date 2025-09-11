import { defineStore } from "pinia";
import type { Channel } from "./channel.type";
import { channelActions } from "./channel.action";

export const useChannelStore = defineStore("channel", {
  state: () => ({
    channels: [] as Channel[],
    currentChannel: null as Channel | null,
    // Loading states
    isLoading: false,
    isLoadingChannels: false,
    isLoadingCurrentChannel: false,
  }),

  actions: {
    ...channelActions,
  },
});
