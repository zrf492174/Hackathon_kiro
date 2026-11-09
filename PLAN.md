# 万圣节恐怖互动网站 完整计划 (Kiro 黑客松)

项目代号: **Haunted Hollow(闹鬼山谷)**

## 1. 目标与范围

### 1.1 目标
- 打造一个有浓厚恐怖氛围的万圣节主题网站,访客进入后像走进一座闹鬼的庄园。
- 提供大量可玩的互动: 弹出小幽灵、南瓜灯、手电筒光标、蜘蛛网、蝙蝠群、点击惊吓、彩蛋等。
- 自动收集**公开可用授权**(CC0 / 公有领域 / 宽松许可)的图片、音效素材,并自动记录授权与署名。
- 全流程使用 Kiro 的 specs、steering、hooks 完成,作为黑客松展示亮点。

### 1.2 范围(MVP)
- 单页应用(一个主场景 + 3 个子房间: 南瓜园、阁楼、墓地)。
- 至少 12 种互动,至少 30 个可用素材,素材全部来自合规来源。
- 素材采集脚本 + 定时 GitHub Actions。
- 无障碍与安全设计(减少动效、光敏警告、惊吓需主动开启)。

### 1.3 非目标
- 不做账号系统、后端数据库、多人联机。
- 不抓取无明确授权的素材,不使用商业版权图片。
- 不做血腥暴力内容,恐怖氛围以"怪诞、哥特、民俗"风格为主。

## 2. 技术栈

| 层 | 选择 | 理由 |
|---|---|---|
| 构建 | Vite + TypeScript | 快速、无后端、易部署 |
| 渲染 | 原生 DOM + CSS 动画 + Canvas 2D (粒子/雾) | 轻量、可控 |
| 动画 | CSS keyframes, Web Animations API,可选 GSAP (MIT) | 简化时间线 |
| 音频 | Web Audio API(封装 AudioManager) | 控制音量、循环、淡入淡出 |
| 素材脚本 | Node.js 20 + TypeScript (tsx),依赖 sharp、p-limit | 图片优化、并发控制 |
| 测试 | Vitest(单元)、Playwright(端到端与截图) | 覆盖脚本和交互 |
| 质量 | ESLint、Prettier、Lighthouse CI、axe-core | 性能与无障碍 |
| 部署 | GitHub Pages (首选) 或 Vercel | 免费、静态 |

## 3. 站点架构与目录结构

```
Hackathon_kiro/
├─ PLAN.md
├─ README.md
├─ CREDITS.md                  # 自动生成的署名与授权清单
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
├─ index.html
├─ .kiro/
│  ├─ specs/                   # requirements.md / design.md / tasks.md
│  ├─ steering/                # product.md, tech.md, structure.md, assets-policy.md
│  └─ hooks/                   # 保存时校验素材、提交前生成 CREDITS
├─ .github/workflows/
│  ├─ collect-assets.yml       # 定时采集
│  └─ deploy.yml               # 构建并发布 Pages
├─ scripts/
│  ├─ collect/
│  │  ├─ index.ts              # 入口,编排各来源
│  │  ├─ sources/
│  │  │  ├─ openverse.ts
│  │  │  ├─ pixabay.ts
│  │  │  ├─ unsplash.ts
│  │  │  ├─ wikimedia.ts
│  │  │  ├─ opengameart.ts
│  │  │  └─ freesound.ts
│  │  ├─ license.ts            # 许可白名单校验
│  │  ├─ dedupe.ts             # 哈希与感知哈希去重
│  │  ├─ optimize.ts           # sharp 压缩、转 WebP、生成缩略图
│  │  ├─ manifest.ts           # 读写 manifest.json
│  │  └─ credits.ts            # 生成 CREDITS.md
│  └─ verify-assets.ts         # CI 校验: 每个文件有授权记录
├─ public/
│  └─ assets/
│     ├─ images/ {ghosts,pumpkins,bats,webs,backgrounds,props}/
│     ├─ audio/  {ambient,sfx,music}/
│     ├─ placeholders/         # 手绘 SVG 兜底
│     └─ manifest.json
├─ src/
│  ├─ main.ts
│  ├─ core/ {state.ts, audio.ts, assets.ts, settings.ts, rng.ts, events.ts}
│  ├─ scenes/ {gate.ts, pumpkinPatch.ts, attic.ts, graveyard.ts}
│  ├─ interactions/
│  │  ├─ popupGhost.ts  pumpkin.ts  flashlight.ts  cobweb.ts  bats.ts
│  │  ├─ clickScare.ts  fog.ts  lightning.ts  candles.ts  easterEggs.ts
│  │  └─ touch.ts
│  ├─ ui/ {warningModal.ts, settingsPanel.ts, hud.ts, collectionBook.ts}
│  ├─ styles/ {theme.css, fx.css, fonts.css}
│  └─ a11y/ {reducedMotion.ts, focus.ts}
└─ tests/ {unit, e2e}
```

