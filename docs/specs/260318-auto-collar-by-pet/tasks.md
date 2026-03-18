# 实施计划

- [ ] 1. 后端：抽取绑定校验函数并应用到三个接口
  - 在 `packages/server/src/routes/admin.ts` 中创建 `validateCollarPetBinding` 函数
  - POST `/api/admin/behaviors` 增加绑定校验调用
  - POST `/api/admin/behaviors/auto` 增加绑定校验调用
  - 在 `packages/server/src/routes/behaviors.ts` POST `/` 中，在现有项圈归属校验后增加 `collar.petId !== body.petId` 判断
  - _需求：需求 3_

- [ ] 2. 后端：修复测试
  - 更新 `packages/server/src/__tests__/behaviors.test.ts` 和 `packages/server/src/__tests__/helpers.ts` 中的 fakeCollar，确保创建时带正确的 petId
  - 确保现有测试全部通过
  - _需求：需求 3_

- [ ] 3. 前端：Events.tsx 宠物-项圈联动
  - 手动创建弹窗：使用 `Form.useWatch('petId', manualForm)` 监听宠物选择
  - 批量生成弹窗：使用 `Form.useWatch('petId', autoForm)` 监听宠物选择
  - 根据选中的 petId 过滤 collars 列表
  - 单项圈时自动选中 collarDeviceId
  - 多项圈时 label 显示上次在线时间（null 时显示"从未上线"）和创建时间
  - 无项圈时显示提示"该宠物未绑定项圈，请先绑定"并禁用提交
  - 切换宠物时重置 collarDeviceId
  - 未选择宠物时项圈下拉列表为空
  - _需求：需求 1、需求 2_
