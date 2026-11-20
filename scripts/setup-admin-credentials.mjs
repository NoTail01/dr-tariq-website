import bcrypt from "bcryptjs";
import { stdin as input, stdout as output } from "node:process";

const BCRYPT_COST = 12;
const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,128}$/;
const MIN_PASSWORD_BYTES = 12;
const MAX_PASSWORD_BYTES = 72;

function fail(message) {
  output.write(`\nError: ${message}\n`);
  process.exit(1);
}

function readVisible(prompt) {
  output.write(prompt);
  return new Promise((resolve) => {
    let value = "";
    const previousRaw = input.isRaw ?? false;
    if (input.isTTY) input.setRawMode(false);
    input.resume();
    const onData = (chunk) => {
      const text = chunk.toString("utf8");
      if (text === "\n" || text === "\r") {
        cleanup();
        output.write("\n");
        resolve(value.trim());
      } else if (text === "\u0003") {
        cleanup();
        output.write("\n");
        process.exit(1);
      } else if (text === "\u007f" || text === "\b") {
        value = value.slice(0, -1);
      } else {
        value += text;
      }
    };
    const cleanup = () => {
      input.off("data", onData);
      if (input.isTTY) input.setRawMode(previousRaw);
      input.pause();
    };
    input.on("data", onData);
  });
}

function readHidden(prompt) {
  output.write(prompt);
  return new Promise((resolve) => {
    let value = "";
    const previousRaw = input.isRaw ?? false;
    if (input.isTTY) input.setRawMode(true);
    input.resume();
    const onData = (chunk) => {
      const text = chunk.toString("utf8");
      if (text === "\n" || text === "\r") {
        cleanup();
        output.write("\n");
        resolve(value);
      } else if (text === "\u0003") {
        cleanup();
        output.write("\n");
        process.exit(1);
      } else if (text === "\u007f" || text === "\b") {
        value = value.slice(0, -1);
      } else if (text >= " ") {
        value += text;
      }
    };
    const cleanup = () => {
      input.off("data", onData);
      if (input.isTTY) input.setRawMode(previousRaw);
      input.pause();
    };
    input.on("data", onData);
  });
}

async function main() {
  if (!input.isTTY) {
    fail("Run this script in an interactive terminal so the password is not echoed.");
  }

  output.write("Admin credential setup\n");
  output.write("The password is entered with terminal echo disabled and is never printed.\n\n");

  const username = await readVisible("Username (3-128 chars: letters, digits, dot, dash, underscore): ");
  if (!USERNAME_PATTERN.test(username)) {
    fail("Username must be 3-128 characters and use only letters, digits, dot, dash or underscore.");
  }

  const password = await readHidden("Password (12-72 bytes): ");
  const confirmation = await readHidden("Confirm password: ");
  if (password !== confirmation) fail("Passwords do not match.");

  const bytes = Buffer.byteLength(password, "utf8");
  if (bytes < MIN_PASSWORD_BYTES || bytes > MAX_PASSWORD_BYTES) {
    fail(`Password must be between ${MIN_PASSWORD_BYTES} and ${MAX_PASSWORD_BYTES} UTF-8 bytes.`);
  }

  const hash = await bcrypt.hash(password, BCRYPT_COST);

  const localHash = hash.replace(/\$/g, "\\$");

  output.write("\nFor .env.local, escape every $ in the bcrypt hash (Next.js dotenv expands unescaped $):\n\n");
  output.write(`ADMIN_USERNAME=${username}\n`);
  output.write(`ADMIN_PASSWORD_HASH=${localHash}\n\n`);
  output.write("For Vercel or another hosting environment dashboard, paste the raw hash instead (no backslashes):\n\n");
  output.write(`ADMIN_USERNAME=${username}\n`);
  output.write(`ADMIN_PASSWORD_HASH=${hash}\n\n`);
  output.write("Restart the app after changing either value. The password itself was never printed or stored.\n");
}

void main();
