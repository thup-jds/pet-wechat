/**
 * Shared helpers for route tests.
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware } from "../middleware/auth";
import { signToken } from "../middleware/auth";
import type { MockDb } from "./mock-db";

// Import route modules (these will use the mocked db via setup.ts)
import authRoute from "../routes/auth";
import petsRoute from "../routes/pets";
import avatarsRoute from "../routes/avatars";
import devicesRoute from "../routes/devices";
import behaviorsRoute from "../routes/behaviors";
import messagesRoute from "../routes/messages";
import meRoute from "../routes/me";

/**
 * Build a fresh Hono app identical to the production one,
 * but without the logger (avoid noisy test output).
 */
export function createApp(): InstanceType<typeof Hono> {
  const app = new Hono();
  app.use("*", cors());

  app.get("/", (c) => c.json({ name: "YEHEY Pet API", version: "0.1.0" }));
  app.get("/health", (c) => c.json({ status: "ok" }));

  // Public routes
  app.route("/api/auth", authRoute);

  // Protected routes
  app.use("/api/*", authMiddleware);
  app.route("/api/me", meRoute);
  app.route("/api/pets", petsRoute);
  app.route("/api/avatars", avatarsRoute);
  app.route("/api/devices", devicesRoute);
  app.route("/api/behaviors", behaviorsRoute);
  app.route("/api/messages", messagesRoute);

  return app;
}

/** Generate a valid JWT for a given userId */
export async function authHeader(userId: string): Promise<Record<string, string>> {
  const token = await signToken(userId);
  return { Authorization: `Bearer ${token}` };
}

/** Shortcut to make a JSON request */
export function jsonReq(
  method: string,
  path: string,
  opts: { headers?: Record<string, string>; body?: unknown } = {}
): Request {
  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...opts.headers,
    },
  };
  if (opts.body !== undefined) {
    init.body = JSON.stringify(opts.body);
  }
  return new Request(`http://localhost${path}`, init);
}

/** Helper to make fake DB row objects */
export function fakeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    wechatOpenid: null,
    phone: null,
    nickname: "Test User",
    avatarUrl: null,
    avatarQuota: 2,
    createdAt: new Date(),
    ...overrides,
  };
}

export function fakePet(overrides: Record<string, unknown> = {}) {
  return {
    id: "pet-1",
    userId: "user-1",
    name: "Mimi",
    species: "cat",
    breed: null,
    gender: "unknown",
    birthday: null,
    weight: null,
    activityScore: 0,
    createdAt: new Date(),
    ...overrides,
  };
}

export function fakeCollar(overrides: Record<string, unknown> = {}) {
  return {
    id: "collar-1",
    userId: "user-1",
    petId: null,
    name: "My Collar",
    macAddress: "AA:BB:CC:DD:EE:FF",
    status: "offline",
    battery: null,
    signal: null,
    createdAt: new Date(),
    ...overrides,
  };
}

export function fakeDesktop(overrides: Record<string, unknown> = {}) {
  return {
    id: "desktop-1",
    userId: "user-1",
    name: "My Desktop",
    macAddress: "11:22:33:44:55:66",
    status: "offline",
    createdAt: new Date(),
    ...overrides,
  };
}

export function fakeMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: "msg-1",
    userId: "user-1",
    type: "system",
    title: "Test",
    content: "Hello",
    isRead: false,
    createdAt: new Date(),
    ...overrides,
  };
}

export function fakeAvatar(overrides: Record<string, unknown> = {}) {
  return {
    id: "avatar-1",
    petId: "pet-1",
    sourceImageUrl: "https://example.com/photo.jpg",
    status: "pending",
    createdAt: new Date(),
    ...overrides,
  };
}

export function fakeBehavior(overrides: Record<string, unknown> = {}) {
  return {
    id: "behavior-1",
    petId: "pet-1",
    collarDeviceId: "collar-1",
    actionType: "walking",
    timestamp: new Date(),
    ...overrides,
  };
}

export function fakeBinding(overrides: Record<string, unknown> = {}) {
  return {
    id: "binding-1",
    desktopDeviceId: "desktop-1",
    petId: "pet-1",
    bindingType: "owner",
    createdAt: new Date(),
    ...overrides,
  };
}

export function fakeAuthorization(overrides: Record<string, unknown> = {}) {
  return {
    id: "auth-1",
    fromUserId: "user-1",
    toUserId: "user-2",
    petId: "pet-1",
    desktopDeviceId: null,
    status: "pending",
    createdAt: new Date(),
    ...overrides,
  };
}
