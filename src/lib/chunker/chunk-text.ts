export type ChunkInput = {
  content: string;
  sourceSection?: string;
  sourcePage?: number;
};

export type ChunkOutput = {
  chunkIndex: number;
  content: string;
  tokenCount: number;
  sourceSection?: string;
  sourcePage?: number;
  contentType?: string;
};

const MAX_CHARS = 1200;

function detectContentType(text: string): string {
  if (/公式|计算|delta|gamma|收益率|波动率|\d+\s*[+\-*/=]/i.test(text)) return "CALCULATION";
  if (/案例|情景|分析|策略/i.test(text)) return "CASE";
  if (/定义|概念|含义|是什么/i.test(text)) return "CONCEPT";
  return "GENERAL";
}

export function chunkText(inputs: ChunkInput[]): ChunkOutput[] {
  const chunks: ChunkOutput[] = [];
  let idx = 0;

  for (const input of inputs) {
    const parts = input.content
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

    let buffer = "";
    for (const part of parts) {
      if ((buffer + "\n\n" + part).length > MAX_CHARS && buffer) {
        chunks.push({
          chunkIndex: idx++,
          content: buffer,
          tokenCount: Math.ceil(buffer.length / 4),
          sourcePage: input.sourcePage,
          sourceSection: input.sourceSection,
          contentType: detectContentType(buffer),
        });
        buffer = part;
      } else {
        buffer = buffer ? `${buffer}\n\n${part}` : part;
      }
    }

    if (buffer) {
      chunks.push({
        chunkIndex: idx++,
        content: buffer,
        tokenCount: Math.ceil(buffer.length / 4),
        sourcePage: input.sourcePage,
        sourceSection: input.sourceSection,
        contentType: detectContentType(buffer),
      });
    }
  }

  return chunks;
}
