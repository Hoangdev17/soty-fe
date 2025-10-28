import type {
  Badges,
  Device,
  Mfa,
  Premium,
  Presence,
  Privacy,
  Settings,
} from "../auth/auth.type";

export interface Bot {
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

  BotAction: BotAction[];
  BotSkill: BotSkill[];
  BotCommand: BotCommand[];
}

export interface BotSkill {
  id: string;
  botId: string;
  name: string;
  description?: string;
  model?: string;
  enabled: boolean;
  config?: JSON;

  command: BotCommand[];

  createdAt: Date;
}

export interface BotCommand {
  id: string;
  botId: string;
  name: string;
  description?: string;
  triggerType: TriggerType;
  pattern?: string;
  enabled: boolean;
  skillId?: string;
  actionId?: string;
  createdAt: Date;
}

export enum TriggerType {
  PREFIX = "PREFIX",
  EXACT = "EXACT",
  PATTERN = "PATTERN",
}

export interface BotAction {
  id: string;
  botId: string;
  name: string;
  handler?: string;
  paramsSchema?: JSON;
  createdAt: Date;

  commands: BotCommand[];
}

export interface CreateBotPayload {
  username: string;
  bio: string;
  email: string;
  avatar: string;
}

export interface AddSkillToBotPayload {
  name: string;
  description?: string;
  model?: string;
}

export interface CreateBotCommandPayload {
  name: string;
  description?: string;
  triggerType: TriggerType;
  pattern?: string;
  skillId?: string;
  actionId?: string;
}

export interface CreateBotActionPayload {
  name: string;
  handler?: string;
  paramsSchema?: JSON;
}

export interface getBotHandlersResponse {
  handlers: string[];
}
