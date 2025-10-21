import { defineStore } from "pinia";
import { newfeedAction } from "./newfeed.action";
import type { FeedLike, NewFeeds } from "./newfeed.type";

export const useNewFeedStore = defineStore("newfeeds", {
  state: () => ({
    post: [] as NewFeeds[],
    currentPost: null as NewFeeds | null,
    postLike: [] as FeedLike[],
  }),

  actions: {
    ...newfeedAction,
  },
});
