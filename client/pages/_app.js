import "../styles/globals.css";
import styles from "../styles/Navbar.module.css";
import { LockOutlined } from "@ant-design/icons";

function MyApp({ Component, pageProps }) {
  return (
    <>
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
    </>
  );
}

export default MyApp;
