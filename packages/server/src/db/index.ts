import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://pet:pet123@localhost:5432/pet_wechat";

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
