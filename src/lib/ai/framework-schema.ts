import { z } from "zod";

export type FrameworkNode = {
  name: string;
  summary: string;
  children: FrameworkNode[];
};

export const FrameworkNodeSchema: z.ZodType<FrameworkNode> = z.lazy(() =>
  z.object({
    name: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    children: z.array(FrameworkNodeSchema).default([]),
  }),
);

/* ------------------------------------------------------------------ */
/*  Visual Block schemas                                               */
/* ------------------------------------------------------------------ */

const VisualBlockSourceSchema = z.object({
  sourceFile: z.string().trim().optional(),
  sourcePage: z.union([z.string(), z.number()]).optional(),
  sourceChunkIds: z.array(z.string().trim().min(1)).optional(),
});

const ProcessFlowBlockSchema = z.object({
  type: z.literal("process_flow"),
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  steps: z
    .array(
      z.object({
        label: z.string().trim().min(1),
        description: z.string().trim().optional(),
      }),
    )
    .min(1),
  source: VisualBlockSourceSchema.optional(),
});

const ComparisonTableBlockSchema = z.object({
  type: z.literal("comparison_table"),
  title: z.string().trim().min(1),
  headers: z.array(z.string().trim().min(1)).min(2),
  rows: z.array(z.array(z.string())).min(1),
  source: VisualBlockSourceSchema.optional(),
});

const FormulaCardBlockSchema = z.object({
  type: z.literal("formula_card"),
  title: z.string().trim().min(1),
  formula: z.string().trim().min(1),
  formulaLatex: z.string().trim().min(1).optional(),
  variables: z
    .array(
      z.object({
        symbol: z.string().trim().min(1),
        meaning: z.string().trim().min(1),
      }),
    )
    .optional(),
  usage: z.string().trim().optional(),
  pitfalls: z.array(z.string().trim().min(1)).optional(),
  source: VisualBlockSourceSchema.optional(),
});

const ConceptMapBlockSchema = z.object({
  type: z.literal("concept_map"),
  title: z.string().trim().min(1),
  concepts: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        description: z.string().trim().optional(),
      }),
    )
    .min(1),
  relations: z
    .array(
      z.object({
        from: z.string().trim().min(1),
        to: z.string().trim().min(1),
        relation: z.string().trim().min(1),
      }),
    )
    .optional(),
  source: VisualBlockSourceSchema.optional(),
});

const ImageBlockSchema = z.object({
  type: z.literal("image"),
  title: z.string().trim().min(1),
  src: z.string().trim().min(1),
  caption: z.string().trim().optional(),
  source: VisualBlockSourceSchema.optional(),
});

/* ---- new block types (v2) ---- */

const CaseCardBlockSchema = z.object({
  type: z.literal("case_card"),
  title: z.string().trim().min(1),
  background: z.string().trim().optional(),
  scenario: z.string().trim().optional(),
  analysis: z.string().trim().optional(),
  lesson: z.string().trim().optional(),
  relatedConcepts: z.array(z.string().trim().min(1)).optional(),
});

const DataTableBlockSchema = z.object({
  type: z.literal("data_table"),
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  headers: z.array(z.string().trim().min(1)).min(1),
  rows: z.array(z.array(z.string())).min(1),
  note: z.string().trim().optional(),
});

const ExampleBoxBlockSchema = z.object({
  type: z.literal("example_box"),
  title: z.string().trim().min(1),
  scenario: z.string().trim().optional(),
  steps: z.array(z.string().trim().min(1)).min(1),
  result: z.string().trim().optional(),
  takeaway: z.string().trim().optional(),
});

const ChartExplanationBlockSchema = z.object({
  type: z.literal("chart_explanation"),
  title: z.string().trim().min(1),
  chartType: z
    .enum(["payoff", "curve", "timeline", "relationship", "other"])
    .optional(),
  xAxis: z.string().trim().optional(),
  yAxis: z.string().trim().optional(),
  elements: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        meaning: z.string().trim().min(1),
      }),
    )
    .optional(),
  keyTakeaways: z.array(z.string().trim().min(1)).min(1),
  examTips: z.array(z.string().trim().min(1)).optional(),
});

/* ---- chart block types (v3) ---- */

