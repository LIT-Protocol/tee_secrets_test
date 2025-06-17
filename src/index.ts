import {
  LitNodeClient,
  uint8arrayToString,
  uint8arrayFromString,
} from "@lit-protocol/lit-node-client";
import { AccessControlConditions, AuthSig, Chain } from "@lit-protocol/types";
import { ethers } from "ethers";
import {
  LIT_ABILITY,
  LIT_CHAINS,
  LIT_EVM_CHAINS,
  LIT_RPC,
} from "@lit-protocol/constants";
import {
  LitAccessControlConditionResource,
  LitActionResource,
  createSiweMessage,
  generateAuthSig,
} from "@lit-protocol/auth-helpers";
import { createSiweWithResourceParams, stringToIpfsHash } from "./utils";
// import { litActionCode } from "./litAction";
import fs from "fs";

async function main(): Promise<void> {
  // Initialize the Lit client
  const client = new LitNodeClient({
    litNetwork: "datil-dev",
  });
  await client.connect();

  // Your secret to encrypt
  const secret = new TextEncoder().encode("This is my secret message");
  const phalaTeeUrl =
    "https://336bfec5ed93970c67da872930846163f27c5041-3002.dstack-prod5.phala.network";

  // // Gate the access to the secret on a valid phala attestation
  // const evmContractConditions = [
  //   {
  //     contractAddress: "0x76A3657F2d6c5C66733e9b69ACaDadCd0B68788b",
  //     functionName: "verifyAndAttestOnChain",
  //     functionParams: [":litParam:attestationQuote"],
  //     functionAbi: {
  //       inputs: [
  //         {
  //           internalType: "bytes",
  //           name: "rawQuote",
  //           type: "bytes",
  //         },
  //       ],
  //       name: "verifyAndAttestOnChain",
  //       outputs: [
  //         {
  //           internalType: "bool",
  //           name: "success",
  //           type: "bool",
  //         },
  //         {
  //           internalType: "bytes",
  //           name: "output",
  //           type: "bytes",
  //         },
  //       ],
  //       stateMutability: "view",
  //       type: "function",
  //     },
  //     chain: "sepolia" as const,
  //     returnValueTest: {
  //       key: "success",
  //       comparator: "=" as const,
  //       value: "true",
  //     },
  //   },
  // ];

  const litActionCode = fs.readFileSync(
    "./litAction-wasm/dist/bundle.js",
    "utf8"
  );
  const derivedIpfsId = await stringToIpfsHash(litActionCode);

  const accessControlConditions = [
    {
      contractAddress: "",
      chain: "ethereum" as const,
      standardContractType: "" as const,
      method: "",
      parameters: [":currentActionIpfsId"],
      returnValueTest: {
        comparator: "=" as const,
        value: derivedIpfsId,
      },
    },
  ];

  try {
    // Encrypt the secret
    const encryptResponse = await client.encrypt({
      accessControlConditions,
      dataToEncrypt: secret,
    });
    const { ciphertext, dataToEncryptHash } = encryptResponse;

    console.log("Encrypted secret:", encryptResponse);

    const ethersSigner = new ethers.Wallet(
      process.env.LIT_MUMBAI_DEPLOYER_PRIVATE_KEY!,
      new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE)
    );

    const sessionSignatures = await client.getSessionSigs({
      chain: "ethereum",
      expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
      resourceAbilityRequests: [
        {
          resource: new LitAccessControlConditionResource("*"),
          ability: LIT_ABILITY.AccessControlConditionDecryption,
        },
        {
          resource: new LitActionResource("*"),
          ability: LIT_ABILITY.LitActionExecution,
        },
      ],
      authNeededCallback: async ({
        uri,
        expiration,
        resourceAbilityRequests,
      }) => {
        const toSign = await createSiweWithResourceParams({
          uri,
          expiration,
          resources: resourceAbilityRequests,
          walletAddress: ethersSigner.address,
          nonce: await client.getLatestBlockhash(),
          litNodeClient: client,
          // siweResources: [
          //   `litParam:attestationQuote:${encodedAttestationQuote}`,
          // ],
        });

        return await generateAuthSig({
          signer: ethersSigner,
          toSign,
        });
      },
    });

    // Decrypt the secret
    const result = await client.executeJs({
      sessionSigs: sessionSignatures,
      code: litActionCode,
      jsParams: {
        ciphertext,
        dataToEncryptHash,
        accessControlConditions,
        phalaTeeUrl,
      },
    });

    console.log("Result:", result);

    const { decrypted } = JSON.parse(result.response as string);
    console.log("Decrypted secret:", decrypted);
  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(console.error);
