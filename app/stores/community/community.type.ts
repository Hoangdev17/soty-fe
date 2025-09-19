import type { Channel } from "../channels/channel.type";
import type { Role } from "../roles/role.type";

// Community types
export interface Community {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  banner?: string; // Thay cho coverImage
  memberCount: number;
  channels: Channel[];
  createdAt: string;
  updatedAt?: string; // Optional vì BE không có
  deletedAt?: string | null;
  ownerId: string;
  owner?: {
    id: string;
    username: string;
    avatar?: string;
  };
  roles: Role[];

  // Các field mới từ BE
  available: boolean;
  bans: any[]; // Có thể định nghĩa type cụ thể hơn sau
  discoverySplash?: string | null;
  invites: any[]; // Có thể định nghĩa type cụ thể hơn sau
  large: boolean;
  maximumMembers?: number | null;
  paymentModel?: any | null;
  preferredLocale: string;
  pricing: number;
  notificationChannelId?: string | null;
  systemChannelId?: string | null;
  vanityUrlCode?: string | null;
  vanityUrlUses: number;
  url: string;
  premiumTier: number;
  premiumSubscriptionCount: number;
  visibility: "PUBLIC" | "PRIVATE" | string;

  // Field client-side (không có trong BE response)
  isJoined?: boolean; // Optional vì BE không trả về
}

export interface CommunityMember {
  id: string;
  userId: string;
  communityId: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
}

export interface CreateCommunityData {
  name: string;
  description: string;
  avatar?: string;
  banner?: string;
  isPrivate?: boolean;
}

export interface CommunityFilters {
  search?: string;
  sortBy?: "newest" | "popular" | "name";
  limit?: number;
  offset?: number;
  visibility?: "PUBLIC" | "PRIVATE";
}
