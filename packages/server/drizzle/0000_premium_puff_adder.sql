CREATE TYPE "public"."avatar_status" AS ENUM('pending', 'processing', 'done', 'failed');--> statement-breakpoint
CREATE TYPE "public"."binding_type" AS ENUM('owner', 'authorized');--> statement-breakpoint
CREATE TYPE "public"."device_status" AS ENUM('online', 'offline', 'pairing');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('authorization', 'system');--> statement-breakpoint
CREATE TYPE "public"."share_link_status" AS ENUM('active', 'expired', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."share_type" AS ENUM('pet', 'desktop');--> statement-breakpoint
CREATE TYPE "public"."species" AS ENUM('cat', 'dog');--> statement-breakpoint
CREATE TABLE "collar_devices" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"pet_id" text,
	"name" text NOT NULL,
	"mac_address" text NOT NULL,
	"status" "device_status" DEFAULT 'offline' NOT NULL,
	"battery" integer,
	"signal" integer,
	"firmware_version" text,
	"last_online_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collar_devices_mac_address_unique" UNIQUE("mac_address")
);
--> statement-breakpoint
CREATE TABLE "desktop_devices" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"mac_address" text NOT NULL,
	"status" "device_status" DEFAULT 'offline' NOT NULL,
	"firmware_version" text,
	"last_online_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "desktop_devices_mac_address_unique" UNIQUE("mac_address")
);
--> statement-breakpoint
CREATE TABLE "desktop_pet_bindings" (
	"id" text PRIMARY KEY NOT NULL,
	"desktop_device_id" text NOT NULL,
	"pet_id" text NOT NULL,
	"binding_type" "binding_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unbound_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "message_type" NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pet_avatar_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"pet_avatar_id" text NOT NULL,
	"action_type" text NOT NULL,
	"image_url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pet_avatars" (
	"id" text PRIMARY KEY NOT NULL,
	"pet_id" text NOT NULL,
	"source_image_url" text NOT NULL,
	"status" "avatar_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pet_behaviors" (
	"id" text PRIMARY KEY NOT NULL,
	"pet_id" text NOT NULL,
	"collar_device_id" text NOT NULL,
	"action_type" text NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"species" "species" NOT NULL,
	"breed" text,
	"gender" "gender" DEFAULT 'unknown' NOT NULL,
	"birthday" text,
	"weight" real,
	"activity_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "share_links" (
	"id" text PRIMARY KEY NOT NULL,
	"share_code" text NOT NULL,
	"share_type" "share_type" NOT NULL,
	"target_id" text NOT NULL,
	"created_by" text NOT NULL,
	"max_uses" integer DEFAULT 1 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"expire_at" timestamp with time zone,
	"status" "share_link_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "share_links_share_code_unique" UNIQUE("share_code")
);
--> statement-breakpoint
CREATE TABLE "share_records" (
	"id" text PRIMARY KEY NOT NULL,
	"share_link_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"wechat_openid" text,
	"phone" text,
	"nickname" text NOT NULL,
	"avatar_url" text,
	"avatar_quota" integer DEFAULT 2 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_wechat_openid_unique" UNIQUE("wechat_openid"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
