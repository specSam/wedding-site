import "./lib/env";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import QRCode from "qrcode";

interface GuestInput {
  guest_id: string;
  name: string;
}

const DATA_FILE = path.resolve(process.cwd(), "scripts/data/guests.json");
const OUTPUT_DIR = path.resolve(process.cwd(), "qr-codes");

async function main() {
  const domain = process.env.PRODUCTION_DOMAIN;
  if (!domain) {
    throw new Error("PRODUCTION_DOMAIN is not set (see .env.local.example)");
  }

  const guests: GuestInput[] = JSON.parse(readFileSync(DATA_FILE, "utf-8"));

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const rows: { guest_name: string; filename: string }[] = [];

  for (const guest of guests) {
    const url = `https://${domain}/?guest=${encodeURIComponent(guest.guest_id)}`;
    const filename = `${guest.guest_id}.png`;

    await QRCode.toFile(path.join(OUTPUT_DIR, filename), url);

    rows.push({ guest_name: guest.name, filename });
  }

  console.log(`Generated ${rows.length} QR code(s) in "${OUTPUT_DIR}".`);
  console.table(rows);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
