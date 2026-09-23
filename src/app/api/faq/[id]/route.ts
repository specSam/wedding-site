import { NextRequest, NextResponse } from "next/server";
import { DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "@/lib/dynamodb";
import { requireAdmin } from "@/lib/adminAuth";

const TABLE_NAME = process.env.FAQ_TABLE_NAME || "Faq";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;

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

  await ddbDocClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { faq_id: id },
      UpdateExpression: "SET question = :question, answer = :answer",
      ExpressionAttributeValues: {
        ":question": payload.question,
        ":answer": payload.answer,
      },
    })
  );

  return NextResponse.json({
    item: { faq_id: id, question: payload.question, answer: payload.answer },
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;

  await ddbDocClient.send(
    new DeleteCommand({ TableName: TABLE_NAME, Key: { faq_id: id } })
  );

  return NextResponse.json({ ok: true });
}
