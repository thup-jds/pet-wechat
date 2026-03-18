# 实施计划

- [ ] 1. 共享类型更新
  - Pet 接口增加 `latestBehavior: { actionType: string; timestamp: string } | null`
  - 新增 WsMessage 类型定义
  - _需求：需求 1, 需求 2_

- [ ] 2. 服务端 WebSocket Hub
  - 新建 `packages/server/src/ws.ts`
  - 连接管理 Map<userId, Set<WS>>
  - JWT token 鉴权（复用 verifyToken）
  - 心跳处理（ping/pong）
  - broadcast(userId, message) 函数
  - _需求：需求 1_

- [ ] 3. 服务端入口注册 WS
  - 修改 `packages/server/src/index.ts`
  - 添加 WebSocket upgrade 和 handler
  - _需求：需求 1_

- [ ] 4. 后端 API 增加 latestBehavior
  - GET `/api/pets` 批量查询最新行为
  - GET `/api/pets/:id` 查询最新行为
  - _需求：需求 2_

- [ ] 5. 行为上报后广播 WS 事件
  - POST `/api/behaviors` 成功后调用 broadcast
  - _需求：需求 1_

- [ ] 6. 小程序 WebSocket 客户端
  - 新建 `packages/app/src/utils/ws.ts`
  - Taro.connectSocket 连接管理
  - 心跳（30s）、指数退避重连
  - 事件订阅 subscribe/unsubscribe
  - _需求：需求 1_

- [ ] 7. 首页状态标签 UI
  - 宠物形象下方渲染状态标签
  - 相对时间计算函数
  - 订阅 WS behavior:new 事件实时更新
  - 样式（SCSS）
  - _需求：需求 1_
