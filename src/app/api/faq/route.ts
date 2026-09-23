import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "@/lib/dynamodb";
import { requireAdmin } from "@/lib/adminAuth";

const TABLE_NAME = process.env.FAQ_TABLE_NAME || "Faq";

interface FaqRecord {
  faq_id: string;
  question: string;
  answer: string;
  sort_order: number;
}

export async function GET() {
  let result;
  try {
    result = await ddbDocClient.send(
      new ScanCommand({ TableName: TABLE_NAME })
    );
  } catch (error) {
    console.error("Failed to scan Faq table", error);
    return NextResponse.json({ error: "Failed to load FAQ" }, { status: 500 });
  }

  const items = ((result.Items ?? []) as FaqRecord[]).sort(
    (a, b) => a.sort_order - b.sort_order
  );

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  let payload: { question?: unknown; answer?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof payload.question !== "string" || typeof payload.answer !== "string") {
    return NextResponse.json(
      { error: "question and answer must be strings" },
      { status: 400 }
    );
  }

  const existingResult = await ddbDocClient.send(
    new ScanCommand({ TableName: TABLE_NAME })
  );
  const existing = (existingResult.Items ?? []) as FaqRecord[];
  const nextSortOrder =
    existing.reduce((max, item) => Math.max(max, item.sort_order ?? 0), 0) + 1;

  const item: FaqRecord = {
    faq_id: randomUUID(),
    question: payload.question,
    answer: payload.answer,
    sort_order: nextSortOrder,
  };

  await ddbDocClient.send(
    new PutCommand({ TableName: TABLE_NAME, Item: item })
  );

  return NextResponse.json({ item }, { status: 201 });
}
