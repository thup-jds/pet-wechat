# 实施计划

- [ ] 1. 修改 `packages/admin/src/api/client.ts`
  - 移除 `getAdminKey()` 的 fallback `"yehey-admin-dev"`，改为返回空字符串
  - 新增 `verifyAdminKey(key: string): Promise<boolean>` 函数，直接 fetch `/api/admin/stats` 验证
  - 在 `request()` 函数中增加 401 处理：清除 localStorage + `window.location.reload()`
  - _需求：需求 1, 需求 3_

- [ ] 2. 修改 `packages/admin/src/App.tsx`
  - 新增 `isAuthed` 状态（初始值根据 `getAdminKey()` 是否非空判断）
  - 未登录时渲染登录表单（Card + Input.Password + Button + Alert 错误提示）
  - 登录处理：调用 `verifyAdminKey()`，成功后 `setAdminKey()` + `setIsAuthed(true)`，失败显示错误
  - 保留现有 Admin Key 设置按钮和 Modal
  - Header 新增退出登录按钮（LogoutOutlined），点击清除 key + `setIsAuthed(false)`
  - 新增 `storage` 事件监听，同步多标签页登录状态
  - _需求：需求 2, 需求 3_
