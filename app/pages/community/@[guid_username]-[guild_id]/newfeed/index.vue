<script setup lang="ts">
import { useAuthStore } from "~/stores/auth/auth.store";
import { useCommunityStore } from "~/stores/community/community.store";
import { useMemberStore } from "~/stores/member/member.store";
import { useNewFeedStore } from "~/stores/newfeed/newfeed.store";
import type { FeedLike, NewFeeds } from "~/stores/newfeed/newfeed.type";

definePageMeta({
  layout: "community-layout",
  middleware: "required-auth",
});

const authStore = useAuthStore();
const newFeedStore = useNewFeedStore();
const communityStore = useCommunityStore();
const memberStore = useMemberStore();
const route = useRoute();

const { user } = storeToRefs(authStore);
const { post } = storeToRefs(newFeedStore);
const { currentCommunity } = storeToRefs(useCommunityStore());
const guildId = route.params.guild_id as string;

const isOpenModalPost = ref(false);
const isOpenModalComment = ref(false);
const postCommentId = ref("");
const isLiking = ref(false);

function handleOpenPostModal() {
  isOpenModalPost.value = true;
}

function handleOpenCommentModal(postId: string) {
  isOpenModalComment.value = true;
  postCommentId.value = postId;
}

async function fetchNewFeed() {
  await newFeedStore.getAllPost(guildId);
}

onMounted(async () => {
  if (!currentCommunity.value) {
    await communityStore.fetchCommunityById(guildId);
    await memberStore.fetchMembersViaWebSocket(guildId);
  }
  fetchNewFeed();
});

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

const isLiked = (post: NewFeeds) => {
  return post.FeedLike?.some((like) => like.user.id === authStore.user?.id);
};
</script>

<template>
  <!-- Ô tạo bài viết -->
  <div
    class="bg-gray-900 rounded-2xl p-4 shadow-md w-full max-w-2xl mx-auto text-gray-100 mt-3"
  >
    <div class="flex items-center gap-3">
      <UAvatar size="lg" :src="user?.avatar!" :alt="user?.username" />

      <UButton
        color="neutral"
        variant="soft"
        class="flex-1 justify-start bg-gray-800 text-gray-400 rounded-full py-3 px-5 hover:bg-gray-700 transition"
        @click="handleOpenPostModal"
      >
        {{ user?.username }} ơi, bạn đang nghĩ gì thế?
      </UButton>
    </div>

    <div class="flex justify-between border-t border-gray-700 mt-3 pt-3">
      <UButton
        color="error"
        variant="ghost"
        icon="i-lucide-video"
        label="Video trực tiếp"
      />
      <UButton
        color="primary"
        variant="ghost"
        icon="i-lucide-image"
        label="Ảnh/video"
      />
      <UButton
        color="warning"
        variant="ghost"
        icon="i-lucide-smile"
        label="Cảm xúc/hoạt động"
      />
    </div>
  </div>

  <!-- Danh sách bài viết -->
  <div v-if="post?.length" class="mt-6 space-y-5 max-w-2xl mx-auto">
    <UCard v-for="p in post" :key="p.id" class="bg-gray-900 text-gray-100">
      <!-- Thông tin tác giả -->
      <div class="flex items-center gap-3 mb-3">
        <UAvatar :src="p.author.avatar" :alt="p.author.username" />
        <div class="flex flex-col">
          <span class="font-semibold text-gray-200">{{
            p.author.username
          }}</span>
          <span class="text-xs text-gray-500">
            {{ new Date(p.createdAt).toLocaleString("vi-VN") }}
          </span>
        </div>
      </div>

      <!-- Nội dung -->
      <p class="text-gray-100 mb-3 whitespace-pre-line">{{ p.content }}</p>

      <!-- Media -->
      <div v-if="p.media?.length" class="mt-2">
        <!-- Nếu chỉ có 1 ảnh/video -->
        <div v-if="p.media.length === 1" class="w-full">
          <img
            v-if="p.media[0]?.type === 'IMG'"
            :src="p.media[0].url"
            alt="Post media"
            class="rounded-lg max-h-96 object-contain w-full"
          />
          <video
            v-else-if="p.media[0]?.type === 'VIDEO'"
            controls
            class="rounded-lg max-h-96 w-full"
          >
            <source :src="p.media[0].url" type="video/mp4" />
          </video>
        </div>

        <!-- Nếu có nhiều ảnh -->
        <div v-else class="grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
          <div
            v-for="(m, i) in p.media.slice(0, 4)"
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

            <!-- Overlay nếu còn nhiều ảnh -->
            <div
              v-if="i === 3 && p.media.length > 4"
              class="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-2xl font-semibold"
            >
              +{{ p.media.length - 4 }}
            </div>
          </div>
        </div>
      </div>

      <span><UIcon name="i-lucide-thumbs-up" /> {{ p.likeCount }} </span>

      <!-- Nút tương tác -->
      <div
        class="flex justify-around border-t border-gray-700 mt-3 pt-2 text-gray-400"
      >
        <UButton
          v-if="!isLiked(p)"
          color="neutral"
          variant="ghost"
          icon="i-lucide-thumbs-up"
          label="Thích"
          :disabled="isLiking"
          @click="handleLike(p.id)"
        />
        <UButton
          v-if="isLiked(p)"
          color="info"
          variant="ghost"
          icon="i-lucide-thumbs-up"
          label="Thích"
          :disabled="isLiking"
          @click="handleUnLike(p.id)"
        />
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-message-circle"
          label="Bình luận"
          @click="handleOpenCommentModal(p.id)"
        />
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-share-2"
          label="Chia sẻ"
        />
      </div>
    </UCard>
  </div>

  <!-- Nếu chưa có bài nào -->
  <div v-else class="text-center text-gray-500 mt-6">
    Chưa có bài viết nào trong cộng đồng này.
  </div>

  <!-- Modal tạo bài viết -->
  <OrganismsModalCreatePost v-model:open="isOpenModalPost" />
  <OrganismsCommentModal
    v-model:open="isOpenModalComment"
    :post-id="postCommentId"
  />
</template>
