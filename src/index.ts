import * as dotenv from "dotenv";
dotenv.config();

import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { ethers } from "ethers";
import { LIT_ABILITY, LIT_RPC } from "@lit-protocol/constants";
import {
  LitAccessControlConditionResource,
  LitActionResource,
  generateAuthSig,
} from "@lit-protocol/auth-helpers";
import { createSiweWithResourceParams, stringToIpfsHash } from "./utils";

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
