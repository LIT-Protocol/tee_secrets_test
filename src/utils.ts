import {
  addRecapToSiweMessage,
  LitResourceAbilityRequest,
} from "@lit-protocol/auth-helpers";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { SiweMessage } from "siwe";
// import { importer } from "ipfs-unixfs-importer";
import { Buffer } from "buffer";
import Hash from "ipfs-only-hash";

export async function createSiweWithResourceParams(params: {
  domain?: string;
  walletAddress: string;
  statement?: string;
  uri?: string;
  version?: string;
  chainId?: number;
  nonce: string;
  expiration?: string;
  resources?: LitResourceAbilityRequest[];
  siweResources?: string[];
  litNodeClient: LitNodeClient;
}) {
  const ONE_WEEK_FROM_NOW = new Date(
    Date.now() + 1000 * 60 * 60 * 24 * 7
  ).toISOString();

  const siweParams = {
    domain: params?.domain ?? "localhost",
    address: params.walletAddress,
    statement:
      params?.statement ??
      "This is a test statement.  You can put anything you want here.",
    uri: params?.uri ?? "https://localhost/login",
    version: params?.version ?? "1",
    chainId: params?.chainId ?? 1,
    nonce: params.nonce,
    expirationTime: params?.expiration ?? ONE_WEEK_FROM_NOW,
  };

  let siweMessage = new SiweMessage(siweParams);

  // -- add recap resources for Lit abilities if needed
  if (params.resources) {
    siweMessage = await addRecapToSiweMessage({
      siweMessage,
      resources: params.resources,
      litNodeClient: params.litNodeClient,
    });
  }

  if (params.siweResources && siweMessage.resources) {
    for (const resource of params.siweResources) {
      siweMessage.resources.push(resource);
    }
  }

  return siweMessage.prepareMessage();
}

/**
 * Converts a string to an IPFS hash.
 * @param input - The input string to convert.
 * @returns A Promise that resolves to the IPFS hash.
 * @throws An error if the generated hash does not start with 'Qm'.
 */
export async function stringToIpfsHash(input: string): Promise<string> {
  return await Hash.of(input);
}

// /**
//  * Converts a string to an IPFS hash.
//  * @param input - The input string to convert.
//  * @returns A Promise that resolves to the IPFS hash.
//  * @throws An error if the generated hash does not start with 'Qm'.
//  */
// export async function stringToIpfsHash(input: string): Promise<string> {
//   const blockput = {
//     put: async (block: any) => {
//       return block.cid;
//     },
//   };

//   // Convert the input string to a Buffer
//   const content = Buffer.from(input);

//   // Import the content to create an IPFS file
//   const files = importer([{ content }], blockput as any);

//   // Get the first (and only) file result
//   const result = (await files.next()).value;

//   const ipfsHash = (result as any).cid.toString();

//   if (!ipfsHash.startsWith("Qm")) {
//     throw new Error("Generated hash does not start with Qm");
//   }

//   return ipfsHash;
// }
