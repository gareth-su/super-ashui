export type PrefaceBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "numbered"; items: string[] };

export const landingPreface: PrefaceBlock[] = [
  {
    type: "paragraph",
    text: "项目最初计划仅用于个人学习和成果展示。目前版本是经过初步验收的成品，原则上具备一定可用性，但功能和内容呈现仍可能不够完善。如有幸被使用，请大家理性参考，也欢迎提出反馈。",
  },
  {
    type: "paragraph",
    text: "本项目的基本逻辑如下：我上传课程课件后，由 LLM 对资料进行整理和内容生成，生成结果离线储存在本地，再由前端网页读取并展示。",
  },
  {
    type: "paragraph",
    text: "因此，本项目网页具有以下优缺点：",
  },
  {
    type: "heading",
    text: "优势：",
  },
  {
    type: "numbered",
    items: [
      "课程资料均由 LLM 对课件进行读取、整理和输出。在内容生成过程中，我对模型设置了较严格的扩展限制，因此网页中可见的主要内容均来自原课件，尽量保留了原课件中的重要案例、例题和关键知识点；同时剔除了大量与主线学习关系不大的扩展资料、外部链接等内容，并对课件中属于同一模块的知识点进行了重新编排和合并。",
      "本项目本身服务于我的期末突击学习需求，网页内容也基于改需求经过多轮审核优化，因此较适合“对课程几乎不了解、需要从零开始梳理”的学习场景。",
    ],
  },
  {
    type: "heading",
    text: "缺陷：",
  },
  {
    type: "numbered",
    items: [
      "知识内容主要来自我的课程老师课件，因此不一定具有普遍适用性，也不保证适合所有同类课程学习。",
      "受制于当前内容生成模式，所有课程内容均为本地离线生成和储存，网页暂不支持自行上传材料并进行个性化解析。",
      "由于我本人基本没有上过课，无法在内容生成阶段给出非常有效的重点筛选指令，因此当前网页呈现的知识内容可能仍存在重点不够分明的问题，需要大家在使用时自行判断和取舍。",
    ],
  },
  {
    type: "paragraph",
    text: "目前，项目已包含三门课程的已有课件资料：",
  },
  {
    type: "bullets",
    items: ["衍生金融工具", "固定收益证券", "金融计量学"],
  },
  {
    type: "paragraph",
    text: "课件来源：",
  },
  {
    type: "bullets",
    items: ["衍生金融工具：贺方毅", "固定收益证券：李丽莎",  "金融计量学：覃依依"],
  },
  {
    type: "paragraph",
    text: "除课件资料补充外，后续该项目大概率不会继续进行更新。",
  },
  {
    type: "paragraph",
    text: "非常期待并欢迎大家在参考和使用本网页后提出反馈。点击网页左下方图标即可提交反馈，反馈内容会进行匿名处理。",
  },
  {
    type: "paragraph",
    text: "主要工具：Claude Code、ChatGPT、Codex、DeepSeek-V4-Pro、GPT-5.5、Claude Opus 4.7。",
  },
];
