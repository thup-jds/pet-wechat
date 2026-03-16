import { Hono } from "hono";
import { db } from "../db";
import { pets, users } from "../db/schema";
import { eq } from "drizzle-orm";
import { verifyInviteCode } from "../utils/invite";

const invitePublicRoute = new Hono();

// 查看邀请详情（公开路由，不需要登录即可预览）
invitePublicRoute.get("/:code", async (c) => {
  const code = c.req.param("code");
  const payload = verifyInviteCode(code);
  if (!payload) return c.json({ error: "Invalid invite code" }, 400);

  const [pet] = await db.select().from(pets).where(eq(pets.id, payload.petId));
  const [fromUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.fromUserId));

  return c.json({
    petName: pet?.name ?? "未知宠物",
    petSpecies: pet?.species ?? "cat",
    fromNickname: fromUser?.nickname ?? "未知用户",
    fromUserId: payload.fromUserId,
    petId: payload.petId,
  });
});

export default invitePublicRoute;
