const fs = require("fs");
const path = require("path");

function loadEnvFile(envPath) {
  const env = {};

  if (!fs.existsSync(envPath)) {
    return env;
  }

  const content = fs.readFileSync(envPath, "utf8");

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

const rootDir = __dirname;
const fileEnv = loadEnvFile(path.join(rootDir, ".env"));

module.exports = {
  apps: [
    {
      name: "ksr-shipping",
      cwd: rootDir,
      script: ".next/standalone/server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 3000,
        HOSTNAME: "0.0.0.0",
        ...fileEnv,
      },
    },
  ],
};
