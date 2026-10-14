# CardDIY

以前的课程作业：一个《杀戮尖塔》风格的卡牌制作器，用 uni-app、Vue 3 和 TypeScript 编写，支持微信小程序和 H5。小程序尚未发布。

可编辑卡牌颜色、类型、稀有度、名称、能量和描述，上传自定义卡图，实时预览并导出 PNG，支持中英文切换。

<img src="docs/screenshots/h5.png" alt="CardDIY H5 运行截图" width="720" />

运行 H5：

```sh
yarn install
yarn dev:h5
```

GitHub Pages 自动发布：

1. 在仓库的 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**（[官方说明](https://docs.github.com/zh/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)）。
2. 将代码推送到 `main`，工作流会安装依赖、运行 `yarn build:h5`，并发布 `dist/build/h5`。也可在 **Actions → Deploy H5 to GitHub Pages → Run workflow** 手动触发。
3. 部署成功后访问 <https://sorubedo.github.io/CardDIY/>，实际地址也会显示在工作流的 `github-pages` 环境中。

工作流使用 Node.js 24 和 Yarn 1.22.22，由 GitHub 提供的 `GITHUB_TOKEN` 完成发布，无需额外配置密钥。构建时会根据 Pages 配置设置资源基础路径；H5 使用 hash 路由，卡牌图片和字体也会跟随基础路径加载。

本地验证 Pages 构建：

```sh
yarn build:h5 --base /CardDIY/
```

微信小程序：运行 `yarn dev:mp-weixin`，用微信开发者工具打开 `dist/dev/mp-weixin`，填入自己的 AppID。

描述中 `>关键词<` 显示黄色，`#数值#` 显示绿色，`@` 显示能量图标。原始课程文档保留在 [docs](docs/) 中。

卡牌素材与《杀戮尖塔》相关权利归原权利人所有。
