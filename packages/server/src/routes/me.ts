import { Hono } from "hono";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

const meRoute = new Hono();

// 获取当前用户信息（受 authMiddleware 保护）
meRoute.get("/", async (c) => {
  const userId = c.get("userId" as never) as string;
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json({ user });
});

export default meRoute;