### 3.1 模块职责
- `core/assets.ts`: 读取 manifest.json,按类别随机取素材,失败则回退到 placeholders。
- `core/audio.ts`: 统一音频入口,支持静音、音量、分组(环境、音效)。
- `core/settings.ts`: 持久化用户设置(localStorage): 静音、减少动效、惊吓开关。
- `interactions/*`: 每个互动一个模块,统一接口 `init(ctx)`, `destroy()`, 便于开关与测试。
- `scenes/*`: 管理场景背景、可用互动集合与切换动画。

## 4. 视觉与恐怖氛围设计

### 4.1 配色
| 用途 | 色值 |
|---|---|
| 背景深黑 | `#0b0710` |
| 暗紫 | `#1d1030` |
| 南瓜橙(高光) | `#ff7a1a` |
| 烛火黄 | `#ffc857` |
| 幽灵白 | `#e8e6f2` |
| 血红(点缀,少量) | `#8b0f1c` |
| 毒绿(点缀) | `#6bff7a` |

正文对比度需达到 WCAG AA (4.5:1),如幽灵白 on 深黑。

### 4.2 字体(均使用开源许可,自托管)
- 标题: Creepster 或 Nosifer (OFL, Google Fonts,可自托管)。
- 手写感: Special Elite (Apache 2.0)。
- 正文: Noto Serif SC / Noto Sans SC (OFL),中文显示。
- 字体文件放入仓库,避免外链依赖。

### 4.3 氛围特效
- **雾**: Canvas 多层柏林噪声或半透明 PNG 层缓慢横向漂移,视差。
- **闪烁**: 烛光/灯光使用 `opacity` 与 `filter: brightness` 的不规则关键帧(随机时长)。
- **暗角(vignette)**: 全屏径向渐变 `radial-gradient(transparent 40%, #000 100%)`。
- **颗粒噪点**: 低透明度噪点叠加层,模拟旧胶片。
- **闪电**: 随机间隔 15 到 40 秒,背景短暂变亮,伴随远雷声(需用户允许声音)。
- **文字抖动**: 标题偶尔故障(glitch)效果,幅度小,且受减少动效控制。
- **鼠标**: 默认光标替换为小蜡烛或手电筒光斑。

## 5. 互动清单

