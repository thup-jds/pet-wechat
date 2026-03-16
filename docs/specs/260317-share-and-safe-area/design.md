# 技术设计

## 架构概览

两个独立修改：

1. **分享交互优化**：将 devices 页的分享按钮从 `View + onClick + Toast 引导` 改为 `Button openType="share"`，直接触发微信分享面板
2. **全局安全区修复**：将 devices、messages、profile 三个 TabBar 页面的硬编码 `padding: 80px` 改为动态 `statusBarHeight`，复用与 NavBar 组件相同的计算逻辑

## 修改 1：分享交互

### 当前问题

```
用户点击"分享" → 调 API 生成邀请码 → setShareInfo → showToast("请点右上角...")
→ 用户手动点「...」→ 触发 useShareAppMessage → 分享
```

中间 Toast 引导完全多余。

### 方案

使用 `<Button openType="share">` 替代 `<View onClick={handleShare}>`。微信小程序中，`openType="share"` 的按钮点击后直接弹出分享面板，触发 `useShareAppMessage` 回调。

**邀请码生成时机**：`useShareAppMessage` 支持返回 Promise（微信基础库 2.12.0+），所以在回调中实时调 API 生成邀请码即可，无需预生成。

**关键改动**：
- 删除 `handleShare` 函数和 `shareInfo` state
- `useShareAppMessage` 返回 Promise，内部调 API 生成邀请码
- 将"分享"按钮从 `<View>` 改为 `<Button openType="share">`，用 CSS 重置 Button 默认样式
- 分享按钮从 `pet-switcher` 容器中移出，避免点击时同时触发 `switchPet()`
- 添加 devices 页面的 `definePageConfig({ enableShareAppMessage: true })`

### 需要修改的文件

| 文件 | 改动 |
|------|------|
| `packages/app/src/pages/devices/index.tsx` | 重构分享逻辑 |
| `packages/app/src/pages/devices/index.scss` | 给 Button 添加样式重置 |

## 修改 2：全局安全区

### 当前问题

三个 TabBar 页面（devices、messages、profile）的 `.nav-bar` 使用固定 `padding: 80px 32px 24px` 或 `padding: 24px 32px 24px`，无法适配不同机型的状态栏高度。

### 方案

统一采用与 index 页面和 NavBar 组件相同的模式：在 JS 中获取 `statusBarHeight`，通过 inline style 设置 `paddingTop`。

**每个页面的改动模式相同**：
1. 在组件顶部获取 `statusBarHeight`
2. `.nav-bar` 的 SCSS 中删除固定的 `padding-top`
3. JSX 中给 `.nav-bar` 添加 `style={{ paddingTop: statusBarHeight + 'px' }}`

### 需要修改的文件

| 文件 | 改动 |
|------|------|
| `packages/app/src/pages/devices/index.tsx` | 已有 statusBarHeight，只需确认 nav-bar 使用它 |
| `packages/app/src/pages/devices/index.scss` | padding 改为 `padding: 24px 32px` |
| `packages/app/src/pages/messages/index.tsx` | 添加 statusBarHeight，传入 nav-bar style |
| `packages/app/src/pages/messages/index.scss` | padding 从 `80px 32px 24px` 改为 `0 32px 24px` |
| `packages/app/src/pages/profile/index.tsx` | 添加 statusBarHeight，传入 nav-bar style |
| `packages/app/src/pages/profile/index.scss` | padding 从 `80px 32px 24px` 改为 `0 32px 24px` |

## 测试策略

- 在微信开发者工具中切换不同机型模拟器验证安全区适配
- 验证分享按钮点击后直接弹出分享面板
- 验证分享出去的小程序卡片链接正确包含邀请码
