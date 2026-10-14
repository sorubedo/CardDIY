# CardDIY 微信小程序开发实验步骤

## 实验名称

基于 uni-app 的卡牌制作应用——CardDIY 的设计与实现

---

## 一、实验目的

1. 掌握 uni-app 跨平台开发框架的项目搭建与配置方法
2. 掌握 Vue 3 Composition API + TypeScript 的前端开发模式
3. 掌握 Canvas 2D 绘图 API 在微信小程序中的使用方法
4. 理解微信小程序特有的 API（相册权限、分享、自定义导航栏）及其处理方式
5. 掌握条件编译（`#ifdef`）实现跨平台差异化的技术

---

## 二、实验环境

| 项目 | 说明 |
|------|------|
| 操作系统 | Linux (Arch Zen Kernel 7.0) |
| 开发框架 | uni-app 3.0（Vue 3 + Vite + TypeScript） |
| UI 组件库 | wot-design-uni v1.14.0（暗色主题） |
| 国际化 | vue-i18n v9（Composition API 模式，`legacy: false`） |
| 样式预处理 | Sass/SCSS |
| 微信开发者工具 | 最新稳定版（用于编译运行微信小程序） |
| Node.js | 运行 Vite 开发服务器和构建工具 |
| 包管理器 | Yarn |

---

## 三、整体架构设计

本应用采用**单页面编辑器**模式，全部功能集中于 `pages/editor/index` 一个页面。数据流基于 Vue 3 响应式系统，核心状态由 `useCardData` 集中管理，各组件通过 props/emits 进行双向绑定。

```
CardData（useCardData 中的响应式状态）
    │
    ├─► card-constants.ts  （卡牌尺寸、默认值、能量偏移量）
    ├─► asset-resolver.ts   （颜色/类型/稀有度 → PNG 素材路径）
    ├─► markup-parser.ts    （描述标记语法 → 带颜色的文字片段）
    │
    ▼
CardPreview.vue（Canvas 组件）
    │
    ▼
useCardRenderer.ts（Canvas 2D 分层合成渲染引擎）
    │
    ▼
useCardExport.ts（PNG 导出，通过 #ifdef 区分微信/H5 平台）
```

---

## 四、实验步骤

### 步骤一：项目初始化与环境配置

**目标**：搭建 uni-app Vue 3 + TypeScript 项目骨架，安装依赖，配置基础工程。

**具体操作**：

1. 使用 `yarn create uni-app` 创建项目，选择 Vue 3 + TypeScript 模板
2. 安装核心依赖：`@dcloudio/uni-app`、`vue@^3.4`、`wot-design-uni@^1.14`、`vue-i18n@^9`
3. 安装 devDependencies：`typescript@^4.9`、`sass@1.78.0`、`vue-tsc@^1`、`vite@5.2`
4. 配置 `tsconfig.json`：设置 `baseUrl: "."`，配置路径别名 `@/*` → `./src/*`，引入 `@dcloudio/types` 和 `wot-design-uni/global` 类型声明
5. 配置 `pages.json`：
   - easycom 自动注册 wot-design-uni 组件（正则 `^wd-(.*)` → 对应组件路径）
   - 设置单页面路由 `pages/editor/index`
   - 页面级 `navigationStyle: "custom"`（为后续自定义导航栏做准备）
6. 配置 `vite.config.ts`：引入 `@dcloudio/vite-plugin-uni` 插件
7. 在 `src/main.ts` 中通过 `createSSRApp` 创建应用实例并注册 i18n 插件
8. 在 `src/App.vue` 中设置全局暗色背景样式（`page { background: #0f0f23 }`）

**验证方式**：执行 `yarn dev:mp-weixin`，在微信开发者工具中打开 `dist/dev/mp-weixin`，确认 Hello World 页面正常显示。

---

### 步骤二：卡牌数据模型与常量定义

