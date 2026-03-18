# 实施计划

- [ ] 1. 修改 index.tsx：添加箭头和循环切换逻辑
  - 导入 `ICON_ARROW_LEFT` 和 `ICON_ARROW_RIGHT`
  - 移除 `arrowSwipe` import
  - 移除 `swipeProgress` 计算
  - 添加 `handlePrevPet` 和 `handleNextPet` 函数（循环逻辑）
  - 在 Swiper 外包裹 `pet-swiper-wrapper` 容器
  - 在 wrapper 中添加左右箭头（仅 `hasMultiplePets` 时渲染）
  - 移除 `swipe-indicator` 整个 JSX 块
  - _需求：需求 1, 需求 2, 需求 3_

- [ ] 2. 修改 index.scss：添加箭头样式、清理旧样式
  - 添加 `.pet-swiper-wrapper` 样式（position: relative）
  - 添加 `.pet-nav-arrow` 基础样式（absolute 定位、垂直居中、点击区域）
  - 添加 `.pet-nav-arrow-left` 和 `.pet-nav-arrow-right` 定位
  - 删除 `.swipe-indicator`、`.swipe-arrow`、`.swipe-text`、`.swipe-progress-track`、`.swipe-progress-fill` 样式
  - _需求：需求 1, 需求 3_
