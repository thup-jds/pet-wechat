# 技术设计：UI 打磨模式

## 架构概览

在数据层（`request.ts` / `ws.ts`）统一拦截，页面代码无需任何修改。Mock 数据集中存放在 `src/mock/` 目录。

```mermaid
graph TD
    A[页面代码] -->|request()| B{isMockMode?}
    B -->|是| C[mock/handler.ts<br/>URL 匹配返回 mock 数据]
    B -->|否| D[真实 HTTP 请求]

    A -->|connectWs / subscribe| E{isMockMode?}
    E -->|是| F[ws.ts 跳过连接<br/>subscribe 正常工作]
    E -->|否| G[真实 WebSocket]

    H[MockToggle 浮动按钮] -->|切换| I[mock/mode.ts<br/>状态管理 + 持久化]
```

## 新增文件清单

```
packages/app/src/mock/
├── mode.ts          # Mock 模式状态管理（开关、持久化）
├── data.ts          # 全部 Mock 数据（最小数据集）
└── handler.ts       # URL 路由匹配，返回对应 mock 数据

packages/app/src/components/MockToggle/
├── index.tsx        # 浮动开关按钮组件
└── index.scss       # 样式
```

## 需要修改的文件

| 文件 | 修改内容 |
|------|---------|
| `packages/app/src/utils/request.ts` | `request()` 入口检查 mock 模式，委托 `mock/handler.ts` |
| `packages/app/src/utils/ws.ts` | `connectWs()` mock 模式下先 `disconnectWs()` 清理已有连接，再 return |
| `packages/app/src/app.ts` | 入口文件，包裹 `children` 时附加 `<MockToggle />` |

## 详细设计

### 1. mock/mode.ts — 状态管理

```typescript
import Taro from "@tarojs/taro";

const STORAGE_KEY = "__ui_polish_mode__";

export function isMockMode(): boolean {
  return Taro.getStorageSync(STORAGE_KEY) === "1";
}

export function setMockMode(enabled: boolean): void {
  if (enabled) {
    Taro.setStorageSync(STORAGE_KEY, "1");
  } else {
    Taro.removeStorageSync(STORAGE_KEY);
  }
}
```

不需要事件订阅机制。切换后直接 `Taro.reLaunch` 到首页即可。

### 2. mock/data.ts — Mock 数据

最小数据集，覆盖所有 API 端点：

| 数据 | 数量 | 说明 |
|------|------|------|
| User | 1 | 含 nickname、phone、avatarUrl、avatarQuota |
| Pet（自有） | 2 | 一猫一狗，含 latestBehavior 和 avatarImageUrl |
| Pet（授权） | 1 | 被授权访问的宠物 |
| CollarDevice | 1 | 在线状态，含电量/信号 |
| DesktopDevice | 1 | 在线状态 |
| Message | 3 | 覆盖 authorization（通过/拒绝）+ system（定制完成）三种变体，title 需包含关键词以触发消息页的 variant 判断 |
| PetAvatar | 1 | status: "done"，用于 avatar 相关页面 |

所有数据使用 `@pet-wechat/shared` 中的类型定义，确保类型安全。

### 3. mock/handler.ts — 请求路由

使用正则或前缀匹配（而非精确字符串匹配），兼容 query 参数和路径参数：

```typescript
type MockRoute = {
  method: string;
  pattern: RegExp;
  handler: (url: string, data?: any) => any;
};
```

**覆盖的端点（含 Codex 审查补充的遗漏）：**

