import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "../../src/lib/dynamodb";

export async function putItems<T extends object>(
  tableName: string,
  items: T[]
) {
  for (const item of items) {
    await ddbDocClient.send(
      new PutCommand({
        TableName: tableName,
        Item: item as Record<string, unknown>,
      })
    );
    console.log(`  put ${JSON.stringify(item)}`);
  }
  console.log(`Seeded ${items.length} item(s) into "${tableName}".`);
}
