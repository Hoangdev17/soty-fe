<script setup lang="ts">
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "~/stores/auth/auth.store";
import UploadButton from "../molecules/upload.button.vue";
import { useNewFeedStore } from "~/stores/newfeed/newfeed.store";

const modelValue = defineModel<boolean>("open", { required: true });

const authStore = useAuthStore();
const newfeedStore = useNewFeedStore();
const route = useRoute();

const { user } = storeToRefs(authStore);
const guildId = route.params.guild_id as string;
const isLoadingPost = ref(false);

const state = ref({
  content: "",
  media: [] as { url: string; type: "IMG" | "VIDEO" }[],
});

function handleImageUploaded(url: string) {
  state.value.media.push({
    url,
    type: "IMG",
  });
}

async function handlePost() {
  try {
    isLoadingPost.value = true;

    await newfeedStore.createPost(
      guildId,
      state.value.content,
      state.value.media
    );

    // Sau khi đăng thành công → đóng modal
    modelValue.value = false;
  } catch (error) {
    console.error("Error creating post:", error);
  } finally {
    // Reset form
    isLoadingPost.value = false;
    state.value = {
      content: "",
      media: [],
    };
  }
}
</script>

<template>
  <UModal v-model:open="modelValue" :ui="{ content: 'max-w-2xl' }">
    <template #header>
      <h2 class="text-center text-xl font-semibold w-full">Tạo bài viết</h2>
    </template>

    <template #body>
      <div class="p-4 text-gray-100">
        <!-- User Info -->
        <div class="flex items-center gap-3 mb-4">
          <UAvatar size="lg" :src="user?.avatar!" />
          <div>
            <p class="font-semibold">{{ user?.username }}</p>
            <UButton
              size="xs"
              color="neutral"
              variant="soft"
              icon="i-lucide-users"
              label="Bạn bè"
              class="mt-1"
            />
          </div>
        </div>

        <!-- Input -->
        <textarea
          v-model="state.content"
          :placeholder="`${user?.username} ơi bạn đang nghĩ gì thế?`"
          class="w-full bg-transparent text-lg resize-none outline-none min-h-[120px] placeholder-gray-400"
        ></textarea>

        <!-- Preview ảnh -->
        <div
          v-if="state.media.length"
          class="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2"
        >
          <div
            v-for="(m, i) in state.media"
            :key="i"
            class="relative group rounded-lg overflow-hidden"
          >
            <img
              v-if="m.type === 'IMG'"
              :src="m.url"
              alt="Preview"
              class="object-cover w-full h-40"
            />
            <button
              class="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
              @click="state.media.splice(i, 1)"
            >
              <UIcon name="i-lucide-x" />
            </button>
          </div>
        </div>

        <!-- Thêm vào bài viết -->
        <div
          class="flex items-center justify-between border border-gray-700 rounded-xl p-2 mt-3"
        >
          <p class="text-sm text-gray-400 ml-2">Thêm vào bài viết của bạn</p>
          <div class="flex items-center gap-2">
            <UploadButton
              variant="ghost"
              size="sm"
              icon="i-lucide-image"
              @success="handleImageUploaded"
            />
            <UButton icon="i-lucide-user-plus" color="info" variant="ghost" />
            <UButton icon="i-lucide-smile" color="warning" variant="ghost" />
            <UButton icon="i-lucide-map-pin" color="error" variant="ghost" />
            <UButton icon="i-lucide-gif" color="success" variant="ghost" />
            <UButton
              icon="i-lucide-more-horizontal"
              color="neutral"
              variant="ghost"
            />
          </div>
        </div>

        <!-- Nút Đăng -->
        <UButton
          block
          size="lg"
          color="primary"
          label="Đăng"
          class="mt-4"
          :loading="isLoadingPost"
          :disabled="!state.content.trim() || state.media.length === 0"
          @click="handlePost"
        />
      </div>
    </template>
  </UModal>
</template>