const ChartPointSchema = z.object({
  x: z.union([z.number(), z.string()]),
  y: z.number(),
});

const PayoffChartBlockSchema = z.object({
  type: z.literal("payoff_chart"),
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  xAxis: z.string().trim().min(1),
  yAxis: z.string().trim().min(1),
  curves: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        points: z.array(ChartPointSchema).min(2),
      }),
    )
    .min(1),
  breakEvenPoints: z.array(z.string().trim().min(1)).optional(),
  annotations: z
    .array(
      z.object({
        x: z.union([z.number(), z.string()]),
        label: z.string().trim().min(1),
      }),
    )
    .optional(),
  regions: z
    .array(
      z.object({
        fromX: z.number(),
        toX: z.number(),
        label: z.string().trim().min(1),
        kind: z
          .enum(["profit", "loss", "breakeven", "other"])
          .optional(),
      }),
    )
    .optional(),
  metrics: z
    .array(
      z.object({
        label: z.string().trim().min(1),
        value: z.string().trim().min(1),
      }),
    )
    .optional(),
  legs: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        position: z.string().trim().min(1),
        strike: z.string().trim().optional(),
      }),
    )
    .optional(),
  keyTakeaways: z.array(z.string().trim().min(1)).min(1),
});

const LineChartBlockSchema = z.object({
  type: z.literal("line_chart"),
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  xAxis: z.string().trim().min(1),
  yAxis: z.string().trim().min(1),
  series: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        points: z.array(ChartPointSchema).min(2),
      }),
    )
    .min(1),
  referenceLines: z
    .array(
      z.object({
        value: z.number(),
        label: z.string().trim().min(1),
      }),
    )
    .optional(),
  keyTakeaways: z.array(z.string().trim().min(1)).min(1),
});

const CurveChartBlockSchema = z.object({
  type: z.literal("curve_chart"),
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  xAxis: z.string().trim().min(1),
  yAxis: z.string().trim().min(1),
  curves: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        shape: z.string().trim().optional(),
        points: z.array(ChartPointSchema).min(2),
      }),
    )
    .min(1),
  keyTakeaways: z.array(z.string().trim().min(1)).min(1),
});

/* ---- new block types (v4) ---- */

const CashflowDiagramBlockSchema = z.object({
  type: z.literal("cashflow_diagram"),
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  nodes: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        label: z.string().trim().min(1),
        role: z.string().trim().optional(),
      }),
    )
    .min(2),
  edges: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        from: z.string().trim().min(1),
        to: z.string().trim().min(1),
        label: z.string().trim().min(1),
        cashflowType: z
          .enum([
            "fixed",
            "floating",
            "principal",
            "interest",
            "net",
            "collateral",
            "risk_transfer",
            "other",
          ])
          .optional(),
        timing: z.string().trim().optional(),
      }),
    )
    .min(1),
  phases: z
    .array(
      z.object({
        title: z.string().trim().min(1),
        edgeIds: z.array(z.string().trim().min(1)).min(1),
      }),
    )
    .optional(),
  outcome: z.string().trim().optional(),
  keyTakeaways: z.array(z.string().trim().min(1)).min(1),
});

const DecisionTreeBlockSchema = z.object({
  type: z.literal("decision_tree"),
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  root: z.object({
    id: z.string().trim().min(1),
    question: z.string().trim().min(1),
    branches: z
      .array(
        z.object({
          condition: z.string().trim().min(1),
          target: z.string().trim().min(1),
        }),
      )
      .min(1),
  }),
  nodes: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        label: z.string().trim().min(1),
        content: z.string().trim().optional(),
      }),
    )
    .min(1),
  keyTakeaways: z.array(z.string().trim().min(1)).min(1),
});

const TimelineBlockSchema = z.object({
  type: z.literal("timeline"),
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  events: z
    .array(
      z.object({
        time: z.string().trim().min(1),
        title: z.string().trim().min(1),
        description: z.string().trim().optional(),
      }),
    )
    .min(2),
  keyTakeaways: z.array(z.string().trim().min(1)).min(1),
});

/* ---- econometrics / Stata block types ---- */

