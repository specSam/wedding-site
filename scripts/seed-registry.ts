import "./lib/env";
import { readFileSync } from "node:fs";
import path from "node:path";
import { putItems } from "./lib/seed-items";

interface RegistryInput {
  item_id: string;
  item_name: string;
  item_url: string;
  item_price: number;
  image_url: string;
}

const TABLE_NAME = process.env.REGISTRY_TABLE_NAME || "Registry";
const DATA_FILE = path.resolve(process.cwd(), "scripts/data/registry.json");

async function main() {
  const registryItems: RegistryInput[] = JSON.parse(
    readFileSync(DATA_FILE, "utf-8")
  );

  await putItems(TABLE_NAME, registryItems);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