| # | 互动 | 描述 | 触发 | 实现要点 |
|---|---|---|---|---|
| 1 | 弹出小幽灵 | 幽灵从屏幕边缘/物体后飘出,发出"呜"声,可点击驱散并计分 | 随机计时 + 鼠标静止 + 滚动到某处 | 池化 DOM,CSS 位移+透明度,素材来自 ghosts 类别 |
| 2 | 南瓜灯 | 一排南瓜灯,点击切换点亮/熄灭,表情变化,烛光闪烁 | 点击 / 键盘回车 | SVG+CSS 发光,`box-shadow`/`drop-shadow` |
| 3 | 南瓜灯谜题 | 按特定顺序点亮 5 个南瓜,打开隐藏门 | 玩法 | 状态机 |
| 4 | 手电筒光标 | 全黑场景,只有光标周围可见,可发现隐藏物 | 鼠标移动 / 触摸拖动 | CSS mask 或 Canvas 遮罩 |
| 5 | 蜘蛛网与蜘蛛 | 角落蛛网,蜘蛛沿丝线垂下,鼠标靠近缩回 | 悬停 / 接近 | SVG 路径,距离判断 |
| 6 | 蝙蝠群 | 点击空白处或夜晚时刻群蝠飞过 | 点击 / 定时 | Canvas 精灵,少量对象 |
| 7 | 点击惊吓 | 点击特定对象(旧画像、门)触发惊吓画面+音效 | 仅用户开启惊吓模式后 | 默认关闭,见无障碍 |
| 8 | 眼睛在黑暗中 | 暗处出现成对发光眼睛,随光标眨眼消失 | 随机 | 小型 SVG |
| 9 | 蜡烛吹灭 | 点击或按住吹灭蜡烛,环境变暗 | 点击 | 影响全局亮度变量 |
| 10 | 雷雨与闪电 | 周期性闪电、雨滴 | 定时 | Canvas 雨 |
| 11 | 收集册 | 每个幽灵/南瓜被发现后进入收集册,显示素材署名 | 发现 | 展示授权信息,体现合规 |
| 12 | 墓碑留言 | 用户输入名字生成墓碑(仅本地,不上传) | 表单 | 过滤与长度限制,避免注入 |
| 13 | 糖果或捣蛋 | 门铃点击后随机得到"糖果"或"恶作剧" | 点击 | 概率表 |
| 14 | 彩蛋 | Konami 码召唤巨型南瓜王;连点月亮 7 次变血月;输入 `boo` 全屏幽灵雨 | 键盘/点击 | 事件总线 |
| 15 | 移动端触摸 | 触摸拖动手电筒、双指点击惊吓、摇晃手机(DeviceMotion,需授权)触发幽灵 | 触摸/传感器 | 统一指针事件,触控目标不小于 44px |

### 5.1 弹出幽灵规则
- 同屏最多 3 只,冷却 8 到 20 秒随机。
- 页面不可见(`visibilitychange`)时暂停。
- 减少动效模式下改为淡入淡出,不做快速位移。

## 6. 素材采集管线(核心)

### 6.1 原则
1. **只收录明确许可**: CC0、Public Domain Mark、Pixabay License、Unsplash License、CC BY(保留署名)。**默认不收 CC BY-NC、CC BY-ND、CC BY-SA 之外未审核的许可**; CC BY-SA 默认不收,避免传染条款复杂化。
2. 每个素材必须记录: 来源 URL、作者、许可、许可链接、获取时间、哈希。
3. 无法确认许可的一律丢弃。
4. 遵守各站 API 条款与速率限制,不做大规模爬取,优先使用官方 API。
5. 密钥仅通过环境变量/GitHub Secrets 传入,不入库。

### 6.2 来源对照

| 来源 | 内容 | 访问方式 | 可收许可 | 备注 |
|---|---|---|---|---|
| Openverse | 图片、音频聚合 | 官方 API (`api.openverse.org`) | 过滤 `license=cc0,pdm,by` | 返回作者、许可字段,首选聚合源 |
| Pixabay | 图片、插画、音效 | 官方 API(需免费 key) | Pixabay License | 不得直接作为独立素材转售,保留来源记录;API 不允许大规模热链,需本地缓存 |
| Unsplash | 照片 | 官方 API(需 key) | Unsplash License | 需触发下载端点 `download_location`,并建议署名 |
| Wikimedia Commons | 图片、音频 | MediaWiki API | CC0、PD、CC BY | 从 `extmetadata` 读许可与作者 |
| OpenGameArt | 精灵、音效、音乐 | 按页面人工/半自动列表,逐条核对许可 | CC0、CC BY | 无稳定官方 API,采用人工维护的候选 URL 清单,脚本只下载并校验 |
| freesound | 音效 | 官方 API(需 key) | 过滤 CC0 | 仅取 CC0 |

