# 技术设计文档

## 架构概览

本次变更涉及前端（Taro 小程序）、后端（Hono API）、数据库（PostgreSQL + Drizzle）三层，以及 Docker Compose 基础设施。变更按 Issue 分组，彼此相对独立。

## 变更清单

### Issue #3 - 统一分享机制

**后端变更：**

1. **新建 `deviceAuthorizations` 表**（schema.ts）
   - 字段：id, fromUserId, toUserId, petId, status(pending/accepted/rejected), createdAt
   - 这是 invite 接受后的持久化授权记录

2. **新增 invite 接受路由**（devices.ts）
   - `POST /api/devices/invite` — 生成 invite code（调用 generateInviteCode）
   - `POST /api/devices/invite/:code/accept` — 验证 code，创建 deviceAuthorization 记录 + desktopPetBindings

3. **清理 share-links 代码**
   - 删除 `shareLinks`、`shareRecords` 表定义（schema.ts）
   - 删除 `shareTypeEnum`、`shareLinkStatusEnum` 枚举
   - 删除 `createShareCode` 引用（id.ts）
   - 删除 devices.ts 中的 share-links 路由（POST/GET /share-links, POST /share-links/:code/use）
   - 删除 devices.ts 中桌面设备删除时的 share-links 清理代码
   - 更新 pets.ts 中删除宠物时的 share-links 清理 → 改为清理 deviceAuthorizations

4. **修复 pets.ts 中 deviceAuthorizations 引用**
   - 当前代码引用了不存在的 deviceAuthorizations，新建该表后自然修复

**前端变更：**

5. **devices/index.tsx** — handleShare 改为调用 `POST /api/devices/invite` + `Taro.shareAppMessage`

**Shared 类型清理：**

6. 删除 `ShareLink`、`ShareRecord`、`ShareType`、`ShareLinkStatus`、`DeviceAuthorizationWithUser` 类型
7. 新增 `DeviceAuthorization` 接口

### Issue #4 - 安全区适配

**前端变更：**

1. **index/index.tsx**（主页）— top-bar padding-top 使用 `Taro.getSystemInfoSync().statusBarHeight`
2. **devices/index.tsx** — nav-bar 添加 statusBarHeight padding

### Issue #5 - 引导页布局

**前端变更：**

1. **guide/index.tsx** — 重构布局，图标水平排列
2. **guide/index.scss** — 缩小图标、调整间距确保单屏展示
3. 复制设计稿图片到 `packages/app/src/assets/images/`

### Issue #6 - 主页设计稿对齐

**前端变更：**

1. **index/index.tsx** — 全面重构：
   - 宠物大图使用真实图片资源
   - 添加底部三个圆形功能按钮
   - 对话气泡使用图片背景
   - 滑动指示器改为箭头+文字+进度条
   - 通知铃铛移至左侧
   - 设备卡片使用图片 icon
2. **index/index.scss** — 对应样式重构
3. 复制所有需要的图片到 assets/images/

### Issue #7 - MinIO 文件存储

**基础设施变更：**

1. **docker-compose.yml** — 添加 MinIO 服务（端口 9000 API + 9001 Console）
2. **packages/server/package.json** — 添加 `@aws-sdk/client-s3` 依赖

**后端变更：**

3. **新建 `packages/server/src/utils/storage.ts`** — S3 客户端封装
4. **upload.ts** — 重写上传逻辑：
   - 文件类型校验（jpg/png/webp）
   - 文件大小限制（10MB）
   - 上传到 MinIO
   - 返回真实可访问 URL

### Issue #8 - 多图上传

**前端变更：**

1. **pet-avatar/index.tsx** —
   - 循环上传所有选中图片
   - 移除硬编码 BASE_URL，使用 request.ts 的配置
   - 显示上传进度

### Issue #9 - UI 审查

在完成以上所有修改后，全面审查所有页面的：
- 按钮样式一致性
- 触控区域尺寸
- 色彩对比度
- 加载/错误状态
- 过渡动画

## 数据库迁移策略

1. 删除 `share_links` 和 `share_records` 表
2. 新建 `device_authorizations` 表
3. 生成并执行 Drizzle 迁移

## 图片资源映射

从 `/Users/yangliu35/Downloads/images/` 复制到 `packages/app/src/assets/images/`：

| 设计稿文件 | 用途 | 目标文件名 |
|-----------|------|-----------|
| image-import-31.png | 宠物大图（主页中央） | pet-hero.png |
| image-import-52.png | 宠物头像（主页左上） | pet-avatar-default.png |
| image-import-16.png | 用户按钮图标 | btn-user.png |
| image-import-41.png | 数据按钮图标 | btn-data.png |
| image-import-14.png | 设置按钮图标 | btn-settings.png |
| image-import-40.png | 对话气泡背景 | speech-bubble-bg.png |
| image-import-35.png | 滑动箭头 | arrow-swipe.png |
| image-import-50.png | 铃铛图标 | bell-icon.png |
| image-import-5.png | 项圈图标（主页） | collar-icon.png |
| image-import-11.png | 桌面端图标（主页） | desktop-icon.png |

## 测试策略

1. TypeScript 编译检查（`tsc --noEmit`）
2. 后端 API 测试（现有 __tests__ 目录）
3. 前端构建验证（`pnpm build:app`）
4. 手动验证：设计稿对照截图
