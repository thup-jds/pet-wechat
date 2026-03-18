# 实施计划

## 批次 1：基础设施

- [ ] 1. 创建 Design Tokens 文件
  - 创建 `packages/app/src/styles/_tokens.scss`，包含所有颜色、字号、间距、圆角、阴影、尺寸变量
  - 创建 `packages/app/src/styles/_mixins.scss`，包含 safe-area-bottom/top、btn-base/primary/secondary、card-base、text-ellipsis、mock-badge、wx-button-reset
  - _需求：需求 1_

- [ ] 2. 配置 Sass 全局注入
  - 在 Taro 配置文件中添加 `sass.resource` 配置，自动注入 `_tokens.scss` 和 `_mixins.scss`
  - 验证编译通过
  - _需求：需求 1_

- [ ] 3. 改造全局样式 app.scss
  - 将 `app.scss` 中所有硬编码值替换为 token 变量
  - `.btn-primary`、`.btn-secondary`、`.card`、`.page-title`、`.container` 使用 token
  - _需求：需求 1_

- [ ] 4. 创建安全区 Hook
  - 创建 `packages/app/src/hooks/useSafeArea.ts`
  - 包含平台兼容处理（try-catch getMenuButtonBoundingClientRect）
  - 返回 statusBarHeight、navHeight、bottomSafeArea
  - _需求：需求 3_

- [ ] 5. 增强 NavBar 组件
  - 扩展 Props：leftContent、rightContent、transparent
  - Tab 页模式：showBack=false 时不显示返回按钮
  - leftContent 和 showBack 互斥
  - 标题居中 + max-width 限制防止与左右区域重叠
  - SCSS 使用 token 变量
  - _需求：需求 2、需求 3_

## 批次 2：共享组件

- [ ] 6. 创建 StepIndicator 组件
  - 创建 `packages/app/src/components/StepIndicator/index.tsx` 和 `index.scss`
  - Props: steps (string[])、current (number)
  - 样式使用 token 变量
  - _需求：需求 10_

- [ ] 7. 创建 MockBadge 组件
  - 创建 `packages/app/src/components/MockBadge/index.tsx` 和 `index.scss`
  - Props: text (string, 默认 "模拟模式")
  - 使用 mock-badge mixin
  - _需求：需求 10_

## 批次 3：页面改造

- [ ] 8. 改造 splash 页面
  - SCSS：替换硬编码值为 token
  - 底部安全区 mixin
  - _需求：需求 1、需求 3_

- [ ] 9. 改造 login 页面
  - SCSS：替换硬编码值为 token
  - 处理 !important：微信 Button 覆盖使用 wx-button-reset mixin，其余移除
  - 底部安全区 mixin
  - _需求：需求 1、需求 3、需求 4、需求 5_

- [ ] 10. 改造 guide 页面
  - SCSS：替换硬编码值为 token
  - _需求：需求 1、需求 6_

- [ ] 11. 改造 collar-bind 页面
  - SCSS：替换硬编码值为 token
  - TSX：替换步骤指示器为 StepIndicator 组件
  - TSX：替换 Mock 标识为 MockBadge 组件
  - 底部安全区
  - _需求：需求 1、需求 3、需求 8、需求 10_

- [ ] 12. 改造 wifi-config 页面
  - SCSS：替换硬编码值为 token（特别是 mock 按钮的 #cc0000）
  - TSX：替换步骤指示器为 StepIndicator 组件
  - 表单输入统一样式
  - 底部安全区
  - _需求：需求 1、需求 3、需求 5、需求 8、需求 10_

- [ ] 13. 改造 wifi-result 页面
  - SCSS：替换硬编码值为 token
  - 底部安全区
  - _需求：需求 1、需求 3_

- [ ] 14. 改造 pet-info 页面
  - SCSS：替换硬编码值为 token
  - 表单输入统一样式
  - 底部安全区
  - _需求：需求 1、需求 3、需求 5_

- [ ] 15. 改造 pet-avatar 页面
  - SCSS：替换硬编码值为 token
  - 底部安全区
  - _需求：需求 1、需求 3_

- [ ] 16. 改造 avatar-progress 页面
  - SCSS：替换硬编码值为 token
  - 底部安全区
  - _需求：需求 1、需求 3_

- [ ] 17. 改造 desktop-bind 页面
  - SCSS：替换硬编码值为 token（特别是 mock 按钮的 #cc0000）
  - TSX：替换 Mock 标识为 MockBadge 组件
  - 底部安全区
  - _需求：需求 1、需求 3、需求 8、需求 10_

- [ ] 18. 改造 desktop-pair 页面
  - SCSS：替换硬编码值为 token
  - 底部安全区
  - _需求：需求 1、需求 3_

- [ ] 19. 改造 invite 页面
  - SCSS：替换硬编码值为 token
  - 底部安全区
  - _需求：需求 1、需求 3_

- [ ] 20. 改造 index（主页）页面
  - SCSS：替换硬编码值为 token
  - 添加 :active 交互反馈
  - 底部安全区
  - _需求：需求 1、需求 3、需求 9_

- [ ] 21. 改造 devices 页面
  - SCSS：替换硬编码值为 token
  - TSX：替换自建导航栏为 NavBar（showBack=false, rightContent 放设置按钮）
  - 状态色统一使用 token
  - _需求：需求 1、需求 2、需求 3、需求 8_

- [ ] 22. 改造 messages 页面
  - SCSS：替换硬编码值为 token
  - TSX：替换自建导航栏为 NavBar（showBack=false, rightContent 放"全部已读"）
  - _需求：需求 1、需求 2、需求 3_

- [ ] 23. 改造 profile 页面
  - SCSS：替换硬编码值为 token
  - TSX：替换自建导航栏为 NavBar（showBack=false）
  - _需求：需求 1、需求 2、需求 3_

- [ ] 24. 改造 settings 页面
  - SCSS：替换硬编码值为 token
  - TSX：使用 NavBar（showBack=true）
  - 底部安全区
  - _需求：需求 1、需求 2、需求 3_
