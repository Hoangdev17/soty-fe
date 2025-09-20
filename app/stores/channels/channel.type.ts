export enum ChannelType {
  GUILD_TEXT = "GUILD_TEXT",
  DM = "DM",
  GUILD_VOICE = "GUILD_VOICE",
  GROUP_DM = "GROUP_DM",
  GUILD_CATEGORY = "GUILD_CATEGORY",
  SEMINAR = "SEMINAR",
  GUILD_PUBLIC_THREAD = "GUILD_PUBLIC_THREAD",
  GUILD_PRIVATE_THREAD = "GUILD_PRIVATE_THREAD",
  GUILD_NEWS = "GUILD_NEWS",
  GUILD_NEWS_THREAD = "GUILD_NEWS_THREAD",
  GUILD_STAGE_VOICE = "GUILD_STAGE_VOICE",
  GUILD_DIRECTORY = "GUILD_DIRECTORY",
  GUILD_FORUM = "GUILD_FORUM",
}

export type Channel = {
  id: string;
  name: string;
  description: string;
  lastMessageId: string | null;
  manageable: boolean;
  starterMessageId: string | null;
  nsfw: boolean;
  parentId: string | null;
  position: number;
  topic: string | null;
  type: ChannelType;
  viewAble: boolean;
  rateLimitPerUser: number | null;

  recipients?: {
    id: string;
    username: string;
    avatar: string | null;
  }[];

  maxMembers: number | null;

  createdAt: Date;
  updatedAt: Date;
};
