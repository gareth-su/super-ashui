import { NextResponse } from "next/server";
import { ingestFixedCourse } from "@/lib/ingestion/ingest-fixed-course";

export async function POST() {
  if (process.env.OWNER_INGEST_TOKEN) {
    return NextResponse.json({ error: "该接口仅供维护者脚本使用" }, { status: 403 });
  }

  const result = await ingestFixedCourse();
  return NextResponse.json(result);
}
