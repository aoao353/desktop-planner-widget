# task-widget

轻量级桌面任务清单，基于 **Tauri 2** + **React 19** + **TypeScript**。无边框透明窗口、本地 JSON 持久化、系统托盘与全局快捷键，界面为中文。

![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
![Tauri](https://img.shields.io/badge/Tauri-2-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 功能概览

| 类别 | 说明 |
|------|------|
| **任务** | 增删改、完成勾选、优先级（紧急 / 高 / 普通 / 低）、标签、截止日期 |
| **视图** | 按优先级分组；精简模式折叠窗口高度，仅保留核心区域；可拖拽调整窗口大小 |
| **系统** | 关闭窗口时隐藏到托盘（非退出）；托盘菜单显示/退出；顶栏 **设置** 可改全局快捷键、自启、透明度、置顶 |
| **自启** | 在设置中开关（Rust 侧 `tauri-plugin-autostart` 写入系统自启项） |
| **数据** | `tasks.json` 存任务；`config.json` 存窗口几何与上述设置（camelCase JSON） |

> **发布前**：请把 `src-tauri/tauri.conf.json` 里的 `identifier`（当前为 `com.lenovo.task-widget`）改成你自己的反向域名标识，避免与上游冲突。

---

## 截图

> 可在此添加应用截图或 GIF，便于仓库展示。

---

## 技术栈

- **前端**：React 19、Vite 7、TypeScript、Tailwind CSS 4、Zustand、Framer Motion  
- **桌面**：Tauri 2、Rust（任务 CRUD 通过 `invoke` 与前端通信）  
- **插件**：`opener`、`global-shortcut`、`autostart`  

---

## 环境要求

- **Node.js** 18+（建议 LTS）  
- **Rust** stable（[`rustup`](https://rustup.rs/)）  
- 平台相关依赖见 [Tauri 前置条件](https://v2.tauri.app/start/prerequisites/)（Windows 需 WebView2 / MSVC 等）。

---

## 开发与构建

### 安装依赖

```bash
npm install
```

### 开发模式（热重载前端 + 调试原生）

```bash
npm run tauri dev
```

默认 Vite 开发服务器端口为 **1420**（见 `vite.config.ts`）。

### 仅构建前端

```bash
npm run build
```

### 生产构建桌面应用

```bash
npm run tauri build
```

产物在 `src-tauri/target/release/`（可执行文件）及 `src-tauri/target/release/bundle/`（安装包，按平台而定）。

---

## 快捷键

| 快捷键 | 作用 |
|--------|------|
| **全局快捷键（可选）** | 在设置中填写并保存后才注册，用于显示或隐藏主窗口（冲突时可能注册失败） |

---

## 数据与配置位置

- 任务数据：`tasks.json`（位于应用 [`app_data_dir`](https://docs.rs/tauri/latest/tauri/path/enum.BaseDirectory.html) 下由 Rust 侧解析的路径）  
- 应用配置：`config.json`（窗口位置/尺寸、全局快捷键、自启、界面透明度、是否置顶）  

卸载或清理应用数据目录会删除上述文件，请自行备份。

---

## 项目结构（简要）

```
task-widget/
├── src/                 # React 前端
│   ├── App.tsx          # 顶栏、自启开关
│   ├── components/      # TaskBoard、TaskCard、Drawer、StatsBar 等
│   └── stores/          # Zustand 任务状态
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs       # 入口、托盘、快捷键、自启
│   │   ├── task.rs      # 任务 CRUD + 文件读写
│   │   ├── app_config.rs
│   │   └── tray.rs
│   ├── capabilities/    # 权限能力
│   └── tauri.conf.json
├── package.json
└── README.md
```

---

## 参与贡献

欢迎 Issue 与 Pull Request。请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 与 [行为准则](./CODE_OF_CONDUCT.md)。

---

## 安全

若发现安全漏洞，请按 [SECURITY.md](./SECURITY.md) 说明私下报告，勿在公开 Issue 中讨论利用细节。

---

## 许可证

本项目采用 [MIT License](./LICENSE)。

© task-widget contributors
