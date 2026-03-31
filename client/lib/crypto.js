/**
 * AES-256-GCM encryption using the browser Web Crypto API.
 *
 * Key derivation:
 *   1. Ask MetaMask to sign a deterministic message with the user's wallet.
 *   2. SHA-256 hash the signature → 32-byte AES key material.
 *   3. Same wallet + same message = same key, every time.
 *   → Only the wallet owner can derive the key and decrypt their passwords.
 *
 * No external servers or nodes required.
 */

const KEY_DERIVATION_MESSAGE = (address) =>
  [
    "SecureVault — Encryption Key Derivation",
    "",
    `Wallet: ${address.toLowerCase()}`,
    "",
    "Signing this message generates your AES-256-GCM encryption key.",
    "It is deterministic: signing again with the same wallet always",
    "produces the same key, so you can always decrypt your passwords.",
    "",
    "⚠️  Never share this signature with anyone.",
  ].join("\n");

/**
 * Ask MetaMask to sign the key-derivation message, then import the resulting
 * SHA-256 digest as an AES-256-GCM CryptoKey.
 *
 * @param {import('@ethersproject/providers').JsonRpcSigner} signer
 * @param {string} address  — checksummed wallet address
 * @returns {Promise<CryptoKey>}
 */
export const deriveEncryptionKey = async (signer, address) => {
  const message = KEY_DERIVATION_MESSAGE(address);
  const signature = await signer.signMessage(message);

  const encoded = new TextEncoder().encode(signature);
  const digest = await crypto.subtle.digest("SHA-256", encoded);

  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const toBase64 = (buffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)));

const fromBase64 = (str) =>
  Uint8Array.from(atob(str), (c) => c.charCodeAt(0));

// ── encrypt ───────────────────────────────────────────────────────────────────

/**
 * Encrypt a plain-text string.
 * Returns a JSON-serialisable object that can be pinned to IPFS.
 *
 * @param {CryptoKey} cryptoKey
 * @param {string}    plaintext
 * @returns {Promise<{ ciphertext: string, iv: string, version: string }>}
 */
export const encryptString = async (cryptoKey, plaintext) => {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
  const encoded = new TextEncoder().encode(plaintext);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    encoded
  );

  return {
    ciphertext: toBase64(cipherBuffer),
    iv: toBase64(iv),
    version: "aes-gcm-v1",
  };
};

// ── decrypt ───────────────────────────────────────────────────────────────────

/**
 * Decrypt a ciphertext object produced by encryptString().
 *
 * @param {CryptoKey} cryptoKey
 * @param {{ ciphertext: string, iv: string }} obj
 * @returns {Promise<string>}
 */
export const decryptString = async (cryptoKey, { ciphertext, iv }) => {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(iv) },
    cryptoKey,
    fromBase64(ciphertext)
  );
  return new TextDecoder().decode(decrypted);
};
