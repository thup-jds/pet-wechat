import { randomBytes } from "crypto";

export function createId(): string {
  return randomBytes(12).toString("hex");
}

export function createShareCode(): string {
  return randomBytes(4).toString("hex");
}
