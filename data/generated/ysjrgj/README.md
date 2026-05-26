# Codex 生成内容目录

这个目录用于存放离线内容生产得到的结构化 JSON。

推荐文件：

- `materials.json`：资料元数据
- `chunks.json`：资料切片内容
- `framework-concise.json`：提纲版知识框架
- `framework-detailed.json`：讲义版知识框架
- `import-summary.md`：离线整理过程和导入说明

运行校验：

```bash
npm run validate:content
```

导入数据库：

```bash
npm run import:content
```

当前仓库只放示例结构，不放真实课程资料。
