import "./lib/env";
import { readFileSync } from "node:fs";
import path from "node:path";
import { putItems } from "./lib/seed-items";

interface GuestInput {
  guest_id: string;
  name: string;
  email: string;
  allowed_guests: number;
  is_admin?: boolean;
}

const TABLE_NAME = process.env.GUESTS_TABLE_NAME || "Guests";
const DATA_FILE = path.resolve(process.cwd(), "scripts/data/guests.json");

async function main() {
  const guests: GuestInput[] = JSON.parse(readFileSync(DATA_FILE, "utf-8"));

  const items = guests.map((guest) => ({
    guest_id: guest.guest_id,
    name: guest.name,
    email: guest.email,
    allowed_guests: guest.allowed_guests,
    is_admin: guest.is_admin ?? false,
    rsvp_status: "pending",
    rsvp_guest_count: 0,
  }));

  await putItems(TABLE_NAME, items);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