**目标**：建立卡牌的类型系统和基础常量，定义所有枚举、接口和默认值。

**具体操作**：

1. **`src/types/card.ts`**——定义核心类型：
   - `CardColor` 枚举：Red、Green、Blue、Purple、Colorless、Status、Curse（7 种颜色）
   - `CardType` 枚举：Attack、Skill、Power（3 种类型）
   - `CardRarity` 枚举：Common、Uncommon、Rare（3 种稀有度）
   - `TextSegmentColor` 类型：0=白色、1=关键词黄色、2=数值绿色、3=能量宝石图标
   - `TextSegment` 接口：描述文本的单个字符片段（字符 + 颜色类型）
   - `DescriptionRow` 接口：一行描述（字符片段数组 + 纯文本 + 像素宽度）
   - `CardArtConfig` 接口：自定义卡图的位置、尺寸配置
   - `CardData` 接口：完整的卡牌数据结构（颜色、类型、稀有度、名称、升级标记、能量消耗、描述行数组、卡图配置）
   - `CardAssets` 接口：解析后的素材路径集合（背景、边框、能量图标、宝石图标）
   - `UserInfo` 接口：用户登录信息（昵称、头像 URL）

2. **`src/constants/card-constants.ts`**——定义所有常量：
   - Canvas 逻辑尺寸：`CARD_WIDTH = 350`、`CARD_HEIGHT = 455`（与参考项目保持一致）
   - 卡图裁剪区域：`ART_CLIP_SIZE = { x: 30, y: 40, w: 300, h: 300 }`
   - 文本限制：名称最大 18 字符，描述最多 5 行，每行最大 30 字符
   - 能量可选值：`['0','1','2','3','4','5','6','7','8','9','X']`
   - `ENERGY_OFFSETS`：每个能量数字在宝石上的像素微调偏移量（不同数字宽度不同，需要手动补偿）
   - 默认卡图配置：初始位置 `(69, 140)`，尺寸 `265×200`
   - 卡图滑块范围：x/y/width/height 各自的最小/最大值
   - 颜色/类型/稀有度的标签映射和下拉选项数组
   - `createDefaultCardData()` 工厂函数：返回红色攻击普通牌 + 默认名称 "Card" + 默认能量 "1" + 示例描述 "Card >Text< @"

**技术要点**：使用枚举而非字符串字面量，确保类型安全；使用 `as const` 断言数组类型为元组。

---

### 步骤三：素材资源解析系统

**目标**：根据卡牌属性（颜色、类型、稀有度）自动映射到对应的静态素材 PNG 路径。

**具体操作**：

1. 整理素材资源目录 `src/static/card-assets/`：
   - `backgrounds/`：16 张背景 PNG（7 色 × 3 类型 - Status 和 Curse 特殊处理）
   - `frames/`：8 张边框 PNG（3 稀有度 × 3 类型，含特殊规则）
   - `gems/`：9 张宝石/能量图标 PNG（5 色能量 + 5 色宝石，Colorless 复用 Red）
   - `fonts/`：Kreon.ttf 和 Kreon-Bold.ttf 字体文件

2. **`src/utils/asset-resolver.ts`**——实现 `resolveCardAssets()` 函数：
   - 正常颜色（Red/Green/Blue/Purple/Colorless）：按 `{color}{type}Background.png` + `{rarity}{type}Frame.png` + `{color}Mana.png` + `{color}ManaGem.png` 拼接路径
   - 特殊规则 ①：`Common + Power` → 使用 `RarePowerFrame`（不存在 `CommonPowerFrame` 素材）
   - 特殊规则 ②：`Colorless` 的宝石 → `RedManaGem`（无色宝石复用红色宝石素材）
   - 特殊规则 ③：`Status` → 固定使用 `ColorlessSkillBackground` + `CommonSkillFrame` + `ColorlessMana` + `RedManaGem`
   - 特殊规则 ④：`Curse` → 固定使用 `CurseBackground` + `CommonSkillFrame` + `ColorlessMana` + `RedManaGem`
   - 实现 `shouldShowEnergy()`：Curse 永远不显示能量，Status 由用户开关控制
   - 实现 `shouldShowTypeAndRarity()`：Status 和 Curse 下隐藏类型/稀有度选择器