| 方法 | URL 模式 | 返回 |
|------|---------|------|
| GET | `/api/pets` | `{ pets, authorizedPets }` |
| POST | `/api/pets` | `{ pet: mockPets[0] }`（含 id，供后续跳转） |
| PUT | `/api/pets/:id` | `{}` |
| GET | `/api/pets/:id` | 按 id 查找 mock pet |
| GET | `/api/devices/collars` | `{ collars }` |
| GET | `/api/devices/desktops` | `{ desktops }` |
| GET | `/api/devices/collars/unowned` | `{ collars: [] }` |
| GET | `/api/devices/desktops/unowned` | `{ desktops: [] }` |
| POST | `/api/devices/collars/:id/claim` | `{ collar: mockCollar }` |
| POST | `/api/devices/desktops/:id/claim` | `{ desktop: mockDesktop }` |
| POST | `/api/devices/desktops/:id/bind` | `{}` |
| PUT | `/api/devices/collars/:id` | `{}` |
| POST | `/api/devices/invite` | `{ inviteCode: "mock-invite-code" }` |
| GET | `/api/invite/:code` | `{ pet: mockPets[0], fromUser: mockUser }` |
| POST | `/api/invite/:code/accept` | `{}` |
| GET | `/api/me` | `{ user }` |
| PUT | `/api/me` | `{ user }` |
| GET | `/api/messages` | `Message[]`（忽略 query 参数，返回全部） |
| GET | `/api/messages/unread-count` | `{ count: 2 }` |
| PUT | `/api/messages/read-all` | `{}` |
| PUT | `/api/messages/:id/read` | `{}` |
| POST | `/api/auth/wechat` | `{ token: "mock-token", user: mockUser }` |
| POST | `/api/avatars` | `{ avatar: { id: "mock-avatar-1", ... } }`（含 id） |
| GET | `/api/avatars/:id` | `{ avatar: mockAvatar }` |
| POST | `/api/upload` | `{ url: "https://placeholder.com/mock.jpg" }` |
| GET | `/api/debug/collect-data` | `{ mock: true }` |
| **默认** | 未匹配路由 | `console.warn` 输出未覆盖的 URL，返回 `{}` |

**写操作注意**：需要返回包含 id 等关键字段的响应体，因为后续页面流程依赖这些字段（如 `pet.id` 用于跳转、`avatar.id` 用于查询进度）。

### 4. request.ts 改造

在 `request()` 函数开头加检查：

```typescript
import { isMockMode } from "../mock/mode";
import { handleMockRequest } from "../mock/handler";

export async function request<T>(options: RequestOptions): Promise<T> {
  if (isMockMode()) {
    return handleMockRequest<T>(options);
  }
  // ... 原有逻辑不变
}
```

### 5. ws.ts 改造

`connectWs()` 开头检查 mock 模式：

```typescript
import { isMockMode } from "../mock/mode";

export async function connectWs() {
  if (isMockMode()) {
    // Mock 模式下清理已有连接并跳过
    disconnectWs();
    return;
  }
  // ... 原有逻辑不变
}
```

`subscribe` / `unsubscribe` 保持原样，Map 机制不受影响——只是不会有消息推送进来。

### 6. 登录态处理

Mock 模式下需要绕过登录态检查。在 `mock/mode.ts` 中：

```typescript
// mock 模式开启时，确保 storage 中有 mock token
export function ensureMockLoginState(): void {
  if (!isMockMode()) return;
  if (!Taro.getStorageSync("token")) {
    Taro.setStorageSync("token", "mock-token");
  }
}
```

在 `app.ts` 的 `useLaunch` 中调用 `ensureMockLoginState()`。这样 `isLoggedIn()` 检查自然通过，各页面的登录态 gating 不需要修改。

### 7. MockToggle 组件

**挂载方式**：不在 `app.ts` 全局挂载（原生 tabBar 下 fixed 层级不稳定），而是创建一个简单组件，在每个页面的根 View 内引入。

但为了"页面代码最小改动"，采用折中方案：**只在 4 个 tabBar 页面引入 MockToggle**（主页、设备、消息、我的）。二级页面不需要切换入口。

**样式**：
- 小圆形按钮（36px），右下角 `position: fixed`
- 距底部：`env(safe-area-inset-bottom) + 70px`（在 tabBar 之上）
- 关闭状态：半透明灰色背景，显示 "M"
- 开启状态：品牌色背景，高亮
- z-index 足够高但不用极端值

**行为**：
- 点击切换模式，`Taro.showToast` 提示
- 切换后 `Taro.reLaunch({ url: "/pages/index/index" })` 回到首页重新加载
  - 使用 `reLaunch` 到首页（固定路由），不尝试保留当前页面参数——这是 UI 打磨模式，回首页是合理的

### 8. 退出登录兼容

两条退出路径（profile 页 `clearStorageSync` / settings 页部分清除）都会清除 mock 模式标志。这是预期行为——退出登录后 mock 模式自然关闭。无需特殊处理。

## 测试策略

- 手动验证：开启 mock 模式后遍历所有 Tab 页面和关键二级页面，确认数据正常渲染
- 关闭 mock 模式后确认恢复真实数据请求
- 验证消息页三种变体（通过/拒绝/定制完成）在 mock 数据下都能正确渲染
- 验证写操作流程（创建宠物 → 跳转 avatar 页）在 mock 下不报错

## 安全考虑

- Mock 机制仅在前端，不涉及后端改动
- Mock 数据不含任何真实用户信息
- 生产环境保留此功能（便于 UI 调试），因为它不影响后端安全
