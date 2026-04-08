import { Button, Space } from "antd";
import { LockOutlined, SecurityScanOutlined, CloudServerOutlined, ThunderboltOutlined, WalletOutlined } from "@ant-design/icons";
import styles from "../styles/Hero.module.css";

const HeroSection = ({ onConnectWallet, isConnecting, onShowHelp }) => {
  return (
    <div className={styles.hero}>
      {/* Animated background orbs */}
      <div className={styles.orbBlue} />
      <div className={styles.orbPurple} />
      <div className={styles.orbGreen} />

      <div className={styles.heroContent}>
        {/* Badge */}
        <div className={styles.heroBadge}>
          <SecurityScanOutlined />
          <span>AES-256-GCM · Polygon Blockchain</span>
        </div>

        <h1 className={styles.heroTitle}>
          Your Passwords.
          <br />
          <span className={styles.gradientText}>Truly Private.</span>
        </h1>

        <p className={styles.heroDescription}>
          SecureVault encrypts your passwords with <strong>AES-256-GCM</strong> — the same standard
          used by banks. Your encryption key is derived from your wallet signature,
          so only you can ever decrypt your data. No servers. No third-party nodes. Just you.
        </p>

        {/* Feature pills */}
        <div className={styles.features}>
          <div className={styles.feature}>
            <SecurityScanOutlined className={styles.featureIcon} />
            <span>AES-256-GCM Encryption</span>
          </div>
          <div className={styles.feature}>
            <CloudServerOutlined className={styles.featureIcon} />
            <span>Decentralised IPFS Storage</span>
          </div>
          <div className={styles.feature}>
            <ThunderboltOutlined className={styles.featureIcon} />
            <span>Polygon Amoy · Low-Fee Blockchain</span>
          </div>
          <div className={styles.feature}>
            <LockOutlined className={styles.featureIcon} />
            <span>Your Keys, Your Control</span>
          </div>
        </div>

        <div className={styles.ctaRow}>
          <Space size="middle">
            <Button
              type="primary"
              size="large"
              onClick={onConnectWallet}
              loading={isConnecting}
              icon={<WalletOutlined />}
              className={styles.connectButton}
            >
              {isConnecting ? "Connecting…" : "Connect Wallet"}
            </Button>
            <Button
              type="default"
              size="large"
              onClick={onShowHelp}
              className={styles.helpButton}
            >
              How to Start?
            </Button>
          </Space>
          <p className={styles.ctaNote}>
            Works with MetaMask · No sign-up required
          </p>
        </div>
      </div>

      {/* Decorative visual panel */}
      <div className={styles.heroVisual}>
        <div className={styles.floatingCard}>
          <div className={styles.cardTop}>
            <div className={styles.cardDots}>
              <span className={styles.dot} style={{ background: "#ff5f57" }} />
              <span className={styles.dot} style={{ background: "#ffbd2e" }} />
              <span className={styles.dot} style={{ background: "#28c840" }} />
            </div>
            <span className={styles.cardTitle}>SecureVault</span>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.mockRow}>
              <span className={styles.mockLabel}>github.com</span>
              <div className={styles.mockShield}><SecurityScanOutlined /></div>
            </div>
            <div className={styles.mockField}>
              <span className={styles.mockKey}>username</span>
              <span className={styles.mockVal}>samir@dev.io</span>
            </div>
            <div className={styles.mockField}>
              <span className={styles.mockKey}>password</span>
              <span className={styles.mockVal}>••••••••••••••</span>
            </div>
            <div className={styles.mockBadge}>
              <SecurityScanOutlined /> Encrypted on-chain
            </div>
          </div>
        </div>

        {/* Floating mini stat cards */}
        <div className={`${styles.statCard} ${styles.statCard1}`}>
          <div className={styles.statIcon}><LockOutlined /></div>
          <div>
            <div className={styles.statNum}>256-bit</div>
            <div className={styles.statDesc}>AES Encryption</div>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statCard2}`}>
          <div className={styles.statIcon}><SecurityScanOutlined /></div>
          <div>
            <div className={styles.statNum}>Zero</div>
            <div className={styles.statDesc}>Central Servers</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
