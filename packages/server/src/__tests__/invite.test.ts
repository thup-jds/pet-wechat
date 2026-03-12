import { describe, it, expect, beforeEach } from "bun:test";
import { mockDb } from "./setup";
import {
  createApp,
  authHeader,
  jsonReq,
  fakePet,
  fakeUser,
  fakeAuthorization,
  fakeMessage,
} from "./helpers";

const app = createApp();

describe("Invite Routes", () => {
  beforeEach(() => {
    mockDb._reset();
  });

  // ===== POST /api/devices/invite =====

  describe("POST /api/devices/invite", () => {
    it("generates an invite code for own pet", async () => {
      const pet = fakePet();
      const user = fakeUser();
      // select 1: pet ownership, select 2: user lookup
      mockDb._results.select = [[pet], [user]];

      const headers = await authHeader("user-1");
      const res = await app.request(
        jsonReq("POST", "/api/devices/invite", {
          headers,
          body: { petId: "pet-1" },
        })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.inviteCode).toBeDefined();
      expect(typeof json.inviteCode).toBe("string");
      expect(json.petName).toBe("Mimi");
      expect(json.fromNickname).toBe("Test User");
    });

    it("returns 404 when pet not owned", async () => {
      mockDb._results.select = [[]]; // pet not found

      const headers = await authHeader("user-2");
      const res = await app.request(
        jsonReq("POST", "/api/devices/invite", {
          headers,
          body: { petId: "pet-1" },
        })
      );
      expect(res.status).toBe(404);
    });
  });

  // ===== GET /api/invite/:code (public route) =====

  describe("GET /api/invite/:code", () => {
    it("returns invite details for a valid code (no auth required)", async () => {
      // First generate a code (requires auth)
      const pet = fakePet();
      const user = fakeUser();
      mockDb._results.select = [[pet], [user]];

      const headers = await authHeader("user-1");
      const genRes = await app.request(
        jsonReq("POST", "/api/devices/invite", {
          headers,
          body: { petId: "pet-1" },
        })
      );
      const { inviteCode } = await genRes.json();

      // Now preview WITHOUT auth header — should work as public route
      mockDb._reset();
      mockDb._results.select = [[pet], [user]];

      const res = await app.request(
        jsonReq("GET", `/api/invite/${inviteCode}`)
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.petName).toBe("Mimi");
      expect(json.fromNickname).toBe("Test User");
      expect(json.petId).toBe("pet-1");
      expect(json.fromUserId).toBe("user-1");
    });

    it("returns 400 for invalid invite code", async () => {
      const res = await app.request(
        jsonReq("GET", "/api/invite/invalid-code")
      );
      expect(res.status).toBe(400);
    });
  });

  // ===== POST /api/devices/invite/:code/accept =====

  describe("POST /api/devices/invite/:code/accept", () => {
    it("accepts an invite and creates authorization", async () => {
      // Generate invite code as user-1
      const pet = fakePet();
      const fromUser = fakeUser();
      mockDb._results.select = [[pet], [fromUser]];

      const headers1 = await authHeader("user-1");
      const genRes = await app.request(
        jsonReq("POST", "/api/devices/invite", {
          headers: headers1,
          body: { petId: "pet-1" },
        })
      );
      const { inviteCode } = await genRes.json();

      // Accept as user-2
      mockDb._reset();
      const auth = fakeAuthorization({ status: "accepted", toUserId: "user-2" });
      const acceptUser = fakeUser({ id: "user-2", nickname: "Acceptor" });
      // select 1: existing auth check (empty), select 2: acceptUser lookup, select 3: pet lookup
      mockDb._results.select = [[], [acceptUser], [pet]];
      mockDb._results.insert = [[auth], [fakeMessage()]]; // auth insert, message insert

      const headers2 = await authHeader("user-2");
      const res = await app.request(
        jsonReq("POST", `/api/devices/invite/${inviteCode}/accept`, {
          headers: headers2,
        })
      );
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.authorization.status).toBe("accepted");
    });

    it("returns 400 when accepting own invite", async () => {
      // Generate invite code as user-1
      const pet = fakePet();
      const user = fakeUser();
      mockDb._results.select = [[pet], [user]];

      const headers = await authHeader("user-1");
      const genRes = await app.request(
        jsonReq("POST", "/api/devices/invite", {
          headers,
          body: { petId: "pet-1" },
        })
      );
      const { inviteCode } = await genRes.json();

      // Try to accept as same user-1
      mockDb._reset();
      const res = await app.request(
        jsonReq("POST", `/api/devices/invite/${inviteCode}/accept`, {
          headers,
        })
      );
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("own invite");
    });

    it("returns 409 when already authorized", async () => {
      // Generate invite code
      const pet = fakePet();
      const user = fakeUser();
      mockDb._results.select = [[pet], [user]];

      const headers1 = await authHeader("user-1");
      const genRes = await app.request(
        jsonReq("POST", "/api/devices/invite", {
          headers: headers1,
          body: { petId: "pet-1" },
        })
      );
      const { inviteCode } = await genRes.json();

      // Accept as user-2 but existing authorization found
      mockDb._reset();
      const existingAuth = fakeAuthorization();
      mockDb._results.select = [[existingAuth]]; // existing auth found

      const headers2 = await authHeader("user-2");
      const res = await app.request(
        jsonReq("POST", `/api/devices/invite/${inviteCode}/accept`, {
          headers: headers2,
        })
      );
      expect(res.status).toBe(409);
    });

    it("returns 400 for invalid invite code", async () => {
      const headers = await authHeader("user-2");
      const res = await app.request(
        jsonReq("POST", "/api/devices/invite/bad-code/accept", { headers })
      );
      expect(res.status).toBe(400);
    });
  });
});
