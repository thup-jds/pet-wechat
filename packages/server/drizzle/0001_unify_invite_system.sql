-- 移除旧的分享链接机制
DROP TABLE IF EXISTS "share_records";
DROP TABLE IF EXISTS "share_links";
DROP TYPE IF EXISTS "public"."share_link_status";
DROP TYPE IF EXISTS "public"."share_type";

-- 创建新的授权状态枚举
DO $$ BEGIN
  CREATE TYPE "public"."authorization_status" AS ENUM('pending', 'accepted', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 创建设备授权表
CREATE TABLE IF NOT EXISTS "device_authorizations" (
  "id" text PRIMARY KEY NOT NULL,
  "from_user_id" text NOT NULL,
  "to_user_id" text NOT NULL,
  "pet_id" text NOT NULL,
  "status" "authorization_status" DEFAULT 'accepted' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "device_authorizations_from_user_id_to_user_id_pet_id_unique" UNIQUE("from_user_id", "to_user_id", "pet_id")
);

-- 添加 additional_image_urls 字段到 pet_avatars
ALTER TABLE "pet_avatars" ADD COLUMN IF NOT EXISTS "additional_image_urls" text;