**技术要点**：素材路径拼接逻辑继承自参考项目 `changeCardFrame()` 函数，通过统一的 `assetPath()` 辅助函数构建路径，避免字符串拼接分散。

---

### 步骤四：描述文本标记解析器

**目标**：实现类《杀戮尖塔》风格的描述文本标记语法，支持关键词高亮、数值变色和能量图标。

**具体操作**：

**`src/utils/markup-parser.ts`**——实现 `parseMarkup()` 状态机：

1. 定义 3 种标记语法：
   - `>keyword<`：将中间内容渲染为**黄色**（colored: 1），用于关键词高亮
   - `#value#`：将中间内容渲染为**绿色**（colored: 2），用于数值展示
   - `@`：渲染为**能量宝石图标**（colored: 3），用于能量消耗占位
   - 其他文字：默认**白色**（colored: 0）

2. 状态机设计：
   - 主状态变量 `colored` 跟踪当前颜色模式（0/1/2）
   - 遍历输入字符串每个字符：
     - 遇到 `>` 且当前为 normal → 进入关键词模式（yellow）
     - 遇到 `<` 且当前为 keyword → 退出关键词模式
     - 遇到 `#` → 切换 value 模式（进入/退出绿色）
     - 遇到 `@` → 直接插入能量宝石片段
     - 其他字符 → 以当前颜色模式插入片段
   - 标记符号本身不保留在输出中（`>`、`<`、`#` 不加入片段数组）

3. 额外实现 `parseDescriptionRows()`：批量解析多行输入，调用 `parseMarkup` 后计算每行的像素宽度（`len` 字段）

**技术要点**：`@` 符号需要使用全角替代 `＠` 写在 vue-i18n 的 JSON locale 文件中，因为 vue-i18n 会把半角 `@` 解析为链接消息语法 `@:key`。

---

### 步骤五：Canvas 2D 渲染引擎

**目标**：实现完整的 Canvas 2D 卡牌合成引擎，将卡牌数据渲染为可视化的卡牌图片。

**具体操作**：

**`src/composables/useCardRenderer.ts`**——实现 `useCardRenderer()`：

1. **Canvas 初始化**（`init` 函数）：
   - 策略 1：检查传入对象是否直接支持 `getContext('2d')`（H5 环境）
   - 策略 2：通过 Vue 组件引用的 `$el` 或 `querySelector` 查找 canvas 元素
   - 策略 3：微信小程序回退——使用 `uni.createSelectorQuery()` 获取 Canvas 节点（`type: '2d'` 模式）
   - 设置 Canvas 尺寸为 `350 × 455`
   - 返回 Promise 以支持异步初始化

2. **分层渲染管线**（`renderCard` 函数），按顺序绘制 8 个图层：

   | 序号 | 图层 | 前位置 |
   |------|------|--------|
   | 0 | 卡图遮罩 | 在 `(30,40)-(330,340)` 区域内裁剪绘制自定义卡图 |
   | 1 | 背景 | 颜色+类型对应的 PNG（`drawImage` 等比缩放） |
   | 2 | 边框 | 稀有度+类型对应的 PNG 覆盖层 |
   | 3 | 能量图标 | 可选，仅在显示能量时绘制（微调偏移 `(-5,-5)`） |
   | 4 | 类型标签 | 居中文字（攻击/技能/能力/状态/诅咒），使用边框视觉中心 `typeCenterX` |
   | 5 | 卡牌名称 | 逐字符手动 kerning 绘制，升级后文字变绿色（`#85d628`） |
   | 6 | 能量数字 | 绘制在能量宝石上的消耗数字，使用 `ENERGY_OFFSETS` 微调位置 |
   | 7 | 描述文字 | 多行描述，黄色关键词/绿色数值/白色普通文字/宝石图标内联渲染 |

