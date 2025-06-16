// @ts-nocheck
import { js_get_collateral, js_verify } from "./dcap_qvl_node.js";

// 3. your action logic
const go = async () => {
  attestation = Uint8Array.from(Buffer.from(attestation.substring(2), "hex"));

  // Get the quote collateral
  let pccs_url = "https://pccs.phala.network/tdx/certification/v4";
  const quoteCollateral = await js_get_collateral(pccs_url, attestation);

  // Current timestamp
  const now = BigInt(Math.floor(Date.now() / 1000));

  // Call the js_verify function
  const result = js_verify(attestation, quoteCollateral, now);
  // console.log(result);
  Lit.Actions.setResponse({ response: JSON.stringify(result) });
};

go();
