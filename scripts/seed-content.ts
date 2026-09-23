import "./lib/env";
import { readFileSync } from "node:fs";
import path from "node:path";
import { putItems } from "./lib/seed-items";

interface StoryInput {
  body: string;
}

const TABLE_NAME = process.env.CONTENT_TABLE_NAME || "Content";
const DATA_FILE = path.resolve(process.cwd(), "scripts/data/story.json");

async function main() {
  const story: StoryInput = JSON.parse(readFileSync(DATA_FILE, "utf-8"));

  await putItems(TABLE_NAME, [
    {
      content_id: "story",
      body: story.body,
    },
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
