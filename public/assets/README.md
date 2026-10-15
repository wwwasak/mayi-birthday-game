# 资源目录

本目录中的文件会在构建时原样复制到 `dist/assets/`，游戏通过相对路径 `./assets/...` 访问。

所有资源的路径、用途和规格以 `src/config/assets.ts` 为唯一注册表；完整清单见根目录 `ASSETS.md`。

- `images/bg/`     场景背景（1920x1080）
- `images/char/`   麻衣立绘（透明 PNG）
- `images/stamps/` 四枚印章图标
- `images/items/`  道具（薄荷糖、火锅、水果捞、金色料理、蛋糕、心愿卡）
- `images/ui/`     标题 LOGO 等界面元素
- `audio/`         BGM、音效、《红豆》

资源未到位时，游戏使用 CSS 占位渐变与占位角色，不会报错。
