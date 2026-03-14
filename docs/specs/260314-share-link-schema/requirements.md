# 需求文档

## 简介

根据 TPRD 数据库设计对比结论，对现有数据库表结构进行全面升级：用分享码机制替代直接授权、补充运维字段、保留解绑历史，并开发对应的 API 和前端页面。

## 需求

### 需求 1 - 分享码替代直接授权

**用户故事：** 作为宠物主人，我想要生成分享码/卡片发到微信群或好友，以便任何拿到分享码的人都能绑定我的宠物到他们的摆台上。

#### 验收标准

1. 当用户在宠物详情或摆台页面点击"分享"时，系统应该创建一条 share_links 记录并返回 share_code
2. 当用户转发小程序卡片到群或好友时，卡片路径应该携带 share_code 参数
3. 当其他用户点开卡片时，如果 share_code 未过期且未用完，系统应该创建绑定记录（desktop_pet_bindings，binding_type=authorized）和 share_records 记录
4. 当 share_code 已过期或已用完时，系统应该返回错误提示
5. 当分享链接被使用后，系统应该递增 used_count
6. 删除现有的 device_authorizations 表及其所有相关 API、前端代码、类型定义

### 需求 2 - 补充 updated_at 字段

**用户故事：** 作为开发者，我需要追踪记录的最后修改时间，以便排查问题和支持增量同步。

#### 验收标准

1. users、pets、collar_devices、desktop_devices 表应该新增 updated_at 字段（timestamptz，默认 now）
2. 对应的 API 更新操作应该自动更新 updated_at 字段
3. 共享类型定义应该包含 updated_at 字段

### 需求 3 - 补充设备运维字段

**用户故事：** 作为开发者，我需要记录设备固件版本和最后在线时间，以便后续支持 OTA 升级和设备健康监控。

#### 验收标准

1. collar_devices 和 desktop_devices 表应该新增 firmware_version（text，可选）和 last_online_at（timestamptz，可选）字段
2. 对应的共享类型定义应该包含这些字段

### 需求 4 - 保留设备解绑历史

**用户故事：** 作为开发者，我需要保留设备解绑历史，以便追溯绑定关系和支持误操作恢复。

#### 验收标准

1. desktop_pet_bindings 表应该新增 unbound_at 字段（timestamptz，可选）
2. 解绑操作应该设置 unbound_at 时间而非删除记录
3. 查询活跃绑定时应该过滤 unbound_at IS NULL 的记录
