import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import { GraphQLClient, gql } from "graphql-request";
import { Contract } from "@ethersproject/contracts";
import {
  Button,
  Input,
  Modal,
  notification,
  Popconfirm,
  Progress,
  Tooltip,
} from "antd";
import {
  PlusCircleOutlined,
  LogoutOutlined,
  EditOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import styles from "../styles/Home.module.css";
import "antd/dist/antd.css";
import {
  deriveEncryptionKey,
  encryptString,
  decryptString,
} from "../lib/crypto";
import { walletClientToSigner } from "../lib/wagmi-ethers";
import HeroSection from "../components/HeroSection";
import PasswordGrid from "../components/PasswordGrid";
import HelpCenter from "../components/HelpCenter";

// ─── Wagmi v2 Hooks ───────────────────────────────────────────────────────────
import { useAccount, useDisconnect, useWalletClient, useSwitchChain } from "wagmi";
import { useModal } from "connectkit";

// ─── Constants ────────────────────────────────────────────────────────────────
const CHAIN_ID = 80002; // Polygon Amoy Testnet

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const abi = [
  "function addKey(string _ipfsHash)",
  "function getMyKeys() view returns (tuple(uint256 id, string ipfsHash, bool isDeleted)[])",
  "function softDeleteKey(uint256 _id)",
  "function updateKey(uint256 _id, string _ipfsHash)",
];

const graphClient = new GraphQLClient(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql"
);

const GET_CREDENTIALS_QUERY = gql`
  query keys(
    $orderBy: Key_orderBy
    $orderDirection: OrderDirection
    $where: Key_filter
  ) {
    keys(
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $where
    ) {
      id
      keyId
      ipfsHash
      owner
      isDeleted
      updatedAt
    }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pinDataToIPFS = async (data) => {
  const res = await fetch("/api/pin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to pin data to IPFS");
  }
  return res.json();
};

const generateRandomPassword = () => {
  const chars =
    "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()-+ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return Array(16)
    .fill(null)
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
};

const getPasswordStrength = (pwd = "") => {
  let s = 0;
  if (pwd.length >= 8) s += 20;
  if (pwd.length >= 12) s += 20;
  if (pwd.length >= 16) s += 10;
  if (/[a-z]/.test(pwd)) s += 10;
  if (/[A-Z]/.test(pwd)) s += 10;
  if (/[0-9]/.test(pwd)) s += 10;
  if (/[^a-zA-Z0-9]/.test(pwd)) s += 20;
  return Math.min(s, 100);
};

const strengthLabel = (score) => {
  if (score < 30) return { text: "Weak", color: "#f5222d" };
  if (score < 60) return { text: "Fair", color: "#fa8c16" };
  if (score < 80) return { text: "Good", color: "#fadb14" };
  return { text: "Strong", color: "#52c41a" };
};

const fetchFromIPFS = async (ipfsHash) => {
  const gateways = [
    `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
    `https://dweb.link/ipfs/${ipfsHash}`,
    `https://ipfs.io/ipfs/${ipfsHash}`,
    `https://nftstorage.link/ipfs/${ipfsHash}`,
  ];
  const fetchWithTimeout = (url, ms) =>
    Promise.race([
      fetch(url),
      new Promise((_, rej) => setTimeout(() => rej(new Error("Timeout")), ms)),
    ]);
  for (const gw of gateways) {
    try {
      const res = await fetchWithTimeout(gw, 8000);
      if (res.ok) return res.json();
    } catch {
      continue;
    }
  }
  throw new Error("Failed to fetch from all IPFS gateways");
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Home() {
  // ─── Wagmi v2 hooks ─────────────────────────────────────────────────────────
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const { switchChain } = useSwitchChain();
  const { setOpen: openConnectKit } = useModal();

  // ─── Local state ────────────────────────────────────────────────────────────
  const [credentialsArr, setCredentialsArr] = useState([]);
  const [credentials, setCredentials] = useState({});
  const [editingCredentials, setEditingCredentials] = useState({});
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState(null);
  const [cryptoKey, setCryptoKey] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);

  // ─── Notifications ──────────────────────────────────────────────────────────
  const showNotification = useCallback(({ type, message, description }) => {
    notification[type]({
      message,
      description,
      placement: "topRight",
      duration: 7,
    });
  }, []);

  // ─── Derive encryption key + contract when wallet connects ──────────────────
  useEffect(() => {
    if (!isConnected || !walletClient || !address) {
      setContract(null);
      setCryptoKey(null);
      setCredentialsArr([]);
      return;
    }

    // Check chain — if wrong, prompt to switch
    if (chain?.id !== CHAIN_ID) {
      showNotification({
        type: "warning",
        message: "Wrong network",
        description: "Please switch to Polygon Amoy Testnet.",
      });
      if (switchChain) {
        switchChain({ chainId: CHAIN_ID });
      }
      return;
    }

    const init = async () => {
      if (isInitializing) return;
      setIsInitializing(true);
      try {
        const signer = walletClientToSigner(walletClient);
        const contractInstance = new Contract(contractAddress, abi, signer);

        showNotification({
          type: "info",
          message: "👆 Sign the message in your wallet",
          description:
            "Sign a message to derive your encryption key. " +
            "Same wallet always generates the same key. No gas required.",
        });

        const key = await deriveEncryptionKey(signer, address);

        setContract(contractInstance);
        setCryptoKey(key);

        showNotification({
          type: "success",
          message: "✅ Wallet connected",
          description: `Connected: ${address.slice(0, 6)}…${address.slice(-4)}`,
        });
      } catch (err) {
        console.error("Init error:", err);
        showNotification({
          type: "error",
          message: "Failed to initialize",
          description: err.message,
        });
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, [isConnected, walletClient, address, chain?.id]);

  // ─── Fetch credentials when contract + key ready ────────────────────────────
  useEffect(() => {
    if (contract && address && cryptoKey) {
      getCredentials();
    }
  }, [contract, address, cryptoKey]);

  // ─── Connect Wallet ─────────────────────────────────────────────────────────
  const handleConnectWallet = () => {
    openConnectKit(true);
  };

  // ─── Disconnect ─────────────────────────────────────────────────────────────
  const handleDisconnect = () => {
    disconnect();
    setCredentialsArr([]);
    setContract(null);
    setCryptoKey(null);
  };

  // ─── Fetch & Decrypt Credentials ────────────────────────────────────────────
  const getCredentials = useCallback(async () => {
    if (!contract || !address || !cryptoKey) return;
    setLoading(true);
    try {
      let keys = [];

      try {
        const result = await graphClient.request(GET_CREDENTIALS_QUERY, {
          orderBy: "updatedAt",
          orderDirection: "desc",
          where: { owner: address.toLowerCase(), isDeleted: false },
        });
        keys = result.keys;
      } catch {
        const contractKeys = await contract.getMyKeys();
        keys = contractKeys
          .filter((k) => !k.isDeleted)
          .map((k) => ({
            keyId: k.id.toString(),
            ipfsHash: k.ipfsHash,
            owner: address.toLowerCase(),
            isDeleted: k.isDeleted,
          }));
      }

      const decrypted = [];
      for (const { ipfsHash, keyId } of keys) {
        try {
          const ipfsData = await fetchFromIPFS(ipfsHash);
          if (ipfsData.version !== "aes-gcm-v1") {
            console.warn(`Skipping credential ${keyId}: old format.`);
            continue;
          }
          const plaintext = await decryptString(cryptoKey, ipfsData);
          decrypted.push({ id: keyId, ...JSON.parse(plaintext) });
        } catch {
          continue;
        }
      }

      setCredentialsArr(decrypted);
    } catch (err) {
      showNotification({
        type: "error",
        message: "Failed to load credentials",
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [contract, address, cryptoKey]);

  // ─── Save / Update ──────────────────────────────────────────────────────────
  const handleSaveCredentials = async (creds) => {
    if (!address || !contract || !cryptoKey) {
      showNotification({ type: "error", message: "Please connect your wallet", description: "" });
      return;
    }
    if (!["site", "username", "password"].every((p) => creds[p])) {
      showNotification({ type: "error", message: "Please fill all fields", description: "" });
      return;
    }
    if (!creds?.id && credentialsArr.some(
      (c) => c.username === creds.username && c.site === creds.site
    )) {
      showNotification({ type: "error", message: "Username already exists for this site", description: "" });
      return;
    }
    if (creds.password.length < 12) {
      showNotification({ type: "error", message: "Password must be at least 12 characters", description: "" });
      return;
    }

    setLoading(true);
    try {
      showNotification({
        type: "info",
        message: "🔐 Encrypting…",
        description: "Encrypting your password with AES-256-GCM.",
      });

      const encryptedPayload = await encryptString(cryptoKey, JSON.stringify(creds));

      showNotification({
        type: "info",
        message: "📤 Uploading to IPFS…",
        description: "Storing encrypted data on decentralised storage.",
      });

      const pinResult = await pinDataToIPFS(encryptedPayload);
      if (!pinResult?.IpfsHash) {
        throw new Error("IPFS upload failed. Check your Pinata API credentials in .env");
      }
      const { IpfsHash } = pinResult;

      showNotification({
        type: "info",
        message: "👆 Confirm transaction in your wallet",
        description: "Your wallet will ask you to approve a small blockchain transaction.",
      });

      if (creds?.id) {
        const tx = await contract.updateKey(creds.id, IpfsHash);
        await tx.wait(1);
        setIsEditModalOpen(false);
        showNotification({ type: "success", message: "✅ Credential updated!", description: "Updated on the blockchain." });
      } else {
        const tx = await contract.addKey(IpfsHash);
        await tx.wait(1);
        setIsAddModalOpen(false);
        setCredentials({});
        showNotification({ type: "success", message: "✅ Credential saved!", description: "Stored on the blockchain." });
      }

      await getCredentials();
    } catch (err) {
      showNotification({
        type: "error",
        message: "Something went wrong",
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // ─── Delete ─────────────────────────────────────────────────────────────────
  const handleDeleteCredential = async (id) => {
    if (!contract) {
      showNotification({ type: "error", message: "Please connect your wallet", description: "" });
      return;
    }
    setLoading(true);
    try {
      const tx = await contract.softDeleteKey(id);
      await tx.wait(1);
      showNotification({ type: "success", message: "✅ Credential deleted", description: "" });
      await getCredentials();
    } catch (err) {
      showNotification({ type: "error", message: "Failed to delete", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  // ─── Client-side search ─────────────────────────────────────────────────────
  const filteredCredentials = searchInput.trim()
    ? credentialsArr.filter(
        (c) =>
          c.site?.toLowerCase().includes(searchInput.toLowerCase()) ||
          c.username?.toLowerCase().includes(searchInput.toLowerCase())
      )
    : credentialsArr;

  // ─── Password Strength Bar ─────────────────────────────────────────────────
  const PasswordStrengthBar = ({ password }) => {
    const score = getPasswordStrength(password);
    const { text, color } = strengthLabel(score);
    if (!password) return null;
    return (
      <div style={{ marginTop: 4 }}>
        <Progress percent={score} showInfo={false} strokeColor={color} size="small" />
        <span style={{ fontSize: 12, color }}>{text} password</span>
      </div>
    );
  };

  // ─── Modals ─────────────────────────────────────────────────────────────────
  const renderAddModal = () => (
    <Modal
      title={null}
      open={isAddModalOpen}
      onCancel={() => { setIsAddModalOpen(false); setCredentials({}); }}
      footer={null}
      width={500}
      centered
    >
      <div className={styles.encryptDecryptContainer}>
        <div className={styles.modalHeader}>
          <div className={styles.modalIcon}><PlusCircleOutlined /></div>
          <h3 className={styles.modalTitle}>Add New Password</h3>
        </div>
        <div className={styles.formField}>
          <label>Website or App</label>
          <Input id="add-site" name="site" placeholder="example.com" value={credentials.site || ""} onChange={(e) => setCredentials({ ...credentials, site: e.target.value })} size="large" />
        </div>
        <div className={styles.formField}>
          <label>Username or Email</label>
          <Input id="add-username" name="username" placeholder="your@email.com" value={credentials.username || ""} onChange={(e) => setCredentials({ ...credentials, username: e.target.value })} size="large" />
        </div>
        <div className={styles.formField}>
          <label>Password</label>
          <Input.Password id="add-password" name="password" placeholder="Enter a strong password" value={credentials.password || ""} onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} size="large" />
          <PasswordStrengthBar password={credentials.password} />
        </div>
        <div className={styles.formActions}>
          <Button className={styles.generateButton} onClick={() => setCredentials({ ...credentials, password: generateRandomPassword() })} size="large">
            Generate Password
          </Button>
          <Button type="primary" className={styles.saveButton} loading={loading} onClick={() => handleSaveCredentials(credentials)} size="large">
            Save Password
          </Button>
        </div>
      </div>
    </Modal>
  );

  const renderEditModal = () => (
    <Modal
      title={null}
      open={isEditModalOpen}
      onCancel={() => setIsEditModalOpen(false)}
      footer={null}
      width={500}
      centered
    >
      <div className={styles.encryptDecryptContainer}>
        <div className={styles.modalHeader}>
          <div className={styles.modalIcon}><EditOutlined /></div>
          <h3 className={styles.modalTitle}>Edit Password</h3>
        </div>
        <div className={styles.formField}>
          <label>Website or App</label>
          <Input id="edit-site" name="site" placeholder="example.com" value={editingCredentials.site || ""} onChange={(e) => setEditingCredentials({ ...editingCredentials, site: e.target.value })} size="large" />
        </div>
        <div className={styles.formField}>
          <label>Username or Email</label>
          <Input id="edit-username" name="username" placeholder="your@email.com" value={editingCredentials.username || ""} onChange={(e) => setEditingCredentials({ ...editingCredentials, username: e.target.value })} size="large" />
        </div>
        <div className={styles.formField}>
          <label>Password</label>
          <Input.Password id="edit-password" name="password" placeholder="Enter a strong password" value={editingCredentials.password || ""} onChange={(e) => setEditingCredentials({ ...editingCredentials, password: e.target.value })} size="large" />
          <PasswordStrengthBar password={editingCredentials.password} />
        </div>
        <div className={styles.formActions}>
          <Button className={styles.generateButton} onClick={() => setEditingCredentials({ ...editingCredentials, password: generateRandomPassword() })} size="large">
            Generate Password
          </Button>
          <Button type="primary" className={styles.saveButton} loading={loading} onClick={() => handleSaveCredentials(editingCredentials)} size="large">
            Update Password
          </Button>
        </div>
      </div>
    </Modal>
  );

  const isReady = isConnected && cryptoKey && contract;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      <Head>
        <title>SecureVault — Decentralized Password Manager</title>
        <meta name="description" content="Secure, decentralized password management powered by AES-256-GCM encryption and blockchain storage." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="SecureVault" />
        <meta property="og:description" content="Web3-native password manager with AES-256-GCM encryption" />
        <meta property="og:type" content="website" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <main className={styles.main}>
        {!isReady ? (
          <HeroSection
            onConnectWallet={handleConnectWallet}
            isConnecting={isInitializing}
            onShowHelp={() => setIsHelpModalOpen(true)}
          />
        ) : (
          <>
            <div className={styles.appHeader}>
              <div className={styles.userInfo}>
                <h2 className={styles.welcomeMessage}>Welcome back! 👋</h2>
                <p className={styles.walletAddress}>
                  <WalletOutlined style={{ marginRight: 6 }} />
                  {address?.slice(0, 6)}…{address?.slice(-4)}
                  <span className={styles.networkBadge}>{chain?.name || "Polygon Amoy"}</span>
                </p>
              </div>
              <Button type="default" icon={<LogoutOutlined />} onClick={handleDisconnect} className={styles.logoutButton}>
                Disconnect
              </Button>
            </div>

            <PasswordGrid
              credentials={filteredCredentials}
              allCount={credentialsArr.length}
              loading={loading}
              searchInput={searchInput}
              onSearch={() => {}}
              onSearchChange={setSearchInput}
              onAdd={() => setIsAddModalOpen(true)}
              onRefresh={getCredentials}
              onEdit={(cred) => { setEditingCredentials(cred); setIsEditModalOpen(true); }}
              onDelete={handleDeleteCredential}
            />
          </>
        )}

        {renderAddModal()}
        {renderEditModal()}
        <HelpCenter open={isHelpModalOpen} onCancel={() => setIsHelpModalOpen(false)} />
      </main>

      <footer className={styles.footer}>
        <a href="https://github.com/samiejumade" target="_blank" rel="noopener noreferrer">
          © {new Date().getFullYear()} Samir Jumade · AES-256-GCM encrypted · Polygon blockchain
        </a>
      </footer>
    </div>
  );
}
