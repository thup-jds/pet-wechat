import { Hono } from "hono";
import { createId } from "../utils/id";

const uploadRoute = new Hono();

// TODO: 接入真实对象存储（OSS/COS），当前 mock 返回假 URL
uploadRoute.post("/", async (c) => {
  const userId = c.get("userId" as never) as string;

  // Hono 支持 multipart/form-data
  const body = await c.req.parseBody();
  const file = body["file"];

  if (!file || typeof file === "string") {
    return c.json({ error: "No file uploaded" }, 400);
  }

  // Mock：生成假的 URL，实际应上传到对象存储
  const fileId = createId();
  const ext = (file as File).name?.split(".").pop() ?? "jpg";
  const mockUrl = `https://mock-storage.yehey.com/uploads/${userId}/${fileId}.${ext}`;

  return c.json({ url: mockUrl, fileId }, 201);
});

export default uploadRoute;
