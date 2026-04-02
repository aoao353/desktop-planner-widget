# 参与贡献

感谢你愿意为 **task-widget** 出力。以下约定帮助 PR 与 Issue 更高效地合并与处理。

## 开始之前

1. 已有 Issue 可先留言，避免多人重复做同一类改动。  
2. 大功能或架构变更，建议先开 Issue 讨论方向与接口。  
3. 请阅读 [行为准则](./CODE_OF_CONDUCT.md)。

## 开发环境

- Node.js 18+、`npm install`  
- Rust stable、`npm run tauri dev` 能正常启动  

提交前请确保：

```bash
npm run build
```

若涉及 Rust 代码，请确认 `cargo build`（在 `src-tauri` 下）通过。

## 提交规范

- **一个 PR 聚焦一个主题**（bugfix、单一功能、文档修正等），便于审查。  
- **说明动机**：在 PR 描述中写清楚「解决什么问题 / 为什么这样改」。  
- **与现有风格一致**：TypeScript / Rust 命名、缩进、组件结构尽量与周边代码一致。  
- **不要夹带无关格式化**（除非该文件本就属于本次改动范围）。

## Issue 与 PR

- **Bug**：复现步骤、系统版本（Windows/macOS/Linux）、Tauri 版本、期望 vs 实际行为。  
- **功能请求**：使用场景、是否愿意自己实现。  
- **PR**：关联相关 Issue（若有）；截图或简短录屏对 UI 改动很有帮助。

## 许可证

向本仓库提交代码贡献，即表示你同意你的贡献在 [MIT 许可证](./LICENSE) 下授权。
