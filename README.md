This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Database scripts

The `/scripts` folder contains one-off scripts for provisioning and seeding the DynamoDB tables used by this app. They use the AWS SDK v3 and read AWS credentials/config from environment variables only (never hardcoded) — make sure `.env.local` is filled in (copy `.env.local.example`) before running any of them.

Run them with [`tsx`](https://github.com/privatenumber/tsx), which executes the TypeScript files directly without a separate build step:

```bash
# Create the Guests, Registry, Content, and Faq tables (on-demand billing) if they don't already exist
npx tsx scripts/create-tables.ts

# Seed each table from the corresponding JSON file in scripts/data/
npx tsx scripts/seed-guests.ts
npx tsx scripts/seed-registry.ts
npx tsx scripts/seed-content.ts
npx tsx scripts/seed-faq.ts
```

Edit the JSON files in `scripts/data/` with your real data before seeding:

- `guests.json` — array of `{ guest_id, name, email, allowed_guests, is_admin? }`. Seeded guests get `rsvp_status: "pending"` and `rsvp_guest_count: 0`; `is_admin` defaults to `false`.
- `registry.json` — array of `{ item_id, item_name, item_url, item_price, image_url }`.
- `story.json` — single object `{ body }`, written to the Content table as the row with `content_id: "story"`.
- `faq.json` — array of `{ faq_id, question, answer, sort_order }`.

## Deploying on AWS Amplify Hosting

This repo includes an [`amplify.yml`](./amplify.yml) build spec so Amplify Hosting can build and deploy the app's SSR output, including the API routes under `/api`. Amplify auto-detects the Next.js SSR build from the `.next` artifact and provisions the server-side compute for you — no extra config beyond `amplify.yml` is needed for that part.

The following still has to be done by hand in the AWS console; none of it is automated by this repo.

### 1. Create least-privilege DynamoDB access for the app

The app's API routes only ever call `GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`, and `Scan` against the four tables from [`scripts/create-tables.ts`](./scripts/create-tables.ts) (`Guests`, `Registry`, `Content`, `Faq` — or whatever you named them). Scope the policy to exactly that:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "WeddingSiteDynamoDbAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:<REGION>:<ACCOUNT_ID>:table/Guests",
        "arn:aws:dynamodb:<REGION>:<ACCOUNT_ID>:table/Registry",
        "arn:aws:dynamodb:<REGION>:<ACCOUNT_ID>:table/Content",
        "arn:aws:dynamodb:<REGION>:<ACCOUNT_ID>:table/Faq"
      ]
    }
  ]
}
```

Preferred approach — an IAM **role**, no long-lived keys:

1. In the Amplify console, go to your app → **App settings → General → Edit**, find the **Compute role** picker, and choose "create a new service role" from there rather than hand-writing the trust policy — Amplify generates the correct trust relationship for its own SSR compute automatically.
2. Once the role exists, attach an inline policy to it using the JSON above (fill in your region, account ID, and actual table names), replacing whatever broad default policy it may have started with.
3. Save it as the app's Compute role. The SDK in `src/lib/dynamodb.ts` uses the default credential provider chain, so once this is set, API routes get temporary credentials automatically — no `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` needed.

Fallback — an IAM **user** with an access key (only if your Amplify setup can't use a compute role):

1. IAM console → Users → Create user (programmatic access only, no console password).
2. Attach the same inline policy as above directly to the user (or to a group).
3. Generate an access key and set it as `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` in Amplify's environment variables (see below), marked as **secret** values. Rotate it periodically since, unlike the role approach, it doesn't expire on its own.

Either way, do **not** attach broader managed policies like `AmazonDynamoDBFullAccess` — the app only ever touches these four tables with the five actions listed above.

### 2. Set environment variables in Amplify

App settings → **Environment variables**, add:

| Variable | Value |
|---|---|
| `AWS_REGION` | The region your DynamoDB tables live in |
| `GUESTS_TABLE_NAME` | e.g. `Guests` |
| `REGISTRY_TABLE_NAME` | e.g. `Registry` |
| `CONTENT_TABLE_NAME` | e.g. `Content` |
| `FAQ_TABLE_NAME` | e.g. `Faq` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Only if you went with the IAM user fallback above — omit these if you attached a compute role |

`S3_BUCKET_NAME` (in `.env.local.example`) and `PRODUCTION_DOMAIN` (used only by `scripts/generate-qr-codes.ts`) aren't read by the deployed app itself, so they don't need to be set in Amplify — the latter is only ever run locally/CI to generate guest QR codes.

Mark any credential-like values as secret so they're masked in build logs, and set them for whichever branch(es) you deploy.

### 3. Connect the GitHub repo

1. Amplify console → **New app → Host web app** → choose GitHub → authorize AWS Amplify to access your GitHub account (or organization) if you haven't already.
2. Select this repository and the branch to deploy (e.g. `main`).
3. Amplify should auto-detect the `amplify.yml` in the repo root — confirm the build settings match it rather than overwriting them with the console's generic Next.js defaults.
4. Add the environment variables from step 2 in the same setup flow (or afterwards under App settings → Environment variables).
5. Save and deploy. Subsequent pushes to the connected branch will trigger a new build/deploy automatically.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
