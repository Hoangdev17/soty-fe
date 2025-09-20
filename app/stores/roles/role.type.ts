import type { Member } from "../member/member.type";

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: "general" | "text" | "voice" | "management" | "administrative";
}

export interface Role {
  id: string;
  name: string;
  color: string; // Hex color code
  icon?: string; // Icon field to store color or icon data
  position: number; // Higher = more authority
  hoist: boolean; // Display separately in member list
  mentionable: boolean;
  managed: boolean; // Bot/integration role
  permissions: string[]; // Array of permission IDs
  guildId: string;
  memberCount?: number;
  members?: {
    user?: {
      id: string;
      username: string;
      globalName: string;
      avatar?: string;
    };
    member?: {
      id: string;
      username: string;
      discriminator: string;
      avatar?: string;
    };
    id: string;
  }[]; // Array of member
  createdAt: string;
  updatedAt?: string;
}

export interface RoleState {
  roles: Record<string, Role[]>; // guildId -> roles[]
  permissions: Permission[];
  loading: boolean;
  error: string | null;
}

export interface CreateRoleData {
  name: string;
  color?: string;
  icon?: string;
  hoist?: boolean;
  mentionable?: boolean;
  permissions?: string[];
}

export interface UpdateRoleData extends Partial<CreateRoleData> {
  position?: number;
}

export interface RoleAssignment {
  memberId: string;
  roleIds: string[];
}