const StataCodeBlockSchema = z.object({
  type: z.literal("stata_code_block"),
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  code: z.string().min(1),
  language: z.literal("stata").optional(),
  sourceFile: z.string().trim().optional(),
  commands: z.array(z.string().trim().min(1)).optional(),
  notes: z.array(z.string().trim().min(1)).optional(),
});

const StataOutputBlockSchema = z.object({
  type: z.literal("stata_output_block"),
  title: z.string().trim().min(1),
  command: z.string().trim().optional(),
  output: z.string().min(1),
  highlights: z
    .array(
      z.object({
        label: z.string().trim().min(1),
        value: z.string().trim().min(1),
        meaning: z.string().trim().optional(),
      }),
    )
    .optional(),
  annotations: z
    .array(
      z.object({
        field: z.string().trim().min(1),
        meaning: z.string().trim().min(1),
        howToRead: z.string().trim().min(1),
        examUse: z.string().trim().optional(),
      }),
    )
    .optional(),
  warnings: z.array(z.string().trim().min(1)).optional(),
  sourceFile: z.string().trim().optional(),
});

const StataInterfaceGuideBlockSchema = z.object({
  type: z.literal("stata_interface_guide"),
  title: z.string().trim().min(1),
  imageSrc: z.string().trim().min(1).optional(),
  areas: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        location: z.string().trim().optional(),
        purpose: z.string().trim().min(1),
        studentAction: z.string().trim().min(1),
        commonMistake: z.string().trim().optional(),
      }),
    )
    .min(1),
});

const TableMappingBlockSchema = z.object({
  type: z.literal("table_mapping_block"),
  title: z.string().trim().min(1),
  targetTable: z.string().trim().min(1),
  mappings: z
    .array(
      z.object({
        tableColumn: z.string().trim().min(1),
        model: z.string().trim().optional(),
        command: z.string().trim().min(1),
        logSource: z.string().trim().optional(),
        coefficientPath: z.string().trim().optional(),
        stdErrPath: z.string().trim().optional(),
        pValuePath: z.string().trim().optional(),
        examInterpretation: z.string().trim().min(1),
        caution: z.string().trim().optional(),
      }),
    )
    .min(1),
});

const CalloutTeacherNoteBlockSchema = z.object({
  type: z.literal("callout_teacher_note"),
  title: z.string().trim().min(1),
  tone: z.enum(["concept", "exam", "warning", "intuition"]).optional(),
  body: z.string().trim().min(1),
  example: z.string().trim().optional(),
});

const RegressionTableBlockSchema = z.object({
  type: z.literal("regression_table"),
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  dependentVariable: z.string().trim().optional(),
  models: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        estimator: z.string().trim().optional(),
        fixedEffects: z.array(z.string().trim().min(1)).optional(),
        clusteredBy: z.string().trim().optional(),
        n: z.union([z.string(), z.number()]).optional(),
        r2: z.string().trim().optional(),
        rows: z
          .array(
            z.object({
              variable: z.string().trim().min(1),
              coef: z.string().trim().optional(),
              stdErr: z.string().trim().optional(),
              t: z.string().trim().optional(),
              p: z.string().trim().optional(),
              note: z.string().trim().optional(),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
  notes: z.array(z.string().trim().min(1)).optional(),
  sourceFile: z.string().trim().optional(),
});

const DatasetSchemaBlockSchema = z.object({
  type: z.literal("dataset_schema"),
  title: z.string().trim().min(1),
  datasetName: z.string().trim().min(1),
  description: z.string().trim().optional(),
  observations: z.union([z.string(), z.number()]).optional(),
  variablesCount: z.union([z.string(), z.number()]).optional(),
  panelId: z.string().trim().optional(),
  timeId: z.string().trim().optional(),
  isBalancedPanel: z.boolean().optional(),
  variables: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        label: z.string().trim().optional(),
        type: z.string().trim().optional(),
        role: z.string().trim().optional(),
        generatedFrom: z.string().trim().optional(),
      }),
    )
    .min(1),
  notes: z.array(z.string().trim().min(1)).optional(),
});

const ReproductionStepsBlockSchema = z.object({
  type: z.literal("reproduction_steps"),
  title: z.string().trim().min(1),
  goal: z.string().trim().min(1),
  steps: z
    .array(
      z.object({
        label: z.string().trim().min(1),
        command: z.string().trim().optional(),
        expectedOutput: z.string().trim().optional(),
        check: z.string().trim().optional(),
        explanation: z.string().trim().optional(),
      }),
    )
    .min(1),
  finalCheck: z.string().trim().optional(),
  sourceFiles: z.array(z.string().trim().min(1)).optional(),
});

