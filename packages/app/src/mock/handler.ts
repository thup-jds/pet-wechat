import type {
  CollarDevice,
  DesktopDevice,
  Pet,
  PetAvatar,
} from "@pet-wechat/shared";
import {
  createMockId,
  findMockPetById,
  getUnreadMockMessageCount,
  mockDb,
} from "./data";
import { MOCK_TOKEN } from "./mode";

type MockMethod = "GET" | "POST" | "PUT" | "DELETE";

type MockRequestOptions = {
  url: string;
  method?: MockMethod;
  data?: any;
};

type MockRoute = {
  method: MockMethod;
  pattern: RegExp;
  handler: (context: { url: string; path: string; data?: any; searchParams: URLSearchParams }) => unknown;
};

function parseMockUrl(url: string) {
  const parsedUrl = new URL(url, "https://mock.local");
  const path = parsedUrl.pathname.replace(/\/+$/, "") || "/";

  return {
    path,
    searchParams: parsedUrl.searchParams,
  };
}

function getNow(): string {
  return new Date().toISOString();
}

function createPetFromInput(data: Partial<Pet> | undefined): Pet {
  const timestamp = getNow();

  return {
    id: createMockId("mock-pet"),
    userId: mockDb.user.id,
    name: data?.name?.trim() || "新宠物",
    species: data?.species === "dog" ? "dog" : "cat",
    breed: data?.breed ?? "待补充",
    gender:
      data?.gender === "male" || data?.gender === "female" || data?.gender === "unknown"
        ? data.gender
        : "unknown",
    birthday: data?.birthday ?? null,
    weight: typeof data?.weight === "number" ? data.weight : null,
    activityScore: 58,
    latestBehavior: {
      actionType: "刚刚到家",
      timestamp,
    },
    avatarImageUrl: "https://placehold.co/720x960/png?text=New+Pet",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createClaimedCollar(id: string, data: Record<string, unknown> | undefined): CollarDevice {
  const timestamp = getNow();

  return {
    id,
    userId: mockDb.user.id,
    petId: typeof data?.petId === "string" ? data.petId : null,
    name: typeof data?.name === "string" ? data.name : "YEHEY Collar",
    macAddress: `AA:BB:CC:${id.slice(-2).padStart(2, "0")}:00:01`,
    status: "online",
    battery: 88,
    signal: 5,
    firmwareVersion: "1.0.0",
    lastOnlineAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createClaimedDesktop(id: string, data: Record<string, unknown> | undefined): DesktopDevice {
  const timestamp = getNow();

  return {
    id,
    userId: mockDb.user.id,
    name: typeof data?.name === "string" ? data.name : "YEHEY Desktop",
    macAddress: `AA:BB:CC:${id.slice(-2).padStart(2, "0")}:00:11`,
    status: "online",
    firmwareVersion: "1.0.0",
    lastOnlineAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function upsertPet(id: string, data: Partial<Pet> | undefined) {
  const petIndex = mockDb.pets.findIndex((pet) => pet.id === id);
  if (petIndex < 0) {
    return;
  }

  mockDb.pets[petIndex] = {
    ...mockDb.pets[petIndex],
    ...data,
    updatedAt: getNow(),
  };
}

function updateCollar(id: string, data: Record<string, unknown> | undefined) {
  const collarIndex = mockDb.collars.findIndex((collar) => collar.id === id);
  if (collarIndex < 0) {
    return;
  }

  mockDb.collars[collarIndex] = {
    ...mockDb.collars[collarIndex],
    ...(data ?? {}),
    updatedAt: getNow(),
  };
}

function claimCollar(id: string, data?: Record<string, unknown>) {
  const timestamp = getNow();
  const unownedIndex = mockDb.unownedCollars.findIndex((collar) => collar.id === id);

  if (unownedIndex >= 0) {
    const claimed = {
      ...mockDb.unownedCollars[unownedIndex],
      userId: mockDb.user.id,
      petId: typeof data?.petId === "string" ? data.petId : null,
      name: typeof data?.name === "string" ? data.name : mockDb.unownedCollars[unownedIndex].name,
      status: "online" as const,
      lastOnlineAt: timestamp,
      updatedAt: timestamp,
    };
    mockDb.unownedCollars.splice(unownedIndex, 1);
    mockDb.collars.push(claimed);
    return claimed;
  }

  const existing = mockDb.collars.find((collar) => collar.id === id);
  if (existing) {
    updateCollar(id, {
      ...data,
      userId: mockDb.user.id,
      status: "online",
      lastOnlineAt: timestamp,
    });
    return mockDb.collars.find((collar) => collar.id === id) ?? existing;
  }

  const created = createClaimedCollar(id, data);
  mockDb.collars.push(created);
  return created;
}

function claimDesktop(id: string, data?: Record<string, unknown>) {
  const timestamp = getNow();
  const unownedIndex = mockDb.unownedDesktops.findIndex((desktop) => desktop.id === id);

  if (unownedIndex >= 0) {
    const claimed = {
      ...mockDb.unownedDesktops[unownedIndex],
      userId: mockDb.user.id,
      name: typeof data?.name === "string" ? data.name : mockDb.unownedDesktops[unownedIndex].name,
      status: "online" as const,
      lastOnlineAt: timestamp,
      updatedAt: timestamp,
    };
    mockDb.unownedDesktops.splice(unownedIndex, 1);
    mockDb.desktops.push(claimed);
    return claimed;
  }

  const existing = mockDb.desktops.find((desktop) => desktop.id === id);
  if (existing) {
    const desktopIndex = mockDb.desktops.findIndex((desktop) => desktop.id === id);
    mockDb.desktops[desktopIndex] = {
      ...mockDb.desktops[desktopIndex],
      ...data,
      userId: mockDb.user.id,
      status: "online",
      lastOnlineAt: timestamp,
      updatedAt: timestamp,
    };
    return mockDb.desktops[desktopIndex];
  }

  const created = createClaimedDesktop(id, data);
  mockDb.desktops.push(created);
  return created;
}

const routes: MockRoute[] = [
  {
    method: "GET",
    pattern: /^\/api\/pets$/,
    handler: () => ({
      pets: mockDb.pets,
      authorizedPets: mockDb.authorizedPets,
    }),
  },
  {
    method: "POST",
    pattern: /^\/api\/pets$/,
    handler: ({ data }) => {
      const pet = createPetFromInput(data);
      mockDb.pets.push(pet);
      return { pet };
    },
  },
  {
    method: "PUT",
    pattern: /^\/api\/pets\/[^/]+$/,
    handler: ({ path, data }) => {
      const match = path.match(/^\/api\/pets\/([^/]+)$/);
      if (match) {
        upsertPet(decodeURIComponent(match[1]), data);
      }
      return {};
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/pets\/[^/]+$/,
    handler: ({ path }) => {
      const match = path.match(/^\/api\/pets\/([^/]+)$/);
      const petId = match ? decodeURIComponent(match[1]) : "";
      return { pet: findMockPetById(petId) ?? mockDb.pets[0] };
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/devices\/collars\/unowned$/,
    handler: () => ({
      collars: mockDb.unownedCollars,
    }),
  },
  {
    method: "GET",
    pattern: /^\/api\/devices\/collars$/,
    handler: () => ({
      collars: mockDb.collars,
    }),
  },
  {
    method: "POST",
    pattern: /^\/api\/devices\/collars$/,
    handler: ({ data }) => {
      const collar = createClaimedCollar(createMockId("mock-collar"), data);
      mockDb.collars.push(collar);
      return { collar };
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/devices\/collars\/[^/]+\/claim$/,
    handler: ({ path, data }) => {
      const match = path.match(/^\/api\/devices\/collars\/([^/]+)\/claim$/);
      const collarId = match ? decodeURIComponent(match[1]) : createMockId("mock-collar");
      const collar = claimCollar(collarId, data);
      return { collar };
    },
  },
  {
    method: "PUT",
    pattern: /^\/api\/devices\/collars\/[^/]+$/,
    handler: ({ path, data }) => {
      const match = path.match(/^\/api\/devices\/collars\/([^/]+)$/);
      if (match) {
        updateCollar(decodeURIComponent(match[1]), data);
      }
      return {};
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/devices\/desktops\/unowned$/,
    handler: () => ({
      desktops: mockDb.unownedDesktops,
    }),
  },
  {
    method: "GET",
    pattern: /^\/api\/devices\/desktops$/,
    handler: () => ({
      desktops: mockDb.desktops,
    }),
  },
  {
    method: "POST",
    pattern: /^\/api\/devices\/desktops\/[^/]+\/claim$/,
    handler: ({ path, data }) => {
      const match = path.match(/^\/api\/devices\/desktops\/([^/]+)\/claim$/);
      const desktopId = match ? decodeURIComponent(match[1]) : createMockId("mock-desktop");
      const desktop = claimDesktop(desktopId, data);
      return { desktop };
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/devices\/desktops\/[^/]+\/bind$/,
    handler: ({ path }) => {
      const match = path.match(/^\/api\/devices\/desktops\/([^/]+)\/bind$/);
      if (match) {
        claimDesktop(decodeURIComponent(match[1]));
      }
      return {};
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/devices\/invite$/,
    handler: () => ({
      inviteCode: mockDb.inviteCode,
    }),
  },
  {
    method: "GET",
    pattern: /^\/api\/invite\/[^/]+$/,
    handler: ({ path }) => {
      const match = path.match(/^\/api\/invite\/([^/]+)$/);
      const inviteCode = match ? decodeURIComponent(match[1]) : "";
      const pet = mockDb.pets[0];

      return {
        petName: pet.name,
        petSpecies: pet.species,
        fromNickname: mockDb.user.nickname,
        fromUserId: mockDb.user.id,
        petId: pet.id,
      };
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/invite\/[^/]+\/accept$/,
    handler: () => ({}),
  },
  {
    method: "POST",
    pattern: /^\/api\/devices\/invite\/[^/]+\/accept$/,
    handler: () => ({}),
  },
  {
    method: "GET",
    pattern: /^\/api\/me$/,
    handler: () => ({
      user: mockDb.user,
    }),
  },
  {
    method: "PUT",
    pattern: /^\/api\/me$/,
    handler: ({ data }) => {
      mockDb.user = {
        ...mockDb.user,
        ...(data ?? {}),
        updatedAt: getNow(),
      };
      return { user: mockDb.user };
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/messages\/unread-count$/,
    handler: () => ({
      count: getUnreadMockMessageCount(),
    }),
  },
  {
    method: "PUT",
    pattern: /^\/api\/messages\/read-all$/,
    handler: () => {
      mockDb.messages = mockDb.messages.map((message) => ({
        ...message,
        isRead: true,
      }));
      return {};
    },
  },
  {
    method: "PUT",
    pattern: /^\/api\/messages\/[^/]+\/read$/,
    handler: ({ path }) => {
      const match = path.match(/^\/api\/messages\/([^/]+)\/read$/);
      const messageId = match ? decodeURIComponent(match[1]) : "";
      mockDb.messages = mockDb.messages.map((message) =>
        message.id === messageId ? { ...message, isRead: true } : message
      );
      return {};
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/messages$/,
    handler: ({ searchParams }) => {
      const type = searchParams.get("type");
      if (!type) {
        return mockDb.messages;
      }

      return mockDb.messages.filter((message) => message.type === type);
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/auth\/wechat$/,
    handler: () => ({
      token: MOCK_TOKEN,
      user: mockDb.user,
    }),
  },
  {
    method: "POST",
    pattern: /^\/api\/avatars$/,
    handler: ({ data }) => {
      const avatar: PetAvatar = {
        id: createMockId("mock-avatar"),
        petId: typeof data?.petId === "string" ? data.petId : mockDb.pets[0].id,
        sourceImageUrl:
          typeof data?.sourceImageUrl === "string"
            ? data.sourceImageUrl
            : "https://placehold.co/720x960/png?text=Avatar",
        status: "done",
        createdAt: getNow(),
      };
      mockDb.avatars.push(avatar);
      mockDb.user = {
        ...mockDb.user,
        avatarQuota: Math.max(0, mockDb.user.avatarQuota - 1),
        updatedAt: getNow(),
      };
      return { avatar };
    },
  },
  {
    method: "GET",
    pattern: /^\/api\/avatars\/[^/]+$/,
    handler: ({ path }) => {
      const match = path.match(/^\/api\/avatars\/([^/]+)$/);
      const avatarId = match ? decodeURIComponent(match[1]) : "";
      return {
        avatar: mockDb.avatars.find((avatar) => avatar.id === avatarId) ?? mockDb.avatars[0],
      };
    },
  },
  {
    method: "POST",
    pattern: /^\/api\/upload$/,
    handler: () => ({
      url: "https://placehold.co/1080x1080/png?text=mock-upload",
    }),
  },
  {
    method: "GET",
    pattern: /^\/api\/debug\/collect-data$/,
    handler: () => ({
      mock: true,
      pets: mockDb.pets.length,
      authorizedPets: mockDb.authorizedPets.length,
      collars: mockDb.collars.length,
      desktops: mockDb.desktops.length,
      unreadMessages: getUnreadMockMessageCount(),
    }),
  },
];

export async function handleMockRequest<T>(options: MockRequestOptions): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase() as MockMethod;
  const { path, searchParams } = parseMockUrl(options.url);
  const route = routes.find((candidate) => candidate.method === method && candidate.pattern.test(path));

  if (!route) {
    console.warn(`[mock] Unhandled request: ${method} ${options.url}`);
    return {} as T;
  }

  return route.handler({
    url: options.url,
    path,
    data: options.data,
    searchParams,
  }) as T;
}
