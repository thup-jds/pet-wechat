# 实施计划

- [ ] 1. DB Schema + Migration
  - collarDevices.userId 去掉 notNull
  - desktopDevices.userId 去掉 notNull
  - 生成并执行 migration
  - _需求：需求 1_

- [ ] 2. Shared Types
  - CollarDevice.userId → string | null
  - DesktopDevice.userId → string | null
  - _需求：需求 1_

- [ ] 3. Server API - 无主设备端点
  - GET /devices/collars/unowned
  - GET /devices/desktops/unowned
  - POST /devices/collars/:id/claim
  - POST /devices/desktops/:id/claim
  - _需求：需求 2, 3_

- [ ] 4. Server Admin - userId 可选
  - POST /admin/collars userId 改为可选
  - POST /admin/desktops userId 改为可选
  - _需求：需求 4_

- [ ] 5. Admin 前端
  - Collars.tsx: userId 非必填 + 无主标签
  - Desktops.tsx: 同上
  - _需求：需求 4_

- [ ] 6. 小程序 - collar-bind 改造
  - 搜索调 unowned API
  - 显示设备列表 + Mock 标识
  - 选择后传 collarId 到 wifi-config
  - _需求：需求 2_

- [ ] 7. 小程序 - wifi-config 改造
  - 支持 collarId 参数，配网成功后 claim
  - 不再创建新设备
  - _需求：需求 2_

- [ ] 8. 小程序 - desktop-bind 改造
  - 搜索调 unowned API
  - 显示设备列表 + Mock 标识
  - 选择后走配网 → claim → 跳转 desktop-pair
  - _需求：需求 3_
