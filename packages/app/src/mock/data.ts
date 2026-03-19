import type {
  CollarDevice,
  DesktopDevice,
  Message,
  Pet,
  PetAvatar,
  User,
} from "@pet-wechat/shared";

export type MockDatabase = {
  user: User;
  pets: Pet[];
  authorizedPets: Pet[];
  collars: CollarDevice[];
  desktops: DesktopDevice[];
  messages: Message[];
  avatars: PetAvatar[];
  unownedCollars: CollarDevice[];
  unownedDesktops: DesktopDevice[];
  inviteCode: string;
};

const NOW = "2026-03-19T00:00:00.000Z";
const ONE_DAY_AGO = "2026-03-18T00:00:00.000Z";
const TWO_DAYS_AGO = "2026-03-17T00:00:00.000Z";
const THREE_DAYS_AGO = "2026-03-16T00:00:00.000Z";

function createMockDatabase(): MockDatabase {
  const user: User = {
    id: "mock-user-1",
    wechatOpenid: "mock-openid-1",
    phone: "13800000000",
    nickname: "UI 打磨用户",
    avatarUrl: "https://placehold.co/160x160/png?text=User",
    avatarQuota: 2,
    createdAt: THREE_DAYS_AGO,
    updatedAt: NOW,
  };

  const pets: Pet[] = [
    {
      id: "mock-pet-cat-1",
      userId: user.id,
      name: "奶盖",
      species: "cat",
      breed: "布偶猫",
      gender: "female",
      birthday: "2023-06-01",
      weight: 4.2,
      activityScore: 86,
      latestBehavior: {
        actionType: "晒太阳",
        timestamp: "2026-03-18T09:20:00.000Z",
      },
      avatarImageUrl: "https://placehold.co/720x960/png?text=Naigai",
      createdAt: TWO_DAYS_AGO,
      updatedAt: NOW,
    },
    {
      id: "mock-pet-dog-1",
      userId: user.id,
      name: "可乐",
      species: "dog",
      breed: "柯基",
      gender: "male",
      birthday: "2022-09-15",
      weight: 11.8,
      activityScore: 64,
      latestBehavior: {
        actionType: "散步中",
        timestamp: "2026-03-18T07:45:00.000Z",
      },
      avatarImageUrl: "https://placehold.co/720x960/png?text=Kele",
      createdAt: TWO_DAYS_AGO,
      updatedAt: NOW,
    },
  ];

  const authorizedPets: Pet[] = [
    {
      id: "mock-pet-shared-1",
      userId: "shared-owner-1",
      name: "栗子",
      species: "cat",
      breed: "英短",
      gender: "male",
      birthday: "2021-12-08",
      weight: 5.1,
      activityScore: 72,
      latestBehavior: {
        actionType: "午睡",
        timestamp: "2026-03-18T05:30:00.000Z",
      },
      avatarImageUrl: "https://placehold.co/720x960/png?text=Lizi",
      createdAt: THREE_DAYS_AGO,
      updatedAt: NOW,
    },
  ];

  const collars: CollarDevice[] = [
    {
      id: "mock-collar-1",
      userId: user.id,
      petId: pets[0].id,
      name: "奶盖的小圈圈",
      macAddress: "AA:BB:CC:DD:EE:01",
      status: "online",
      battery: 78,
      signal: 4,
      firmwareVersion: "1.2.3",
      lastOnlineAt: NOW,
      createdAt: TWO_DAYS_AGO,
      updatedAt: NOW,
    },
  ];

  const desktops: DesktopDevice[] = [
    {
      id: "mock-desktop-1",
      userId: user.id,
      name: "书房桌面端",
      macAddress: "AA:BB:CC:DD:EE:11",
      status: "online",
      firmwareVersion: "2.0.1",
      lastOnlineAt: NOW,
      createdAt: TWO_DAYS_AGO,
      updatedAt: NOW,
    },
  ];

  const messages: Message[] = [
    {
      id: "mock-message-1",
      userId: user.id,
      type: "authorization",
      title: "宠物授权通过通知",
      content: "你已获得查看奶盖实时动态的授权，可以前往首页查看。",
      isRead: false,
      createdAt: NOW,
    },
    {
      id: "mock-message-2",
      userId: user.id,
      type: "authorization",
      title: "宠物授权申请已拒绝",
      content: "对方暂未同意共享宠物空间，可稍后再次发起邀请。",
      isRead: true,
      createdAt: ONE_DAY_AGO,
    },
    {
      id: "mock-message-3",
      userId: user.id,
      type: "system",
      title: "宠物定制完成提醒",
      content: "你的宠物动态图像已经定制完成，点击即可查看。",
      isRead: false,
      createdAt: TWO_DAYS_AGO,
    },
  ];

  const avatars: PetAvatar[] = [
    {
      id: "mock-avatar-1",
      petId: pets[0].id,
      sourceImageUrl: "https://placehold.co/720x960/png?text=Avatar",
      status: "done",
      createdAt: NOW,
    },
  ];

  const unownedCollars: CollarDevice[] = [
    {
      id: "mock-collar-unowned-1",
      userId: null,
      petId: null,
      name: "待绑定项圈 A1",
      macAddress: "AA:BB:CC:DD:EE:21",
      status: "pairing",
      battery: 91,
      signal: 5,
      firmwareVersion: "1.0.0",
      lastOnlineAt: NOW,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  const unownedDesktops: DesktopDevice[] = [
    {
      id: "mock-desktop-unowned-1",
      userId: null,
      name: "待绑定桌面端 D1",
      macAddress: "AA:BB:CC:DD:EE:31",
      status: "pairing",
      firmwareVersion: "1.0.0",
      lastOnlineAt: NOW,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  return {
    user,
    pets,
    authorizedPets,
    collars,
    desktops,
    messages,
    avatars,
    unownedCollars,
    unownedDesktops,
    inviteCode: "mock-invite-code",
  };
}

export const mockDb = createMockDatabase();

export function createMockId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function findMockPetById(id: string): Pet | undefined {
  return [...mockDb.pets, ...mockDb.authorizedPets].find((pet) => pet.id === id);
}

export function getUnreadMockMessageCount(): number {
  return mockDb.messages.filter((message) => !message.isRead).length;
}
