import { Hono } from "hono";
import { db } from "../db";
import { petAvatars, petAvatarActions, pets, users } from "../db/schema";
import { eq, and, gt, sql } from "drizzle-orm";

const avatarsRoute = new Hono();

function isSafeImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// 上传图片，创建定制任务
avatarsRoute.post("/", async (c) => {
  const userId = c.get("userId" as never) as string;
  const body = await c.req.json<{
    petId: string;
    sourceImageUrl: string;
    additionalImages?: string[];
  }>();

  if (!isSafeImageUrl(body.sourceImageUrl)) {
    return c.json({ error: "Invalid sourceImageUrl" }, 400);
  }

  // 检查宠物归属
  const [pet] = await db
    .select()
    .from(pets)
    .where(and(eq(pets.id, body.petId), eq(pets.userId, userId)));
  if (!pet) return c.json({ error: "Pet not found" }, 404);

  // 原子扣减额度（避免并发竞态）
  const [updated] = await db
    .update(users)
    .set({ avatarQuota: sql`${users.avatarQuota} - 1` })
    .where(and(eq(users.id, userId), gt(users.avatarQuota, 0)))
    .returning();
  if (!updated) {
    return c.json({ error: "定制额度不足" }, 403);
  }

  // 校验 additionalImages 中的 URL
  if (body.additionalImages?.some((url) => !isSafeImageUrl(url))) {
    return c.json({ error: "Invalid additionalImages URL" }, 400);
  }

  // 创建定制任务
  const [avatar] = await db
    .insert(petAvatars)
    .values({
      petId: body.petId,
      sourceImageUrl: body.sourceImageUrl,
      additionalImageUrls: body.additionalImages?.length
        ? JSON.stringify(body.additionalImages)
        : null,
      status: "pending",
    })
    .returning();

  return c.json({ avatar }, 201);
});

// 查询定制状态
avatarsRoute.get("/:id", async (c) => {
  const userId = c.get("userId" as never) as string;
  const avatarId = c.req.param("id");
  const [avatar] = await db
    .select()
    .from(petAvatars)
    .where(eq(petAvatars.id, avatarId));
  if (!avatar) return c.json({ error: "Avatar not found" }, 404);

  // 校验宠物归属
  const [pet] = await db
    .select()
    .from(pets)
    .where(and(eq(pets.id, avatar.petId), eq(pets.userId, userId)));
  if (!pet) return c.json({ error: "Unauthorized" }, 403);

  const actions = await db
    .select()
    .from(petAvatarActions)
    .where(eq(petAvatarActions.petAvatarId, avatarId));

  return c.json({ avatar, actions });
});

// TODO: 人工完成定制后，通过管理后台调用此接口上传结果
avatarsRoute.post("/:id/actions", async (c) => {
  const userId = c.get("userId" as never) as string;
  const avatarId = c.req.param("id");
  const body = await c.req.json<{
    actions: { actionType: string; imageUrl: string; sortOrder: number }[];
  }>();

  if (!Array.isArray(body.actions) || body.actions.length === 0) {
    return c.json({ error: "actions is required" }, 400);
  }
  if (body.actions.some((action) => !isSafeImageUrl(action.imageUrl))) {
    return c.json({ error: "Invalid action imageUrl" }, 400);
  }

  const [avatar] = await db
    .select()
    .from(petAvatars)
    .where(eq(petAvatars.id, avatarId));
  if (!avatar) return c.json({ error: "Avatar not found" }, 404);

  // 校验宠物归属
  const [pet] = await db
    .select()
    .from(pets)
    .where(and(eq(pets.id, avatar.petId), eq(pets.userId, userId)));
  if (!pet) return c.json({ error: "Unauthorized" }, 403);

  const inserted = await db
    .insert(petAvatarActions)
    .values(
      body.actions.map((action) => ({
        petAvatarId: avatarId,
        actionType: action.actionType,
        imageUrl: action.imageUrl,
        sortOrder: action.sortOrder,
      })),
    )
    .returning();

  // 标记为完成
  await db
    .update(petAvatars)
    .set({ status: "done" })
    .where(eq(petAvatars.id, avatarId));

  return c.json({ actions: inserted });
});

export default avatarsRoute;
