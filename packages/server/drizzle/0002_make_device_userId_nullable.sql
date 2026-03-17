-- 项圈和桌面摆台的 userId 改为可选，支持"无主设备"（工厂出货状态）
ALTER TABLE "collar_devices" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "desktop_devices" ALTER COLUMN "user_id" DROP NOT NULL;