### 6.3 搜索关键词
`halloween`, `ghost`, `jack-o-lantern`, `pumpkin`, `bat silhouette`, `spider web`, `haunted house`, `graveyard`, `full moon`, `candle`, `fog`, `witch`; 音频: `wind`, `creaking door`, `ghost whisper`, `thunder`, `owl`, `evil laugh`, `heartbeat`。

### 6.4 流程

```
搜索 (各来源 adapter)
  -> 许可白名单过滤 (license.ts)
  -> 下载到 .cache/raw (带限速与重试)
  -> 去重 (SHA-256 精确 + pHash 近似)
  -> 质量过滤 (最小分辨率、宽高比、文件大小)
  -> 优化 (sharp: 缩放最大边 1600,转 WebP/AVIF,生成 320px 缩略图; 音频转 ogg/mp3,码率受限)
  -> 分类放入 public/assets/<type>/<category>
  -> 更新 manifest.json
  -> 生成 CREDITS.md
  -> verify-assets.ts 校验
```

### 6.5 抠图与适配
- 幽灵、蝙蝠等需要透明背景: 优先选 PNG/SVG 透明素材; 否则标记 `needsMatting`,后续用本地工具(例如 rembg,MIT)处理,或放弃该素材。
- 被修改的素材在 manifest 中记录 `modified: true`,CC BY 要求注明修改。

### 6.6 manifest.json 示例 schema

```json
{
  "version": 1,
  "generatedAt": "2025-10-01T08:00:00Z",
  "assets": [
    {
      "id": "img-openverse-3f9a1c",
      "type": "image",
      "category": "ghosts",
      "file": "images/ghosts/ghost-3f9a1c.webp",
      "thumb": "images/ghosts/ghost-3f9a1c.thumb.webp",
      "width": 1024,
      "height": 1280,
      "bytes": 48213,
      "hasAlpha": true,
      "sha256": "...",
      "phash": "a1b2c3d4e5f60718",
      "source": {
        "provider": "openverse",
        "pageUrl": "https://example.org/photo/123",
        "downloadUrl": "https://example.org/files/123.png",
        "fetchedAt": "2025-10-01T08:00:00Z"
      },
      "author": "Author Name",
      "authorUrl": "https://example.org/user/author",
      "title": "Cute Ghost",
      "license": "CC0-1.0",
      "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
      "attributionRequired": false,
      "modified": true,
      "tags": ["ghost", "halloween"],
      "status": "approved"
    }
  ]
}
```

音频条目额外字段: `durationSec`, `loop`, `loudnessLufs`。
`status` 取值: `approved | pending | rejected`,仅 `approved` 会被站点加载。

### 6.7 许可与署名追踪
- `license.ts` 维护白名单: `CC0-1.0`, `PDM`, `CC-BY-4.0`, `CC-BY-3.0`, `PIXABAY`, `UNSPLASH`。
- `credits.ts` 读取 manifest,生成 `CREDITS.md`(按类别分表: 标题、作者、来源、许可),同时站内"收集册/关于"页展示。
- `verify-assets.ts`(CI 必跑): 扫描 `public/assets`,任何文件无对应 manifest 记录、许可不在白名单、需署名但缺作者,则失败。
- 保留人工审核: 新采集素材默认 `pending`,通过 PR 评审改为 `approved`(也可对 CC0 来源自动批准)。

### 6.8 去重
- 精确: SHA-256。
- 近似: 感知哈希 (pHash),汉明距离小于等于 6 视为重复,保留分辨率更高者。
- 同一作者同一标题跨来源重复也合并。

### 6.9 离线与降级方案
- 提供手绘 SVG/CSS 占位素材(幽灵、南瓜灯、蝙蝠、蛛网、墓碑),随仓库提交,自有版权(CC0 发布)。
- `assets.ts` 加载流程: manifest 缺失、素材 404、网络受限时自动使用 placeholders,站点始终可用。
- 脚本支持 `--offline` 与 `--dry-run`: 不联网,仅校验现有 manifest。
- 采集结果提交进仓库,线上站点不依赖运行时第三方请求(也避免热链)。

