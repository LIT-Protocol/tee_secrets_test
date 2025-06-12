import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync, writeFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const wasmPath = join(
  __dirname,
  "../node_modules/@phala/dcap-qvl-node/dcap-qvl-node_bg.wasm"
);
const wasmBytes = readFileSync(wasmPath);
const wasmBase64 = wasmBytes.toString("base64");

const indexPath = join(__dirname, "../index.ts");
let indexContent = readFileSync(indexPath, "utf8");
indexContent = indexContent.replace(
  /const wasmBase64 = "YOUR_BASE64_WASM_HERE";[^\n]*/,
  `const wasmBase64 = "${wasmBase64}";`
);

writeFileSync(indexPath, indexContent, "utf8");
console.log("WASM inlined as base64 in index.ts");
