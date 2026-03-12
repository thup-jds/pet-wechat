import { Hono } from "hono";
import { db } from "../db";
import {
  pets,
  petAvatars,
  petAvatarActions,
  petBehaviors,
  collarDevices,
  desktopPetBindings,
  shareLinks,
  shareRecords,
} from "../db/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";

const petsRoute = new Hono();

// 获取当前用户的所有宠物（含被授权的宠物）
petsRoute.get("/", async (c) => {
  const userId = c.get("userId" as never) as string;

  // 自己的宠物
  const ownPets = await db.select().from(pets).where(eq(pets.userId, userId));

  // 被授权的宠物
  const authorizedRecords = await db
    .select()
    .from(deviceAuthorizations)
    .where(
      and(
        eq(deviceAuthorizations.toUserId, userId),
        eq(deviceAuthorizations.status, "accepted")
      )
    );
  const authorizedPetIds = authorizedRecords.map((a) => a.petId);
  let authorizedPets: typeof ownPets = [];
  if (authorizedPetIds.length > 0) {
    authorizedPets = await db
      .select()
      .from(pets)
      .where(inArray(pets.id, authorizedPetIds));
  }

  return c.json({ pets: ownPets, authorizedPets });
});

// 获取单个宠物详情（含动态图像）
petsRoute.get("/:id", async (c) => {
  const userId = c.get("userId" as never) as string;
  const petId = c.req.param("id");

  const [pet] = await db
    .select()
    .from(pets)
    .where(and(eq(pets.id, petId), eq(pets.userId, userId)));
  if (!pet) return c.json({ error: "Pet not found" }, 404);

  const avatars = await db
    .select()
    .from(petAvatars)
    .where(eq(petAvatars.petId, petId));

  const avatarIds = avatars.map((a) => a.id);
  let actions: (typeof petAvatarActions.$inferSelect)[] = [];
  if (avatarIds.length > 0) {
    for (const avatarId of avatarIds) {
      const acts = await db
        .select()
        .from(petAvatarActions)
        .where(eq(petAvatarActions.petAvatarId, avatarId));
      actions.push(...acts);
    }
  }

  // 计算活跃值：基于最近 7 天的行为记录数量
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const behaviors = await db
    .select()
    .from(petBehaviors)
    .where(eq(petBehaviors.petId, petId));
  const recentCount = behaviors.filter(
    (b) => new Date(b.timestamp) >= sevenDaysAgo
  ).length;
  // TODO: 活跃值算法待产品定义，当前简单按行为次数映射 0-100
  const activityScore = Math.min(100, recentCount * 10);

  return c.json({ pet: { ...pet, activityScore }, avatars, actions });
});

// 创建宠物
petsRoute.post("/", async (c) => {
  const userId = c.get("userId" as never) as string;
  const body = await c.req.json();

  const [pet] = await db
    .insert(pets)
    .values({
      userId,
      name: body.name,
      species: body.species,
      breed: body.breed ?? null,
      gender: body.gender ?? "unknown",
      birthday: body.birthday ?? null,
      weight: body.weight ?? null,
    })
    .returning();

  return c.json({ pet }, 201);
});

// 更新宠物信息
petsRoute.put("/:id", async (c) => {
  const userId = c.get("userId" as never) as string;
  const petId = c.req.param("id");
  const body = await c.req.json();

  const [existing] = await db
    .select()
    .from(pets)
    .where(and(eq(pets.id, petId), eq(pets.userId, userId)));
  if (!existing) return c.json({ error: "Pet not found" }, 404);

  const [pet] = await db
    .update(pets)
    .set({
      name: body.name ?? existing.name,
      species: body.species ?? existing.species,
      breed: body.breed ?? existing.breed,
      gender: body.gender ?? existing.gender,
      birthday: body.birthday ?? existing.birthday,
      weight: body.weight ?? existing.weight,
      updatedAt: new Date(),
    })
    .where(eq(pets.id, petId))
    .returning();

  return c.json({ pet });
});

// 删除宠物
petsRoute.delete("/:id", async (c) => {
  const userId = c.get("userId" as never) as string;
  const petId = c.req.param("id");

  const [existing] = await db
    .select()
    .from(pets)
    .where(and(eq(pets.id, petId), eq(pets.userId, userId)));
  if (!existing) return c.json({ error: "Pet not found" }, 404);

  // 级联删除关联数据
  const avatars = await db
    .select({ id: petAvatars.id })
    .from(petAvatars)
    .where(eq(petAvatars.petId, petId));
  const avatarIds = avatars.map((a) => a.id);
  if (avatarIds.length > 0) {
    await db
      .delete(petAvatarActions)
      .where(inArray(petAvatarActions.petAvatarId, avatarIds));
  }
  await db.delete(petAvatars).where(eq(petAvatars.petId, petId));
  await db.delete(petBehaviors).where(eq(petBehaviors.petId, petId));
  // 软删除绑定记录
  await db
    .update(desktopPetBindings)
    .set({ unboundAt: new Date() })
    .where(and(eq(desktopPetBindings.petId, petId), isNull(desktopPetBindings.unboundAt)));
  // 删除分享记录再删分享链接（FK 约束）
  const petLinks = await db
    .select({ id: shareLinks.id })
    .from(shareLinks)
    .where(and(eq(shareLinks.targetId, petId), eq(shareLinks.shareType, "pet")));
  for (const link of petLinks) {
    await db.delete(shareRecords).where(eq(shareRecords.shareLinkId, link.id));
  }
  await db.delete(shareLinks).where(and(eq(shareLinks.targetId, petId), eq(shareLinks.shareType, "pet")));
  // 解除项圈与该宠物的关联（不删除项圈本身）
  await db
    .update(collarDevices)
    .set({ petId: null })
    .where(eq(collarDevices.petId, petId));

  await db.delete(pets).where(eq(pets.id, petId));
  return c.json({ success: true });
});

export default petsRoute;
