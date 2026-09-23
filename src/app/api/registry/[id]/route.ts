import { NextRequest, NextResponse } from "next/server";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "@/lib/dynamodb";
import { requireAdmin } from "@/lib/adminAuth";

const TABLE_NAME = process.env.REGISTRY_TABLE_NAME || "Registry";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;

  await ddbDocClient.send(
    new DeleteCommand({ TableName: TABLE_NAME, Key: { item_id: id } })
  );

  return NextResponse.json({ ok: true });
}
