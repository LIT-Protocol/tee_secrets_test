# Retrieving and decrypting secrets from a Phala TEE with Lit Protocol

A demonstration of using Lit Protocol as a secure secret store for Phala TEE (Trusted Execution Environment) applications. This repository shows how to conditionally decrypt content using Lit Protocol, where decryption is only allowed for verified Phala TEE instances running known-good software builds.

## Overview

This project enables secure secret management for TEE applications by:

- Obtaining attestations from Phala TEE instances
- Verifying TEE attestations within Lit Actions
- Conditionally decrypting secrets only for verified TEE instances
- Ensuring secrets can only be accessed by specific, trusted TEE builds

## Architecture

The system uses a clone of the [`dcap-qvl`](https://github.com/Phala-Network/dcap-qvl) repository for attestation verification, compiled to WASM and embedded within a Lit Action. The workflow ensures that sensitive data remains protected and is only accessible to authorized TEE instances.

### Key Components

- **litAction-wasm/**: Contains the Lit Action code and attestation verification logic
- **dcap-qvl**: WASM-compiled attestation verification library
- **src/index.ts**: Main code that runs the action and gets the decrypted secret. You probably want to run this from inside your TEE.

## Prerequisites

- Node.js and npm installed
- Access to Lit Protocol network
- Phala TEE environment (for production use)

## Installation

1. Clone this repository:

```bash
git clone git@github.com:LIT-Protocol/tee_secrets_test.git
cd tee_secrets_test
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
cp .env.example .env
```

Then edit `.env` and add your Ethereum wallet private key to `ETHEREUM_WALLET_PRIVATE_KEY`. This wallet will be used to interact with the Lit Protocol network.

## Building

Build the WASM module and prepare the Lit Action:

```bash
cd litAction-wasm
npm install
npm run build
cd ..
```

This command:

- Compiles the dcap-qvl library to WASM
- Bundles it with the Lit Action code
- Prepares the action for deployment

## Usage

### Running the Example

Run the demonstration example:

```bash
npm run start
```

This example demonstrates:

1. Obtaining an attestation from a Phala TEE
2. Parsing and verifying the attestation
3. Conditional decryption based on verification results

### Customizing for Your TEE Build

Edit `litAction-wasm/index.ts` to define your specific TEE verification requirements.

### Workflow

1. **TEE Attestation Request**: The Phala TEE requests its attestation
2. **Lit Action Execution**: The Lit Action runs within the Lit Protocol network
3. **Attestation Verification**: The action hits the `/attest` endpoint of the Phala TEE and verifies the TEE attestation using embedded WASM
4. **Conditional Decryption**: If verification passes, the secret is decrypted
5. **Secret Delivery**: The decrypted secret is returned to the verified TEE

## Project Structure

```
tee_secrets_test/
├── README.md                 # This file
├── package.json             # Project dependencies
├── src/                     # Main application source
│   └── index.ts            # Entry point
├── litAction-wasm/         # Lit Action and WASM components
│   ├── index.ts           # Lit Action logic
│   ├── package.json       # WASM build configuration
│   ├── build.js           # Build script
│   └── dcap-qvl-master/   # Attestation verification library
└── scripts/               # Build and utility scripts
```

## Security Considerations

- **Attestation Verification**: Always verify the complete attestation chain
- **Build Reproducibility**: Ensure TEE builds are reproducible for consistent MR_ENCLAVE values
- **Key Management**: Store encryption keys securely within Lit Protocol
- **Version Control**: Track and verify ISV_SVN to ensure only updated TEE versions can decrypt

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions:

- Open an issue in this repository
- Consult Lit Protocol documentation: https://developer.litprotocol.com
- Refer to Phala Network documentation: https://docs.phala.network
