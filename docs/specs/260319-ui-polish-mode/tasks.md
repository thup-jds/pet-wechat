# 实施计划

- [ ] 1. 创建 `mock/mode.ts` — Mock 模式状态管理
  - `isMockMode()` 读取 storage
  - `setMockMode(enabled)` 写入/删除 storage
  - `ensureMockLoginState()` mock 下确保有 token
  - _需求：需求 1, 需求 4_

- [ ] 2. 创建 `mock/data.ts` — Mock 数据集
  - 1 个 User（含 nickname、phone、avatarUrl）
  - 2 个自有 Pet（一猫一狗，含 latestBehavior、avatarImageUrl）
  - 1 个授权 Pet
  - 1 个 CollarDevice（在线，含电量/信号）
  - 1 个 DesktopDevice（在线）
  - 3 条 Message（覆盖通过/拒绝/定制完成三种变体，title 含关键词）
  - 1 个 PetAvatar（status: done）
  - 所有数据使用 `@pet-wechat/shared` 类型
  - _需求：需求 2, 需求 4_

- [ ] 3. 创建 `mock/handler.ts` — 请求路由匹配
  - 使用正则匹配 URL + method
  - 覆盖 design.md 中列出的全部端点
  - 写操作返回含必要字段的响应体（如 pet.id、avatar.id）
  - 未匹配路由 console.warn + 返回 `{}`
  - _需求：需求 2, 需求 4_

- [ ] 4. 修改 `utils/request.ts` — 接入 mock 拦截
  - `request()` 开头检查 `isMockMode()`，委托 `handleMockRequest`
  - _需求：需求 2_

- [ ] 5. 修改 `utils/ws.ts` — Mock 下跳过 WebSocket
  - `connectWs()` 开头检查 `isMockMode()`，先 `disconnectWs()` 清理再 return
  - _需求：需求 3_

- [ ] 6. 修改 `app.ts` — 启动时确保 mock 登录态
  - `useLaunch` 中调用 `ensureMockLoginState()`
  - _需求：需求 1_

- [ ] 7. 创建 `components/MockToggle/` — 浮动开关按钮
  - 右下角 fixed 小圆按钮（36px）
  - 开启/关闭状态视觉区分
  - 点击切换 + Toast 提示 + `reLaunch` 到首页
  - index.tsx + index.scss
  - _需求：需求 1_

- [ ] 8. 在 4 个 tabBar 页面引入 MockToggle
  - pages/index/index.tsx
  - pages/devices/index.tsx
  - pages/messages/index.tsx
  - pages/profile/index.tsx
  - 在页面根 View 内末尾添加 `<MockToggle />`
  - _需求：需求 1_
