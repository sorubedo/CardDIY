# CardDIY 微信小程序 API 使用分析

## 项目简介

CardDIY 是一款基于 **uni-app**（Vue 3 Composition API + TypeScript + Vite）的卡牌制作应用。用户可自定义卡牌属性（颜色、类型、稀有度、能量消耗）、上传卡图、使用标记语法编写描述文字，并将结果导出为 PNG 图片。首要目标平台是微信小程序，其次为 H5。

### 技术栈

- **框架**：uni-app (Vue 3 Composition API + TypeScript + Vite)
- **UI 组件库**：wot-design-uni v1（暗色主题）
- **国际化**：vue-i18n v9（Composition API 模式）
- **样式**：Sass/SCSS
- **Canvas 渲染**：自研 8 层 Canvas 2D 合成引擎

### 数据流

```
CardData（useCardData 中的响应式状态）
    │
    ├─► card-constants.ts  （尺寸、默认值、能量偏移量）
    ├─► asset-resolver.ts   （颜色/类型/稀有度 → PNG 素材路径）
    ├─► markup-parser.ts    （描述文本 → 带颜色的文字片段）
    │
    ▼
CardPreview.vue（Canvas 组件）
    │
    ▼
useCardRenderer.ts（Canvas 2D 合成引擎）
    │
    ▼
useCardExport.ts（PNG 导出，通过 #ifdef 区分平台）
```

---

## 一、使用的微信相关 API 总览（共 16 个 uni API）

### 🔴 微信独占 API（位于 `#ifdef MP-WEIXIN` 块内）

| API | 用途 | 所在文件 |
|-----|------|---------|
| `uni.getSetting()` | 查询用户相册授权状态 | `useCardExport.ts` |
| `uni.authorize({ scope: 'scope.writePhotosAlbum' })` | 请求相册写入权限 | `useCardExport.ts` |
| `uni.saveImageToPhotosAlbum({ filePath })` | 保存图片到系统相册 | `useCardExport.ts` |
| `uni.openSetting({})` | 权限被拒后引导用户打开设置页 | `useCardExport.ts` |
| `(uni as any).showShareImageMenu({ path })` | 唤起微信原生分享面板（分享给朋友/收藏等） | `useCardExport.ts` |
| `uni.canvasToTempFilePath({...})` | Canvas 导出为临时文件路径 | `useCardRenderer.ts` |
| `uni.getMenuButtonBoundingClientRect()` | 获取微信胶囊按钮位置（自定义导航栏用） | `editor/index.vue` |
| `<button open-type="chooseAvatar">` | 微信原生头像选择器 | `editor/index.vue` |
| `<input type="nickname">` | 微信原生昵称输入框（带"使用微信昵称"快捷填充） | `editor/index.vue` |

### 🟢 跨平台通用 API（无 `#ifdef` 包裹）

| API | 用途 |
|-----|------|
| `uni.getStorageSync` / `uni.setStorageSync` / `uni.removeStorageSync` | 本地存储（登录信息） |
| `uni.showToast({...})` | 轻提示 |
| `uni.showModal({...})` | 模态对话框（权限引导） |
| `uni.chooseImage({...})` | 选择图片（卡图上传） |
| `uni.loadFontFace({...})` | 加载字体（H5 能加载本地字体，微信仅支持 HTTPS 网络字体） |
| `uni.createSelectorQuery().in(...)` | 获取 Canvas 节点（Canvas 初始化回退策略） |
| `uni.getSystemInfoSync()` | 获取设备信息（像素比、状态栏高度等） |

---

## 二、微信 vs H5 的关键差异点

