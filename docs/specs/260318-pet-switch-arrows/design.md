# 技术设计文档

## 架构概览

纯前端 UI 变更，仅涉及主页组件的布局调整和交互逻辑修改。不涉及后端、数据库或 API 变更。目标平台仅为微信小程序。

## 需要修改的文件

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `packages/app/src/pages/index/index.tsx` | 修改 | 添加箭头按钮、循环切换逻辑、移除滑动指示器 |
| `packages/app/src/pages/index/index.scss` | 修改 | 添加箭头样式、调整布局、删除 swipe-indicator 样式 |

## 详细设计

### 1. 布局变更

**当前布局**：
```
hero-section (column)
  ├── speech-bubble
  ├── pet-swiper / hero-shell
  └── swipe-indicator (arrow图片 + 文案 + 进度条)
```

**目标布局**：
```
hero-section (column)
  ├── speech-bubble
  └── pet-swiper-wrapper (position: relative)
      ├── pet-swiper / hero-shell (宽度不变)
      ├── arrow-left (position: absolute, left, 垂直居中)
      └── arrow-right (position: absolute, right, 垂直居中)
```

**关键**：箭头使用 `position: absolute` 覆盖在 Swiper 区域上，不影响 Swiper 的原始宽度和布局，避免窄屏溢出问题。

### 2. 箭头渲染条件

箭头仅在 `hasMultiplePets`（即 `allPets.length > 1`）时渲染。单宠物场景下不渲染箭头元素。

### 3. 交互逻辑

```typescript
// 循环切换 — 仅箭头点击触发，Swiper 不设置 circular
const handlePrevPet = () => {
  setCurrentPetIndex((prev) =>
    prev === 0 ? allPets.length - 1 : prev - 1
  );
};

const handleNextPet = () => {
  setCurrentPetIndex((prev) =>
    prev === allPets.length - 1 ? 0 : prev + 1
  );
};
```

**注意**：不对 Swiper 设置 `circular` 属性，保持原有滑动行为不变。循环切换仅在点击箭头时生效。

### 4. 箭头图标

使用项目已有的 `ICON_ARROW_LEFT` 和 `ICON_ARROW_RIGHT`（SVG data URI，在 `assets/icons.ts` 中定义），保证多端渲染一致性。

### 5. 箭头样式

- 使用 `<Image>` 组件 + absolute 定位
- 点击区域：48rpx × 48rpx，足够的触控面积
- 垂直居中：`top: 50%; transform: translateY(-50%)`
- 颜色：SVG 自带 `#666`，与项目暖灰风格协调
- 左箭头 `left: 8rpx`，右箭头 `right: 8rpx`

### 6. 清理

- 移除 `swipe-indicator` 相关 JSX（箭头图片 + 文案 + 进度条）
- 移除对应 SCSS 样式（`.swipe-indicator`、`.swipe-arrow`、`.swipe-text`、`.swipe-progress-track`、`.swipe-progress-fill`）
- 移除 `arrowSwipe` import 和 `swipeProgress` 计算
- `arrow-swipe.png` 资源文件暂不删除
