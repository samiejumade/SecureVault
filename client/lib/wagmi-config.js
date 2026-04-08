import { http, createConfig } from "wagmi";
import { getDefaultConfig } from "connectkit";

// ─── Polygon Amoy Testnet Chain Definition ────────────────────────────────────
const polygonAmoy = {
  id: 80002,
  name: "Polygon Amoy Testnet",
  network: "polygon-amoy",
  nativeCurrency: {
    decimals: 18,
    name: "MATIC",
    symbol: "MATIC",
  },
  rpcUrls: {
    default: { http: ["https://rpc-amoy.polygon.technology/"] },
  },
  blockExplorers: {
    default: { name: "PolygonScan", url: "https://amoy.polygonscan.com" },
  },
  testnet: true,
};

// ─── Wagmi Config (v2 API) ────────────────────────────────────────────────────
const config = createConfig(
  getDefaultConfig({
    appName: "SecureVault",
    appDescription: "Decentralized Password Manager with AES-256-GCM Encryption",
    appUrl: typeof window !== "undefined" ? window.location.origin : "https://securevault.app",
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_VITE_REOWN_PROJECT_ID || "",
    chains: [polygonAmoy],
    transports: {
      [polygonAmoy.id]: http("https://rpc-amoy.polygon.technology/"),
    },
  })
);

export { config, polygonAmoy };