### 6.10 脚本命令设计
```
npm run assets:collect -- --source=openverse --query="halloween ghost" --limit=20 --category=ghosts
npm run assets:collect:all        # 按配置文件 scripts/collect/config.json 全部来源
npm run assets:verify             # 校验
npm run assets:credits            # 生成 CREDITS.md
```
配置示例 `config.json`: 每个类别的关键词、来源、数量上限、最小分辨率、许可白名单。

## 7. 自动化

### 7.1 定时采集 (GitHub Actions)
`collect-assets.yml`:
- 触发: `schedule` (每周一次) + `workflow_dispatch`。
- 步骤: checkout -> setup-node -> `npm ci` -> `assets:collect:all` -> `assets:verify` -> 使用 PR action 提交到 `assets/auto-update` 分支,新素材状态为 `pending`。
- Secrets: `PIXABAY_KEY`, `UNSPLASH_KEY`, `FREESOUND_KEY`。Openverse 可匿名低频或注册客户端。
- 限制单次新增数量(如 20),并输出摘要到 `GITHUB_STEP_SUMMARY`。

### 7.2 Kiro Hooks
- 保存 `manifest.json` 时: 自动运行 `assets:verify`。
- 新增素材文件时: 提示补充署名并运行 `assets:credits`。
- 保存 `src/interactions/*.ts` 时: 运行相关 Vitest 用例。

### 7.3 CI
`ci.yml`: lint、类型检查、Vitest、`assets:verify`、构建、Lighthouse CI。

## 8. 音频设计

- **自动播放策略**: 浏览器禁止无手势自动播放。入口页设置"进入闹鬼山谷"按钮,点击后才创建/恢复 `AudioContext`。
- 默认进入时询问是否开启声音,默认静音可选。
- **静音开关**: 全局固定右上角按钮,键盘可达,状态持久化。
- 分层: 环境层(风声、虫鸣,循环,淡入淡出)、事件音效(门吱呀、幽灵低语、雷声)、短乐句。
- 音量规范: 环境 -30 LUFS 左右,惊吓音效不超过 -14 LUFS,避免突然巨响; 使用 GainNode 做限幅与渐变。
- 页面隐藏时自动暂停,返回时恢复。
- 音频预加载仅加载环境层,其余懒加载。
- 音频同样来自 CC0 来源并写入 manifest。

## 9. 性能与无障碍

### 9.1 性能
- 首屏 JS 小于 150KB gzip,图片全部 WebP,懒加载非首屏素材。
- Canvas 动画使用 `requestAnimationFrame`,页面不可见时暂停,低端设备自动降低粒子数(依据 `navigator.hardwareConcurrency` 与帧率监测)。
- DOM 幽灵使用对象池,避免频繁创建。
- 目标: Lighthouse 性能 90 以上, 60fps 桌面, 移动端不低于 30fps。

### 9.2 无障碍
- **prefers-reduced-motion**: 检测后关闭闪电闪光、快速位移、抖动,改用淡入淡出; 设置面板也可手动切换。
- **光敏癫痫警告**: 进入前弹窗说明含闪烁和突然声音,需确认; 闪烁频率不超过每秒 3 次,避免大面积高对比快速闪动。
- **惊吓需主动开启**: "点击惊吓/突然音效"默认关闭,在设置里手动开启,并可随时关闭。
- **键盘可达**: 所有互动可用 Tab、Enter、Space 操作; 可见焦点样式(橙色描边)。
- **对比度**: 正文达 WCAG AA。
- 语义化 HTML,互动元素有 `aria-label`; 重要状态变化用 `aria-live` 播报(如"你发现了一只幽灵")。
- 装饰性图片 `alt=""`,收集册中图片提供描述。
- 提供"安全模式": 一键关闭所有惊吓与闪烁,仅保留静态氛围。