const ExamTaskBlockSchema = z.object({
  type: z.literal("exam_task"),
  title: z.string().trim().min(1),
  prompt: z.string().trim().min(1),
  requirements: z.array(z.string().trim().min(1)).optional(),
  answerPath: z.array(z.string().trim().min(1)).optional(),
  scoringPoints: z.array(z.string().trim().min(1)).optional(),
  commonMistakes: z.array(z.string().trim().min(1)).optional(),
});

const InterpretationChecklistBlockSchema = z.object({
  type: z.literal("interpretation_checklist"),
  title: z.string().trim().min(1),
  items: z
    .array(
      z.object({
        label: z.string().trim().min(1),
        question: z.string().trim().optional(),
        expected: z.string().trim().optional(),
        warning: z.string().trim().optional(),
      }),
    )
    .min(1),
});

const CommonStataErrorBlockSchema = z.object({
  type: z.literal("common_stata_error"),
  title: z.string().trim().min(1),
  message: z.string().trim().min(1),
  cause: z.string().trim().optional(),
  fix: z.string().trim().optional(),
  example: z.string().trim().optional(),
});

export const VisualBlockSchema = z.discriminatedUnion("type", [
  ProcessFlowBlockSchema,
  ComparisonTableBlockSchema,
  FormulaCardBlockSchema,
  ConceptMapBlockSchema,
  ImageBlockSchema,
  CaseCardBlockSchema,
  DataTableBlockSchema,
  ExampleBoxBlockSchema,
  ChartExplanationBlockSchema,
  PayoffChartBlockSchema,
  LineChartBlockSchema,
  CurveChartBlockSchema,
  CashflowDiagramBlockSchema,
  DecisionTreeBlockSchema,
  TimelineBlockSchema,
  StataCodeBlockSchema,
  StataOutputBlockSchema,
  StataInterfaceGuideBlockSchema,
  TableMappingBlockSchema,
  CalloutTeacherNoteBlockSchema,
  RegressionTableBlockSchema,
  DatasetSchemaBlockSchema,
  ReproductionStepsBlockSchema,
  ExamTaskBlockSchema,
  InterpretationChecklistBlockSchema,
  CommonStataErrorBlockSchema,
]);

export type VisualBlock = z.infer<typeof VisualBlockSchema>;

/* ------------------------------------------------------------------ */
/*  Framework schema                                                   */
/* ------------------------------------------------------------------ */

export const FrameworkSchema = z.object({
  title: z.string().trim().min(1),
  courseSummary: z.string().trim().min(1),
  chapters: z
    .array(
      z.object({
        chapterTitle: z.string().trim().min(1),
        sourceFile: z.string().trim().optional(),
        summary: z.string().trim().min(1),
        keyConcepts: z.array(z.string().trim().min(1)).default([]),
        nodes: z.array(FrameworkNodeSchema).default([]),
        visualBlocks: z.array(VisualBlockSchema).optional(),
      }),
    )
    .min(1),
  overallFramework: z.object({
    mainThread: z.string().trim().min(1),
    learningPath: z.array(z.string().trim().min(1)).default([]),
    crossChapterRelations: z
      .array(
        z.object({
          from: z.string().trim().min(1),
          to: z.string().trim().min(1),
          relation: z.string().trim().min(1),
        }),
      )
      .default([]),
    coreConceptMap: z
      .array(
        z.object({
          concept: z.string().trim().min(1),
          appearsIn: z.array(z.string().trim().min(1)).default([]),
          importance: z.string().trim().min(1),
        }),
      )
      .default([]),
  }),
});

export type FrameworkData = z.infer<typeof FrameworkSchema>;

function stripMarkdownFence(raw: string) {
  const trimmed = raw.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match?.[1]?.trim() ?? trimmed;
}

export function parseFrameworkJson(raw: string): FrameworkData {
  const parsed = JSON.parse(stripMarkdownFence(raw)) as unknown;
  return FrameworkSchema.parse(parsed);
}
