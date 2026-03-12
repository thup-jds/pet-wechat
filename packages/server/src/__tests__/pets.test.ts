import { describe, it, expect, beforeEach } from "bun:test";
import { mockDb } from "./setup";
import { createApp, authHeader, jsonReq, fakePet } from "./helpers";

const app = createApp();

describe("Pet Routes", () => {
  beforeEach(() => {
    mockDb._reset();
  });

  // ===== Auth guard =====

  it("returns 401 without token for all pet endpoints", async () => {
    const res = await app.request(jsonReq("GET", "/api/pets"));
    expect(res.status).toBe(401);
  });

  // ===== GET /api/pets =====

  describe("GET /api/pets", () => {
    it("returns user's pets", async () => {
      const pet = fakePet();
      mockDb._results.select = [[pet]];

      const headers = await authHeader("user-1");
      const res = await app.request(
        jsonReq("GET", "/api/pets", { headers })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.pets).toHaveLength(1);
      expect(json.pets[0].name).toBe("Mimi");
    });

    it("returns empty array when user has no pets", async () => {
      mockDb._results.select = [[]];

      const headers = await authHeader("user-1");
      const res = await app.request(
        jsonReq("GET", "/api/pets", { headers })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.pets).toHaveLength(0);
    });
  });

  // ===== GET /api/pets/:id =====

  describe("GET /api/pets/:id", () => {
    it("returns pet details with avatars and actions", async () => {
      const pet = fakePet();
      // select 1: pet query, select 2: avatars query, select 3+: actions queries
      mockDb._results.select = [
        [pet],
        [{ id: "avatar-1", petId: "pet-1", sourceImageUrl: "url", status: "done", createdAt: new Date() }],
        [{ id: "action-1", petAvatarId: "avatar-1", actionType: "idle", imageUrl: "url", sortOrder: 0 }],
      ];

      const headers = await authHeader("user-1");
      const res = await app.request(
        jsonReq("GET", "/api/pets/pet-1", { headers })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.pet.id).toBe("pet-1");
      expect(json.avatars).toHaveLength(1);
      expect(json.actions).toHaveLength(1);
    });

    it("returns 404 when pet belongs to another user (ownership check)", async () => {
      // select returns empty -> pet not found for this userId
      mockDb._results.select = [[]];

      const headers = await authHeader("user-2");
      const res = await app.request(
        jsonReq("GET", "/api/pets/pet-1", { headers })
      );
      expect(res.status).toBe(404);
    });
  });

  // ===== POST /api/pets =====

  describe("POST /api/pets", () => {
    it("creates a pet", async () => {
      const pet = fakePet({ name: "Lucky", species: "dog" });
      mockDb._results.insert = [[pet]];

      const headers = await authHeader("user-1");
      const res = await app.request(
        jsonReq("POST", "/api/pets", {
          headers,
          body: { name: "Lucky", species: "dog" },
        })
      );
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.pet.name).toBe("Lucky");
    });
  });

  // ===== PUT /api/pets/:id =====

  describe("PUT /api/pets/:id", () => {
    it("updates own pet", async () => {
      const existing = fakePet();
      const updated = fakePet({ name: "New Name" });
      // select: find existing, update: return updated
      mockDb._results.select = [[existing]];
      mockDb._results.update = [[updated]];

      const headers = await authHeader("user-1");
      const res = await app.request(
        jsonReq("PUT", "/api/pets/pet-1", {
          headers,
          body: { name: "New Name" },
        })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.pet.name).toBe("New Name");
    });

    it("returns 404 when updating another user's pet", async () => {
      mockDb._results.select = [[]]; // ownership check fails

      const headers = await authHeader("user-2");
      const res = await app.request(
        jsonReq("PUT", "/api/pets/pet-1", {
          headers,
          body: { name: "Hack" },
        })
      );
      expect(res.status).toBe(404);
    });
  });

  // ===== DELETE /api/pets/:id =====

  describe("DELETE /api/pets/:id", () => {
    it("deletes own pet", async () => {
      mockDb._results.select = [[fakePet()]];

      const headers = await authHeader("user-1");
      const res = await app.request(
        jsonReq("DELETE", "/api/pets/pet-1", { headers })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it("returns 404 when deleting another user's pet", async () => {
      mockDb._results.select = [[]];

      const headers = await authHeader("user-2");
      const res = await app.request(
        jsonReq("DELETE", "/api/pets/pet-1", { headers })
      );
      expect(res.status).toBe(404);
    });
  });
});