// Default permissions list
export const DEFAULT_PERMISSIONS: Permission[] = [
  // Basic permissions
  {
    id: "VIEW_CHANNELS",
    name: "View Channels",
    description: "Can view text and voice channels",
    category: "general",
  },
  {
    id: "SEND_MESSAGES",
    name: "Send Messages",
    description: "Can send messages in text channels",
    category: "text",
  },
  {
    id: "SEND_TTS_MESSAGES",
    name: "Send TTS Messages",
    description: "Can send text-to-speech messages",
    category: "text",
  },
  {
    id: "MANAGE_MESSAGES",
    name: "Manage Messages",
    description: "Can delete other members' messages",
    category: "text",
  },
  {
    id: "EMBED_LINKS",
    name: "Embed Links",
    description: "Can post links that show embedded content",
    category: "text",
  },
  {
    id: "ATTACH_FILES",
    name: "Attach Files",
    description: "Can upload files and images",
    category: "text",
  },
  {
    id: "READ_MESSAGE_HISTORY",
    name: "Read Message History",
    description: "Can view previous messages",
    category: "text",
  },
  {
    id: "MENTION_EVERYONE",
    name: "Mention @everyone",
    description: "Can mention @everyone and @here",
    category: "text",
  },
  {
    id: "USE_EXTERNAL_EMOJIS",
    name: "Use External Emojis",
    description: "Can use emojis from other servers",
    category: "text",
  },
  {
    id: "VIEW_GUILD_INSIGHTS",
    name: "View Server Insights",
    description: "Can view server analytics and insights",
    category: "general",
  },
  {
    id: "ADD_REACTIONS",
    name: "Add Reactions",
    description: "Can add emoji reactions to messages",
    category: "text",
  },

  // Voice channel permissions
  {
    id: "CONNECT",
    name: "Connect",
    description: "Can join voice channels",
    category: "voice",
  },
  {
    id: "SPEAK",
    name: "Speak",
    description: "Can speak in voice channels",
    category: "voice",
  },
  {
    id: "MUTE_MEMBERS",
    name: "Mute Members",
    description: "Can mute members in voice channels",
    category: "voice",
  },
  {
    id: "DEAFEN_MEMBERS",
    name: "Deafen Members",
    description: "Can deafen members in voice channels",
    category: "voice",
  },
  {
    id: "MOVE_MEMBERS",
    name: "Move Members",
    description: "Can move members between voice channels",
    category: "voice",
  },
  {
    id: "USE_VAD",
    name: "Use Voice Activity",
    description: "Can use voice activity detection",
    category: "voice",
  },
  {
    id: "PRIORITY_SPEAKER",
    name: "Priority Speaker",
    description: "Can be given priority when speaking",
    category: "voice",
  },
  {
    id: "STREAM",
    name: "Stream",
    description: "Can stream video in voice channels",
    category: "voice",
  },

  // Moderation permissions
  {
    id: "KICK_MEMBERS",
    name: "Kick Members",
    description: "Can remove members from the server",
    category: "management",
  },
  {
    id: "BAN_MEMBERS",
    name: "Ban Members",
    description: "Can ban members from the server",
    category: "management",
  },
  {
    id: "MANAGE_ROLES",
    name: "Manage Roles",
    description: "Can create, edit, and delete roles",
    category: "management",
  },
  {
    id: "MANAGE_CHANNELS",
    name: "Manage Channels",
    description: "Can create, edit, and delete channels",
    category: "management",
  },
  {
    id: "MANAGE_GUILD",
    name: "Manage Server",
    description: "Can edit server settings",
    category: "management",
  },
  {
    id: "PRIORITY_SPEAKER",
    name: "Priority Speaker",
    description: "Can be given priority when speaking",
    category: "voice",
  },
  {
    id: "STREAM",
    name: "Stream",
    description: "Can stream video in voice channels",
    category: "voice",
  },

  // Advanced permissions
  {
    id: "USE_SLASH_COMMANDS",
    name: "Use Slash Commands",
    description: "Can use application commands",
    category: "general",
  },
  {
    id: "MANAGE_THREADS",
    name: "Manage Threads",
    description: "Can create and manage threads",
    category: "text",
  },
  {
    id: "CREATE_PUBLIC_THREADS",
    name: "Create Public Threads",
    description: "Can create public threads",
    category: "text",
  },
  {
    id: "CREATE_PRIVATE_THREADS",
    name: "Create Private Threads",
    description: "Can create private threads",
    category: "text",
  },
  {
    id: "USE_EXTERNAL_STICKERS",
    name: "Use External Stickers",
    description: "Can use stickers from other servers",
    category: "text",
  },
  {
    id: "SEND_MESSAGES_IN_THREADS",
    name: "Send Messages in Threads",
    description: "Can send messages in threads",
    category: "text",
  },
  {
    id: "USE_EMBEDDED_ACTIVITIES",
    name: "Use Activities",
    description: "Can use activities in voice channels",
    category: "voice",
  },

  // Administrative permissions
  {
    id: "ADMINISTRATOR",
    name: "Administrator",
    description: "Full access to all server features",
    category: "administrative",
  },
  {
    id: "CREATE_INSTANT_INVITE",
    name: "Create Invite",
    description: "Can create server invites",
    category: "general",
  },
  {
    id: "CHANGE_NICKNAME",
    name: "Change Nickname",
    description: "Can change their own nickname",
    category: "general",
  },
  {
    id: "MANAGE_NICKNAMES",
    name: "Manage Nicknames",
    description: "Can change other members' nicknames",
    category: "management",
  },
];

// Guild Permission Constants
export class GuildPermissions {
  // Basic permissions
  static readonly VIEW_CHANNELS = 1n << 0n; // 1
  static readonly SEND_MESSAGES = 1n << 1n; // 2
  static readonly SEND_TTS_MESSAGES = 1n << 2n; // 4
  static readonly MANAGE_MESSAGES = 1n << 3n; // 8
  static readonly EMBED_LINKS = 1n << 4n; // 16
  static readonly ATTACH_FILES = 1n << 5n; // 32
  static readonly READ_MESSAGE_HISTORY = 1n << 6n; // 64
  static readonly MENTION_EVERYONE = 1n << 7n; // 128
  static readonly USE_EXTERNAL_EMOJIS = 1n << 8n; // 256
  static readonly VIEW_GUILD_INSIGHTS = 1n << 9n; // 512

