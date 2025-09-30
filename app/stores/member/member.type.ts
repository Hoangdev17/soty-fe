export interface Member {
  id: string;
  userId: string;
  guildId: string;
  joinedAt: Date;
  nickname?: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  pronouns?: string;
  accentColor?: number;
  bannerColor?: number;
  flags: string[];
  permissions: string[];
  bannable: boolean;
  kickable: boolean;
  manageable: boolean;
  moderatable: boolean;
  pending: boolean;
  xp: number;
  coins: number;
  xepo: number;
  currentLevel: number;
  title?: string;
  lastActivityAt?: Date;
  dailyStreak: number;
  lastXpClaimedAt?: Date;
  referralCode?: string;
  settings?: any;
  avatarDecorationId?: string;
  profileEffectId?: string;
  // Relations
  user?: {
    id: string;
    username: string;
    avatar?: string;
    globalName?: string;
  };
  guild?: {
    id: string;
    name: string;
    avatar?: string;
  };
  roles?: any[]; // GuildMemberRole[]
  messages?: any[]; // GuildMessage[]
  guildRoles?: any[]; // GuildRole[]
  xpLogs?: any[]; // GuildXpLog[]
  missionLogs?: any[]; // GuildMissionLog[]
  badges?: any[]; // GuildMemberBadge[]
  inventory?: any[]; // GuildMemberInventory[]
  statusCode?: number; // HTTP status code from join request (e.g., 200, 202)
}

export interface MemberState {
  members: Record<string, Member[]>; // guildId -> members[]
  memberCount: number | null;
  loading: boolean;
  error: string | null;
}
