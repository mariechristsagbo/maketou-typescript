import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OPENAPI_URL = "https://docs-api.maketou.com/openapi.yaml";
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const localSpecPath = resolve(repositoryRoot, "resources/openapi.yaml");

function assertPlausibleOpenApi(document) {
  const source = document.toString("utf8").replace(/^\uFEFF/, "");

  if (
    source.trim().length === 0 ||
    !/^openapi:\s*3(?:\.\d+){0,2}\s*$/m.test(source) ||
    !source.includes("\npaths:") ||
    !source.includes("/api/v1/stores/cart/checkout:")
  ) {
    throw new Error("Upstream response is not a plausible Maketou OpenAPI document.");
  }
}

async function fetchUpstreamSpec() {
  const response = await fetch(OPENAPI_URL, {
    headers: { Accept: "application/yaml, text/yaml, text/plain" },
  });

  if (!response.ok) {
    throw new Error(`Upstream OpenAPI request failed with HTTP ${response.status}.`);
  }

  const document = Buffer.from(await response.arrayBuffer());
  assertPlausibleOpenApi(document);
  return document;
}

async function sync() {
  const upstream = await fetchUpstreamSpec();
  const local = await readFile(localSpecPath).catch(() => undefined);

  if (local?.equals(upstream)) {
    console.log("Maketou OpenAPI specification is already current.");
    return;
  }

  await mkdir(dirname(localSpecPath), { recursive: true });
  await writeFile(localSpecPath, upstream);
  console.log("Maketou OpenAPI specification synchronized.");
}

async function check() {
  const [upstream, local] = await Promise.all([
    fetchUpstreamSpec(),
    readFile(localSpecPath).catch(() => undefined),
  ]);

  if (local?.equals(upstream)) {
    console.log("Maketou OpenAPI specification is current.");
    return;
  }

  console.error("Maketou OpenAPI drift detected.\n\nRun:\n  pnpm spec:sync\n\nThen inspect the diff before updating the SDK.");
  process.exitCode = 1;
}

const command = process.argv[2];

try {
  if (command === "sync") {
    await sync();
  } else if (command === "check") {
    await check();
  } else {
    throw new Error("Usage: node scripts/openapi.mjs <sync|check>");
  }
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`OpenAPI synchronization failed: ${message}`);
  process.exitCode = 2;
}
