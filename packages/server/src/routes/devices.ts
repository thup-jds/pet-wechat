import { Hono } from "hono";
import { db } from "../db";
import {
  collarDevices,
  desktopDevices,
  desktopPetBindings,
  petBehaviors,
  pets,
  shareLinks,
  shareRecords,
} from "../db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

const devicesRoute = new Hono();

// ===== 项圈设备 =====

devicesRoute.get("/collars", async (c) => {
  const userId = c.get("userId" as never) as string;
  const result = await db
    .select()
    .from(collarDevices)
    .where(eq(collarDevices.userId, userId));
  return c.json({ collars: result });
});

devicesRoute.post("/collars", async (c) => {
  const userId = c.get("userId" as never) as string;
  const body = await c.req.json();

  // 如果指定了 petId，校验宠物归属
  if (body.petId) {
    const [pet] = await db
      .select()
      .from(pets)
      .where(and(eq(pets.id, body.petId), eq(pets.userId, userId)));
    if (!pet) return c.json({ error: "Pet not found" }, 404);
  }

  const [collar] = await db
    .insert(collarDevices)
    .values({
      userId,
      name: body.name ?? "我的项圈",
      macAddress: body.macAddress,
      petId: body.petId ?? null,
    })
    .returning();
  return c.json({ collar }, 201);
});

devicesRoute.put("/collars/:id", async (c) => {
  const userId = c.get("userId" as never) as string;
  const id = c.req.param("id");
  const body = await c.req.json();

  const [existing] = await db
    .select()
    .from(collarDevices)
    .where(and(eq(collarDevices.id, id), eq(collarDevices.userId, userId)));
  if (!existing) return c.json({ error: "Collar not found" }, 404);

  // 如果更新 petId，校验宠物归属
  if (body.petId !== undefined && body.petId !== null) {
    const [pet] = await db
      .select()
      .from(pets)
      .where(and(eq(pets.id, body.petId), eq(pets.userId, userId)));
    if (!pet) return c.json({ error: "Pet not found" }, 404);
  }

  const [collar] = await db
    .update(collarDevices)
    .set({
      name: body.name ?? existing.name,
      petId: body.petId !== undefined ? body.petId : existing.petId,
      updatedAt: new Date(),
    })
    .where(eq(collarDevices.id, id))
    .returning();
  return c.json({ collar });
});

devicesRoute.delete("/collars/:id", async (c) => {
  const userId = c.get("userId" as never) as string;
  const id = c.req.param("id");
  const [existing] = await db
    .select()
    .from(collarDevices)
    .where(and(eq(collarDevices.id, id), eq(collarDevices.userId, userId)));
  if (!existing) return c.json({ error: "Collar not found" }, 404);

  // 级联删除关联的行为记录
  await db.delete(petBehaviors).where(eq(petBehaviors.collarDeviceId, id));
  await db.delete(collarDevices).where(eq(collarDevices.id, id));
  return c.json({ success: true });
});

// ===== 桌面端设备 =====

devicesRoute.get("/desktops", async (c) => {
  const userId = c.get("userId" as never) as string;
  const result = await db
    .select()
    .from(desktopDevices)
    .where(eq(desktopDevices.userId, userId));
  return c.json({ desktops: result });
});

devicesRoute.post("/desktops", async (c) => {
  const userId = c.get("userId" as never) as string;
  const body = await c.req.json();
  const [desktop] = await db
    .insert(desktopDevices)
    .values({
      userId,
      name: body.name ?? "我的桌面端",
      macAddress: body.macAddress,
    })
    .returning();
  return c.json({ desktop }, 201);
});

devicesRoute.delete("/desktops/:id", async (c) => {
  const userId = c.get("userId" as never) as string;
  const id = c.req.param("id");
  const [existing] = await db
    .select()
    .from(desktopDevices)
    .where(and(eq(desktopDevices.id, id), eq(desktopDevices.userId, userId)));
  if (!existing) return c.json({ error: "Desktop not found" }, 404);

  // 软删除关联的绑定记录
  await db
    .update(desktopPetBindings)
    .set({ unboundAt: new Date() })
    .where(and(eq(desktopPetBindings.desktopDeviceId, id), isNull(desktopPetBindings.unboundAt)));
  // 清理关联的分享链接（desktop 类型）
  const desktopLinks = await db
    .select({ id: shareLinks.id })
    .from(shareLinks)
    .where(and(eq(shareLinks.targetId, id), eq(shareLinks.shareType, "desktop")));
  for (const link of desktopLinks) {
    await db.delete(shareRecords).where(eq(shareRecords.shareLinkId, link.id));
  }
  await db.delete(shareLinks).where(and(eq(shareLinks.targetId, id), eq(shareLinks.shareType, "desktop")));
  await db.delete(desktopDevices).where(eq(desktopDevices.id, id));
  return c.json({ success: true });
});

// ===== 桌面端-宠物绑定 =====