## 10. 如何使用 Kiro 功能

### 10.1 Specs
在 `.kiro/specs/` 建立 3 个 spec:
1. `asset-pipeline`: 采集管线(需求用 EARS 格式写,如"当素材许可不在白名单时,系统应拒绝该素材")。
2. `interactions`: 互动系统与场景。
3. `a11y-safety`: 无障碍与安全模式。
每个 spec 走 requirements -> design -> tasks,再逐任务执行,方便黑客松展示开发过程。

### 10.2 Steering
`.kiro/steering/`:
- `product.md`: 产品愿景、风格、禁止血腥。
- `tech.md`: 技术栈、命名、测试要求。
- `structure.md`: 目录约定。
- `assets-policy.md`: **素材合规规则**(许可白名单、必须记录署名、不得入库无许可素材),让 Kiro 每次生成代码都遵守。

### 10.3 Hooks
见 7.2。可再加: 提交前检查"无破折号/无敏感密钥"、改动样式时跑 axe 检查。

### 10.4 其他
- 使用 Kiro 对话快速生成 SVG 占位素材与互动原型。
- 在 README 里记录"Kiro 如何帮助我们"的截图与流程,用于评审展示。

## 11. 黑客松里程碑时间线(以 5 天为例,可压缩)

| 阶段 | 时间 | 产出 |
|---|---|---|
| M0 启动 | 第 1 天上午 | 仓库初始化,steering、spec 撰写,Vite 脚手架 |
| M1 氛围骨架 | 第 1 天下午 | 暗色主题、雾、暗角、字体、入口警告页、音频管理器 |
| M2 素材管线 | 第 2 天 | Openverse + Wikimedia 适配器、许可校验、去重、manifest、CREDITS 生成、占位 SVG |
| M3 核心互动 | 第 3 天 | 弹出幽灵、南瓜灯、手电筒、蛛网、蝙蝠 |
| M4 扩展互动 | 第 4 天上午 | 点击惊吓(可选)、收集册、彩蛋、触摸支持、闪电 |
| M5 自动化与质量 | 第 4 天下午 | GitHub Actions、其余来源适配器、测试、无障碍审计、性能优化 |
| M6 发布与演示 | 第 5 天 | 部署、README、演示视频、彩排 |

缓冲: 每阶段预留 20% 时间。若延期,优先保证 M1+M3+M2 的最小闭环。

## 12. 测试计划

- **单元 (Vitest)**: 许可白名单、去重逻辑、manifest 读写、概率表、状态机(南瓜谜题)、设置持久化。
- **脚本测试**: 使用录制的 API 响应 fixture,不依赖网络; 覆盖空结果、限流 429、许可缺失。
- **端到端 (Playwright)**: 进入流程(警告 -> 声音选择)、静音开关、南瓜点击、幽灵弹出与驱散、键盘操作、减少动效下无闪电、移动视口触摸。
- **视觉**: 关键场景截图对比。
- **无障碍**: axe-core 自动扫描 + 人工键盘走查 + 屏幕阅读器抽查。
- **性能**: Lighthouse CI 阈值。
- **合规**: `assets:verify` 在 CI 中为必过项。

## 13. 部署

- **GitHub Pages(首选)**: `deploy.yml` 构建 `dist/`,使用 `actions/deploy-pages`; Vite 设置 `base: '/Hackathon_kiro/'`。
- **Vercel(备选)**: 导入仓库,构建命令 `npm run build`,输出 `dist`。
- 设置缓存头(静态素材长缓存,带哈希文件名)。
- 部署前检查: `assets:verify`、Lighthouse、404 页面、`CREDITS.md` 链接存在于页脚。

## 14. 风险与应对