3. **并发渲染防护**（`renderVersion` 机制）：
   - 每次 `renderCard` 调用递增全局版本号
   - 使用 `async/await` 加载素材图片，期间可能被新的渲染请求中断
   - 在图片加载后、在 Canvas 绘制前检查版本号——若不匹配则 `return` 丢弃过期渲染
   - 调用 `setTransform` 和 `clearRect` 重置画布状态，防止 clip/transform 状态错乱

4. **水印绘制**（`drawWatermark` 函数）：
   - 在画布右下角绘制半透明水印（`@用户名`）
   - 透明度 0.35，白色文字 + 黑色描边，13px 字体

5. **导出接口**（`exportCard` 函数）：
   - 先同步绘制水印（如有）
   - **微信小程序**：`uni.canvasToTempFilePath()` 导出为 PNG 文件路径，`destWidth`/`destHeight` 乘以 `devicePixelRatio` 提高清晰度
   - **H5**：`canvas.toBlob()` 或 `canvas.toDataURL()` 导出为 Blob URL
   - 平台差异通过 `// #ifdef MP-WEIXIN` / `// #ifdef H5` 条件编译处理

**技术要点**：
- 使用自定义颜色常量对象 `C` 统一管理所有渲染颜色，如 `NAME_SHADOW_FILL: '#5f5e5c'`、`DESC_KEYWORD: '#e1c36c'`
- 类型标签文字居中于边框图片的视觉中心（`typeCenterX`），而非画布全宽中心——因为左侧有能量标志占据空间，全宽居中会导致文字视觉偏左
- 描述文字中的 `@` 能量宝石使用 `drawImage` 内联绘制，占据 28×28 像素，与其他文字等宽排列

---

### 步骤六：UI 组件开发

**目标**：构建卡牌编辑器的各个功能组件，使用 wot-design-uni 组件库的暗色主题。

**具体操作**：

1. **`CardPreview.vue`**——Canvas 预览组件：
   - 使用 Canvas 2D 组件（`type="2d"`），尺寸 350×455
   - `onMounted` 时初始化渲染器、加载字体（H5 用 `uni.loadFontFace` 加载 Kreon 字体）、执行首次渲染
   - `watch` 深度监听 `cardData`、`cardAssets`、`locale` 变化，自动触发重新渲染
   - 微信小程序字体加载为空实现（`loadFontFace` 仅支持 HTTPS 网络字体），Canvas 回退到 serif
   - `defineExpose` 暴露 `exportCard` 和 `renderCard` 方法供父组件调用
   - 导出时先绘制水印到画布，导出完成后异步重新渲染无水印版本

2. **`CardPropertyPanel.vue`**——属性选择器：
   - 使用 `wd-picker` 组件实现颜色、类型、稀有度的三级下拉选择
   - 选项文本通过 vue-i18n `t()` 动态翻译
   - Status 和 Curse 颜色下隐藏类型/稀有度选择器（通过 `shouldShowTypeAndRarity` 计算属性控制 `v-if`）

3. **`CardNameInput.vue`**——名称输入：
   - `wd-input` 组件，限制最大 18 字符
   - 升级开关使用 `wd-switch`，升级后卡名显示 "+" 后缀且名称变为绿色

4. **`CardEnergyInput.vue`**——能量消耗选择：
   - 按钮组形式展示 0–9 + X + 清除按钮（✕）
   - 当前选中值高亮显示（红色背景 + 红色边框）
   - 点击已选中值可取消选择（清除能量消耗）
   - 升级开关：升级后能量数字变为绿色