  // Voice permissions
  static readonly CONNECT = 1n << 10n; // 1024
  static readonly SPEAK = 1n << 11n; // 2048
  static readonly MUTE_MEMBERS = 1n << 12n; // 4096
  static readonly DEAFEN_MEMBERS = 1n << 13n; // 8192
  static readonly MOVE_MEMBERS = 1n << 14n; // 16384
  static readonly USE_VAD = 1n << 15n; // 32768

  // Moderation permissions
  static readonly KICK_MEMBERS = 1n << 16n; // 65536
  static readonly BAN_MEMBERS = 1n << 17n; // 131072
  static readonly MANAGE_ROLES = 1n << 18n; // 262144
  static readonly MANAGE_CHANNELS = 1n << 19n; // 524288
  static readonly MANAGE_GUILD = 1n << 20n; // 1048576
  static readonly ADD_REACTIONS = 1n << 21n; // 2097152
  static readonly VIEW_AUDIT_LOG = 1n << 22n; // 4194304

  // Advanced permissions
  static readonly PRIORITY_SPEAKER = 1n << 23n; // 8388608
  static readonly STREAM = 1n << 24n; // 16777216
  static readonly USE_SLASH_COMMANDS = 1n << 25n; // 33554432
  static readonly MANAGE_THREADS = 1n << 26n; // 67108864
  static readonly CREATE_PUBLIC_THREADS = 1n << 27n; // 134217728
  static readonly CREATE_PRIVATE_THREADS = 1n << 28n; // 268435456
  static readonly USE_EXTERNAL_STICKERS = 1n << 29n; // 537870912
  static readonly SEND_MESSAGES_IN_THREADS = 1n << 30n; // 1073741824
  static readonly USE_EMBEDDED_ACTIVITIES = 1n << 31n; // 2147483648
  static readonly MODERATE_MEMBERS = 1n << 32n; // 4294967296

  // Admin permissions
  static readonly ADMINISTRATOR = 1n << 33n; // 8589934592
  static readonly CREATE_INSTANT_INVITE = 1n << 34n; // 17179869184
  static readonly CHANGE_NICKNAME = 1n << 35n; // 34359738368
  static readonly MANAGE_NICKNAMES = 1n << 36n; // 68719476736

  // Default permissions for @everyone role
  static readonly DEFAULT_EVERYONE_PERMISSIONS =
    GuildPermissions.VIEW_CHANNELS |
    GuildPermissions.SEND_MESSAGES |
    GuildPermissions.EMBED_LINKS |
    GuildPermissions.ATTACH_FILES |
    GuildPermissions.READ_MESSAGE_HISTORY |
    GuildPermissions.ADD_REACTIONS |
    GuildPermissions.USE_EXTERNAL_EMOJIS |
    GuildPermissions.CONNECT |
    GuildPermissions.SPEAK |
    GuildPermissions.USE_VAD |
    GuildPermissions.PRIORITY_SPEAKER |
    GuildPermissions.STREAM |
    GuildPermissions.USE_SLASH_COMMANDS;

  // Helper method to check if user has permission
  static hasPermission(userPermissions: bigint, permission: bigint): boolean {
    // Administrator has all permissions
    if (
      (userPermissions & GuildPermissions.ADMINISTRATOR) ===
      GuildPermissions.ADMINISTRATOR
    ) {
      return true;
    }
    return (userPermissions & permission) === permission;
  }

  // Helper method to combine permissions
  static combinePermissions(...permissions: bigint[]): bigint {
    return permissions.reduce((acc, perm) => acc | perm, 0n);
  }
}

