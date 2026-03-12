# 项目说明

YEHEY 宠物"在场" - 微信小程序 MVP

## 技术栈

- 前端：Taro 4 + React + TypeScript + Sass（微信小程序）
- 后端：Hono + Bun + TypeScript
- 数据库：PostgreSQL + Drizzle ORM
- 包管理：pnpm workspace monorepo

## 项目结构

- `packages/app` - Taro 小程序前端
- `packages/server` - Hono 后端 API
- `packages/shared` - 前后端共享类型定义

## 端口约定

- 后端 API：9527（避开常用端口 3000/8000/8080/5173）
- PostgreSQL：5432（Docker Compose）

## 常用命令

- `pnpm dev:server` - 启动后端（Bun）
- `pnpm dev:app` - 启动小程序前端
- `pnpm db:generate` - 生成数据库迁移
- `pnpm db:migrate` - 执行数据库迁移
- `pnpm db:studio` - 打开 Drizzle Studio

- 需要通过 pencil mcp 拿到前端设计图，复用设计图内部的资源文件，确保实现与设计一致
