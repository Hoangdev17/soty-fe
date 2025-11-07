<script setup lang="ts">
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "~/stores/auth/auth.store";
import { useNewFeedStore } from "~/stores/newfeed/newfeed.store";
import { useDisplayName } from "~/composables/useDisplayName";
import type { NewFeeds } from "~/stores/newfeed/newfeed.type";

interface Props {
  postId: string;
}

const props = defineProps<Props>();
const modelValue = defineModel<boolean>("open", { required: true });

const newFeedStore = useNewFeedStore();
const authStore = useAuthStore();
const { getUserDisplayName } = useDisplayName();
const { currentPost } = storeToRefs(newFeedStore);
const { user } = storeToRefs(authStore);

const route = useRoute();
const guildId = route.params.guild_id as string;

const isLiking = ref(false);
const commentText = ref("");

async function fetchComments(postId: string) {
  await newFeedStore.getPostById(guildId, postId);
}

watch(
  () => props.postId,
  async (newPostId) => {
    if (newPostId) await fetchComments(newPostId);
  },
  { immediate: true }
);

const isLiked = (post?: NewFeeds | null) => {
  if (!post) return false;
  return (
    post.FeedLike?.some((like) => like.user.id === authStore.user?.id) ?? false
  );
};

async function handleLike(postId: string) {
  isLiking.value = true;
  await newFeedStore.likePost(guildId, postId);
  isLiking.value = false;
}

async function handleUnLike(postId: string) {
  isLiking.value = true;
  await newFeedStore.unlikePost(guildId, postId, user.value?.id!);
  isLiking.value = false;
}

async function handleAddComment(postId: string, content: string) {
  await newFeedStore.createComment(guildId, postId, content);
  commentText.value = "";
}
</script>

