import {
  addRecapToSiweMessage,
  LitResourceAbilityRequest,
} from "@lit-protocol/auth-helpers";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { SiweMessage } from "siwe";

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