```
                    ┌──────────────────────────────────┬──────────────────────────────────┐
                    │          微信小程序               │             H5 浏览器             │
    ┌───────────────┼──────────────────────────────────┼──────────────────────────────────┤
    │ Canvas 导出    │ uni.canvasToTempFilePath()      │ canvas.toBlob() / toDataURL()   │
    │               │ → 返回临时文件路径 (string)       │ → 返回 blob URL (string)         │
    ├───────────────┼──────────────────────────────────┼──────────────────────────────────┤
    │ 保存图片       │ saveImageToPhotosAlbum()         │ <a> 标签 download 触发浏览器下载  │
    │               │ → 保存到系统相册                  │ → 下载到本地文件系统              │
    ├───────────────┼──────────────────────────────────┼──────────────────────────────────┤
    │ 分享图片       │ showShareImageMenu()             │ navigator.share()               │
    │               │ → 微信原生分享面板                │ → Web Share API / 不支持则提示   │
    ├───────────────┼──────────────────────────────────┼──────────────────────────────────┤
    │ 字体加载       │ ❌ 无法加载                      │ ✅ uni.loadFontFace 加载本地字体  │
    │               │ （仅支持 HTTPS 网络字体）          │ + document.fonts.ready           │
    ├───────────────┼──────────────────────────────────┼──────────────────────────────────┤
    │ 导航栏         │ 自定义导航栏                      │ 无特殊处理                       │
    │               │ （避开微信胶囊按钮）               │                                  │
    ├───────────────┼──────────────────────────────────┼──────────────────────────────────┤
    │ 登录           │ chooseAvatar + type="nickname"   │ 无（登录弹窗功能降级）            │
    │               │ 微信原生头像/昵称组件              │                                  │
    ├───────────────┼──────────────────────────────────┼──────────────────────────────────┤
    │ 分享按钮       │ ✅ 显示"分享给朋友"按钮           │ ❌ 不显示该按钮                   │
    └───────────────┴──────────────────────────────────┴──────────────────────────────────┘
```

---

## 三、条件编译块分布（共 12 处）

| 文件 | 微信专属块 | H5 专属块 |
|------|-----------|----------|
| `src/composables/useCardExport.ts` | 3 处（saveToAlbum、shareToChat 权限流） | 2 处（downloadH5、navigator.share） |
| `src/composables/useCardRenderer.ts` | 1 处（canvasToTempFilePath 导出） | 1 处（canvas.toBlob/toDataURL 导出） |
| `src/components/CardPreview.vue` | 1 处（字体加载：空实现+注释说明） | 1 处（uni.loadFontFace + document.fonts.ready） |
| `src/pages/editor/index.vue` | 3 处（分享按钮、自定义导航栏计算、保存到相册） | 1 处（downloadH5 下载） |

---

## 四、数据流对比

### 微信小程序导出流程

```
Canvas → uni.canvasToTempFilePath() → tempFilePath (string)
    ├─ 导出：saveImageToPhotosAlbum(tempPath) → 系统相册
    └─ 分享：showShareImageMenu({path}) → 微信分享面板
```

### H5 导出流程

```
Canvas → toBlob()/toDataURL() → blob URL (string)
    ├─ 导出：<a download> 点击触发浏览器下载
    └─ 分享：navigator.share({files: [blob]}) → Web Share API
```

---

## 五、各 API 详细说明

### 5.1 相册权限与保存（`useCardExport.ts`）

```ts
// #ifdef MP-WEIXIN
try {
  const setting = await uni.getSetting()
  if (!setting.authSetting['scope.writePhotosAlbum']) {
    await uni.authorize({ scope: 'scope.writePhotosAlbum' })
  }
  await uni.saveImageToPhotosAlbum({ filePath })
  uni.showToast({ title: '已保存到相册', icon: 'success' })
} catch (err: any) {
  if (err.errMsg?.includes('auth deny') || err.errMsg?.includes('deny')) {
    const res = await uni.showModal({
      title: '需要相册权限',
      content: '请在设置中允许访问相册',
      confirmText: '去设置',
    })
    if (res.confirm) uni.openSetting({})
  }
  throw err
}
// #endif
```

完整的权限处理流程：检查授权 → 请求授权 → 保存图片 → 权限被拒时引导用户去设置页开启。

### 5.2 分享功能（`useCardExport.ts`）

```ts
// #ifdef MP-WEIXIN
await new Promise(r => setTimeout(r, 150))
;(uni as any).showShareImageMenu?.({
  path: tempPath,
  fail: (err: any) => {
    if (err.errMsg?.includes('cancel')) return
    console.error('Share failed:', err)
    uni.showToast({ title: '分享失败', icon: 'error' })
  },
})
// #endif
```

> **注意**：`showShareImageMenu` 使用了 `(uni as any)` 类型断言，因为该 API 不在 uni-app 标准类型定义中，属于微信小程序较新的 API。

