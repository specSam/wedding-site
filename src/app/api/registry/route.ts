import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "@/lib/dynamodb";
import { requireAdmin } from "@/lib/adminAuth";

const TABLE_NAME = process.env.REGISTRY_TABLE_NAME || "Registry";

interface RegistryRecord {
  item_id: string;
  item_name: string;
  item_url: string;
  item_price: number;
  image_url: string;
  claimed_by?: string | null;
  claimed_at?: string | null;
}

export async function GET() {
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guest_id")?.value;

  const result = await ddbDocClient.send(
    new ScanCommand({ TableName: TABLE_NAME })
  );

  const items = ((result.Items ?? []) as RegistryRecord[]).map((item) => ({
    ...item,
    isClaimedByViewer: !!guestId && item.claimed_by === guestId,
  }));

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  let payload: {
    item_name?: unknown;
    item_url?: unknown;
    item_price?: unknown;
    image_url?: unknown;
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (
    typeof payload.item_name !== "string" ||
    typeof payload.item_url !== "string" ||
    typeof payload.item_price !== "number" ||
    typeof payload.image_url !== "string"
  ) {
    return NextResponse.json(
      {
        error:
          "item_name, item_url, and image_url must be strings, and item_price a number",
      },
      { status: 400 }
    );
  }

  const item: RegistryRecord = {
    item_id: randomUUID(),
    item_name: payload.item_name,
    item_url: payload.item_url,
    item_price: payload.item_price,
    image_url: payload.image_url,
  };

  await ddbDocClient.send(
    new PutCommand({ TableName: TABLE_NAME, Item: item })
  );

  return NextResponse.json(
    { item: { ...item, isClaimedByViewer: false } },
    { status: 201 }
  );
}
