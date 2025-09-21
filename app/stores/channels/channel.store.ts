import { defineStore } from "pinia";
import type { Channel } from "./channel.type";
import { channelActions } from "./channel.action";

export const useChannelStore = defineStore("channel", {
  state: () => ({
    channels: [] as Channel[],
    channelDM: [] as Channel[],
    currentChannel: null as Channel | null,
    // Loading states
    isLoading: false,
    isLoadingChannels: false,
    isLoadingCurrentChannel: false,
  }),

  getters: {
    getChannels: (state) => {
      return state.channels;
    },
  },

  actions: {
    ...channelActions,

    setChannels(channels: Channel[]) {
      this.channels = [...channels];

      // Force reactivity update
      this.$patch({ channels: [...channels] });
    },

    clearChannels() {
      this.channels = [];
      this.currentChannel = null;
      this.isLoading = false;
      this.isLoadingChannels = false;
      this.isLoadingCurrentChannel = false;
    },
  },
});
