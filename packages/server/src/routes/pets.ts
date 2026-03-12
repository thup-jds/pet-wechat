import { Hono } from "hono";
import { db } from "../db";
import {
  pets,
  petAvatars,
  petAvatarActions,
  petBehaviors,
  collarDevices,
  desktopPetBindings,
  deviceAuthorizations,
} from "../db/schema";
import { eq, and, inArray } from "drizzle-orm";

const petsRoute = new Hono();

// 获取当前用户的所有宠物
petsRoute.get("/", async (c) => {
  const userId = c.get("userId" as never) as string;
  const result = await db.select().from(pets).where(eq(pets.userId, userId));
  return c.json({ pets: result });
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

  return c.json({ pet, avatars, actions });
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
  await db.delete(desktopPetBindings).where(eq(desktopPetBindings.petId, petId));
  await db.delete(deviceAuthorizations).where(eq(deviceAuthorizations.petId, petId));
  // 解除项圈与该宠物的关联（不删除项圈本身）
  await db
    .update(collarDevices)
    .set({ petId: null })
    .where(eq(collarDevices.petId, petId));

  await db.delete(pets).where(eq(pets.id, petId));
  return c.json({ success: true });
});

export default petsRoute;
