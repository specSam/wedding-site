import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "@/lib/dynamodb";

const CONTENT_TABLE_NAME = process.env.CONTENT_TABLE_NAME || "AboutUs";
const GUESTS_TABLE_NAME = process.env.GUESTS_TABLE_NAME || "Guests";
const CONTENT_ID = "story";

export async function GET() {
  const result = await ddbDocClient.send(
    new GetCommand({
      TableName: CONTENT_TABLE_NAME,
      Key: { content_id: CONTENT_ID },
    })
  );

  const body = (result.Item?.body as string | undefined) ?? "";

  return NextResponse.json({ body });
}

export async function PUT(request: NextRequest) {
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guest_id")?.value;

  if (!guestId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guestResult = await ddbDocClient.send(
    new GetCommand({
      TableName: GUESTS_TABLE_NAME,
      Key: { guest_id: guestId },
    })
  );

  if (guestResult.Item?.is_admin !== true) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payload: { body?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof payload.body !== "string") {
    return NextResponse.json(
      { error: "body must be a string" },
      { status: 400 }
    );
  }

  await ddbDocClient.send(
    new UpdateCommand({
      TableName: CONTENT_TABLE_NAME,
      Key: { content_id: CONTENT_ID },
      UpdateExpression: "SET body = :body",
      ExpressionAttributeValues: { ":body": payload.body },
    })
  );

  return NextResponse.json({ body: payload.body });
}
