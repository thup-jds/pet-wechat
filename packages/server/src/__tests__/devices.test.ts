import { describe, it, expect, beforeEach } from "bun:test";
import { mockDb } from "./setup";
import {
  createApp,
  authHeader,
  jsonReq,
  fakeCollar,
  fakeDesktop,
  fakePet,
  fakeBinding,
  fakeShareLink,
  fakeShareRecord,
} from "./helpers";

const app = createApp();

describe("Device Routes", () => {
  beforeEach(() => {
    mockDb._reset();
  });

  it("returns 401 without token", async () => {
    const res = await app.request(jsonReq("GET", "/api/devices/collars"));
    expect(res.status).toBe(401);
  });

  // ===== Collar devices =====

  describe("GET /api/devices/collars", () => {
    it("returns user's collars", async () => {
      mockDb._results.select = [[fakeCollar()]];

      const headers = await authHeader("user-1");
      const res = await app.request(
        jsonReq("GET", "/api/devices/collars", { headers })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.collars).toHaveLength(1);
    });
  });

  describe("POST /api/devices/collars", () => {
    it("creates a collar", async () => {
      const collar = fakeCollar();
      mockDb._results.insert = [[collar]];

      const headers = await authHeader("user-1");
      const res = await app.request(
        jsonReq("POST", "/api/devices/collars", {
          headers,
          body: { macAddress: "AA:BB:CC:DD:EE:FF" },
        })
      );
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.collar.macAddress).toBe("AA:BB:CC:DD:EE:FF");
    });
  });

  describe("PUT /api/devices/collars/:id", () => {
    it("updates own collar", async () => {
      const existing = fakeCollar();
      const updated = fakeCollar({ name: "Updated Collar" });
      mockDb._results.select = [[existing]];
      mockDb._results.update = [[updated]];

      const headers = await authHeader("user-1");
      const res = await app.request(
        jsonReq("PUT", "/api/devices/collars/collar-1", {
          headers,
          body: { name: "Updated Collar" },
        })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.collar.name).toBe("Updated Collar");
    });

    it("returns 404 for another user's collar", async () => {
      mockDb._results.select = [[]];

      const headers = await authHeader("user-2");
      const res = await app.request(
        jsonReq("PUT", "/api/devices/collars/collar-1", {
          headers,
          body: { name: "Hack" },
        })
      );
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/devices/collars/:id", () => {
    it("deletes own collar", async () => {
      mockDb._results.select = [[fakeCollar()]];

      const headers = await authHeader("user-1");
      const res = await app.request(
        jsonReq("DELETE", "/api/devices/collars/collar-1", { headers })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it("returns 404 for another user's collar", async () => {
      mockDb._results.select = [[]];

      const headers = await authHeader("user-2");
      const res = await app.request(
        jsonReq("DELETE", "/api/devices/collars/collar-1", { headers })
      );
      expect(res.status).toBe(404);
    });
  });

  // ===== Desktop devices =====

  describe("GET /api/devices/desktops", () => {
    it("returns user's desktops", async () => {
      mockDb._results.select = [[fakeDesktop()]];

      const headers = await authHeader("user-1");
      const res = await app.request(
        jsonReq("GET", "/api/devices/desktops", { headers })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.desktops).toHaveLength(1);
    });
  });

  describe("POST /api/devices/desktops", () => {
    it("creates a desktop", async () => {
      mockDb._results.insert = [[fakeDesktop()]];

      const headers = await authHeader("user-1");
      const res = await app.request(
        jsonReq("POST", "/api/devices/desktops", {
          headers,
          body: { macAddress: "11:22:33:44:55:66" },
        })
      );
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.desktop.macAddress).toBe("11:22:33:44:55:66");
    });
  });

  describe("DELETE /api/devices/desktops/:id", () => {
    it("deletes own desktop", async () => {
      mockDb._results.select = [[fakeDesktop()]];

      const headers = await authHeader("user-1");
      const res = await app.request(
        jsonReq("DELETE", "/api/devices/desktops/desktop-1", { headers })
      );
      expect(res.status).toBe(200);
    });

    it("returns 404 for another user's desktop", async () => {
      mockDb._results.select = [[]];

      const headers = await authHeader("user-2");
      const res = await app.request(
        jsonReq("DELETE", "/api/devices/desktops/desktop-1", { headers })
      );
      expect(res.status).toBe(404);
    });
  });

  // ===== Desktop-pet binding =====

  describe("POST /api/devices/desktops/:id/bind", () => {
    it("binds a pet to a desktop", async () => {
      // select 1: desktop check, select 2: pet ownership check
      mockDb._results.select = [[fakeDesktop()], [fakePet()]];
      mockDb._results.insert = [[fakeBinding()]];

      const headers = await authHeader("user-1");
      const res = await app.request(
        jsonReq("POST", "/api/devices/desktops/desktop-1/bind", {
          headers,
          body: { petId: "pet-1", bindingType: "owner" },
        })
      );
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.binding.petId).toBe("pet-1");
    });

    it("returns 404 when desktop not owned by user", async () => {
      mockDb._results.select = [[]]; // desktop not found

      const headers = await authHeader("user-2");
      const res = await app.request(
        jsonReq("POST", "/api/devices/desktops/desktop-1/bind", {
          headers,
          body: { petId: "pet-1", bindingType: "owner" },
        })
      );
      expect(res.status).toBe(404);
    });

    it("returns 404 when pet not owned by user", async () => {
      // desktop found, pet not found
      mockDb._results.select = [[fakeDesktop({ userId: "user-2" })], []];

      const headers = await authHeader("user-2");
      const res = await app.request(
        jsonReq("POST", "/api/devices/desktops/desktop-1/bind", {
          headers,
          body: { petId: "pet-1", bindingType: "owner" },
        })
      );
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/devices/desktops/:id/bind/:bindingId", () => {
    it("soft-deletes when desktop is owned by user", async () => {
      mockDb._results.select = [[fakeDesktop()]];
      mockDb._results.update = [[fakeBinding({ unboundAt: new Date() })]];

      const headers = await authHeader("user-1");
      const res = await app.request(
        jsonReq("DELETE", "/api/devices/desktops/desktop-1/bind/binding-1", {
          headers,
        })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it("returns 404 when desktop not owned by user", async () => {
      mockDb._results.select = [[]];

      const headers = await authHeader("user-2");
      const res = await app.request(
        jsonReq("DELETE", "/api/devices/desktops/desktop-1/bind/binding-1", {
          headers,
        })
      );
      expect(res.status).toBe(404);
    });
  });

  // ===== Share links =====

  describe("POST /api/devices/share-links", () => {
    it("creates a share link for own pet", async () => {
      mockDb._results.select = [[fakePet()]]; // pet ownership check
      mockDb._results.insert = [[fakeShareLink()]];

      const headers = await authHeader("user-1");
      const res = await app.request(
        jsonReq("POST", "/api/devices/share-links", {
          headers,
          body: { shareType: "pet", targetId: "pet-1" },
        })
      );
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.shareLink.shareCode).toBeDefined();
    });

    it("returns 404 when pet not owned by user", async () => {
      mockDb._results.select = [[]]; // pet not found

      const headers = await authHeader("user-2");
      const res = await app.request(
        jsonReq("POST", "/api/devices/share-links", {
          headers,
          body: { shareType: "pet", targetId: "pet-1" },
        })
      );
      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/devices/share-links", () => {
    it("returns user's share links", async () => {
      mockDb._results.select = [[fakeShareLink()]];

      const headers = await authHeader("user-1");
      const res = await app.request(
        jsonReq("GET", "/api/devices/share-links", { headers })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.shareLinks).toHaveLength(1);
    });
  });

  describe("POST /api/devices/share-links/:code/use", () => {
    it("returns 404 for non-existent share code", async () => {
      mockDb._results.select = [[]]; // share link not found

      const headers = await authHeader("user-2");
      const res = await app.request(
        jsonReq("POST", "/api/devices/share-links/badcode/use", { headers })
      );
      expect(res.status).toBe(404);
    });

    it("returns 400 when using own share link", async () => {
      mockDb._results.select = [[fakeShareLink({ createdBy: "user-1" })]];

      const headers = await authHeader("user-1");
      const res = await app.request(
        jsonReq("POST", "/api/devices/share-links/abc12345/use", { headers })
      );
      expect(res.status).toBe(400);
    });
  });
});
