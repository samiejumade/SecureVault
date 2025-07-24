import LitJsSdk from "@lit-protocol/sdk-browser";

const client = new LitJsSdk.LitNodeClient({ 
  debug: false,
  connectTimeout: 30000,
  minNodeCount: 2,
  defaultNetwork: "bsc",
  alertWhenUnauthorized: false,
  checkNodeAttestation: false
});

class Lit {
  litNodeClient;
  authSig; // Cache the auth signature
  
  constructor({ autoConnect = false }) {
    if (autoConnect) {
      this.connect();
    }
  }
  
  async connect() {
    try {
      await client.connect();
      this.litNodeClient = client;
      console.log("✅ Lit Protocol connected successfully");
    } catch (error) {
      console.error("❌ Lit Protocol connection failed:", error);
      throw error;
    }
  }

  async getAuthSig() {
    if (!this.authSig) {
      console.log("Getting new auth signature...");
      this.authSig = await LitJsSdk.checkAndSignAuthMessage({ chain: "bscTestnet" });
    }
    return this.authSig;
  }

  // Clear cached auth signature (call this on account change)
  clearAuthSig() {
    this.authSig = null;
  }

  async encryptString(stringToEncrypt, accessControlConditions) {
    if (!this.litNodeClient) {
      await this.connect();
    }
    
    try {
      const authSig = await this.getAuthSig();
      const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(stringToEncrypt);

      const encryptedSymmetricKey = await this.litNodeClient.saveEncryptionKey({
        accessControlConditions,
        symmetricKey,
        authSig,
        chain: "bscTestnet",
      });

      return {
        encryptedString,
        encryptedSymmetricKey: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16")
      };
    } catch (error) {
      console.error("Encryption failed:", error);
      throw error;
    }
  };

  async decryptString(encryptedSymmetricKey, encryptedString, accessControlConditions) {
    if (!this.litNodeClient) {
      await this.connect();
    }
    
    try {
      const authSig = await this.getAuthSig();
      const symmetricKey = await this.litNodeClient.getEncryptionKey({
        accessControlConditions,
        toDecrypt: encryptedSymmetricKey,
        chain: "bscTestnet",
        authSig,
      });

      const decryptedString = await LitJsSdk.decryptString(
        encryptedString,
        symmetricKey
      );
      return { decryptedString };
    } catch (error) {
      console.error("Decryption failed:", error);
      throw error;
    }
  };
}

export default Lit;