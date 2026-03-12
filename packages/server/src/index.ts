import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authMiddleware } from "./middleware/auth";
import authRoute from "./routes/auth";
import petsRoute from "./routes/pets";
import avatarsRoute from "./routes/avatars";
import devicesRoute from "./routes/devices";
import behaviorsRoute from "./routes/behaviors";
import messagesRoute from "./routes/messages";
import meRoute from "./routes/me";
import debugRoute from "./routes/debug";
import uploadRoute from "./routes/upload";
import invitePublicRoute from "./routes/invite-public";

const app = new Hono();

app.use("*", logger());
app.use("*", cors());

app.get("/", (c) => c.json({ name: "YEHEY Pet API", version: "0.1.0" }));
app.get("/health", (c) => c.json({ status: "ok" }));

// 公开路由（登录接口 + 邀请预览）
app.route("/api/auth", authRoute);
app.route("/api/invite", invitePublicRoute);

// 需要鉴权的路由
app.use("/api/*", authMiddleware);
app.route("/api/me", meRoute);
app.route("/api/pets", petsRoute);
app.route("/api/avatars", avatarsRoute);
app.route("/api/devices", devicesRoute);
app.route("/api/behaviors", behaviorsRoute);
app.route("/api/messages", messagesRoute);
app.route("/api/upload", uploadRoute);
app.route("/api/debug", debugRoute);

const port = Number(process.env.PORT ?? 9527);
console.log(`Server running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
