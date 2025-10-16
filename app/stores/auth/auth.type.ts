export interface LoginPayload {
  email: string;
  password: string;
}

export type Badges = {
  code: string;
  grantedAt: Date;
};

export type Premium = {
  active: boolean;
  tier: number | null;
  expiresAt: Date | null;
};

export enum PresenceStatus {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE",
  IDLE = "IDLE",
  DND = "DND",
}

export type Presence = {
  status: PresenceStatus;
  customText: String | null;
  activities: String[] | null;
  lastUpdated: Date | null;
};

enum Platform {
  WEB = "WEB",
  IOS = "IOS",
  ANDROID = "ANDROID",
  DESKTOP = "DESKTOP",
}

export type Device = {
  platform: Platform;
  ip: String | null;
  lastActiveAt: Date | null;
  pushToken: String | null;
};

export type Privacy = {
  allowDMFrom: boolean;
  allowFriendRequest: boolean;
  showActivity: boolean;
  showOnlineStatus: boolean;
};

export type Settings = {
  theme: string | null;
  locale: String | null;
  timezone: String | null;
  notifications: boolean;
  voice: JSON | null;
  ui: JSON | null;
};

enum MfaType {
  TOTP = "TOTP",
  WEBAUTHN = "WEBAUTHN",
}

export type Mfa = {
  enanled: boolean;
  type: MfaType;
  backupCode: String[];
};

export interface User {
  id: string;
  email: string;
  username: string;
  phone: string | null;
  disabled: boolean;
  refreshTokenHash: string | null;
  globalName: string | null;
  bio: string | null;
  avatar: string | null;
  avatarEffectId: string | null;
  nameplateId: string | null;
  profileEffectId: string | null;
  banner: string | null;
  accentColor: string | null;
  hexAccentColor: string | null;
  badges: Badges[];
  premium: Premium | null;
  presence: Presence | null;
  devices: Device[];
  privacy: Privacy | null;
  settings: Settings | null;
  mfa: Mfa | null;
  isVerified: boolean;
  deleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface getRequestSentPayload {
  id: string;
  receiver: User;
  receiverId: string;
  sender: User;
  senderId: string;
  status: string;
  createdAt: Date;
}
export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  sender: User;
}
export interface FriendPayload {
  id: string;
  friendId: string;
  userId: string;
  friend: User;
  createdAt: Date;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface DecoratorCollection {
  id: string;
  userId: string;
  assetId: string;
  isActive: boolean;
  purchasePrice: number;
  acquiredAt: Date;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Decorations {
  id: string;
  assetType: number; // 0: nameplate; 1: avatarDecoration; 2: profile_effects
  name: string;
  description?: string;
  assetId: string; // UUID
  price: number;
  salePrice: number;
  metadata: any; // Json type
  expiresAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  collections: DecoratorCollection[];
  User?: User;
  userId?: string;
}

export interface collecetiblePayload {
  id: string;
  asset: Decorations;
  assetId: string;
}

export interface getUserDecorationInterface {
  collectibles: collecetiblePayload[];
  total: number;
}