<template>
  <UModal v-model:open="modelValue" :ui="{ content: 'max-w-2xl' }">
    <!-- Header -->
    <template #header>
      <h2 class="text-center text-xl font-semibold w-full">
        Bài viết của {{ currentPost?.author.username }}
      </h2>
    </template>

    <!-- Body -->
    <template #body>
      <div v-if="currentPost" class="flex flex-col max-h-[75vh]">
        <!-- Nội dung + comment list -->
        <div class="flex-1 overflow-y-auto pr-1 text-gray-100 scrollbar-hide">
          <!-- user -->
          <div class="flex items-center gap-3 mb-3">
            <UAvatar
              :src="currentPost.author.avatar"
              :alt="currentPost.author.username"
            />
            <div class="flex flex-col">
              <span class="font-semibold">{{
                currentPost.author.username
              }}</span>
              <span class="text-xs text-gray-500">
                {{ new Date(currentPost.createdAt).toLocaleString("vi-VN") }}
              </span>
            </div>
          </div>

          <!-- content -->
          <p class="mb-3 whitespace-pre-line">{{ currentPost.content }}</p>

          <!-- Media -->
          <div v-if="currentPost.media?.length" class="mt-2">
            <div v-if="currentPost.media.length === 1" class="w-full">
              <img
                v-if="currentPost.media[0]?.type === 'IMG'"
                :src="currentPost.media[0].url"
                alt="Post media"
                class="rounded-lg max-h-96 object-contain w-full"
              />
              <video
                v-else-if="currentPost.media[0]?.type === 'VIDEO'"
                controls
                class="rounded-lg max-h-96 w-full"
              >
                <source :src="currentPost.media[0].url" type="video/mp4" />
              </video>
            </div>

            <!-- nhiều ảnh -->
            <div
              v-else
              class="grid grid-cols-2 gap-2 rounded-lg overflow-hidden"
            >
              <div
                v-for="(m, i) in currentPost.media.slice(0, 4)"
                :key="i"
                class="relative bg-black/20 rounded-lg overflow-hidden"
              >
                <img
                  v-if="m.type === 'IMG'"
                  :src="m.url"
                  alt="Post media"
                  class="object-cover w-full h-48"
                />
                <video
                  v-else-if="m.type === 'VIDEO'"
                  controls
                  class="object-cover w-full h-48"
                >
                  <source :src="m.url" type="video/mp4" />
                </video>
                <div
                  v-if="i === 3 && currentPost.media.length > 4"
                  class="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-2xl font-semibold"
                >
                  +{{ currentPost.media.length - 4 }}
                </div>
              </div>
            </div>
          </div>

          <!-- like -->
          <div class="flex items-center gap-2 mt-2">
            <UIcon name="i-lucide-thumbs-up" />
            <span>{{ currentPost.likeCount }}</span>
          </div>

          <!-- actions -->
          <div
            class="flex justify-around border-t border-gray-700 mt-3 pt-2 text-gray-400"
          >
            <UButton
              v-if="!isLiked(currentPost)"
              color="neutral"
              variant="ghost"
              icon="i-lucide-thumbs-up"
              label="Thích"
              :disabled="isLiking"
              @click="handleLike(currentPost.id)"
            />
            <UButton
              v-else
              color="info"
              variant="ghost"
              icon="i-lucide-thumbs-up"
              label="Bỏ thích"
              :disabled="isLiking"
              @click="handleUnLike(currentPost.id)"
            />
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-message-circle"
              label="Bình luận"
            />
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-share-2"
              label="Chia sẻ"
            />
          </div>

          <!-- comment list -->
          <div class="mt-4 border-t border-gray-700 pt-3 pb-24">
            <div
              v-if="!currentPost.FeedComment?.length"
              class="flex flex-col text-gray-500 text-sm items-center py-4"
            >
              <UIcon name="i-lucide-message-square" class="text-4xl mb-2" />
              <span>Chưa có bình luận nào, hãy là người đầu tiên!</span>
            </div>

            <div v-else class="flex flex-col gap-3">
              <div
                v-for="comment in currentPost.FeedComment"
                :key="comment.id"
                class="flex gap-3 items-start"
              >
                <UAvatar :src="comment.user.avatar" size="sm" />
                <div class="bg-gray-800 rounded-lg px-3 py-2 w-full">
                  <div class="flex justify-between items-center">
                    <span class="font-semibold text-gray-100 text-sm">
                      {{ getUserDisplayName(comment.user) }}
                    </span>
                    <span class="text-xs text-gray-500">
                      {{ new Date(comment.createdAt).toLocaleString("vi-VN") }}
                    </span>
                  </div>
                  <p class="text-gray-300 text-sm mt-1 whitespace-pre-line">
                    {{ comment.content }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- input comment sticky -->
        <div
          class="sticky bottom-0 left-0 bg-gray-900 border-t border-gray-700 p-3 flex items-center gap-2"
        >
          <UAvatar
            :src="authStore.user?.avatar!"
            :alt="authStore.user?.username"
            size="md"
          />

          <div
            class="flex-1 flex items-center bg-gray-800 rounded-2xl px-3 py-1 focus-within:ring-1 ring-info transition"
          >
            <UInput
              v-model="commentText"
              placeholder="Viết bình luận..."
              color="neutral"
              variant="none"
              class="flex-1 text-white placeholder-gray-400 border-0 bg-transparent focus:ring-0"
              @keyup.enter="handleAddComment(currentPost.id, commentText)"
            />

            <!-- Toolbar -->
            <div class="flex items-center gap-1 ml-2">
              <UButton
                icon="i-lucide-smile"
                color="neutral"
                variant="ghost"
                size="xs"
              />
              <UButton
                icon="i-lucide-image"
                color="neutral"
                variant="ghost"
                size="xs"
              />
              <UButton
                icon="i-lucide-gift"
                color="neutral"
                variant="ghost"
                size="xs"
              />
            </div>
          </div>

          <UButton
            color="info"
            variant="solid"
            icon="i-lucide-send"
            :disabled="!commentText.trim()"
            @click="handleAddComment(currentPost.id, commentText)"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
