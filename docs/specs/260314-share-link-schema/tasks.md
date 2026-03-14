# 实施计划

- [ ] 1. Schema 变更
  - 删除 `deviceAuthorizations` 表和 `authorizationStatusEnum` 枚举
  - 新增 `shareTypeEnum`、`shareLinkStatusEnum` 枚举
  - 新增 `shareLinks`、`shareRecords` 表
  - 为 users、pets 添加 `updatedAt` 字段
  - 为 collar_devices 添加 `firmwareVersion`、`lastOnlineAt`、`updatedAt` 字段
  - 为 desktop_devices 添加 `firmwareVersion`、`lastOnlineAt`、`updatedAt` 字段
  - 为 desktop_pet_bindings 添加 `unboundAt` 字段
  - _需求：1, 2, 3, 4_

- [ ] 2. 共享类型更新
  - 删除 `AuthorizationStatus`、`DeviceAuthorization` 类型
  - 新增 `ShareType`、`ShareLinkStatus`、`ShareLink`、`ShareRecord` 类型
  - 为 `User`、`Pet`、`CollarDevice`、`DesktopDevice`、`DesktopPetBinding` 添加新字段
  - _需求：1, 2, 3, 4_

- [ ] 3. 工具函数
  - 新增 `createShareCode()` 生成 8 位分享码
  - _需求：1_

- [ ] 4. API 路由变更
  - 从 devices.ts 删除授权路由（POST/GET/PUT authorizations）
  - 新增分享码路由：POST share-links、POST share-links/:code/use、GET share-links
  - 修改解绑路由为软删除（设置 unbound_at）
  - 修改更新路由自动设置 updated_at
  - _需求：1, 2, 4_

- [ ] 5. 级联删除修复
  - pets.ts 中将 deviceAuthorizations 级联删除改为 shareLinks 级联删除
  - _需求：1_

- [ ] 6. 前端页面更新
  - 删除设备页的授权通知 UI 和相关状态/逻辑
  - 添加分享按钮（在宠物卡片或摆台卡片旁）
  - _需求：1_

- [ ] 7. 数据库迁移
  - 运行 `pnpm db:generate` 生成迁移
  - 运行 `pnpm db:migrate` 执行迁移
  - _需求：1, 2, 3, 4_