| 风险 | 影响 | 应对 |
|---|---|---|
| 素材许可误判 | 法律/评审扣分 | 白名单 + 人工审核 + 校验脚本 + 仅用官方 API 元数据 |
| API 限流或无网络 | 采集失败 | 重试退避、缓存、offline 模式、已提交素材 + SVG 占位 |
| API key 泄露 | 安全 | 仅用 Secrets,gitignore `.env`,hook 扫描 |
| 惊吓引发不适 | 体验与无障碍 | 警告、默认关闭惊吓、安全模式、减少动效 |
| 性能差 | 卡顿 | 对象池、降级粒子、图片优化 |
| 浏览器自动播放限制 | 无声 | 手势后启动音频,提供提示 |
| 素材风格不统一 | 观感差 | 统一滤镜(暗色调、降饱和、橙紫叠色),人工筛选 |
| 范围蔓延 | 无法完成 | 先 MVP,互动按优先级,砍掉 12、13 |
| 抠图质量差 | 幽灵边缘脏 | 优先透明素材,失败回退 SVG |
| 移动端传感器权限 | 摇晃功能不可用 | 作为可选增强,失败则忽略 |

## 15. 演示脚本(约 3 分钟)

1. (0:00) 打开站点,展示光敏/惊吓警告,说明无障碍设计。
2. (0:20) 点击"进入",开启声音,风声渐入,雾与烛光出现。
3. (0:40) 点亮南瓜灯,触发谜题,隐藏门打开。
4. (1:00) 进入阁楼,打开手电筒,发现隐藏幽灵并收入收集册。
5. (1:30) 幽灵突然弹出,点击驱散并计分; 蝙蝠飞过; 触发闪电。
6. (2:00) 输入彩蛋(`boo` 或 Konami),全屏幽灵雨。
7. (2:20) 打开收集册,展示每个素材的作者与许可。
8. (2:35) 切到终端/Actions,展示 `assets:collect` 与 `assets:verify`,以及自动生成的 `CREDITS.md`。
9. (2:50) 展示 Kiro specs、steering、hooks 的使用,总结亮点。

## 16. 任务清单

### 准备
- [ ] 初始化 Vite + TS 项目,配置 ESLint/Prettier/Vitest/Playwright
- [ ] 编写 `.kiro/steering/*.md`(含 assets-policy)
- [ ] 编写 3 个 specs(requirements/design/tasks)
- [ ] 添加 README 与 .gitignore(含 `.env`、`.cache`)

### 视觉与基础
- [ ] 主题 CSS: 配色、字体自托管、暗角、颗粒
- [ ] 雾特效、烛光闪烁
- [ ] 入口警告页与设置面板(静音、减少动效、惊吓开关、安全模式)
- [ ] AudioManager 与静音开关

### 素材管线
- [ ] manifest schema 与读写
- [ ] license.ts 白名单与测试
- [ ] Openverse 适配器
- [ ] Wikimedia Commons 适配器
- [ ] Pixabay / Unsplash / freesound 适配器
- [ ] OpenGameArt 候选清单与校验下载
- [ ] 去重 (SHA-256 + pHash)
- [ ] sharp 优化与缩略图
- [ ] credits.ts 生成 CREDITS.md
- [ ] verify-assets.ts
- [ ] SVG 占位素材与离线回退
- [ ] collect-assets.yml 定时工作流

### 互动
- [ ] 弹出小幽灵
- [ ] 南瓜灯与谜题
- [ ] 手电筒光标
- [ ] 蛛网与蜘蛛
- [ ] 蝙蝠群
- [ ] 闪电与雨
- [ ] 黑暗中的眼睛
- [ ] 蜡烛吹灭
- [ ] 点击惊吓(可选开启)
- [ ] 收集册
- [ ] 彩蛋 (Konami / boo / 血月)
- [ ] 墓碑留言、糖果或捣蛋(时间允许)
- [ ] 移动端触摸适配

### 质量与发布
- [ ] 单元与端到端测试
- [ ] axe 与 Lighthouse 达标
- [ ] deploy.yml 与线上验证
- [ ] 页脚链接 CREDITS.md
- [ ] 录制演示视频,彩排演示脚本

## v3 grimoire (FEAT-002)

Done: castle, laboratory, library (grimoire) and gazette scenes with unit and Playwright/axe tests.
