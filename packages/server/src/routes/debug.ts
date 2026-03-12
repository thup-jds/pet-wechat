import { Hono } from "hono";
import { db } from "../db";
import {
  users,
  pets,
  collarDevices,
  desktopDevices,
  desktopPetBindings,
  deviceAuthorizations,
  petAvatars,
  petBehaviors,
  messages,
} from "../db/schema";
import { eq } from "drizzle-orm";

const debugRoute = new Hono();

// 采集对照：汇总当前用户的所有数据（用于测试数据采集）
debugRoute.get("/collect-data", async (c) => {
  const userId = c.get("userId" as never) as string;

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const userPets = await db.select().from(pets).where(eq(pets.userId, userId));
  const collars = await db
    .select()
    .from(collarDevices)
    .where(eq(collarDevices.userId, userId));
  const desktops = await db
    .select()
    .from(desktopDevices)
    .where(eq(desktopDevices.userId, userId));

  const petIds = userPets.map((p) => p.id);

  let bindings: any[] = [];
  let avatars: any[] = [];
  let behaviors: any[] = [];

  for (const pid of petIds) {
    const b = await db
      .select()
      .from(desktopPetBindings)
      .where(eq(desktopPetBindings.petId, pid));
    bindings.push(...b);
    const av = await db
      .select()
      .from(petAvatars)
      .where(eq(petAvatars.petId, pid));
    avatars.push(...av);
    const bh = await db
      .select()
      .from(petBehaviors)
      .where(eq(petBehaviors.petId, pid));
    behaviors.push(...bh);
  }

  const sentAuth = await db
    .select()
    .from(deviceAuthorizations)
    .where(eq(deviceAuthorizations.fromUserId, userId));
  const recvAuth = await db
    .select()
    .from(deviceAuthorizations)
    .where(eq(deviceAuthorizations.toUserId, userId));

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.userId, userId));

  return c.json({
    user,
    pets: userPets,
    collars,
    desktops,
    bindings,
    sentAuthorizations: sentAuth,
    receivedAuthorizations: recvAuth,
    avatars,
    behaviors,
    messages: msgs,
    summary: {
      petCount: userPets.length,
      collarCount: collars.length,
      desktopCount: desktops.length,
      bindingCount: bindings.length,
      behaviorCount: behaviors.length,
      avatarCount: avatars.length,
      messageCount: msgs.length,
    },
  });
});

export default debugRoute;
