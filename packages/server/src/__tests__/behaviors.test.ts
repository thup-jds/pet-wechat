import { describe, it, expect, beforeEach } from "bun:test";
import { mockDb } from "./setup";
import { createApp, authHeader, jsonReq, fakePet, fakeBehavior, fakeCollar } from "./helpers";

const app = createApp();

describe("Behavior Routes", () => {
  beforeEach(() => {
    mockDb._reset();
  });

  describe("GET /api/behaviors/:petId", () => {
    it("returns behaviors for an owned pet", async () => {
      const behavior = fakeBehavior();
      // select 1: pet ownership check, select 2: behaviors list
      mockDb._results.select = [[fakePet()], [behavior]];

      const headers = await authHeader("user-1");
      const res = await app.request(
        jsonReq("GET", "/api/behaviors/pet-1", { headers })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.behaviors).toHaveLength(1);
      expect(json.behaviors[0].actionType).toBe("walking");
    });

    it("returns 404 when pet belongs to another user", async () => {
      mockDb._results.select = [[]]; // ownership check fails

      const headers = await authHeader("user-2");
      const res = await app.request(
        jsonReq("GET", "/api/behaviors/pet-1", { headers })
      );
      expect(res.status).toBe(404);
    });

    it("returns 401 without token", async () => {
      const res = await app.request(jsonReq("GET", "/api/behaviors/pet-1"));
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/behaviors", () => {
    it("creates a behavior record when pet and collar owned by user", async () => {
      const behavior = fakeBehavior();
      // select 1: pet ownership, select 2: collar ownership
      mockDb._results.select = [[fakePet()], [fakeCollar()]];
      mockDb._results.insert = [[behavior]];

      const headers = await authHeader("user-1");
      const res = await app.request(
        jsonReq("POST", "/api/behaviors", {
          headers,
          body: {
            petId: "pet-1",
            collarDeviceId: "collar-1",
            actionType: "walking",
          },
        })
      );
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.behavior.actionType).toBe("walking");
    });

    it("returns 404 when pet not owned by user", async () => {
      mockDb._results.select = [[]]; // pet ownership fails

      const headers = await authHeader("user-2");
      const res = await app.request(
        jsonReq("POST", "/api/behaviors", {
          headers,
          body: {
            petId: "pet-1",
            collarDeviceId: "collar-1",
            actionType: "walking",
          },
        })
      );
      expect(res.status).toBe(404);
    });

    it("returns 404 when collar not owned by user", async () => {
      // pet found, collar not found
      mockDb._results.select = [[fakePet()], []];

      const headers = await authHeader("user-1");
      const res = await app.request(
        jsonReq("POST", "/api/behaviors", {
          headers,
          body: {
            petId: "pet-1",
            collarDeviceId: "collar-999",
            actionType: "walking",
          },
        })
      );
      expect(res.status).toBe(404);
    });

    it("returns 400 when collar does not match pet", async () => {
      mockDb._results.select = [[fakePet()], [fakeCollar({ petId: "pet-2" })]];

      const headers = await authHeader("user-1");
      const res = await app.request(
        jsonReq("POST", "/api/behaviors", {
          headers,
          body: {
            petId: "pet-1",
            collarDeviceId: "collar-1",
            actionType: "walking",
          },
        })
      );
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("项圈与宠物不匹配");
    });
  });
});
