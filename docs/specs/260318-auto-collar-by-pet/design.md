# 技术设计文档

## 架构概览

本次改动涉及两个层面：
1. **前端（管理后台）**：选择宠物后，根据 `collar_devices.petId` 过滤项圈候选列表
2. **后端 API**：在行为事件创建接口中增加 petId-collarDeviceId 绑定关系校验

改动范围小，不涉及数据库 schema 变更，不新增 API 端点。

## 需要修改的文件

| 文件 | 改动内容 |
|------|----------|
| `packages/admin/src/pages/Events.tsx` | 宠物选择联动项圈过滤 |
| `packages/server/src/routes/admin.ts` | POST `/behaviors` 和 `/behaviors/auto` 增加绑定校验 |
| `packages/server/src/routes/behaviors.ts` | POST `/` 增加绑定校验 |
| `packages/server/src/__tests__/behaviors.test.ts` | 更新测试中的 fakeCollar 确保带 petId |

## 详细设计

### 1. 前端：Events.tsx 改动

#### 核心逻辑

```
选择宠物 → 从 collars 中过滤出 petId === selectedPetId 的项圈 → 更新项圈候选列表
```

#### 实现方式

- 使用 `Form.useWatch('petId', form)` 监听宠物选择变化（避免 `onValuesChange` 在任意字段变更时触发的误清空问题）
- 计算 `filteredCollars = collars.filter(c => c.petId === selectedPetId)`
- 如果 `filteredCollars.length === 1`，自动设置 `collarDeviceId` 的值
- 如果 `filteredCollars.length === 0`，显示空状态提示"该宠物未绑定项圈，请先绑定"
- 如果 `filteredCollars.length > 1`，显示项圈列表，label 中包含上次在线时间和创建时间
- 当未选择宠物时，项圈下拉列表为空（不显示全量项圈）
- 切换宠物时，通过 `useEffect` 重置 `collarDeviceId` 字段并在单项圈时自动选中

#### 项圈选项 label 格式

```
{name} ({macAddress}) | 上次在线: {lastOnlineAt ?? "从未上线"} | 创建: {createdAt}
```

`lastOnlineAt` 可能为 null，需要 fallback 显示"从未上线"。

#### 两个弹窗各自独立

手动创建弹窗和批量生成弹窗各自使用独立的 `Form.useWatch`，不共享状态。每个弹窗内部逻辑一致：watch petId → 计算 filteredCollars → 联动。

### 2. 后端：校验函数抽取

三个接口的校验逻辑相同，抽取共享函数避免重复：

```typescript
// 放在 admin.ts 中（或独立 utils），校验 collarDeviceId 对应的项圈是否绑定了指定 petId
async function validateCollarPetBinding(collarDeviceId: string, petId: string) {
  const [collar] = await db.select().from(collarDevices)
    .where(eq(collarDevices.id, collarDeviceId));
  if (!collar) return { valid: false, status: 404, error: "Collar not found" };
  if (collar.petId !== petId) return { valid: false, status: 400, error: "项圈与宠物不匹配" };
  return { valid: true, collar };
}
```

错误码区分：项圈不存在返回 404，绑定不匹配返回 400，与现有 API 语义一致。

### 3. 后端：behaviors.ts 改动

现有代码已经分别校验了宠物归属和项圈归属，在项圈归属校验后增加绑定关系校验：

```typescript
if (collar.petId !== body.petId) {
  return c.json({ error: "项圈与宠物不匹配" }, 400);
}
```

### 4. 测试修复

`packages/server/src/__tests__/behaviors.test.ts` 中 `fakeCollar()` 默认 `petId: null`，增加绑定校验后该测试会失败。需要更新测试用例，确保 fakeCollar 创建时带正确的 `petId`。

## 测试策略

- 前端：手动验证两个弹窗的联动行为
- 后端：更新现有测试确保绑定校验生效
- 后端：通过管理后台手动测试 API 校验

## 安全考虑

- 后端校验是防御性措施，防止绕过前端直接调用 API 传入不匹配的 petId/collarDeviceId
- 不涉及权限变更
- 注意：TOCTOU 竞态（校验后插入前项圈被改绑）在管理后台场景下可接受，无需事务保护
