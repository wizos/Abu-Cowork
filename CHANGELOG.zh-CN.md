# 更新日志

> 本文件是**中文** canonical 更新日志 —— 驱动 App 内更新弹窗与官网的中文展示。英文版见 [`CHANGELOG.md`](./CHANGELOG.md)（驱动 GitHub Release）。每次发版两份同步维护、语言不混（见 `RELEASING.md`）。v0.31.0 之前的历史仅英文版有。

## v0.31.0 · 2026-07-18

### 新增

- **右栏多页签工作区**：右栏文件预览升级为多页签工作区 —— 多文件预览并存（keep-alive 隐藏不卸载）、真 PTY 终端（portable-pty 后端 + xterm.js 前端）、原生 webview 浏览器页签（任意站点，不受 iframe 的 X-Frame-Options 限制），并以「任务摘要」作为默认页签。
- **主窗口卡片化改版**：卡片化视觉层次、顶栏与 macOS 红绿灯对齐、工具箱与自动化收进主布局的卡片网格（固定尺寸横卡 + 自适应铺满 + 统一启用开关）。
- **会话全文搜索接入 FTS5**：侧栏会话搜索弹窗接入 SQLite FTS5，可按标题 + 正文跨历史会话检索。
- **账户菜单 + 设置导航整理**：左下角三个按钮收进头像 popover（内联切主题/语言、接真实检查更新流），设置分组重组。

### 变更

- **字号排版体系（8-token）**：全部字号迁移到 8 档 `--text-*` token（font-size + line-height + font-weight 三绑定），清零 px 硬编码与命名字号；阅读正文号定为 14px（对齐主流聊天客户端），标题字重封顶 600。
- **语义色 + 链接色 tokenization**：链接与状态色收敛为 `--abu-{danger/warning/success/info}`（fg/solid/bg 三角色）+ 专用 `--abu-link`（品牌橙不复用 accent）；765 处裸 Tailwind 色阶转 token 并达 WCAG AA，`--abu-text-muted` 也提到 AA。

### 修复

- **消息列表底部锁定 + 搜索跳转**：虚拟化消息列表在打开/切换会话时正确锁定到底部；搜索命中跳转配淡出高亮。
- **`cn()` 吞字号 token**：修复 tailwind-merge 把 `text-[var(--)]` 误判为 font-size 从而吞掉字号 token 的问题（extendTailwindMerge 根治，app 级）。
- **工作区页签交互**：页签拖拽真正重排 + 中性插入线、关闭（×）不再误触发拖拽、PDF worker 经 Vite `?url` 加载并 memoize file 对象（修「object can not be cloned」）、恢复面板收起按钮。
- **PTY 子进程回收**：终端被杀后回收子进程，spawn 竞态下清理孤儿进程。
- **macOS 顶栏可点性**：页签条上方的 + 按钮曾落在 macOS 拖拽区导致不可点，已修。

**完整变更**：https://github.com/PM-Shawn/Abu-Cowork/compare/v0.30.0...v0.31.0
