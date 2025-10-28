<script setup lang="ts">
import { useBotStore } from "~/stores/bots/bot.store";
import { TriggerType, type Bot, type BotSkill } from "~/stores/bots/bot.type";

const selectedBot = defineModel<Bot | null>("selectedBot", { default: null });
const selectedSkill = defineModel<BotSkill | null>("selectedSkill", {
  default: null,
});

const activeTab = ref<"bots" | "actions" | "commands">("bots");
const botStore = useBotStore();
const isAddSkillModalOpen = ref(false);
const isCreateActionModalOpen = ref(false);
const isCreateCommandModalOpen = ref(false);
const isCreateBotModalOpen = ref(false);

// Load data on mount
onMounted(async () => {
  await botStore.fetchAllBot();
});

const createSkillForm = ref({
  name: "",
  description: "",
  model: "",
});

const createActionForm = ref({
  name: "",
  handler: "",
  paramsSchema: null as any,
});

const createCommandForm = ref({
  name: "",
  description: "",
  triggerType: TriggerType.PREFIX,
  pattern: "",
  command: "",
  skillId: "",
  actionId: "",
  parameters: null as any,
});

const bots = computed(() => botStore.bots);
const allActions = computed(() => {
  return bots.value.flatMap((bot) =>
    (bot.BotAction || []).map((action) => ({
      ...action,
      botName: bot.username,
      botId: bot.id,
    }))
  );
});
const allCommands = computed(() => {
  return bots.value.flatMap((bot) =>
    (bot.BotCommand || []).map((cmd) => ({
      ...cmd,
      botName: bot.username,
      botId: bot.id,
    }))
  );
});

const openAddSkillModal = (bot: Bot) => {
  selectedBot.value = bot;
  createSkillForm.value = {
    name: "",
    description: "",
    model: "",
  };
  isAddSkillModalOpen.value = true;
};

const openCreateActionModal = (bot: Bot, skill: BotSkill) => {
  selectedBot.value = bot;
  selectedSkill.value = skill;
  createActionForm.value = {
    name: "",
    handler: "",
    paramsSchema: null,
  };
  isCreateActionModalOpen.value = true;
};

