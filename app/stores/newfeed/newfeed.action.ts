import { useNewFeedStore } from "./newfeed.store";
import type {
  commentPayLoad,
  FeedComment,
  FeedLike,
  NewFeeds,
} from "./newfeed.type";

export const newfeedAction = {
  async createPost(
    guildId: string,
    content: string,
    media: { url: string; type: string }[]
  ) {
    const { fetchWithAuth } = useFetchWithAuth();
    const newFeedStore = useNewFeedStore();

    const res = await fetchWithAuth<NewFeeds>(`/community/feed/${guildId}`, {
      method: "POST",
      body: JSON.stringify({
        content,
        media,
      }),
    });

    newFeedStore.post.unshift(res);

    return res;
  },

  async getAllPost(guildId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const newFeedStore = useNewFeedStore();

    const res = await fetchWithAuth<NewFeeds[]>(`/community/feed/${guildId}`, {
      method: "GET",
    });

    newFeedStore.post = res;

    return res;
  },

  async likePost(guildId: string, postId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const newFeedStore = useNewFeedStore();

    const res = await fetchWithAuth<FeedLike>(
      `/community/feed/${guildId}/${postId}/like`,
      {
        method: "POST",
      }
    );

    newFeedStore.postLike.push(res);
    const post = newFeedStore.post.find((a) => a.id === postId);

    if (post) {
      post.likeCount++;
      post.FeedLike.push(res);
    }

    if (newFeedStore.currentPost && newFeedStore.currentPost.id === postId) {
      newFeedStore.currentPost.likeCount++;
      newFeedStore.currentPost.FeedLike.push(res);
    }

    return res;
  },

  async unlikePost(guildId: string, postId: string, userId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const newFeedStore = useNewFeedStore();

    const res = await fetchWithAuth<FeedLike>(
      `/community/feed/${guildId}/${postId}/unlike`,
      {
        method: "DELETE",
      }
    );

    newFeedStore.postLike = newFeedStore.postLike.filter(
      (a) => a.user.id !== userId
    );
    const post = newFeedStore.post.find((a) => a.id === postId);
    if (post) {
      post.likeCount--;
      post.FeedLike = post.FeedLike.filter((a) => a.user.id !== userId);
    }

    if (newFeedStore.currentPost && newFeedStore.currentPost.id === postId) {
      newFeedStore.currentPost.likeCount--;
      newFeedStore.currentPost.FeedLike =
        newFeedStore.currentPost.FeedLike.filter((a) => a.user.id !== userId);
    }

    return res;
  },

  async createComment(guildId: string, postId: string, content: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const newFeedStore = useNewFeedStore();

    const res = await fetchWithAuth<FeedComment>(
      `/community/feed/${guildId}/${postId}/comment`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      }
    );

    const post = newFeedStore.post.find((a) => a.id === postId);
    if (post) {
      post.FeedComment.push(res);
      post.commentCount++;
    }

    if (newFeedStore.currentPost && newFeedStore.currentPost.id === postId) {
      newFeedStore.currentPost.FeedComment.push(res);
      newFeedStore.currentPost.commentCount++;
    }

    return res;
  },

  async getPostById(guildId: string, postId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const newFeedStore = useNewFeedStore();

    const res = await fetchWithAuth<NewFeeds>(
      `/community/feed/${guildId}/${postId}`,
      {
        method: "GET",
      }
    );

    newFeedStore.currentPost = res;

    return res;
  },

  async getCommentByPost(guildId: string, postId: string) {
    const { fetchWithAuth } = useFetchWithAuth();
    const newFeedStore = useNewFeedStore();

    const res = await fetchWithAuth<commentPayLoad>(
      `/community/feed/${guildId}/${postId}/comment`,
      {
        method: "GET",
      }
    );

    const post = newFeedStore.post.find((a) => a.id === postId);
    if (post) {
      post.commentCount = res.total;
      post.FeedComment.push(res.comments);
    }

    if (newFeedStore.currentPost && newFeedStore.currentPost.id === postId) {
      newFeedStore.currentPost.FeedComment.push(res.comments);
      newFeedStore.currentPost.commentCount = res.total;
    }

    return res;
  },
};
