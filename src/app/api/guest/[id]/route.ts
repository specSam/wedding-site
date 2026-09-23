import { NextRequest, NextResponse } from "next/server";
import { GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "@/lib/dynamodb";

const TABLE_NAME = process.env.GUESTS_TABLE_NAME || "Guests";

interface GuestRecord {
  guest_id: string;
  name: string;
  allowed_guests: number;
  is_admin?: boolean;
}

async function findByExactId(id: string): Promise<GuestRecord | null> {
  const result = await ddbDocClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { guest_id: id } })
  );
  return (result.Item as GuestRecord | undefined) ?? null;
}

async function findByName(query: string): Promise<GuestRecord | null> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return null;

  const result = await ddbDocClient.send(
    new ScanCommand({ TableName: TABLE_NAME })
  );
  const guests = (result.Items ?? []) as GuestRecord[];

  const exact = guests.find((g) => g.name?.toLowerCase() === normalized);
  if (exact) return exact;

  const startsWith = guests.find((g) =>
    g.name?.toLowerCase().startsWith(normalized)
  );
  if (startsWith) return startsWith;

  const contains = guests.find((g) => g.name?.toLowerCase().includes(normalized));
  return contains ?? null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const guest = (await findByExactId(id)) ?? (await findByName(id));

  if (!guest) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  }

  return NextResponse.json({
    guest_id: guest.guest_id,
    name: guest.name,
    allowed_guests: guest.allowed_guests,
  });
}