const openCreateCommandModal = (bot: Bot) => {
  selectedBot.value = bot;
  createCommandForm.value = {
    name: "",
    description: "",
    triggerType: TriggerType.PREFIX,
    pattern: "",
    command: "",
    skillId: "",
    actionId: "",
    parameters: null,
  };
  isCreateCommandModalOpen.value = true;
};
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="flex space-x-8 px-6" aria-label="Tabs">
          <button
            @click="activeTab = 'bots'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'bots'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300',
            ]"
          >
            🤖 Bots ({{ bots.length }})
          </button>
          <button
            @click="activeTab = 'actions'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'actions'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300',
            ]"
          >
            ⚡ Actions ({{ allActions.length }})
          </button>
          <button
            @click="activeTab = 'commands'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'commands'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300',
            ]"
          >
            💬 Commands ({{ allCommands.length }})
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="p-6">
        <!-- Bots Tab -->
        <div v-if="activeTab === 'bots'" class="space-y-4">
          <div
            v-for="bot in bots"
            :key="bot.id"
            class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-start gap-4 flex-1">
                <UAvatar
                  :src="bot.avatar || undefined"
                  :alt="bot.username"
                  size="xl"
                />
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                      {{ bot.username }}
                    </h3>
                    <span
                      v-if="bot.isVerified"
                      class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-full"
                    >
                      ✓ Verified
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {{ bot.email }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {{ bot.bio || "Không có mô tả" }}
                  </p>

                  <!-- Skills -->
                  <div class="mt-4">
                    <div class="flex items-center justify-between mb-2">
                      <h4
                        class="text-sm font-semibold text-gray-700 dark:text-gray-300"
                      >
                        Skills ({{ bot.BotSkill?.length || 0 }})
                      </h4>
                      <UButton
                        size="xs"
                        variant="soft"
                        @click="openAddSkillModal(bot)"
                      >
                        + Thêm Skill
                      </UButton>
                    </div>
                    <div
                      v-if="bot.BotSkill && bot.BotSkill.length > 0"
                      class="space-y-2"
                    >
                      <div
                        v-for="skill in bot.BotSkill"
                        :key="skill.id"
                        class="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                      >
                        <div class="flex items-center justify-between">
                          <div class="flex-1">
                            <div class="flex items-center gap-2">
                              <h5
                                class="font-semibold text-gray-900 dark:text-white"
                              >
                                {{ skill.name }}
                              </h5>
                              <span
                                :class="[
                                  'px-2 py-0.5 text-xs font-medium rounded-full',
                                  skill.enabled
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
                                ]"
                              >
                                {{ skill.enabled ? "Enabled" : "Disabled" }}
                              </span>
                            </div>
                            <p
                              class="text-xs text-gray-600 dark:text-gray-400 mt-1"
                            >
                              {{ skill.description || "No description" }}
                            </p>
                            <p
                              v-if="skill.model"
                              class="text-xs text-gray-500 dark:text-gray-500 mt-1"
                            >
                              Model: {{ skill.model }}
                            </p>
                          </div>
                          <UButton
                            size="xs"
                            variant="ghost"
                            @click="openCreateActionModal(bot, skill)"
                          >
                            + Action
                          </UButton>
                        </div>
                      </div>
                    </div>
                    <p v-else class="text-sm text-gray-500 dark:text-gray-500">
                      Chưa có skill nào
                    </p>
                  </div>

                  <!-- Stats -->
                  <div class="flex items-center gap-6 mt-4 text-sm">
                    <div class="flex items-center gap-2">
                      <span class="text-gray-500 dark:text-gray-400"
                        >Actions:</span
                      >
                      <span class="font-semibold text-gray-900 dark:text-white">
                        {{ bot.BotAction?.length || 0 }}
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-gray-500 dark:text-gray-400"
                        >Commands:</span
                      >
                      <span class="font-semibold text-gray-900 dark:text-white">
                        {{ bot.BotCommand?.length || 0 }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex gap-2">
                <UButton
                  size="sm"
                  variant="soft"
                  @click="openCreateCommandModal(bot)"
                >
                  + Command
                </UButton>
                <UButton size="sm"> Chi tiết </UButton>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="bots.length === 0" class="text-center py-12">
            <div class="text-6xl mb-4">🤖</div>
            <h3
              class="text-xl font-semibold text-gray-900 dark:text-white mb-2"
            >
              Chưa có bot nào
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              Tạo bot đầu tiên của bạn để bắt đầu
            </p>
            <UButton @click="isCreateBotModalOpen = true">Tạo Bot Mới</UButton>
          </div>
        </div>

        <!-- Actions Tab -->
        <div v-else-if="activeTab === 'actions'" class="space-y-4">
          <div
            v-for="action in allActions"
            :key="action.id"
            class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
          >
            <div class="flex items-start justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                    {{ action.name }}
                  </h3>
                  <span
                    class="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-semibold rounded-full"
                  >
                    {{ action.botName }}
                  </span>
                </div>
                <p
                  v-if="action.handler"
                  class="text-sm text-gray-600 dark:text-gray-400 mt-2"
                >
                  Handler:
                  <code
                    class="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded"
                    >{{ action.handler }}</code
                  >
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Commands: {{ action.commands?.length || 0 }}
                </p>
              </div>
            </div>
          </div>

          <div v-if="allActions.length === 0" class="text-center py-12">
            <div class="text-6xl mb-4">⚡</div>
            <p class="text-gray-600 dark:text-gray-400">Chưa có action nào</p>
          </div>
        </div>

        <!-- Commands Tab -->
        <div v-else-if="activeTab === 'commands'" class="space-y-4">
          <div
            v-for="command in allCommands"
            :key="command.id"
            class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                    {{ command.name }}
                  </h3>
                  <span
                    class="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-semibold rounded-full"
                  >
                    {{ command.botName }}
                  </span>
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-semibold rounded-full',
                      command.enabled
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
                    ]"
                  >
                    {{ command.enabled ? "Enabled" : "Disabled" }}
                  </span>
                </div>
                <p
                  v-if="command.description"
                  class="text-sm text-gray-600 dark:text-gray-400 mt-2"
                >
                  {{ command.description }}
                </p>
                <div class="mt-3 space-y-1">
                  <p class="text-sm">
                    <span class="text-gray-500 dark:text-gray-400"
                      >Pattern:</span
                    >
                    <code
                      class="ml-2 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded"
                      >{{ command.pattern }}</code
                    >
                  </p>
                  <p class="text-sm">
                    <span class="text-gray-500 dark:text-gray-400"
                      >Trigger Type:</span
                    >
                    <span class="ml-2 font-semibold">{{
                      command.triggerType
                    }}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div v-if="allCommands.length === 0" class="text-center py-12">
            <div class="text-6xl mb-4">💬</div>
            <p class="text-gray-600 dark:text-gray-400">Chưa có command nào</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modals -->
  <OrganismsAddSkillModel
    v-model:open="isAddSkillModalOpen"
    :selected-bot="selectedBot"
  />
  <OrganismsCreateActionModal
    v-model:open="isCreateActionModalOpen"
    :selected-bot="selectedBot"
    :selected-skill="selectedSkill"
  />
  <OrganismsCreateCommandModal
    v-model:open="isCreateCommandModalOpen"
    :selected-bot="selectedBot"
  />
</template>
