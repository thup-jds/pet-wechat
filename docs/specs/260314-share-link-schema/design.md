# 技术设计

## 架构概览

本次变更涉及 3 个 package（server / shared / app），核心工作为：

1. **Schema 变更**：删除 `device_authorizations` 表和相关枚举，新增 `share_links` + `share_records` 表和枚举，为多张表添加字段
2. **API 变更**：删除旧授权 API，新增分享码 API，修改解绑 API
3. **前端变更**：删除授权通知 UI，新增分享功能入口

## 需要修改的文件清单

### Server

| 文件 | 操作 | 说明 |
|------|------|------|
| `packages/server/src/db/schema.ts` | 修改 | 删除旧表/枚举，新增表/枚举/字段 |
| `packages/server/src/routes/devices.ts` | 修改 | 删除授权路由，新增分享码路由，修改解绑逻辑 |
| `packages/server/src/routes/pets.ts` | 修改 | 删除对 deviceAuthorizations 的级联删除，改为 shareLinks 级联 |
| `packages/server/src/utils/id.ts` | 修改 | 新增 createShareCode 短码生成函数 |

### Shared

| 文件 | 操作 | 说明 |
|------|------|------|
| `packages/shared/src/types.ts` | 修改 | 删除旧类型，新增 ShareLink / ShareRecord 类型，给现有类型加字段 |

### App

| 文件 | 操作 | 说明 |
|------|------|------|
| `packages/app/src/pages/devices/index.tsx` | 修改 | 删除授权通知 UI，添加分享按钮 |

### 数据库迁移

| 文件 | 操作 | 说明 |
|------|------|------|
| `packages/server/drizzle/` | 新增 | 通过 `pnpm db:generate` 生成迁移文件 |

## 数据库变更详情

### 删除

- `device_authorizations` 表
- `authorizationStatusEnum` 枚举

### 新增枚举

- `shareTypeEnum`: `pet`, `desktop`
- `shareLinkStatusEnum`: `active`, `expired`, `disabled`

### 新增表

**share_links**：分享链接

| 字段 | 类型 | 说明 |
|------|------|------|
| id | text PK | nanoid |
| share_code | text UNIQUE NOT NULL | 8 位随机短码 |
| share_type | shareTypeEnum NOT NULL | pet 或 desktop |
| target_id | text NOT NULL | 宠物或摆台 ID |
| created_by | text NOT NULL FK→users | 创建者 |
| max_uses | integer NOT NULL default 1 | 最大使用次数 |
| used_count | integer NOT NULL default 0 | 已使用次数 |
| expire_at | timestamptz | 过期时间 |
| status | shareLinkStatusEnum NOT NULL default active | 状态 |
| created_at | timestamptz NOT NULL default now | 创建时间 |

**share_records**：使用记录

| 字段 | 类型 | 说明 |
|------|------|------|
| id | text PK | nanoid |
| share_link_id | text NOT NULL FK→share_links | 分享链接 |
| user_id | text NOT NULL FK→users | 使用者 |
| created_at | timestamptz NOT NULL default now | 使用时间 |

### 字段添加

| 表 | 新增字段 |
|----|---------|
| users | updated_at timestamptz default now |
| pets | updated_at timestamptz default now |
| collar_devices | firmware_version text, last_online_at timestamptz, updated_at timestamptz default now |
| desktop_devices | firmware_version text, last_online_at timestamptz, updated_at timestamptz default now |
| desktop_pet_bindings | unbound_at timestamptz |

## API 设计

### 删除的 API

- ~~POST /api/devices/authorizations~~
- ~~GET /api/devices/authorizations~~
- ~~PUT /api/devices/authorizations/:id~~

### 新增的 API

**POST /api/devices/share-links**

创建分享链接。

请求体：
```json
{
  "shareType": "pet" | "desktop",
  "targetId": "xxx",
  "maxUses": 1
}
```

响应：
```json
{ "shareLink": { ... } }
```

**POST /api/devices/share-links/:code/use**

使用分享码绑定。

响应：
```json
{ "binding": { ... }, "record": { ... } }
```

**GET /api/devices/share-links**

获取当前用户创建的分享链接列表。

### 修改的 API

**DELETE /api/devices/desktops/:id/bind/:bindingId**

改为软删除：设置 unbound_at 而非物理删除。

## 测试策略

由于项目没有测试框架，通过以下方式验证：
1. `pnpm db:generate` 生成迁移文件
2. `pnpm db:migrate` 执行迁移
3. 构建检查：`pnpm build`（如有）
4. 手动调用 API 验证

## 安全考虑

- 分享码使用 nanoid 生成 8 位随机码，碰撞概率极低
- 使用分享码时校验 status、过期时间、使用次数
- 只有资源所有者能创建分享链接
