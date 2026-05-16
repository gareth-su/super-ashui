import { NextResponse } from "next/server";
import { getOrCreateDefaultSubject } from "@/lib/db/default-subject";

export async function GET() {
  try {
    const subject = await getOrCreateDefaultSubject();
    return NextResponse.json({ subject });
  } catch {
    return NextResponse.json({ subject: { id: "fixed-course", name: "衍生金融工具" } });
  }
}