5. **`CardDescriptionInput.vue`**——描述输入：
   - 动态行数管理：支持添加/删除描述行（最多 5 行，最少 1 行）
   - 每行使用 `wd-input`，限制最多 30 字符
   - 顶部显示标记语法提示：`>关键词< = 黄色 | #数值# = 绿色 | @(半角) = 能量图标`

6. **`CardArtUploader.vue`**——卡图上传：
   - 使用 `uni.chooseImage` 从相册选择图片
   - 上传后生成 `CardArtConfig` 配置（初始位置填充整个 300×300 裁剪区域）
   - 支持更换图片和移除图片操作
   - 无卡图时仅显示"上传图片"按钮，有卡图时显示"更换图片"+"移除图片"

**技术要点**：
- 组件的 `defineProps` 和 `defineEmits` 使用 TypeScript 类型定义，保证类型安全
- 描述输入组件的行管理通过 `numRows` ref 控制可见行数，实际数据数组 `lines` 长度始终保留（删除仅减少可见行数）
- 所有文本标签使用 vue-i18n 的 `t()` 函数动态获取，支持中英文切换

---

### 步骤七：卡牌数据状态管理

**目标**：实现集中式的卡牌数据响应式管理，连接 UI 组件和渲染引擎。

**具体操作**：

**`src/composables/useCardData.ts`**——实现 `useCardData()`：

1. **响应式状态**：使用 `reactive()` 包裹 `CardData` 对象，所有属性修改自动触发视图更新
2. **计算属性**：
   - `cardAssets`：根据当前颜色/类型/稀有度自动解析素材路径
   - `showEnergy`：根据颜色判断是否显示能量模块
   - `showTypeAndRarity`：Status/Curse 下不显示类型和稀有度选择
   - `displayName`：升级后名称添加 "+" 后缀
   - `parsedRows`：将原始输入文本通过 `parseMarkup` 解析为带颜色信息的片段数组
   - `activeRows`：过滤掉空行
3. **操作方法**：
   - `addDescriptionRow()` / `removeDescriptionRow()`：管理描述行数
   - `updateDescriptionRow(index, value)`：更新指定行的描述文本
   - `setCardArt(imagePath)` / `removeCardArt()`：管理自定义卡图
   - `updateCardArtPosition(updates)` / `resetCardArtPosition()`：调整卡图位置和大小
   - `resetAll()`：重置整个卡牌为默认数据
   - `onColorChange(newColor)`：颜色变化时更新状态

---

### 步骤八：主编辑器页面组装

**目标**：将所有组件和逻辑组装为完整编辑器页面。

**具体操作**：

**`src/pages/editor/index.vue`**——编辑器主页面：

1. 使用 `wd-config-provider theme="dark"` 包裹全局，启用 wot-ui 暗色主题
2. **自定义导航栏**：
   - 左侧显示 "Card Maker" 标题
   - 右侧显示用户登录按钮（未登录）/ 用户名（已登录）+ 中英文切换按钮
   - 微信小程序适配：通过 `uni.getSystemInfoSync()` 获取状态栏高度，通过 `uni.getMenuButtonBoundingClientRect()` 获取胶囊按钮位置，计算导航栏高度和右侧留白，避免被胶囊遮挡
3. **登录浮层**：
   - 使用微信原生 `<button open-type="chooseAvatar">` 获取用户头像
   - 使用 `<input type="nickname">` 支持一键填入微信昵称
   - 登录信息通过 `useAuth` 存储到 `uni.setStorageSync`
4. **功能区域**（`scroll-view` 容器中垂直排列）：
   - 卡牌预览区（`CardPreview`）
   - 属性选择区（`CardPropertyPanel`）
   - 名称输入区（`CardNameInput`）
   - 能量选择区（`CardEnergyInput`，仅在 `showEnergy` 为 true 时显示）
   - 描述输入区（`CardDescriptionInput`）
   - 卡图上传区（`CardArtUploader`）
   - 导出操作区：导出 PNG 按钮（全平台）+ 分享按钮（仅微信小程序，通过 `#ifdef MP-WEIXIN` 控制显示）
