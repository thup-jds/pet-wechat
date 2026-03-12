// ===== 枚举 =====

export type Species = "cat" | "dog";
export type Gender = "male" | "female" | "unknown";
export type DeviceStatus = "online" | "offline" | "pairing";
export type AvatarStatus = "pending" | "processing" | "done" | "failed";
export type MessageType = "authorization" | "system";
export type BindingType = "owner" | "authorized";
export type ShareType = "pet" | "desktop";
export type ShareLinkStatus = "active" | "expired" | "disabled";

// ===== 用户 =====

export interface User {
  id: string;
  wechatOpenid: string | null;
  phone: string | null;
  nickname: string;
  avatarUrl: string | null;
  avatarQuota: number;
  createdAt: string;
  updatedAt: string;
}

// ===== 宠物 =====

export interface Pet {
  id: string;
  userId: string;
  name: string;
  species: Species;
  breed: string | null;
  gender: Gender;
  birthday: string | null;
  weight: number | null;
  activityScore: number;
  createdAt: string;
  updatedAt: string;
}

// ===== 设备 =====

export interface CollarDevice {
  id: string;
  userId: string;
  petId: string | null;
  name: string;
  macAddress: string;
  status: DeviceStatus;
  battery: number | null;
  signal: number | null;
  firmwareVersion: string | null;
  lastOnlineAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DesktopDevice {
  id: string;
  userId: string;
  name: string;
  macAddress: string;
  status: DeviceStatus;
  firmwareVersion: string | null;
  lastOnlineAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DesktopPetBinding {
  id: string;
  desktopDeviceId: string;
  petId: string;
  bindingType: BindingType;
  createdAt: string;
  unboundAt: string | null;
}

// ===== 分享 =====

export interface ShareLink {
  id: string;
  shareCode: string;
  shareType: ShareType;
  targetId: string;
  createdBy: string;
  maxUses: number;
  usedCount: number;
  expireAt: string | null;
  status: ShareLinkStatus;
  createdAt: string;
}

export interface ShareRecord {
  id: string;
  shareLinkId: string;
  userId: string;
  createdAt: string;
}

/** 授权列表接口返回时附带的用户昵称 */
export interface DeviceAuthorizationWithUser extends DeviceAuthorization {
  fromNickname?: string;
  toNickname?: string;
}

// ===== 宠物形象 =====

export interface PetAvatar {
  id: string;
  petId: string;
  sourceImageUrl: string;
  status: AvatarStatus;
  createdAt: string;
}

export interface PetAvatarAction {
  id: string;
  petAvatarId: string;
  actionType: string;
  imageUrl: string;
  sortOrder: number;
}

// ===== 行为 =====

export interface PetBehavior {
  id: string;
  petId: string;
  collarDeviceId: string;
  actionType: string;
  timestamp: string;
}

// ===== 邀请 =====

export interface InvitePayload {
  fromUserId: string;
  petId: string;
  petName: string;
  fromNickname: string;
}

// ===== 消息 =====

export interface Message {
  id: string;
  userId: string;
  type: MessageType;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}
