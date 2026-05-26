# 离线内容生产与导入流程

## 为什么当前采用离线内容生产方案

当前项目不是面向大量用户的 SaaS，课程、老师和资料基本固定。知识框架生成属于一次性或低频工作，因此主路径改为在开发阶段用 Codex / GPT Pro 离线完成资料解析、知识框架整理和结构化 JSON 生成，再导入 Prisma / SQLite。

网站运行时主要负责读取数据库中的 `KnowledgeArtifact` 并展示给学生，不要求后台必须稳定接入在线 AI API。

在线 AI API 生成接口仍然保留，后续如果能稳定接入 DeepSeek、OpenAI-compatible 国内模型、OpenAI、Claude 或其他模型，可以恢复作为后台可选能力。

## 原始资料放在哪里

原始 PDF、PPT、Word、图片或老师发放的材料放在：

```text
source-materials/derivatives/
```

`source-materials/` 已加入 `.gitignore`。不要把真实课件、PDF、PPT、Word 提交到 GitHub。

## Codex 生成的 JSON 放在哪里

Codex / GPT Pro 离线整理后的结构化 JSON 放在：

```text
data/generated/ysjrgj/
```

当前约定文件：

```text
materials.json
chunks.json
framework-concise.json
framework-detailed.json
import-summary.md
```

其中：

- `materials.json`：资料元数据
- `chunks.json`：资料切片内容
- `framework-concise.json`：提纲版知识框架
- `framework-detailed.json`：讲义版知识框架
- `import-summary.md`：资料来源、整理过程和人工校对记录

## 知识框架 JSON 结构

离线生成和在线生成共用 [framework-schema.ts](../src/lib/ai/framework-schema.ts) 校验，结构需兼容学生端 `/framework`：

```json
{
  "title": "课程知识框架标题",
  "courseSummary": "课程整体概述",
  "chapters": [
    {
      "chapterTitle": "章节标题",
      "sourceFile": "资料名称",
      "summary": "章节概述",
      "keyConcepts": ["关键概念"],
      "nodes": [
        {
          "name": "知识点名称",
          "summary": "知识点解释",
          "children": []
        }
      ]
    }
  ],
  "overallFramework": {
    "mainThread": "课程知识主线",
    "learningPath": ["建议复习顺序"],
    "crossChapterRelations": [
      { "from": "章节或概念A", "to": "章节或概念B", "relation": "关系说明" }
    ],
    "coreConceptMap": [
      { "concept": "核心概念", "appearsIn": ["出现章节"], "importance": "为什么重要" }
    ]
  }
}
```

## 如何校验 JSON

默认校验根目录：

```bash
npm run validate:content
```

该命令会校验：

- `materials.json`
- `chunks.json`
- `framework-concise.json`
- `framework-detailed.json`

可以通过 `CONTENT_VARIANT` 指定校验目录：

```powershell
$env:CONTENT_VARIANT="full"
npm run validate:content

$env:CONTENT_VARIANT="sample"
npm run validate:content

Remove-Item Env:CONTENT_VARIANT
npm run validate:content
```

对应目录：

- 未设置：`data/generated/ysjrgj/`
- `CONTENT_VARIANT=sample`：`data/generated/ysjrgj/sample/`
- `CONTENT_VARIANT=full`：`data/generated/ysjrgj/full/`

校验失败时会输出具体错误。该脚本不连接 AI，不调用任何模型。

## 如何导入数据库

运行：

```bash
npm run import:content
```

默认导入课程名为：

```text
衍生金融工具
```

如果需要指定课程名：

```bash
CONTENT_SUBJECT_NAME="公司金融" npm run import:content
```

导入会写入：

- `Subject`
- `Material`
- `MaterialChunk`
- `KnowledgeArtifact`

其中 `KnowledgeArtifact` 使用：

```text
type = C1_FRAMEWORK
detailLevel = CONCISE / DETAILED
version = 自动递增
contentJson = 已校验 JSON
```

导入脚本不写题库，不调用 `generateQuestions`，不修改 `fixed-course-framework.ts`。

## 如何在 /framework 查看导入结果

1. 先运行：

```bash
npm run validate:content
npm run import:content
npm run dev
```

2. 打开：

```text
/framework
```

3. 选择对应课程和提纲/讲义版本。

学生端 `/framework` 只读取数据库里已有的 `KnowledgeArtifact`；读取失败时仍回退到 `fixed-course-framework.ts`。

## 在线 AI API 接口保留情况

在线生成仍保留在：

- [provider.ts](../src/lib/ai/provider.ts)
- [generate-framework.ts](../src/lib/ai/generate-framework.ts)
- [framework-schema.ts](../src/lib/ai/framework-schema.ts)
- [artifacts/generate/route.ts](../src/app/api/subjects/[subjectId]/artifacts/generate/route.ts)

后台按钮是可选能力。未配置 AI API 时，页面提示“未配置 AI API，可使用离线导入流程”，不会影响后台其他功能。

未来恢复在线 AI 生成时，配置：

```env
AI_PROVIDER=openai-compatible
AI_API_KEY=你的 API Key
AI_API_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
NEXT_PUBLIC_AI_API_CONFIGURED=true
```

然后在后台课程详情页点击“生成知识框架”。