5. **导出流程**：
   - 点击导出 → 设置文件名（取卡牌名称）→ 调用 `CardPreview.exportCard(watermark)` → 获得临时文件路径
   - 微信小程序：调用 `saveImageToPhotosAlbum()` 保存到相册（含权限检查和引导）
   - H5：创建 `<a>` 标签触发浏览器下载
6. **重置功能**：使用 `wd-message-box` 的 confirm 对话框确认后调用 `resetAll()` 恢复默认卡牌
7. **分享功能**：生成带水印的 PNG → 调用 `showShareImageMenu` 唤起微信原生分享面板

---

### 步骤九：跨平台 PNG 导出与权限处理

**目标**：实现微信小程序和 H5 两个平台的差异化导出逻辑，处理微信特有的权限流程。

**具体操作**：

**`src/composables/useCardExport.ts`**——实现 `useCardExport()`：

1. **保存到相册**（`saveToAlbum`，微信专属）：
   - 完整权限处理流程：
     ```
     uni.getSetting()                →  检查相册权限状态
     uni.authorize(...)              →  请求权限（如未授权）
     uni.saveImageToPhotosAlbum()    →  保存图片到系统相册
     uni.showToast('已保存到相册')     →  成功提示
     uni.showModal('需要相册权限')     →  权限被拒引导
     uni.openSetting()               →  用户确认后跳转设置页
     ```
   - `catch` 中捕获错误 `errMsg`，若包含 `auth deny` 或 `deny` 则弹出设置引导弹窗
   - H5 环境下调用 `downloadH5` 触发浏览器下载

2. **分享功能**（`shareToChat`，微信专属）：
   - 延迟 150ms 等待 Canvas 临时文件写入完成
   - 调用 `uni.showShareImageMenu({ path })` 唤起原生分享面板
   - 用户取消分享不提示错误（静默处理 `cancel`）
   - H5 使用 `navigator.share()` Web Share API，不支持的浏览器提示

3. **H5 下载**（`downloadH5`）：
   - 创建隐藏 `<a>` 标签，设置 `download` 属性
   - 使用 `blob:` URL 时，延迟 1 秒后通过 `URL.revokeObjectURL()` 释放内存

4. **文件名策略**：`setFilename()` 使用卡牌名称作为导出文件名（如 `斩杀.png`），默认为 `card.png`

---

### 步骤十：国际化（i18n）支持

**目标**：实现中英文双语切换，所有界面文本动态翻译。

**具体操作**：

1. **`src/locale/index.ts`**——i18n 配置：
   - 使用 `vue-i18n` v9 的 `createI18n()` 创建实例
   - 配置 `legacy: false`（Vue 3 Composition API 模式必须）
   - 默认语言 `zh-CN`，回退语言 `zh-CN`
   - 加载中文和英文两个 JSON 消息文件

2. **`zh-CN.json` / `en-US.json`**——翻译字典：
   - 组织结构：按功能域分组（`colorLabel`、`typeLabel`、`rarityLabel`、`cardTypeText`、`auth`、`editor`）
   - `editor` 下再细分为 `sectionTitle`、输入标签、按钮文本、提示信息等
   - **特别注意**：`descHint` 字段中的 `@` 和 `|` 使用全角替代（`＠`、`｜`），因为 vue-i18n 即使在 `legacy: false` 下仍会将半角 `@` 解析为链接消息语法，半角 `|` 解析为复数分隔符

3. **语言切换**：在导航栏右侧提供切换按钮，通过修改 `locale.value` 在 `'zh-CN'` 和 `'en-US'` 间切换

4. **动态标签**：Canvas 渲染中的类型文字（攻击/Attack 等）也通过传入 `locale` 参数实现动态翻译

---

