import "./lib/env";
import {
  CreateTableCommand,
  DescribeTableCommand,
  ResourceNotFoundException,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";
import { ddbClient } from "../src/lib/dynamodb";

interface TableDefinition {
  tableName: string;
  partitionKey: string;
}

const tables: TableDefinition[] = [
  {
    tableName: process.env.GUESTS_TABLE_NAME || "Guests",
    partitionKey: "guest_id",
  },
  {
    tableName: process.env.REGISTRY_TABLE_NAME || "Registry",
    partitionKey: "item_id",
  },
  {
    tableName: process.env.CONTENT_TABLE_NAME || "Content",
    partitionKey: "content_id",
  },
  {
    tableName: process.env.FAQ_TABLE_NAME || "Faq",
    partitionKey: "faq_id",
  },
];

async function tableExists(tableName: string): Promise<boolean> {
  try {
    await ddbClient.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error) {
    if (error instanceof ResourceNotFoundException) {
      return false;
    }
    throw error;
  }
}

async function createTable({ tableName, partitionKey }: TableDefinition) {
  if (await tableExists(tableName)) {
    console.log(`Table "${tableName}" already exists, skipping.`);
    return;
  }

  console.log(`Creating table "${tableName}"...`);
  await ddbClient.send(
    new CreateTableCommand({
      TableName: tableName,
      BillingMode: "PAY_PER_REQUEST",
      KeySchema: [{ AttributeName: partitionKey, KeyType: "HASH" }],
      AttributeDefinitions: [
        { AttributeName: partitionKey, AttributeType: "S" },
      ],
    })
  );

  await waitUntilTableExists(
    { client: ddbClient, maxWaitTime: 60 },
    { TableName: tableName }
  );
  console.log(`Table "${tableName}" is active.`);
}

async function main() {
  for (const table of tables) {
    await createTable(table);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
