# 需求文档：Admin 管理端登录认证

## 简介

当前 Admin 管理端的 `getAdminKey()` 函数带有硬编码的默认值 `"yehey-admin-dev"`，导致任何人无需输入 Admin Key 即可直接访问所有管理功能。需要移除硬编码默认值，在用户未设置 Admin Key 时强制要求输入。

## 需求

### 需求 1 - 移除硬编码 Admin Key 默认值

**用户故事：** 作为系统管理员，我希望 Admin Key 不再有硬编码的默认值，以便未授权的人无法直接访问管理端。

#### 验收标准

1. 当 `localStorage` 中没有存储 `adminKey` 时，`getAdminKey()` 应该返回空字符串（而非默认值 `"yehey-admin-dev"`）
2. 后端收到空的 `X-Admin-Key` 头时，应该返回 401 未授权

### 需求 2 - 未设置 Admin Key 时强制输入

**用户故事：** 作为系统管理员，我希望首次访问管理端时被要求输入 Admin Key，以便只有知道密钥的人才能进入。

#### 验收标准

1. 当用户访问管理端且 `localStorage` 中没有存储 `adminKey` 时，系统应该显示一个登录页面，要求输入 Admin Key
2. 登录页面应包含一个密码输入框和一个登录按钮
3. 当用户输入 Admin Key 并点击登录后，系统应该将输入的 Key 存储到 `localStorage` 中
4. 如果 Admin Key 验证失败（API 返回 401），系统应该显示错误提示，不跳转

### 需求 3 - 已登录状态下的 Key 管理

**用户故事：** 作为已登录的管理员，我希望能修改 Admin Key 或退出登录。

#### 验收标准

1. 当管理员已登录时，Header 中应该保留"Admin Key"设置按钮，允许修改 Key
2. 当 API 请求返回 401（Key 失效/变更）时，系统应该自动清除 `localStorage` 中的 Key 并跳转到登录页
3. 应该提供"退出登录"按钮，点击后清除 `localStorage` 中的 Key 并跳转到登录页
