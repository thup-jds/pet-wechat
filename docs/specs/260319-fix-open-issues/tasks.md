# 实施计划

- [ ] 1. #32 用户昵称可编辑
  - 在 `profile/index.tsx` 中给昵称区域添加 `onClick={handleEditNickname}`
  - 新增 `isDefaultNickname(nickname)` 函数，匹配 `微信用户`、`(微信用户)`、空串、纯空白、`用户XXXX` 格式
  - 默认昵称时在昵称下方显示「点击修改昵称」提示文字
  - 在 `profile/index.scss` 中添加昵称可点击的样式（下划线提示）
  - _需求：需求 1_

- [ ] 2. #27 页面滚动溢出安全区修复
  - **消息页**：`messages/index.scss` 根节点改 `height: 100vh; overflow: hidden`，已有 ScrollView 填充剩余空间
  - **我的页**：`profile/index.tsx` 内容区包裹 `ScrollView scrollY`；`profile/index.scss` 根节点改 `height: 100vh; overflow: hidden`
  - **主页**：`index/index.tsx` 内容区包裹 `ScrollView scrollY`；`index/index.scss` 根节点改 `height: 100vh; overflow: hidden`
  - 确认设备页已正确（nav-bar 不在 ScrollView 内）
  - _需求：需求 2_

- [ ] 3. #26 主页底部多余猫咪占位图
  - `packages/shared/src/types.ts` 给 Pet 类型添加 `avatarImageUrl?: string`
  - `packages/server/src/routes/pets.ts` GET 接口增加子查询：`pet_avatars WHERE status='done' ORDER BY created_at DESC LIMIT 1` → 取关联 `pet_avatar_actions WHERE sort_order=0` 的 `image_url`
  - `packages/app/src/pages/index/index.tsx` hero-image 条件渲染：有 `avatarImageUrl` 时用它，否则用 `petHero`
  - _需求：需求 3_

- [ ] 4. #25 形象定制完成通知
  - `packages/shared/src/types.ts` 添加 `WsAvatarDoneMessage` 类型
  - `packages/server/src/routes/avatars.ts` POST `/:id/actions`：
    - 幂等检查（status 已为 done 则跳过）
    - 使用事务包裹：插入 actions + 更新状态 + 插入系统消息
    - 事务成功后 WS 推送 `avatar:done` 给宠物主人
  - `packages/server/src/ws.ts` 导出 broadcast 函数供 avatars 路由使用
  - `packages/app/src/pages/index/index.tsx` 订阅 `avatar:done`，收到后 toast + 重新加载数据
  - `packages/app/src/pages/pet-avatar/index.tsx` 上传改为限流并发（并发数 3），更新进度文案
  - _需求：需求 4_

- [ ] 5. #24 宠物图片上传入口
  - `packages/app/src/pages/index/index.tsx` 在 hero-shell 内添加相机图标按钮（仅 ownPets 显示）
  - 点击跳转到 `/pages/pet-avatar/index?petId=${currentPet.id}`
  - `packages/app/src/pages/index/index.scss` 添加编辑按钮样式（右下角定位）
  - _需求：需求 5_

- [ ] 6. #11 邀请码一次性使用
  - `packages/server/src/db/schema.ts` 新增 `inviteCodes` 表
  - 运行 `pnpm db:generate` 生成迁移
  - `packages/server/src/routes/devices.ts` POST `/invite`：生成码后插入 `invite_codes`（存 SHA-256 hash）
  - `packages/server/src/routes/devices.ts` POST `/invite/:code/accept`：
    - 查 `invite_codes` 表，无记录则按原有逻辑处理（兼容旧码）
    - 有记录则用原子更新 `accepted_by IS NULL` 条件写入，失败则返回「邀请已失效」
  - _需求：需求 6_
