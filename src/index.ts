import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { AccessControlConditions, AuthSig } from "@lit-protocol/types";
import { ethers } from "ethers";
import { LIT_ABILITY, LIT_RPC } from "@lit-protocol/constants";
import {
  LitAccessControlConditionResource,
  createSiweMessage,
  generateAuthSig,
} from "@lit-protocol/auth-helpers";

async function main(): Promise<void> {
  // Initialize the Lit client
  const client = new LitNodeClient({
    litNetwork: "datil-dev",
  });
  await client.connect();

  // Your secret to encrypt
  const secret = new TextEncoder().encode("This is my secret message");

  // Dummy access control condition (replace with your actual condition)
  const accessControlConditions: AccessControlConditions = [
    {
      contractAddress: "",
      standardContractType: "",
      chain: "ethereum",
      method: "eth_getBalance",
      parameters: [":userAddress", "latest"],
      returnValueTest: {
        comparator: ">=",
        value: "0",
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
      // capabilityAuthSigs: [capacityDelegationAuthSig], // Unnecessary on datil-dev
      resourceAbilityRequests: [
        {
          resource: new LitAccessControlConditionResource("*"),
          ability: LIT_ABILITY.AccessControlConditionDecryption,
        },
      ],
      authNeededCallback: async ({
        uri,
        expiration,
        resourceAbilityRequests,
      }) => {
        const toSign = await createSiweMessage({
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
    const decryptedString = await client.decrypt({
      accessControlConditions,
      sessionSigs: sessionSignatures,
      chain: "ethereum",
      ciphertext: ciphertext,
      dataToEncryptHash: dataToEncryptHash,
    });

    console.log("Decrypted secret:", decryptedString);
  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(console.error);
