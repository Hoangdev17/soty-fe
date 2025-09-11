enum ChannelType {
  GUILD_TEXT = "GUILD_TEXT",
  DM = "DM",
  GUILD_VOICE = "GUILD_VOICE",
  GROUP_DM = "GROUP_DM",
  GUILD_CATEGORY = "GUILD_CATEGORY",
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

  recipients: string[];
  maxMembers: number | null;

  createdAt: Date;
  updatedAt: Date;
};
