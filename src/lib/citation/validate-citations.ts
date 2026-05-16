import { z } from "zod";

export const citationSchema = z.array(
  z.object({
    materialId: z.string(),
    page: z.number().int().nullable().optional(),
    chunkId: z.string(),
    quote: z.string().min(1),
  }),
);

export function hasValidCitations(raw: string): boolean {
  try {
    const parsed = JSON.parse(raw);
    const result = citationSchema.safeParse(parsed);
    return result.success && parsed.length > 0;
  } catch {
    return false;
  }
}
