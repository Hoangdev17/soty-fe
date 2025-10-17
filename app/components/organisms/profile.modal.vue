<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui";
import { useAuthStore } from "~/stores/auth/auth.store";
import type { Decorations, User } from "~/stores/auth/auth.type";
import { useChannelStore } from "~/stores/channels/channel.store";

const props = defineProps<{
  userId: string;
}>();

const user = ref<User | null>(null);
const avatarEffectUser = ref<Decorations | null>(null);
const profileEffectUser = ref<Decorations | null>(null);

const items = [
  {
    label: "Hoạt động",
    slot: "actions" as const,
  },
  {
    label: "Bạn chung",
    slot: "friendsame" as const,
  },
  {
    label: "Máy chủ chung",
    slot: "communitysame" as const,
  },
] satisfies TabsItem[];

const authStore = useAuthStore();

async function fetchUser() {
  const res = await authStore.fetchUserById(props.userId);

  user.value = res;

  const avatarEffect = authStore.decoration.find(
    (a) => a.id === user.value?.avatarEffectId
  );

  if (avatarEffect) avatarEffectUser.value = avatarEffect;

  const profileEffect = authStore.profileDecoration.find(
    (p) => p.id === user.value?.profileEffectId
  );

  if (profileEffect) profileEffectUser.value = profileEffect;
  console.log("profile", profileEffectUser.value);
}

watch(
  () => props.userId,
  async (newId) => {
    if (newId) {
      fetchUser();
    }
  },
  { immediate: true }
);

