#!/bin/bash

export PATH="/opt/homebrew/opt/llvm/bin:$PATH"

cd dcap-qvl-master

# build wasm
wasm-pack build --release --target deno --features js

# convert to base64
base64 -i pkg/dcap_qvl_bg.wasm -o ../wasm.b64

cp pkg/dcap_qvl.js ../dcap_qvl_node.js
