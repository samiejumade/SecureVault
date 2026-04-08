import "../styles/globals.css";
import styles from "../styles/Navbar.module.css";
import { LockOutlined } from "@ant-design/icons";
import { WagmiProvider } from "wagmi";
import { ConnectKitProvider } from "connectkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "../lib/wagmi-config";

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          theme="midnight"
          options={{
            disclaimer: (
              <span>
                By connecting your wallet, you agree to SecureVault&apos;s terms.
                Your encryption key is derived from your wallet signature — only you can decrypt your passwords.
              </span>
            ),
          }}
        >
          <nav className={styles.navbar}>
            <div className={styles.navInner}>
              <a href="/" className={styles.brand}>
                <div className={styles.brandIcon}>
                  <LockOutlined />
                </div>
                <span className={styles.brandName}>
                  Secure<span className={styles.brandAccent}>Vault</span>
                </span>
              </a>
              <div className={styles.navRight}>
                <span className={styles.navTag}>AES-256-GCM Encrypted</span>
              </div>
            </div>
          </nav>
          <Component {...pageProps} />
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default MyApp;