function formatDate(date?: string | Date | null) {
  if (!date) return "Không rõ";
  return new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const isMe = computed(() => props.userId === authStore.user?.id);
const isFriend = computed(() => {
  return authStore.friends?.some((f) => f.id === props.userId) ?? false;
});

const channelStore = useChannelStore();

const handleCreateDM = async (userId: string) => {
  try {
    const channelDM = await channelStore.createChannelDm([userId]);
    navigateTo(`/@me/${channelDM.id}`);
  } catch (error) {}
};
</script>

<template>
  <UModal class="overflow-visible max-w-4xl">
    <template #content>
      <div class="flex bg-[#1e1e1e] rounded-4xl p-10">
        <!-- Left section -->
        <div
          class="relative flex-1 rounded-xl overflow-hidden border border-[#2b2b2b]"
        >
          <!-- Profile Effect Overlay -->
          <div
            v-if="profileEffectUser?.metadata?.effects?.length"
            class="absolute inset-0 w-full h-full pointer-events-none z-10 rounded-xl overflow-hidden"
          >
            <!-- Duyệt qua từng effect layer -->
            <img
              v-for="(effect, index) in profileEffectUser.metadata.effects"
              :key="index"
              :src="effect.src"
              :style="{
                position: 'absolute',
                top: effect.position?.y + 'px',
                left: effect.position?.x + 'px',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: effect.zIndex || 1,
                animation: effect.loop
                  ? `effectLoop-${index} ${effect.duration}ms linear infinite`
                  : `effectOnce-${index} ${effect.duration}ms linear 1`,
                animationDelay: (effect.start || 0) + 'ms',
              }"
              alt="Profile Effect Layer"
            />
          </div>

          <!-- Header (Banner) -->
          <div
            class="h-32 rounded-t-xl bg-cover bg-center"
            :style="{
              backgroundImage: user?.banner
                ? `url(${user.banner})`
                : 'linear-gradient(90deg, #00E5CC, #0099FF)',
            }"
          ></div>

          <!-- Avatar -->
          <div class="absolute left-6 top-32 -translate-y-1/2 z-20">
            <div class="relative w-24 h-24 flex items-center justify-center">
              <!-- Avatar -->
              <UAvatar
                :src="user?.avatar || ''"
                :alt="user?.username"
                size="xl"
                class="w-20 h-20"
              />

              <!-- Avatar Effect -->
              <img
                v-if="avatarEffectUser?.metadata?.link?.startsWith('http')"
                :src="avatarEffectUser.metadata.link"
                alt="Avatar Effect"
                class="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 scale-110 object-contain pointer-events-none z-10"
              />
            </div>
          </div>

          <!-- Body -->
          <div class="pt-15 pb-6 px-5 text-white relative z-20">
            <h2 class="text-xl font-semibold">{{ user?.username }}</h2>
            <p class="text-sm text-gray-400">{{ user?.bio }}</p>

            <div class="flex gap-2 mt-4">
              <UButton
                v-if="isMe === true"
                color="primary"
                variant="outline"
                icon="i-lucide-settings"
                @click="
                  () => {
                    navigateTo(`/settings/@${user?.username}`);
                  }
                "
              >
                Sửa hồ sơ
              </UButton>
              <UButton
                v-else
                color="primary"
                variant="outline"
                icon="i-lucide-message-circle"
                @click="handleCreateDM(user?.id || '')"
              >
                Nhắn tin
              </UButton>
              <UButton
                variant="soft"
                icon="i-lucide-users"
                v-if="!isMe && isFriend"
              ></UButton>
              <UButton
                variant="soft"
                icon="i-lucide-more-horizontal"
                v-if="!isMe"
              />
            </div>

            <p class="mt-5">Gia nhập từ</p>
            <div class="flex mt-3">
              <UAvatar
                :src="user?.avatar || ''"
                :alt="user?.username"
                class="w-6 h-6"
              ></UAvatar>
              <span class="text-sm text-gray-500 ml-2">{{
                formatDate(user?.createdAt)
              }}</span>
            </div>
          </div>
        </div>

        <!-- Right section -->
        <div class="flex-1 p-6 text-white">
          <UTabs
            :items="items"
            variant="link"
            :ui="{ trigger: 'grow' }"
            class="gap-4"
          >
            <!-- Tab 1: actions -->
            <template #actions="{ item }">
              <div
                class="flex flex-col items-center justify-center h-full text-center gap-3 min-h-[300px]"
              >
                <span class="text-md text-white">
                  User không có hoạt động nào để chia sẻ gần đây
                </span>
                <span class="text-sm text-gray-500">
                  Bạn phải suy đoán vì họ đã để trống không, hãy nói cho họ rằng
                  bạn nghĩ họ siêu cấp bí ẩn
                </span>
                <UButton variant="outline" icon="i-lucide-message-circle">
                  Nhắn tin
                </UButton>
              </div>
            </template>

            <!-- Tab 2: friendsame -->
            <template #friendsame="{ item }">
              <div class="flex flex-col h-full text-center gap-4 min-h-[300px]">
                <div class="flex">
                  <UAvatar
                    src="/logo.png"
                    alt="soty"
                    class="w-12 h-12"
                    :chip="{
                      inset: true,
                      position: 'bottom-right',
                      size: '2xl',
                    }"
                  />

                  <span class="text-md ml-3 mt-3">Soty</span>
                </div>
              </div>
            </template>

            <template #communitysame="{ item }">
              <div class="flex flex-col h-full gap-4 min-h-[300px] text-white">
                <!-- Mỗi community item -->
                <div
                  class="flex items-center p-3 rounded-lg transition-all duration-200 cursor-pointer hover:bg-[#2b2b2b]/70 group"
                >
                  <UAvatar
                    src="/logo.png"
                    alt="soty"
                    class="w-12 h-12 transform transition-transform duration-200"
                    :chip="{
                      inset: true,
                      position: 'bottom-right',
                    }"
                  />

                  <span
                    class="text-md ml-3 transition-colors duration-200 group-hover:text-[#00E5CC]"
                  >
                    Soty
                  </span>
                </div>
              </div>
            </template>
          </UTabs>
        </div>
      </div>
    </template>
  </UModal>
</template>
