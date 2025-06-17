// @ts-nocheck
import { js_get_collateral, js_verify } from "./dcap_qvl_node.js";

const go = async () => {
  const correctMr3 =
    "59fd04d2ef62a1dba4e914a34fab87d1389743fb205e0366e171859b9db4fee139923f5bca93ca783362bcb51e23b502";

  const challenge = ethers.utils.hexlify(
    crypto.getRandomValues(new Uint8Array(32))
  );

  console.log("challenge", challenge);

  const attestationResponse = await fetch(`${phalaTeeUrl}/attest`, {
    method: "POST",
    body: JSON.stringify({ challenge }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!attestationResponse.ok) {
    // capture and print the response body
    const errorBody = await attestationResponse.text();
    console.log("Error body", errorBody);
    throw new Error("Invalid response from phala tee");
  }

  const responseData = await attestationResponse.json();
  // console.log("responseData", responseData);
  let { signature, quote, userData } = responseData;
  quote = Buffer.from(quote, "hex");
  console.log("signature from phala tee", signature);
  console.log("userData from phala tee", userData);
  console.log("hashedUserData from phala tee", responseData.hashedUserData);

  // verify signature and that it matches the authSig
  // this verifies that the TEE requesting the secret is the
  // same one that made the request, and that it's safe
  // to decrypt the secret and return it
  const address = ethers.utils.verifyMessage(challenge, signature);
  console.log("Address recovered from signature", address);
  const authSigAddress = Lit.Auth.authSigAddress;
  console.log("authSigAddress", authSigAddress);
  // uncomment when sending request from the TEE
  // if (address !== authSigAddress) {
  //   throw new Error("Signature does not match authSig");
  // }

  // we must calculate and hash this ourselves, to
  // ensure that the challenge was included in the attestation
  const attestationUserData = JSON.stringify({
    challenge,
    signature,
  });
  const hashedUserData = ethers.utils.sha256(
    ethers.utils.toUtf8Bytes(attestationUserData)
  );
  console.log("calculated attestationUserData", attestationUserData);
  console.log("calculated hashed user data", hashedUserData);

  // Get the quote collateral
  let pccs_url = "https://pccs.phala.network/tdx/certification/v4";
  const quoteCollateral = await js_get_collateral(pccs_url, quote);

  // Current timestamp
  const now = BigInt(Math.floor(Date.now() / 1000));

  // Call the js_verify function
  const result = js_verify(quote, quoteCollateral, now);
  const report = result.report.TD10;
  const reportData = report.report_data.substring(64, 128);
  console.log("reportData substring", reportData);
  if (result.status != "UpToDate") {
    console.log("result from js_verify()", result);
    throw new Error(
      "Report is not up to date - attestation could be invalid or expired"
    );
  }
  if (reportData != hashedUserData.substring(2)) {
    console.log("hashedUserData", hashedUserData);
    console.log("reportData", reportData);
    console.log("result from js_verify()", result);
    throw new Error(
      "Invalid user data in attestation - this could be a challenge mismatch"
    );
  }
  // if (result.report.TD10.rt_mr3 !== correctMr3) {
  //   console.log(result);
  //   throw new Error("Invalid MR3 in attestation");
  // }

  const decrypted = await Lit.Actions.decryptAndCombine({
    ciphertext,
    accessControlConditions,
    dataToEncryptHash,
    chain: "ethereum",
  });

  Lit.Actions.setResponse({
    response: JSON.stringify({
      decrypted,
      result,
    }),
  });
};

go();
