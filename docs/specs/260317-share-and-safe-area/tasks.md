# 实施计划

- [ ] 1. 重构 devices 页分享逻辑
  - 删除 `handleShare` 函数和 `shareInfo` state
  - `useShareAppMessage` 改为返回 Promise，内部调 API 生成邀请码
  - 将分享按钮从 `<View>` 改为 `<Button openType="share">`
  - 分享按钮从 `pet-switcher` 容器中移出，防止触发 switchPet
  - 添加 `definePageConfig({ enableShareAppMessage: true })`
  - CSS 重置 Button 默认样式
  - _需求：需求 1_

- [ ] 2. 修复 devices 页安全区
  - nav-bar SCSS 删除固定 padding-top，改为 inline style 动态 statusBarHeight
  - 修复 `.device-content` 的 `calc(100vh - 128px)` 为动态值
  - _需求：需求 2_

- [ ] 3. 修复 messages 页安全区
  - 添加 statusBarHeight 获取逻辑
  - nav-bar 使用 inline style paddingTop
  - SCSS 中 padding 从 `80px 32px 24px` 改为 `0 32px 24px`
  - _需求：需求 2_

- [ ] 4. 修复 profile 页安全区
  - 添加 statusBarHeight 获取逻辑
  - nav-bar 使用 inline style paddingTop
  - SCSS 中 padding 从 `80px 32px 24px` 改为 `0 32px 24px`
  - _需求：需求 2_
