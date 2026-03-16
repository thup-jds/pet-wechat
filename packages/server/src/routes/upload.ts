import { Hono } from "hono";
import { createId } from "../utils/id";
import { uploadFile } from "../utils/storage";

const uploadRoute = new Hono();

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

uploadRoute.post("/", async (c) => {
  const userId = c.get("userId" as never) as string;
  const body = await c.req.parseBody();
  const file = body["file"];

  if (!file || typeof file === "string" || Array.isArray(file)) {
    return c.json({ error: "No file uploaded" }, 400);
  }

  const uploadedFile = file as File;

  if (!ALLOWED_TYPES.has(uploadedFile.type)) {
    return c.json({ error: "Unsupported file type" }, 400);
  }

  if (uploadedFile.size > MAX_FILE_SIZE) {
    return c.json({ error: "File too large" }, 400);
  }

  const fileId = createId();
  const ext =
    uploadedFile.type === "image/png"
      ? "png"
      : uploadedFile.type === "image/webp"
        ? "webp"
        : "jpg";
  const key = `${userId}/${fileId}.${ext}`;
  const buffer = Buffer.from(await uploadedFile.arrayBuffer());
  const url = await uploadFile(key, buffer, uploadedFile.type);

  return c.json({ url, fileId }, 201);
});

export default uploadRoute;
