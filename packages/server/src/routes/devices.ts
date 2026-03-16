import { Hono } from "hono";
import { db } from "../db";
import {
  collarDevices,
  desktopDevices,
  desktopPetBindings,
  deviceAuthorizations,
  petBehaviors,
  pets,
  users,
} from "../db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { generateInviteCode, verifyInviteCode } from "../utils/invite";

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

// ===== 邀请授权 =====

devicesRoute.post("/invite", async (c) => {
  const userId = c.get("userId" as never) as string;
  const body = await c.req.json<{ petId?: string }>();
  if (!body.petId) return c.json({ error: "petId is required" }, 400);

  const [pet] = await db
    .select()
    .from(pets)
    .where(and(eq(pets.id, body.petId), eq(pets.userId, userId)));
  if (!pet) return c.json({ error: "Pet not found" }, 404);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  const inviteCode = generateInviteCode({
    fromUserId: userId,
    petId: pet.id,
    createdAt: Date.now(),
  });

  return c.json({
    inviteCode,
    petId: pet.id,
    petName: pet.name,
    fromNickname: user?.nickname ?? "未知用户",
  });
});

devicesRoute.post("/invite/:code/accept", async (c) => {
  const userId = c.get("userId" as never) as string;
  const code = c.req.param("code");
  const payload = verifyInviteCode(code);
  if (!payload) return c.json({ error: "Invalid invite code" }, 400);

  if (payload.fromUserId === userId) {
    return c.json({ error: "Cannot accept your own invite" }, 400);
  }

  const [pet] = await db
    .select()
    .from(pets)
    .where(
      and(eq(pets.id, payload.petId), eq(pets.userId, payload.fromUserId))
    )
    .limit(1);
  if (!pet) return c.json({ error: "Pet not found" }, 404);

  const [existingAuthorization] = await db
    .select()
    .from(deviceAuthorizations)
    .where(
      and(
        eq(deviceAuthorizations.fromUserId, payload.fromUserId),
        eq(deviceAuthorizations.toUserId, userId),
        eq(deviceAuthorizations.petId, payload.petId),
        eq(deviceAuthorizations.status, "accepted")
      )
    )
    .limit(1);
  if (existingAuthorization) {
    return c.json({ error: "Already accepted this invite" }, 409);
  }

  const [authorization] = await db
    .insert(deviceAuthorizations)
    .values({
      fromUserId: payload.fromUserId,
      toUserId: userId,
      petId: payload.petId,
      status: "accepted",
    })
    .returning();

  const userDesktops = await db
    .select()
    .from(desktopDevices)
    .where(eq(desktopDevices.userId, userId));

  const bindings =
    userDesktops.length > 0
      ? await db
          .insert(desktopPetBindings)
          .values(
            userDesktops.map((desktop) => ({
              desktopDeviceId: desktop.id,
              petId: payload.petId,
              bindingType: "authorized" as const,
            })),
          )
          .returning()
      : [];

  return c.json({ authorization, bindings }, 201);
});

export default devicesRoute;
