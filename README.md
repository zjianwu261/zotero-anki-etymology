# zotero-anki-etymology — Zotero 9 插件

在 Zotero Reader 中选中英文单词，一键生成词源卡并导入 Anki。

- 调用 DeepSeek V4 API 生成词源拆解、语义演变、例句等结构化内容
- 自动抓取 Cambridge Dictionary 美式发音（失败回退有道词典）
- 通过 AnkiConnect 直接写入 Anki，自动创建「词源卡」笔记类型

## 支持版本

| 软件 | 版本 |
|------|------|
| Zotero | **7 / 8 / 9** |
| Anki | 2.1+（需安装 [AnkiConnect](https://ankiweb.net/shared/info/2055492159)） |

## 安装

1. 下载 [dist/zotero_anki_etymology-0.1.21.xpi](dist/zotero_anki_etymology-0.1.21.xpi)
2. Zotero → 工具 → 插件 → ⚙️ → Install Plugin From File → 选择 `.xpi`
3. 重启 Zotero

## 配置

打开 Zotero → Settings → zotero_anki_etymology，填写：

| 字段 | 说明 |
|------|------|
| **DeepSeek API Key** | DeepSeek 开发者后台获取 |
| 模型 | `deepseek-v4-flash`（默认）或 `deepseek-v4-pro` |
| 导入牌组 | Anki 目标牌组，点「刷新」读取已有牌组 |

高级设置（展开后可配）：

| 字段 | 默认值 |
|------|--------|
| Base URL | `https://api.deepseek.com` |
| AnkiConnect URL | `http://127.0.0.1:8765` |
| 标签 | `zotero-word` |

## 使用

- 在 Zotero Reader 中选中单个英文单词 → 弹窗点「导入 Anki」
- 或右键 → 「导入 "word" 到 Anki」

## 卡片内容

插件会自动寻找包含以下 8 个结构化字段的笔记类型；找不到则自动创建「词源卡」：

1. **Word** — 单词
2. **Part_of_Speech** — 词性
3. **Pronunciation** — IPA 音标
4. **Example_Sentence** — 例句（英文）
5. **Example_ZH** — 例句翻译
6. **Etymology_Breakdown** — 词源拆解（HTML）
7. **Semantic_Evolution** — 语义演变（HTML，含词性用法、同源词、对比、短语、总结）
8. **Memory_Tip** — 记忆技巧

默认**强制使用词源卡结构**：优先复用已有的、包含全部 8 个字段的笔记类型；没有就自动创建「词源卡」（含发音模板与样式）；「词源卡」被手动改过、少了字段的话，导入时会用 `modelFieldAdd` 自动补回来。不会再回退到 Basic。

只有在设置里取消勾选「强制使用「词源卡」笔记类型」后，才会回退到 Basic 的 Front/Back 格式。

## 模型说明

DeepSeek 已于 2026-07-24 下线 `deepseek-chat` / `deepseek-reasoner`，现在只接受：

- `deepseek-v4-flash`（默认，快且便宜）
- `deepseek-v4-pro`（更强但更慢）

插件会自动将旧模型名映射到 `deepseek-v4-flash`，并在请求中关闭 V4 默认的思考模式（`thinking: disabled`）。

## 依赖

- DeepSeek API Key（充值余额）
- Anki 启动 + AnkiConnect 插件运行中

## 打包

```bash
cd source
zip -r ../dist/zotero_anki_etymology-$(jq -r .version manifest.json).xpi . -x "*.DS_Store"
```

## License

MIT
