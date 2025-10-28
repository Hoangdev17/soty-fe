import { BotActions } from "./bot.action";
import type { Bot } from "./bot.type";

export const useBotStore = defineStore("bot", {
  state: () => ({
    bots: [] as Bot[],
    handlers: [] as string[],
  }),

  actions: {
    ...BotActions,
  },
});