// Permission names mapping for String[] format
export const PERMISSION_NAMES: Record<string, string> = {
  "1": "VIEW_CHANNELS",
  "2": "SEND_MESSAGES",
  "4": "SEND_TTS_MESSAGES",
  "8": "MANAGE_MESSAGES",
  "16": "EMBED_LINKS",
  "32": "ATTACH_FILES",
  "64": "READ_MESSAGE_HISTORY",
  "128": "MENTION_EVERYONE",
  "256": "USE_EXTERNAL_EMOJIS",
  "512": "VIEW_GUILD_INSIGHTS",
  "1024": "CONNECT",
  "2048": "SPEAK",
  "4096": "MUTE_MEMBERS",
  "8192": "DEAFEN_MEMBERS",
  "16384": "MOVE_MEMBERS",
  "32768": "USE_VAD",
  "65536": "KICK_MEMBERS",
  "131072": "BAN_MEMBERS",
  "262144": "MANAGE_ROLES",
  "524288": "MANAGE_CHANNELS",
  "1048576": "MANAGE_GUILD",
  "2097152": "ADD_REACTIONS",
  "4194304": "VIEW_AUDIT_LOG",
  "8388608": "PRIORITY_SPEAKER",
  "16777216": "STREAM",
  "33554432": "USE_SLASH_COMMANDS",
  "67108864": "MANAGE_THREADS",
  "134217728": "CREATE_PUBLIC_THREADS",
  "268435456": "CREATE_PRIVATE_THREADS",
  "537870912": "USE_EXTERNAL_STICKERS",
  "1073741824": "SEND_MESSAGES_IN_THREADS",
  "2147483648": "USE_EMBEDDED_ACTIVITIES",
  "4294967296": "MODERATE_MEMBERS",
  "8589934592": "ADMINISTRATOR",
  "17179869184": "CREATE_INSTANT_INVITE",
  "34359738368": "CHANGE_NICKNAME",
  "68719476736": "MANAGE_NICKNAMES",
};

// Reverse mapping for String[] to BigInt conversion
export const PERMISSION_VALUES: Record<string, bigint> = {};
Object.entries(PERMISSION_NAMES).forEach(([key, value]) => {
  PERMISSION_VALUES[value] = BigInt(key);
});

// Utility functions for permission conversion
export class PermissionUtils {
  /**
   * Convert BigInt permissions to String[] for JSON serialization
   */
  static bigIntToStringArray(permissions: bigint): string[] {
    const result: string[] = [];
    Object.entries(PERMISSION_NAMES).forEach(([bitValue, name]) => {
      const bit = BigInt(bitValue);
      if ((permissions & bit) === bit) {
        result.push(name);
      }
    });
    return result;
  }

  /**
   * Convert String[] permissions to BigInt for bitwise operations
   */
  static stringArrayToBigInt(permissions: string[]): bigint {
    let result = 0n;
    permissions.forEach((permission) => {
      const value = PERMISSION_VALUES[permission];
      if (value) {
        result |= value;
      }
    });
    return result;
  }

  /**
   * Check if user has permission (supports both BigInt and String[])
   */
  static hasPermission(
    userPermissions: bigint | string[],
    permission: bigint | string
  ): boolean {
    if (typeof userPermissions === "bigint" && typeof permission === "bigint") {
      return GuildPermissions.hasPermission(userPermissions, permission);
    }

    if (Array.isArray(userPermissions) && typeof permission === "string") {
      return userPermissions.includes(permission);
    }

    // Mixed types - convert to common format
    if (Array.isArray(userPermissions) && typeof permission === "bigint") {
      const permName = PERMISSION_NAMES[permission.toString()];
      return permName ? userPermissions.includes(permName) : false;
    }

    if (typeof userPermissions === "bigint" && typeof permission === "string") {
      const permValue = PERMISSION_VALUES[permission];
      return permValue
        ? GuildPermissions.hasPermission(userPermissions, permValue)
        : false;
    }

    return false;
  }

  /**
   * Get default permissions as String[]
   */
  static getDefaultPermissions(): string[] {
    return this.bigIntToStringArray(
      GuildPermissions.DEFAULT_EVERYONE_PERMISSIONS
    );
  }

  /**
   * Validate permission name
   */
  static isValidPermission(permission: string): boolean {
    return permission in PERMISSION_VALUES;
  }
}
