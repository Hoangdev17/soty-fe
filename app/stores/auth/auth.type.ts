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

enum PresenceStatus {
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

export interface LoginResponse {
  token: string;
  user: User;
}
