import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color codes
const COLOR_FRONTEND = "\x1b[32m"; // Green
const COLOR_BACKEND = "\x1b[36m";  // Cyan
const COLOR_RESET = "\x1b[0m";

function log(prefix, color, data) {
  const lines = data.toString().split("\n");
  lines.forEach((line) => {
    if (line.trim()) {
      console.log(`${color}[${prefix}]${COLOR_RESET} ${line}`);
    }
  });
}

console.log("Iniciando servidores de desarrollo para Polla Mundialista...");

// Spawn backend process
const backendProcess = spawn("npm", ["run", "dev"], {
  cwd: path.join(__dirname, "backend"),
  shell: true,
});

backendProcess.stdout.on("data", (data) => log("Backend", COLOR_BACKEND, data));
backendProcess.stderr.on("data", (data) => log("Backend ERROR", COLOR_BACKEND, data));

// Spawn frontend process
const frontendProcess = spawn("npm", ["run", "dev"], {
  cwd: __dirname,
  shell: true,
});

frontendProcess.stdout.on("data", (data) => log("Frontend", COLOR_FRONTEND, data));
frontendProcess.stderr.on("data", (data) => log("Frontend ERROR", COLOR_FRONTEND, data));

// Graceful shutdown
const cleanup = () => {
  console.log("\nApagando servidores...");
  backendProcess.kill("SIGTERM");
  frontendProcess.kill("SIGTERM");
  process.exit();
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

backendProcess.on("close", (code) => {
  console.log(`Servidor Backend finalizó con código ${code}`);
  cleanup();
});

frontendProcess.on("close", (code) => {
  console.log(`Servidor Frontend finalizó con código ${code}`);
  cleanup();
});
