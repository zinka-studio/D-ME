#!/usr/bin/env node
// D-ME setup: checks your Zernio key, then deploys the dashboard Worker to the Cloudflare account
// that wrangler is logged in to. Zernio holds the Instagram connection and runs the automations.
//
//   node scripts/setup.mjs            plan only, nothing is changed
//   node scripts/setup.mjs --apply    install (run it in your own terminal)
//
// Options: --name <worker-name> --skip-tests --yes
//
// The Zernio key is typed into a hidden prompt (or read from DME_ZERNIO_API_KEY).
// The generated admin password is written to d-me-tokens.txt, never printed.

import { spawn } from "node:child_process";
import { mkdtempSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

function run(label, command, args) {
  console.log(`\n[${label}]`);
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

/** Ask Zernio whether the key works and which Instagram accounts are connected. */
export async function checkZernioKey(apiKey, fetchImpl = fetch) {
  const response = await fetchImpl("https://zernio.com/api/v1/accounts?platform=instagram", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, reason: `Zernio did not accept this key (${body?.error?.message ?? body?.error ?? response.status}).` };
  }
  const accounts = (body.accounts ?? []).filter((account) => !account.platform || account.platform === "instagram");
  if (!accounts.length) {
    return { ok: false, reason: "The key works, but no Instagram account is connected in Zernio. Connect one in the Zernio dashboard, then run this again." };
  }
  return { ok: true, accounts };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log("Usage: node scripts/setup.mjs [--apply] [--name d-me] [--skip-tests] [--yes]");
    return;
  }
  if (existsSync(manifestPath)) {
    throw new Error("This folder already has a finished installation (.d-me-install.json). To update it, run: npm run deploy");
  }
  const workerName = args.name ?? "d-me";
  if (!/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(workerName)) throw new Error("--name must be lowercase letters, digits and hyphens.");

  console.log("D-ME installation plan");
  console.log(`Worker: ${workerName}`);
  console.log("\nWhen --apply is used:");
  console.log("1. Show the Cloudflare account that wrangler is logged in to, and ask you to confirm it");
  console.log("2. Ask for your Zernio API key (hidden input) and check it, and the connected Instagram account, with Zernio");
  console.log("3. Run the tests and a dry deployment");
  console.log("4. Generate the admin password (saved to d-me-tokens.txt), deploy the Worker, and check /health");
  if (!args.apply) {
    console.log("\nPlan only. Nothing was changed. Run the same command with --apply in your own terminal to install.");
    return;
  }

  await wrangler("Cloudflare account", ["whoami"]);
  if (!args.yes) {
    const answer = await ask("\nIs this the Cloudflare account you want to install into? Type yes to continue: ");
    if (answer.toLowerCase() !== "yes") { console.log("Stopped. Nothing was changed."); return; }
  }

  console.log("\nEnter your Zernio API key (zernio.com/dashboard/api-keys). Input is hidden and is never saved to a file in this folder.");
  const apiKey = process.env.DME_ZERNIO_API_KEY || await askHidden("Zernio API key: ");
  if (!apiKey) throw new Error("The Zernio API key is required.");
  console.log("\n[Checking the key with Zernio]");
  const check = await checkZernioKey(apiKey);
  if (!check.ok) throw new Error(`${check.reason} Nothing was created.`);
  const first = check.accounts[0];
  console.log(`Key accepted. Instagram account: @${first.username ?? first._id}${check.accounts.length > 1 ? ` (and ${check.accounts.length - 1} more; the dashboard uses the first)` : ""}.`);

  if (!args.skipTests) await run("Tests", isWindows ? "npm.cmd" : "npm", ["test"]);
  const config = JSON.parse(readFileSync(join(root, "wrangler.jsonc"), "utf8"));
  config.name = workerName;
  writeFileSync(localConfig, `${JSON.stringify(config, null, 2)}\n`);
  await wrangler("Dry deployment", ["deploy", "--dry-run", "--config", localConfig]);

  const adminToken = token();
  const secretsDir = mkdtempSync(join(tmpdir(), "d-me-"));
  const secretsFile = join(secretsDir, "secrets.json");
  let deployOutput;
  try {
    writeFileSync(secretsFile, JSON.stringify({ ZERNIO_API_KEY: apiKey, ADMIN_TOKEN: adminToken }), { mode: 0o600 });
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
    "D-ME private token. Move it to a password manager, then delete this file.",
    `Admin password (the "management key" in the dashboard): ${adminToken}`,
    "",
  ].join("\n"), { mode: 0o600 });
  writeFileSync(manifestPath, `${JSON.stringify({ workerName, workerUrl, adminUrl: `${workerUrl}/admin`, createdAt: new Date().toISOString() }, null, 2)}\n`);

  console.log("\nInstalled and health-checked.");
  console.log(`Dashboard: ${workerUrl}/admin`);
  console.log(`\nThe admin password is in ${tokensPath}`);
  console.log("Open that file yourself, copy the password to a password manager, then delete it. It is not printed here on purpose.");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`\nStopped: ${error.message}`);
    process.exit(1);
  });
}