devicesRoute.post("/desktops/:id/bind", async (c) => {
  const userId = c.get("userId" as never) as string;
  const desktopId = c.req.param("id");
  const body = await c.req.json<{ petId: string; bindingType: "owner" | "authorized" }>();

  const [desktop] = await db
    .select()
    .from(desktopDevices)
    .where(and(eq(desktopDevices.id, desktopId), eq(desktopDevices.userId, userId)));
  if (!desktop) return c.json({ error: "Desktop not found" }, 404);

  // 校验 petId 归属当前用户
  const [pet] = await db
    .select()
    .from(pets)
    .where(and(eq(pets.id, body.petId), eq(pets.userId, userId)));
  if (!pet) return c.json({ error: "Pet not found" }, 404);

  const [binding] = await db
    .insert(desktopPetBindings)
    .values({
      desktopDeviceId: desktopId,
      petId: body.petId,
      bindingType: body.bindingType,
    })
    .returning();
  return c.json({ binding }, 201);
});

devicesRoute.delete("/desktops/:id/bind/:bindingId", async (c) => {
  const userId = c.get("userId" as never) as string;
  const desktopId = c.req.param("id");
  const bindingId = c.req.param("bindingId");

  // 校验桌面端归属当前用户
  const [desktop] = await db
    .select()
    .from(desktopDevices)
    .where(and(eq(desktopDevices.id, desktopId), eq(desktopDevices.userId, userId)));
  if (!desktop) return c.json({ error: "Desktop not found" }, 404);

  // 软删除：设置 unbound_at
  const [binding] = await db
    .update(desktopPetBindings)
    .set({ unboundAt: new Date() })
    .where(
      and(
        eq(desktopPetBindings.id, bindingId),
        eq(desktopPetBindings.desktopDeviceId, desktopId),
        isNull(desktopPetBindings.unboundAt),
      )
    )
    .returning();
  if (!binding) return c.json({ error: "Binding not found" }, 404);
  return c.json({ success: true });
});

// ===== 分享链接 =====

devicesRoute.post("/share-links", async (c) => {
  const userId = c.get("userId" as never) as string;
  const body = await c.req.json<{
    shareType: "pet" | "desktop";
    targetId: string;
    maxUses?: number;
  }>();

  // MVP 阶段只支持 pet 类型分享
  if (body.shareType !== "pet") {
    return c.json({ error: "Only pet sharing is supported" }, 400);
  }

  // 校验资源归属
  const [pet] = await db
    .select()
    .from(pets)
    .where(and(eq(pets.id, body.targetId), eq(pets.userId, userId)));
  if (!pet) return c.json({ error: "Pet not found" }, 404);

  const [shareLink] = await db
    .insert(shareLinks)
    .values({
      shareType: body.shareType,
      targetId: body.targetId,
      createdBy: userId,
      maxUses: body.maxUses ?? 1,
    })
    .returning();
  return c.json({ shareLink }, 201);
});

devicesRoute.get("/share-links", async (c) => {
  const userId = c.get("userId" as never) as string;
  const result = await db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.createdBy, userId));
  return c.json({ shareLinks: result });
});

devicesRoute.post("/share-links/:code/use", async (c) => {
  const userId = c.get("userId" as never) as string;
  const code = c.req.param("code");

  // 查找分享链接
  const [link] = await db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.shareCode, code));
  if (!link) return c.json({ error: "Share link not found" }, 404);

  // 不能使用自己的分享码
  if (link.createdBy === userId) {
    return c.json({ error: "Cannot use your own share link" }, 400);
  }

  // 校验状态
  if (link.status !== "active") {
    return c.json({ error: "Share link is no longer active" }, 400);
  }

  // 校验过期
  if (link.expireAt && new Date(link.expireAt) < new Date()) {
    return c.json({ error: "Share link has expired" }, 400);
  }

  // 条件更新防竞态：只在 used_count < max_uses 时递增
  const [updated] = await db
    .update(shareLinks)
    .set({ usedCount: sql`${shareLinks.usedCount} + 1` })
    .where(
      and(
        eq(shareLinks.id, link.id),
        sql`${shareLinks.usedCount} < ${shareLinks.maxUses}`,
      )
    )
    .returning();
  if (!updated) {
    return c.json({ error: "Share link has reached max uses" }, 400);
  }

  // 为使用者的每个摆台创建授权绑定
  const userDesktops = await db
    .select()
    .from(desktopDevices)
    .where(eq(desktopDevices.userId, userId));

  if (userDesktops.length === 0) {
    // 回滚 used_count
    await db
      .update(shareLinks)
      .set({ usedCount: sql`${shareLinks.usedCount} - 1` })
      .where(eq(shareLinks.id, link.id));
    return c.json({ error: "You have no desktop devices to bind" }, 400);
  }

  for (const desktop of userDesktops) {
    await db.insert(desktopPetBindings).values({
      desktopDeviceId: desktop.id,
      petId: link.targetId,
      bindingType: "authorized",
    });
  }

  // 创建使用记录
  const [record] = await db
    .insert(shareRecords)
    .values({
      shareLinkId: link.id,
      userId,
    })
    .returning();

  return c.json({ record });
});

export default devicesRoute;
