import { useBotStore } from "./bot.store";
import type {
  AddSkillToBotPayload,
  Bot,
  BotAction,
  CreateBotActionPayload,
  CreateBotCommandPayload,
  CreateBotPayload,
  getBotHandlersResponse,
} from "./bot.type";

export const BotActions = {
  async fetchAllBot() {
    const { fetchWithAuth } = useFetchWithAuth();
    const botStore = useBotStore();

    const res = await fetchWithAuth<Bot[]>(`/bots`, {
      method: "GET",
    });

    if (res) {
      // Ensure all bots have arrays initialized
      botStore.bots = res.map((bot) => ({
        ...bot,
        BotAction: bot.BotAction || [],
        BotSkill: bot.BotSkill || [],
        BotCommand: bot.BotCommand || [],
      }));
    }

    return res;
  },

  async inviteBotToCommunity(botId: string, communityId: string) {
    const { fetchWithAuth } = useFetchWithAuth();

    const res = await fetchWithAuth(`/bots/${botId}/invite/${communityId}`, {
      method: "POST",
    });

    return res;
  },

  async createBot(dto: CreateBotPayload) {
    const { fetchWithAuth } = useFetchWithAuth();
    const botStore = useBotStore();
    const res = await fetchWithAuth<Bot>(`/bots`, {
      method: "POST",
      body: JSON.stringify(dto),
    });

    if (res) {
      // Ensure arrays are initialized
      const bot = {
        ...res,
        BotAction: res.BotAction || [],
        BotSkill: res.BotSkill || [],
        BotCommand: res.BotCommand || [],
      };
      botStore.bots.push(bot);
    }

    return res;
  },

  async addSkillToBot(botId: string, dto: AddSkillToBotPayload) {
    const { fetchWithAuth } = useFetchWithAuth();
    const res = await fetchWithAuth(`/bots/${botId}/skills`, {
      method: "POST",
      body: JSON.stringify(dto),
    });

    return res;
  },

  async addActionToBot(
    botId: string,
    dto: CreateBotActionPayload,
    skillId: string
  ) {
    const { fetchWithAuth } = useFetchWithAuth();
    const botStore = useBotStore();
    const res = await fetchWithAuth<BotAction>(
      `/bots/${botId}/skills/${skillId}/actions`,
      {
        method: "POST",
        body: JSON.stringify(dto),
      }
    );

    if (res) {
      const bot = botStore.bots.find((b) => b.id === botId);
      if (bot) {
        if (!bot.BotAction) {
          bot.BotAction = [];
        }
        bot.BotAction.push(res);
      }
    }

    return res;
  },

  async addCommandToAction(botId: string, dto: CreateBotCommandPayload) {
    const { fetchWithAuth } = useFetchWithAuth();
    const res = await fetchWithAuth(`/bots/${botId}/commands`, {
      method: "POST",
      body: JSON.stringify(dto),
    });

    return res;
  },

  async fetchBotHandlers(botId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const botStore = useBotStore();
    const res = await fetchWithAuth<getBotHandlersResponse>(
      `/bots/${botId}/handlers`,
      {
        method: "GET",
      }
    );

    if (res) {
      botStore.handlers = res.handlers;
    }

    return res;
  },
};
