import { Hono } from "hono";
import { db } from "../db";
import { users } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { signToken } from "../middleware/auth";

const auth = new Hono();

// TODO: 接入真实微信 code2session 接口，当前为 MVP 简化版
// 微信小程序登录：前端传 code，后端换 openid
auth.post("/wechat", async (c) => {
  const { code } = await c.req.json<{ code: string }>();
  if (!code) return c.json({ error: "code is required" }, 400);

  // TODO: 调用微信 API https://api.weixin.qq.com/sns/jscode2session 获取 openid
  // MVP 阶段使用固定 mock openid，确保同一用户重复登录不会创建新账户
  const openid = "mock_openid_default_user";

  // 使用 upsert 避免并发首次登录的竞态条件
  const [user] = await db
    .insert(users)
    .values({
      wechatOpenid: openid,
      nickname: "微信用户",
    })
    .onConflictDoUpdate({
      target: users.wechatOpenid,
      set: { nickname: sql`${users.nickname}` },
    })
    .returning();

  const token = await signToken(user.id);
  return c.json({ token, user });
});

// 手机号验证码登录
auth.post("/phone", async (c) => {
  const { phone, code } = await c.req.json<{ phone: string; code: string }>();
  if (!phone || !code) return c.json({ error: "phone and code required" }, 400);

  // TODO: 接入真实短信验证码服务
  if (code !== "123456") {
    return c.json({ error: "验证码错误" }, 400);
  }

  // 使用 upsert 避免并发首次登录的竞态条件
  const [user] = await db
    .insert(users)
    .values({
      phone,
      nickname: `用户${phone.slice(-4)}`,
    })
    .onConflictDoUpdate({
      target: users.phone,
      set: { nickname: sql`${users.nickname}` },
    })
    .returning();

  const token = await signToken(user.id);
  return c.json({ token, user });
});

export default auth;