### 5.3 自定义导航栏（`editor/index.vue`）

```ts
// #ifdef MP-WEIXIN
const sysInfo = uni.getSystemInfoSync()
const statusBarHeight = sysInfo.statusBarHeight || 20
const menuButton = uni.getMenuButtonBoundingClientRect()
const capsuleWidth = sysInfo.windowWidth - menuButton.left
const navHeight = menuButton.bottom + (menuButton.top - statusBarHeight)
navbarStyle.value = {
  paddingTop: statusBarHeight + 'px',
  height: navHeight + 'px',
  paddingRight: (capsuleWidth + 8) + 'px',
}
// #endif
```

通过 `pages.json` 中设置 `navigationStyle: "custom"` 隐藏原生导航栏后，用此代码计算自定义导航栏的高度和位置，确保不被微信胶囊按钮遮挡。

### 5.4 微信原生登录组件（`editor/index.vue`）

```html
<button open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
  <!-- 头像选择 -->
</button>
<input type="nickname" @blur="onNicknameBlur" />
```

微信小程序专属的 WXML 组件：
- `open-type="chooseAvatar"`：唤起微信头像选择器
- `type="nickname"`：输入框上方显示"使用微信昵称"快捷填充按钮

### 5.5 Canvas 导出差异（`useCardRenderer.ts`）

**微信小程序**使用 `uni.canvasToTempFilePath`，支持 `destWidth`/`destHeight` 参数设置输出分辨率（乘以 devicePixelRatio）：
```ts
uni.canvasToTempFilePath({
  canvas,
  x: 0, y: 0,
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
  destWidth: CARD_WIDTH * dpr,
  destHeight: CARD_HEIGHT * dpr,
  fileType: 'png', quality: 1,
  success: (res: any) => resolve(res.tempFilePath),
  fail: reject,
})
```

**H5** 使用标准 DOM API：
```ts
canvas.toBlob((blob: Blob) => {
  const url = URL.createObjectURL(blob)
  resolve(url)
}, 'image/png')
```

### 5.6 字体加载（`CardPreview.vue`）

- **H5**：通过 `uni.loadFontFace` 从 `/static/card-assets/fonts/` 加载 Kreon 字体的 .ttf 文件，然后等待 `document.fonts.ready`
- **微信小程序**：空实现。微信小程序的 `loadFontFace` 仅支持 HTTPS 网络字体 URL，无法加载本地静态资源中的字体，Canvas 上文字回退到 serif 字体渲染

---

## 六、总结

项目共使用 **16 个 uni API**，其中 **9 个是微信专属的**（被 `#ifdef MP-WEIXIN` 包裹），核心差异集中在四个功能点：

1. **图片导出**：微信走相册权限 + 保存到相册，H5 走浏览器下载
2. **图片分享**：微信用原生分享面板（`showShareImageMenu`），H5 用 Web Share API
3. **字体渲染**：微信无法加载本地字体（Canvas 回退到 serif），H5 正常加载 Kreon 字体
4. **UI 适配**：微信需要自定义导航栏避开胶囊按钮，且有原生头像/昵称登录组件

项目没有直接使用 `wx.*` 原生 API，所有跨平台差异都通过 uni-app 的 `#ifdef` 条件编译处理，架构上保持了良好的平台隔离。

### 平台无关文件列表

以下文件不包含任何平台特定代码（无 `#ifdef`，无微信专属调用），纯跨平台复用：

- `src/types/card.ts` — 类型定义
- `src/constants/card-constants.ts` — 常量（Canvas 尺寸、能量偏移量等）
- `src/utils/asset-resolver.ts` — 素材路径解析
- `src/utils/markup-parser.ts` — 描述标记解析器
- `src/composables/useCardData.ts` — 卡牌数据状态管理
- `src/composables/useAuth.ts` — 登录状态管理
- `src/components/CardPropertyPanel.vue` — 属性选择器
- `src/components/CardNameInput.vue` — 名称输入
- `src/components/CardEnergyInput.vue` — 能量输入
- `src/components/CardDescriptionInput.vue` — 描述输入
- `src/components/CardArtUploader.vue` — 卡图上传
- `src/locale/index.ts` — 国际化配置
