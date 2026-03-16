# 实施计划

- [ ] 1. 复制图片资源到 assets 目录
  - 从 Downloads/images 复制所有需要的图片到 packages/app/src/assets/images/
  - 按语义重命名（pet-hero.png, btn-user.png 等）
  - _需求：需求 3, 4_

- [ ] 2. Issue #3 后端：新建 deviceAuthorizations 表 + 清理 share-links
  - 在 schema.ts 新建 deviceAuthorizations 表（authorizationStatusEnum + 表定义）
  - 删除 shareLinks、shareRecords 表和相关枚举
  - 删除 id.ts 中的 createShareCode
  - 在 devices.ts 中添加 invite 路由、删除 share-links 路由
  - 修复 pets.ts 中的级联删除逻辑
  - 修复 debug.ts 中的 deviceAuthorizations 引用
  - 更新 shared types.ts
  - _需求：需求 1_

- [ ] 3. Issue #3 前端：设备页分享改为 invite + shareAppMessage
  - 修改 devices/index.tsx handleShare → 调用 invite API + Taro.shareAppMessage
  - _需求：需求 1_

- [ ] 4. Issue #4：安全区适配
  - 主页 index.tsx：top-bar 使用动态 statusBarHeight
  - 设备页 devices/index.tsx：nav-bar 添加安全区
  - _需求：需求 2_

- [ ] 5. Issue #5：引导页布局重构
  - 图标水平排列，缩小尺寸
  - 使用真实图片资源
  - 确保单屏展示
  - _需求：需求 3_

- [ ] 6. Issue #6：主页设计稿对齐
  - 接入宠物大图和头像图片
  - 添加底部三个圆形功能按钮
  - 优化对话气泡、滑动指示器、通知铃铛位置
  - 使用图片 icon 替换设备卡片
  - _需求：需求 4_

- [ ] 7. Issue #7：MinIO 文件存储
  - docker-compose.yml 添加 MinIO 服务
  - 新建 storage.ts S3 客户端封装
  - 重写 upload.ts 上传逻辑
  - 添加 @aws-sdk/client-s3 依赖
  - _需求：需求 5_

- [ ] 8. Issue #8：多图上传修复
  - pet-avatar/index.tsx 循环上传所有图片
  - 移除硬编码 BASE_URL
  - 显示上传进度
  - _需求：需求 6_

- [ ] 9. Issue #9：UI 审查与优化
  - 全面审查按钮样式一致性
  - 检查触控区域尺寸
  - 统一加载/错误状态
  - _需求：需求 7_
