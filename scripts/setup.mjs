#!/usr/bin/env node
// D-ME setup: creates a D1 database, applies the migrations, stores the secrets
// and deploys the Worker to the Cloudflare account that wrangler is logged in to.
//
//   node scripts/setup.mjs                 plan only, nothing is changed
//   node scripts/setup.mjs --apply         create everything (run it in your own terminal)
//
// Options: --name <worker-name> --instagram-user-id <digits> --location <weur|eeur|apac|oc|wnam|enam>
//          --skip-tests --yes
//
// Secrets are typed into hidden prompts (or read from DME_IG_ACCESS_TOKEN and DME_IG_APP_SECRET).
// The generated verify and admin tokens are written to d-me-tokens.txt, never printed.

import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const localConfig = join(root, "wrangler.local.jsonc");
const manifestPath = join(root, ".d-me-install.json");
const tokensPath = join(root, "d-me-tokens.txt");
const isWindows = process.platform === "win32";

function parseArgs(argv) {
  const args = { apply: false, skipTests: false, yes: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--apply") args.apply = true;
    else if (arg === "--skip-tests") args.skipTests = true;
    else if (arg === "--yes") args.yes = true;
    else if (arg === "--name") args.name = argv[++i];
    else if (arg === "--instagram-user-id") args.instagramUserId = argv[++i];
    else if (arg === "--location") args.location = argv[++i];
    else if (arg === "--help" || arg === "-h") args.help = true;
    else throw new Error(`Unknown option: ${arg}`);
  }
  return args;
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((done) => rl.question(question, (answer) => { rl.close(); done(answer.trim()); }));
}

function askHidden(question) {
  return new Promise((done, fail) => {
    const stdin = process.stdin;
    if (!stdin.isTTY) {
      fail(new Error("A hidden prompt needs a real terminal. Run this command in your own terminal window."));
      return;
    }
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const finish = () => { stdin.setRawMode(false); stdin.pause(); stdin.off("data", onData); };
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") { finish(); process.stdout.write("\n"); done(value); return; }
        if (char === "\u0003") { finish(); process.exit(130); }
        if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
        else value += char;
      }
    };
    stdin.on("data", onData);
  });
}

function run(label, command, args, { quiet = false } = {}) {
  if (!quiet) console.log(`\n[${label}]`);
  return new Promise((done, fail) => {
    const child = spawn(command, args, { cwd: root, shell: isWindows, stdio: ["inherit", "pipe", "pipe"] });
    let output = "";
    const tee = (target) => (data) => { output += data; target.write(data); };
    child.stdout.on("data", tee(process.stdout));
    child.stderr.on("data", tee(process.stderr));
    child.on("error", fail);
    child.on("close", (code) => (code === 0 ? done(output) : fail(new Error(`${label} failed with exit code ${code}`))));
  });
}

const wrangler = (label, args) => run(label, isWindows ? "npx.cmd" : "npx", ["wrangler", ...args]);
const token = () => randomBytes(32).toString("base64url");

