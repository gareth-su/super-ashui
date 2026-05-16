# AI Course Knowledge Framework

这是一个面向课程复习的结构化学习网站。系统将已整理的课程内容作为固定知识库，用户打开网站后可以直接查看课程知识框架和学习内容。

## 已实现内容

- 预置课程知识框架
- 讲义版 / 提纲版切换
- 结构化知识体系
- 章节导航与核心概念地图
- 可视化辅助材料

## 技术栈

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Prisma
- SQLite

## 本地运行

```bash
npm install
npx prisma generate
npm run dev
```

打开：

```text
http://localhost:3000/framework
```

## 部署说明

公开部署版不包含本地数据库、原始课件、上传文件或环境变量文件。课程展示页读取预生成的结构化 JSON 内容；涉及数据库导入、资料上传、在线解析的维护者功能不作为公开部署入口使用。

## AI/Agent 构建成果

AI/Agent 参与了课程资料解析、知识结构设计、章节框架生成、讲义式页面呈现优化和可视化内容整理。项目展示了从课程资料到结构化学习系统的构建流程。