### 步骤十一：登录/水印/分享功能集成

**目标**：实现用户登录系统、导出图片水印和原生分享功能。

**具体操作**：

1. **`src/composables/useAuth.ts`**——登录状态管理：
   - 模块级单例 `userInfo` ref，全局共享
   - 模块加载时自动从 `uni.getStorageSync('userInfo')` 恢复登录状态
   - `saveUserInfo()`：保存用户信息到 storage
   - `logout()`：清除内存状态和 storage 数据
   - 排除微信匿名用户（昵称为 "微信用户" 时视为未登录）

2. **水印功能**：
   - 导出时若用户已登录，在 Canvas 右下角绘制 `@用户名` 半透明水印
   - 水印透明度 0.35，白色文字 + 黑色描边
   - 导出完成后立即异步重绘无水印预览（不影响导出结果）

3. **分享功能**已在上一步中实现

---

### 步骤十二：Bug 修复与优化迭代

**目标**：解决开发过程中发现的各类问题，完善应用体验。

**关键问题和修复**：

1. **Canvas 并发渲染竞态**（commit `8bceece`）：
   - **问题**：快速连续修改卡牌属性时，多个 `async renderCard` 调用重叠执行，共用同一 `ctx` 导致 `clip`/`transform` 状态错乱
   - **修复**：引入 `renderVersion` 递增版本号机制，每个渲染调用在图片加载后检查版本号，不匹配则立即丢弃

2. **类型标签文字居中偏差**（commit `9e2321e`）：
   - **问题**：类型文字（攻击/技能等）以画布全宽居中，但左侧有能量图标占据空间，视觉上偏左
   - **修复**：计算边框图片的视觉中心 `typeCenterX`（排除左边能量标志区域），以此为文字居中基准

3. **vue-i18n 特殊字符解析问题**（commit `03aed26`、`c1ac429`）：
   - **问题**：`descHint` 中的 `@` 被 vue-i18n 解析为链接消息引用 `@:key`，`|` 被解析为复数分隔符，导致页面报错
   - **修复**：在 locale JSON 文件中使用全角替代字符 `＠` (U+FF20) 和 `｜` (U+FF5C)

4. **H5 PNG 导出 bug**（commit `ec003b1`）：
   - **问题**：H5 环境下 `canvas.toDataURL()` 返回的 base64 URL 无法直接用于下载
   - **修复**：改用 `canvas.toBlob()` 生成 Blob 对象，通过 `URL.createObjectURL()` 创建 Blob URL，退出时释放

5. **导出文件名优化**（commit `2c95b49`）：
   - **问题**：导出文件名写死为 `card.png`
   - **修复**：使用卡牌名称（`cardData.name`）作为导出文件名

6. **自定义导航栏适配**（commit `1ef500a`）：
   - **问题**：微信小程序原生导航栏无法自定义，与暗色主题不协调
   - **修复**：`navigationStyle: "custom"` 隐藏原生导航栏，手动计算状态栏高度 + 胶囊位置，绘制自定义导航栏

7. **重置功能优化**（commit `99f020f`）：
   - **问题**：原生 `uni.showModal` 样式与暗色主题不匹配
   - **修复**：替换为 `wd-message-box` 的 confirm 对话框，保持 UI 一致性

8. **相册权限处理**（commit `a6bd552`）：
   - **问题**：导出时若相册权限未授权直接失败，用户体验差
   - **修复**：完善权限检查 → 请求 → 保存 → 被拒引导的四步流程，权限被拒后弹出对话框引导用户跳转系统设置页

---

## 五、项目目录结构