function writeLocalConfig({ workerName, databaseName, databaseId, instagramUserId }) {
  const config = JSON.parse(readFileSync(join(root, "wrangler.jsonc"), "utf8"));
  config.name = workerName;
  config.vars.IG_USER_ID = instagramUserId;
  config.d1_databases[0].database_name = databaseName;
  config.d1_databases[0].database_id = databaseId;
  writeFileSync(localConfig, `${JSON.stringify(config, null, 2)}\n`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log("Usage: node scripts/setup.mjs [--apply] [--name d-me] [--instagram-user-id 123] [--location weur] [--skip-tests] [--yes]");
    return;
  }
  if (existsSync(manifestPath)) {
    throw new Error("This folder already has a finished installation (.d-me-install.json). To update it, run: npm run deploy");
  }

  let workerName = args.name ?? "d-me";
  let instagramUserId = args.instagramUserId ?? "";
  const location = args.location ?? "weur";
  if (!instagramUserId && args.apply && process.stdin.isTTY) {
    instagramUserId = await ask("Instagram professional account ID (digits only): ");
  }
  if (!/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(workerName)) throw new Error("--name must be lowercase letters, digits and hyphens.");
  if (args.apply && !/^[0-9]+$/.test(instagramUserId)) throw new Error("--instagram-user-id must be the numeric Instagram account ID.");
  if (!["weur", "eeur", "apac", "oc", "wnam", "enam"].includes(location)) throw new Error("--location must be one of weur, eeur, apac, oc, wnam, enam.");
  const databaseName = `${workerName}-db`;

  console.log("D-ME installation plan");
  console.log(`Worker:            ${workerName}`);
  console.log(`D1 database:       ${databaseName} (${location})`);
  console.log(`Instagram user ID: ${instagramUserId || "(asked when --apply is used)"}`);
  console.log("\nWhen --apply is used:");
  console.log("1. Show the Cloudflare account that wrangler is logged in to, and ask you to confirm it");
  console.log("2. Run the tests and a dry deployment");
  console.log("3. Create the D1 database and apply the migrations");
  console.log("4. Ask for the Instagram access token and the Meta app secret (hidden input)");
  console.log("5. Generate the verify token and the admin password, saved to d-me-tokens.txt");
  console.log("6. Deploy the Worker, then check /health");
  if (!args.apply) {
    console.log("\nPlan only. Nothing was changed. Run the same command with --apply in your own terminal to install.");
    return;
  }

  await wrangler("Cloudflare account", ["whoami"]);
  if (!args.yes) {
    const answer = await ask("\nIs this the Cloudflare account you want to install into? Type yes to continue: ");
    if (answer.toLowerCase() !== "yes") { console.log("Stopped. Nothing was changed."); return; }
  }
  if (!args.skipTests) await run("Tests", isWindows ? "npm.cmd" : "npm", ["test"]);
  await wrangler("Dry deployment", ["deploy", "--dry-run"]);

  writeLocalConfig({ workerName, databaseName, databaseId: "PENDING", instagramUserId });
  await wrangler("Create D1", ["d1", "create", databaseName, "--location", location, "--config", localConfig]);
  const info = await run("Read D1 id", isWindows ? "npx.cmd" : "npx", ["wrangler", "d1", "info", databaseName, "--json", "--config", localConfig], { quiet: true });
  const idMatch = /"uuid"\s*:\s*"([0-9a-f-]{36})"/i.exec(info);
  if (!idMatch) throw new Error("The database was created but its id could not be read. Check the D1 page in the Cloudflare dashboard before retrying.");
  writeLocalConfig({ workerName, databaseName, databaseId: idMatch[1], instagramUserId });
  await wrangler("Apply migrations", ["d1", "migrations", "apply", databaseName, "--remote", "--config", localConfig]);

  console.log("\nEnter the Meta credentials. Input is hidden and is never saved to a file in this folder.");
  const accessToken = process.env.DME_IG_ACCESS_TOKEN || await askHidden("Instagram access token: ");
  const appSecret = process.env.DME_IG_APP_SECRET || await askHidden("Meta app secret: ");
  if (!accessToken || !appSecret) throw new Error("Both the Instagram access token and the Meta app secret are required.");
  const verifyToken = token();
  const adminToken = token();

  const secretsDir = mkdtempSync(join(tmpdir(), "d-me-"));
  const secretsFile = join(secretsDir, "secrets.json");
  let deployOutput;
  try {
    writeFileSync(secretsFile, JSON.stringify({
      IG_ACCESS_TOKEN: accessToken,
      IG_APP_SECRET: appSecret,
      IG_VERIFY_TOKEN: verifyToken,
      ADMIN_TOKEN: adminToken,
    }), { mode: 0o600 });
    deployOutput = await wrangler("Deploy", ["deploy", "--config", localConfig, "--secrets-file", secretsFile, "--message", "D-ME install"]);
  } finally {
    rmSync(secretsDir, { recursive: true, force: true });
  }

  const urlMatch = /https:\/\/[^\s]+\.workers\.dev/.exec(deployOutput);
  if (!urlMatch) throw new Error("Deployed, but the workers.dev address was not found in the output. Open the Worker in the Cloudflare dashboard to get it.");
  const workerUrl = urlMatch[0].replace(/\/$/, "");
  const health = await fetch(`${workerUrl}/health`).then((response) => response.json()).catch(() => null);
  if (!health || health.ok !== true) throw new Error(`The Worker is deployed at ${workerUrl} but /health did not answer ok. Wait a minute and open it again.`);

  writeFileSync(tokensPath, [
    "D-ME private tokens. Move them to a password manager, then delete this file.",
    `Admin password (the "management key" in the dashboard): ${adminToken}`,
    `Verify token (for the Meta webhook setup): ${verifyToken}`,
    "",
  ].join("\n"), { mode: 0o600 });
  writeFileSync(manifestPath, `${JSON.stringify({
    workerName, databaseName, databaseId: idMatch[1], instagramUserId,
    workerUrl, adminUrl: `${workerUrl}/admin`, callbackUrl: `${workerUrl}/webhook/instagram`,
    createdAt: new Date().toISOString(),
  }, null, 2)}\n`);

  console.log("\nInstalled and health-checked.");
  console.log(`Dashboard:    ${workerUrl}/admin`);
  console.log(`Webhook URL:  ${workerUrl}/webhook/instagram`);
  console.log(`\nThe admin password and the verify token are in ${tokensPath}`);
  console.log("Open that file yourself, copy both values to a password manager, then delete it. They are not printed here on purpose.");
}

main().catch((error) => {
  console.error(`\nStopped: ${error.message}`);
  process.exit(1);
});
