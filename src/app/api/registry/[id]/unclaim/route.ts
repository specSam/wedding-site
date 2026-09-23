import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "@/lib/dynamodb";

const TABLE_NAME = process.env.REGISTRY_TABLE_NAME || "Registry";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guest_id")?.value;

  if (!guestId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await ddbDocClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { item_id: id },
        UpdateExpression: "SET claimed_by = :nullVal REMOVE claimed_at",
        ConditionExpression: "claimed_by = :guestId",
        ExpressionAttributeValues: {
          ":guestId": guestId,
          ":nullVal": null,
        },
      })
    );
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) {
      return NextResponse.json(
        { error: "Not claimed by you" },
        { status: 409 }
      );
    }
    throw error;
  }

  return NextResponse.json({ ok: true });
}
