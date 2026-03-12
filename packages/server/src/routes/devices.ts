import { Hono } from "hono";
import { db } from "../db";
import {
  collarDevices,
  desktopDevices,
  desktopPetBindings,
  deviceAuthorizations,
  petBehaviors,
  pets,
} from "../db/schema";
import { eq, and } from "drizzle-orm";

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

  // 级联删除关联的绑定记录
  await db.delete(desktopPetBindings).where(eq(desktopPetBindings.desktopDeviceId, id));
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

  await db
    .delete(desktopPetBindings)
    .where(and(eq(desktopPetBindings.id, bindingId), eq(desktopPetBindings.desktopDeviceId, desktopId)));
  return c.json({ success: true });
});

// ===== 授权分享 =====

devicesRoute.post("/authorizations", async (c) => {
  const userId = c.get("userId" as never) as string;
  const body = await c.req.json<{ toUserId: string; petId: string }>();

  // 校验宠物归属
  const [pet] = await db
    .select()
    .from(pets)
    .where(and(eq(pets.id, body.petId), eq(pets.userId, userId)));
  if (!pet) return c.json({ error: "Pet not found" }, 404);

  const [auth] = await db
    .insert(deviceAuthorizations)
    .values({
      fromUserId: userId,
      toUserId: body.toUserId,
      petId: body.petId,
      status: "pending",
    })
    .returning();
  return c.json({ authorization: auth }, 201);
});

devicesRoute.get("/authorizations", async (c) => {
  const userId = c.get("userId" as never) as string;
  // 获取收到的和发出的授权
  const received = await db
    .select()
    .from(deviceAuthorizations)
    .where(eq(deviceAuthorizations.toUserId, userId));
  const sent = await db
    .select()
    .from(deviceAuthorizations)
    .where(eq(deviceAuthorizations.fromUserId, userId));
  return c.json({ received, sent });
});

devicesRoute.put("/authorizations/:id", async (c) => {
  const userId = c.get("userId" as never) as string;
  const id = c.req.param("id");
  const body = await c.req.json<{ status: "accepted" | "rejected" }>();

  // 只有被授权方可以接受/拒绝
  const [auth] = await db
    .update(deviceAuthorizations)
    .set({ status: body.status })
    .where(and(eq(deviceAuthorizations.id, id), eq(deviceAuthorizations.toUserId, userId)))
    .returning();
  if (!auth) return c.json({ error: "Authorization not found" }, 404);
  return c.json({ authorization: auth });
});

export default devicesRoute;
