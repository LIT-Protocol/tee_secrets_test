#!/bin/bash

export PATH="/opt/homebrew/opt/llvm/bin:$PATH"

cd dcap-qvl-master

# build wasm
wasm-pack build --release --target deno --features js

# convert to base64
base64 -i pkg/dcap_qvl_bg.wasm -o ../wasm.b64

# First copy the original file
cp pkg/dcap_qvl.js ../dcap_qvl_node.js

# Create a temporary file with the initialization code
cat > ../init_code.js << EOF
const wasmBytes = "$(cat ../wasm.b64)";
const wasmModule = new WebAssembly.Module(atob(wasmBytes));
const wasm = new WebAssembly.Instance(wasmModule, imports).exports;
EOF

# Remove the wasm_url loading code and replace with our initialization code
sed -i '' -e '/const wasm_url = new URL/,/^}/d' \
    -e '/const wasmInstance = (await WebAssembly.instantiate(wasmCode, imports)).instance;/r ../init_code.js' \
    -e '/const wasmInstance = (await WebAssembly.instantiate(wasmCode, imports)).instance;/d' ../dcap_qvl_node.js

# Clean up temporary files
# rm ../wasm.b64 ../init_code.js
