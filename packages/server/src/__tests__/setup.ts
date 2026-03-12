/**
 * Test setup: provides access to the mock db instance created in preload.ts
 */
import type { MockDb } from "./mock-db";

// Retrieve the mock db instance from globalThis (set by preload.ts)
export const mockDb: MockDb = (globalThis as any).__mockDb;

// Re-export signToken so tests can easily generate JWTs
export { signToken } from "../middleware/auth";
