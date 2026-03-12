import {
  pgTable,
  text,
  timestamp,
  integer,
  real,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createId } from "../utils/id";

// ===== 枚举 =====

export const speciesEnum = pgEnum("species", ["cat", "dog"]);
export const genderEnum = pgEnum("gender", ["male", "female", "unknown"]);
export const deviceStatusEnum = pgEnum("device_status", [
  "online",
  "offline",
  "pairing",
]);
export const avatarStatusEnum = pgEnum("avatar_status", [
  "pending",
  "processing",
  "done",
  "failed",
]);
export const authorizationStatusEnum = pgEnum("authorization_status", [
  "pending",
  "accepted",
  "rejected",
]);
export const messageTypeEnum = pgEnum("message_type", [
  "authorization",
  "system",
]);
export const bindingTypeEnum = pgEnum("binding_type", [
  "owner",
  "authorized",
]);

// ===== 用户 =====

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(createId),
  wechatOpenid: text("wechat_openid").unique(),
  phone: text("phone").unique(),
  nickname: text("nickname").notNull(),
  avatarUrl: text("avatar_url"),
  avatarQuota: integer("avatar_quota").notNull().default(2),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ===== 宠物 =====

export const pets = pgTable("pets", {
  id: text("id").primaryKey().$defaultFn(createId),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  species: speciesEnum("species").notNull(),
  breed: text("breed"),
  gender: genderEnum("gender").notNull().default("unknown"),
  birthday: text("birthday"),
  weight: real("weight"),
  activityScore: integer("activity_score").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ===== 项圈设备 =====

export const collarDevices = pgTable("collar_devices", {
  id: text("id").primaryKey().$defaultFn(createId),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  petId: text("pet_id").references(() => pets.id),
  name: text("name").notNull(),
  macAddress: text("mac_address").notNull().unique(),
  status: deviceStatusEnum("status").notNull().default("offline"),
  battery: integer("battery"),
  signal: integer("signal"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ===== 桌面端设备 =====

export const desktopDevices = pgTable("desktop_devices", {
  id: text("id").primaryKey().$defaultFn(createId),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  macAddress: text("mac_address").notNull().unique(),
  status: deviceStatusEnum("status").notNull().default("offline"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ===== 桌面端-宠物绑定 =====

export const desktopPetBindings = pgTable("desktop_pet_bindings", {
  id: text("id").primaryKey().$defaultFn(createId),
  desktopDeviceId: text("desktop_device_id")
    .notNull()
    .references(() => desktopDevices.id),
  petId: text("pet_id")
    .notNull()
    .references(() => pets.id),
  bindingType: bindingTypeEnum("binding_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ===== 设备授权 =====

export const deviceAuthorizations = pgTable("device_authorizations", {
  id: text("id").primaryKey().$defaultFn(createId),
  fromUserId: text("from_user_id")
    .notNull()
    .references(() => users.id),
  toUserId: text("to_user_id")
    .notNull()
    .references(() => users.id),
  petId: text("pet_id")
    .notNull()
    .references(() => pets.id),
  desktopDeviceId: text("desktop_device_id").references(
    () => desktopDevices.id
  ),
  status: authorizationStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ===== 宠物形象 =====

export const petAvatars = pgTable("pet_avatars", {
  id: text("id").primaryKey().$defaultFn(createId),
  petId: text("pet_id")
    .notNull()
    .references(() => pets.id),
  sourceImageUrl: text("source_image_url").notNull(),
  status: avatarStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const petAvatarActions = pgTable("pet_avatar_actions", {
  id: text("id").primaryKey().$defaultFn(createId),
  petAvatarId: text("pet_avatar_id")
    .notNull()
    .references(() => petAvatars.id),
  actionType: text("action_type").notNull(),
  imageUrl: text("image_url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ===== 宠物行为 =====

export const petBehaviors = pgTable("pet_behaviors", {
  id: text("id").primaryKey().$defaultFn(createId),
  petId: text("pet_id")
    .notNull()
    .references(() => pets.id),
  collarDeviceId: text("collar_device_id")
    .notNull()
    .references(() => collarDevices.id),
  actionType: text("action_type").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ===== 消息 =====

export const messages = pgTable("messages", {
  id: text("id").primaryKey().$defaultFn(createId),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  type: messageTypeEnum("type").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
