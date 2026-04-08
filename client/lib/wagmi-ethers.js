/**
 * Adapter to get an Ethers.js v5 Signer from a wagmi v2 WalletClient (viem v2).
 */
import { Web3Provider } from "@ethersproject/providers";

/**
 * Convert a wagmi/viem WalletClient into an Ethers.js v5 Signer.
 */
export function walletClientToSigner(walletClient) {
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new Web3Provider(transport, network);
  return provider.getSigner(account.address);
}
