export interface NewFeeds {
  id: string;
  guildId: string;
  authorId: string;
  author: {
    id: string;
    avatar: string;
    username: string;
  };
  content: string;
  media: {
    url: string;
    type: string;
  }[];
  FeedLike: FeedLike[];
  FeedComment: FeedComment[];
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedLike {
  id: string;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  post: {
    guildId: string;
  };
  authorId: string;
  postId: string;
  createdAt: Date;
}

export interface FeedComment {
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

export interface commentPayLoad {
  comments: FeedComment;
  total: number;
}
