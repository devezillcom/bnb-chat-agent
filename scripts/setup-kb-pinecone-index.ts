// Example:
//   npx tsx scripts/setup-kb-pinecone-index.ts --dry-run
//   npx tsx scripts/setup-kb-pinecone-index.ts --yes

import "dotenv/config";

import { Command } from "commander";
import { Pinecone } from "@pinecone-database/pinecone";
import { z } from "zod";

import {
  PINECONE_KB_DEFAULT_CLOUD,
  PINECONE_KB_DEFAULT_REGION,
  PINECONE_KB_EMBED_FIELD,
  PINECONE_KB_EMBED_MODEL,
} from "@/lib/pinecone/constants";

const SCRIPT_NAME = "setup-kb-pinecone-index";

const optionsSchema = z
  .object({
    indexName: z.string().trim().min(1),
    cloud: z.string().trim().min(1),
    region: z.string().trim().min(1),
    dryRun: z.boolean(),
    yes: z.boolean(),
  })
  .refine((value) => !(value.dryRun && value.yes), {
    message: "Choose one: --dry-run or --yes.",
  });

type Options = z.infer<typeof optionsSchema>;

function parseArgs(): Options {
  const program = new Command()
    .name(SCRIPT_NAME)
    .description(
      "Create the Pinecone integrated index for knowledge base embeddings.",
    )
    .option(
      "--index-name <name>",
      "Pinecone index name",
      process.env.PINECONE_INDEX_NAME ?? "bnb-kb-multilingual-e5",
    )
    .option("--cloud <cloud>", "Pinecone cloud", PINECONE_KB_DEFAULT_CLOUD)
    .option(
      "--region <region>",
      "Pinecone region (default: ap-southeast-1 / AWS Singapore)",
      process.env.PINECONE_REGION ?? PINECONE_KB_DEFAULT_REGION,
    )
    .option("--dry-run", "Preview the index configuration", false)
    .option("--yes", "Create the index", false);

  program.parse();
  return optionsSchema.parse(program.opts());
}

async function main() {
  const options = parseArgs();
  const mode = options.yes ? "apply" : "dry-run";
  const apiKey = process.env.PINECONE_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("PINECONE_API_KEY is required.");
  }

  const config = {
    name: options.indexName,
    cloud: options.cloud,
    region: options.region,
    embed: {
      model: PINECONE_KB_EMBED_MODEL,
      fieldMap: {
        text: PINECONE_KB_EMBED_FIELD,
      },
    },
  };

  console.log(`[${SCRIPT_NAME}] Starting`, { mode, config });

  const client = new Pinecone({ apiKey });
  const existing = await client.listIndexes();
  const alreadyExists = existing.indexes?.some(
    (index) => index.name === options.indexName,
  );

  if (alreadyExists) {
    console.log(`[${SCRIPT_NAME}] Index already exists`, {
      indexName: options.indexName,
    });
    return;
  }

  if (!options.yes) {
    console.log(`[${SCRIPT_NAME}] Dry run only. Re-run with --yes to create.`);
    return;
  }

  await client.createIndexForModel({
    name: config.name,
    cloud: config.cloud as "aws" | "gcp" | "azure",
    region: config.region,
    embed: config.embed,
    waitUntilReady: true,
  });

  console.log(`[${SCRIPT_NAME}] Index created`, {
    indexName: options.indexName,
    model: PINECONE_KB_EMBED_MODEL,
    field: PINECONE_KB_EMBED_FIELD,
  });
}

main().catch((error) => {
  console.error(`[${SCRIPT_NAME}] Failed`, { error });
  process.exit(1);
});