```
CardDIY/
├── src/
│   ├── types/card.ts                 # 类型定义（枚举 + 接口）
│   ├── constants/card-constants.ts   # 常量定义
│   ├── composables/
│   │   ├── useCardData.ts            # 卡牌数据状态管理
│   │   ├── useCardRenderer.ts        # Canvas 2D 渲染引擎
│   │   ├── useCardExport.ts          # PNG 导出逻辑
│   │   └── useAuth.ts               # 登录状态管理
│   ├── utils/
│   │   ├── asset-resolver.ts         # 素材路径解析
│   │   └── markup-parser.ts          # 描述标记解析器
│   ├── components/
│   │   ├── CardPreview.vue           # Canvas 预览
│   │   ├── CardPropertyPanel.vue     # 属性选择器
│   │   ├── CardNameInput.vue         # 名称输入
│   │   ├── CardEnergyInput.vue       # 能量选择
│   │   ├── CardDescriptionInput.vue  # 描述输入
│   │   └── CardArtUploader.vue       # 卡图上传
│   ├── pages/editor/index.vue        # 主编辑器页面
│   ├── locale/
│   │   ├── index.ts                  # i18n 配置
│   │   ├── zh-CN.json               # 中文翻译
│   │   └── en-US.json               # 英文翻译
│   ├── static/card-assets/           # 卡牌素材（背景/边框/宝石/字体）
│   ├── main.ts                       # 应用入口
│   └── App.vue                       # 根组件
├── pages.json                        # 页面路由配置
├── vite.config.ts                    # Vite 构建配置
├── tsconfig.json                     # TypeScript 配置
├── package.json                      # 依赖管理
└── CLAUDE.md                         # 开发指南
```

---

## 六、实验结果与功能展示

应用成功实现了以下核心功能：

| 功能模块 | 实现内容 |
|----------|---------|
| 卡牌属性 | 7 色 × 3 类型 × 3 稀有度，Status/Curse 自动限制类型选择 |
| 卡牌名称 | 最多 18 字符，支持升级标记（名称后加 "+" 且变色） |
| 能量消耗 | 0–9 + X + 空（不显示），支持升级变色 |
| 描述文字 | 最多 5 行 × 30 字符，支持 3 种标记语法（关键词黄色/数值绿色/能量图标） |
| 自定义卡图 | 相册选择 → Canvas 裁剪区域合成 |
| 实时预览 | Canvas 2D 8 层合成渲染，修改属性即时更新 |
| PNG 导出 | 微信：保存到系统相册（含权限处理）；H5：浏览器下载 |
| 水印 | 导出时自动添加 @用户名 半透明水印 |
| 分享 | 微信原生分享面板（分享给朋友/收藏） |
| 中英文切换 | vue-i18n 双语支持 |
| 登录系统 | 微信原生 chooseAvatar + nickname 组件 |
| 暗色主题 | wot-design-uni 暗色主题全局适配 |

---

## 七、实验总结与收获

1. **跨平台架构设计**：通过 uni-app 的 `#ifdef` 条件编译机制，在保持 80% 以上代码跨平台复用的前提下，实现了微信小程序和 H5 平台在导出、权限、字体加载等关键差异点的针对性处理。

2. **Canvas 异步渲染**：处理异步图片加载与并发渲染的竞态问题是本次实验的技术难点之一。通过版本号机制（`renderVersion`）确保过期的渲染请求被正确丢弃，保证了视口的一致性。

3. **微信小程序特有 API**：深入使用了微信小程序的 `chooseAvatar`、`type="nickname"`、`showShareImageMenu`、`saveImageToPhotosAlbum`、`getMenuButtonBoundingClientRect` 等 API，理解了微信小程序在权限管理、原生组件和用户交互方面的特殊设计。

4. **国际化注意事项**：vue-i18n 即使在 `legacy: false` 模式下仍会解析 `@` 和 `|` 特殊字符，需使用全角替代字符避开解析，这是一个容易被忽略的坑。

5. **响应式数据流设计**：通过 Vue 3 的 Composition API，将卡牌数据、素材解析、渲染引擎、导出逻辑分离为独立模块，通过 `computed` 和 `watch` 实现自动化的数据驱动渲染。
