import { DcapVerifier } from "@lit-protocol/dcap-qvl-ts";

// 3. your action logic
const go = async () => {
  // @ts-ignore
  const verifier = new DcapVerifier();
  // convert the attestation from a hex string to a Uint8Array
  // @ts-ignore
  attestation = Uint8Array.from(Buffer.from(attestation.substring(2), "hex"));
  // @ts-ignore
  const result = await verifier.verifyQuote(attestation);
  // @ts-ignore
  Lit.Actions.setResponse({ response: result });
};

go();
