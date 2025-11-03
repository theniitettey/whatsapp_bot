import fs from "fs/promises";
import path from "path";

async function readEnvFile(envPath: string) {
  try {
    const raw = await fs.readFile(envPath, "utf8");
    const lines = raw.split(/\r?\n/);
    const obj: Record<string, string> = {};
    for (const line of lines) {
      if (!line || line.trim().startsWith("#")) continue;
      const idx = line.indexOf("=");
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      obj[key] = value;
    }
    return obj;
  } catch (err) {
    return {};
  }
}

async function writeEnvFile(envPath: string, obj: Record<string, string>) {
  const lines = Object.entries(obj).map(([k, v]) => `${k}=${v}`);
  await fs.writeFile(envPath, lines.join("\n"), "utf8");
}

async function main() {
  const [, , key, value] = process.argv;
  if (!key) {
    console.error("Usage: ts-node scripts/set-env.ts KEY VALUE");
    process.exit(2);
  }
  // Prevent changing ports via CLI to keep ports read-only.
  const forbidden = [/^PORT$/i, /PORT$/i, /^VITE_/i];
  for (const re of forbidden) {
    if (re.test(key)) {
      console.error(`Refusing to set port-related key: ${key}`);
      process.exit(3);
    }
  }
  const envPath = path.join(process.cwd(), ".env");
  const env = await readEnvFile(envPath);
  env[key] = value ?? "";
  await writeEnvFile(envPath, env);
  console.log(`Updated ${key} in ${envPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
