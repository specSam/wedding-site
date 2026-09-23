import "./lib/env";
import { readFileSync } from "node:fs";
import path from "node:path";
import { putItems } from "./lib/seed-items";

interface FaqInput {
  faq_id: string;
  question: string;
  answer: string;
  sort_order: number;
}

const TABLE_NAME = process.env.FAQ_TABLE_NAME || "Faq";
const DATA_FILE = path.resolve(process.cwd(), "scripts/data/faq.json");

async function main() {
  const faqItems: FaqInput[] = JSON.parse(readFileSync(DATA_FILE, "utf-8"));

  await putItems(TABLE_NAME, faqItems);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
