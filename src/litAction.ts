// @ts-nocheck

const _litActionCode = async () => {
  // parse the attestation

  // if everything checks out, decrypt the ciphertext and return it
  const decrypted = await Lit.Actions.decryptAndCombine({
    ciphertext,
    accessControlConditions,
    dataToEncryptHash,
    chain: "ethereum",
  });
  Lit.Actions.setResponse({
    response: JSON.stringify({
      decrypted,
      attestation,
    }),
  });
};

export const litActionCode = `(${_litActionCode.toString()})();`;
