import { useEffect, useState, useCallback  } from "react";
import Head from "next/head";
import LitJsSdk from "@lit-protocol/sdk-browser";
import { GraphQLClient, gql } from "graphql-request";
import { Web3Provider } from "@ethersproject/providers";
import { Contract } from "@ethersproject/contracts";
import {
  Space,
  Button,
  Input,
  Popconfirm,
  Modal,
  message,
  Table,
  notification,
  Spin,
} from "antd";
import {
  PlusCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined
} from "@ant-design/icons";
import styles from "../styles/Home.module.css";
import "antd/dist/antd.css";
import Lit from "../lib/lit";

if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    if (
      args[0]?.includes?.('WebSocket connection') ||
      args[0]?.includes?.('bridge.walletconnect.org') ||
      args[0]?.includes?._socketCreate
    ) {
      return; // Suppress WalletConnect WebSocket errors
    }
    originalError.apply(console, args);
  };
}

const lit = new Lit({ autoConnect: true });

const client = new GraphQLClient(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql"
);

const GET_CREDENTIALS_QUERY = gql`
    query keys(
      $first: Int
      $skip: Int
      $orderBy: Key_orderBy
      $orderDirection: OrderDirection
      $where: Key_filter
    ) {
      keys(
        first: $first
        skip: $skip
        orderBy: $orderBy
        orderDirection: $orderDirection
        where: $where
      ) {
        id
        keyId
        keyA
        keyB
        ipfsHash
        owner
        isDeleted
        updatedAt
      }
    }
  `;

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const abi = [
  "function addKey(string _ipfsHash)",
  "function getMyKeys() view returns (tuple(uint256 id, string ipfsHash, bool isDeleted)[])",
  "function softDeleteKey(uint256 _id)",
  "function updateKey(uint256 _id, string _ipfsHash)"
];

const pinDataToIPFS = async (data) => {
  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY,
        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_API_SECRET_KEY
      },
      body: JSON.stringify(data)
    }
  );
  return response.json();
};

const generteRandomPassword = () => {
  //  generate 12 characters alphanumeric password
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()-+ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return Array(12).fill().map(() => chars[(Math.floor(Math.random() * chars.length))]).join("");
};

const testIPFSData = async (ipfsHash) => {
  try {
    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
    const data = await response.json();
    console.log("IPFS Test Data:", data);
    
    // Test if the data structure is correct
    if (data.encryptedString && data.encryptedSymmetricKey) {
      console.log("✅ IPFS data structure is correct");
      
      // Test blob conversion
      const blob = LitJsSdk.base64StringToBlob(data.encryptedString);
      console.log("✅ Blob conversion successful:", blob);
      
      return data;
    } else {
      console.error("❌ IPFS data structure is incorrect:", data);
    }
  } catch (error) {
    console.error("❌ IPFS test failed:", error);
  }
};

// Call this function with your IPFS hash
// testIPFSData("QmeUEdh3R8qBKXWNnrSgmJR6Qe591FdcDuw5yWmRXJE7CG");

export default function Home() {
  const [credentials, setCredentials] = useState({});
  const [credentialsArr, setCredentialsArr] = useState([]);
  const [logMessage, setLogMessage] = useState("");
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [editingCredentials, setEditingCredentials] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const handleNotification = ({ type, message, description }) => {
    notification[type]({
      message,
      description,
      placement: "topRight",
      duration: 6,
    });
    setLog(null);
  };

  // Update the useEffect for log handling
useEffect(() => {
  if (log) {
    handleNotification(log);
  }
}, [log, handleNotification]);

  // only the user who encrypted the data can decrypt it
  const accessControlConditions = [
    {
      contractAddress: "",
      standardContractType: "",
      chain: "bscTestnet",
      method: "",
      parameters: [":userAddress"],
      returnValueTest: {
        comparator: "=",
        value: account
      }
    }
  ];

  useEffect(() => {
    if (contract) {
      getCredentials();
    }
  }, [contract]);

  useEffect(() => {
    if (provider) {
      console.log("window.ethereum", window.ethereum);
      window.ethereum.on("accountsChanged", () => window.location.reload());
      window.ethereum.on("chainChanged", () => window.location.reload());
      window.ethereum.on("connect", (info) =>
        console.log("connected to network", info)
      );
    }
    return () => {
      if (provider) {
        window.ethereum.removeAllListeners(); 
      }
    };
  }, [provider]);

  // const handleConnectWallet = async () => {
  //   try {
  //     if (window?.ethereum) {
  //       const accounts = await window.ethereum.request({
  //         method: "eth_requestAccounts"
  //       });
  //       console.log("Using account: ", accounts[0]);
  //       const provider = new Web3Provider(window.ethereum);
  //       const { chainId } = await provider.getNetwork();
  //       if (chainId !== 80002) {
  //         setLog({ type: "info", message: "Switching to Polygon Amoy Testnet", description: "Please connect to Amoy Testnet" });
  //         // switch to the polygon testnet
  //         await window.ethereum
  //           .request({
  //             method: "wallet_switchEthereumChain",
  //             params: [{ chainId: "0x13882" }] // 80002 in hex
  //           });
  //       }
  //       console.log("chainId:", chainId);
  //       setProvider(provider);
  //       setAccount(accounts[0]);
  //       const signer = provider.getSigner();
  //       const contract = new Contract(contractAddress, abi, signer);
  //       setContract(contract);
  //       setLog({ type: "info", message: "Wallet connected successfully", description: "" });
  //     } else {
  //       console.log("Please use Web3 enabled browser");
  //       setLog({ type: "error", message: "Please use Web3 enabled browser", description: "" });
  //     }
  //   } catch (err) {
  //     console.log("Error connecting wallet", err);
  //     setLog({ type: "error", message: "Something went wrong while connecting wallet!", description: "" });
  //   }
  // };

  const handleConnectWallet = async () => {
    try {
      if (window?.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts"
        });
        
        const provider = new Web3Provider(window.ethereum);
        const { chainId } = await provider.getNetwork();
        
        if (chainId !== 97) {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x61" }]
          });
        }
        
        const signer = provider.getSigner();
        setProvider(provider);
        setAccount(accounts[0]);
        const contract = new Contract(contractAddress, abi, signer);
        setContract(contract);
        
        // Initialize Lit connection
        await lit.connect();
      }
    } catch (err) {
      console.error("Error connecting wallet", err);
      setLog({ type: "error", message: "Failed to connect wallet", description: err.message });
    }
  };
  
  const handleInputChange = (event) =>
    setCredentials({ ...credentials, [event.target.name]: event.target.value });

  const handleEditingGenerateRandomPassword = () => {
    const randomPassword = generteRandomPassword();
    setEditingCredentials({
      ...editingCredentials,
      password: randomPassword
    });
  };

  const handleAddGenerateRandomPassword = () => {
    const randomPassword = generteRandomPassword();
    setCredentials({ ...credentials, password: randomPassword });
  };

  const handleEditingInputChange = (event) =>
    setEditingCredentials({
      ...editingCredentials,
      [event.target.name]: event.target.value
    });

  const handleSaveCredentials = async (credentials) => {
    if (!window.ethereum.selectedAddress) {
      await handleConnectWallet();
    }
    if (!account || !contract) return setLog({ type: "error", message: "Please connect your wallet", description: "" });
    // check username, password, domain are not empty
    if (!["site", "username", "password"].every((prop) => credentials[prop]))
      return setLog({ type: "error", message: "Please fill all the fields", description: "" });
    // check if username already exists for the site while creating new credentials
    if (!credentials?.id && credentialsArr.some((cred) => cred.username === credentials.username && cred.site === credentials.site))
      return setLog({ type: "error", message: "Username already exists", description: "You already saved a password with this username for this site" });
    // check if credentials already saved
    const existingCredentials = credentialsArr.find(
      (cred) =>
        cred.site === credentials.site &&
        cred.username === credentials.username &&
        cred.password === credentials.password
    );
    if (existingCredentials)
      return setLog({ type: "error", message: "Credentials already saved", description: "You already saved a password with this username for this site" });
    // check if password length is 12 characters or longer
    if (credentials.password.length < 12) return setLog({ type: "error", message: "Password should be 12 characters or longer", description: "" });
    setLoading(true);
    try {
      const credentialsString = JSON.stringify(credentials);
      console.log("credentialsString", credentialsString);
      const { encryptedString, encryptedSymmetricKey } =
        await lit.encryptString(credentialsString, accessControlConditions);
      console.log("encryptedString", encryptedString);
      console.log("acls-->", accessControlConditions);
      // save encryptedString and encryptedSymmetricKey to ipfs
      // convert stringblob to base64 string
      const encryptedStringBase64 = await LitJsSdk.blobToBase64String(
        encryptedString
      );
      console.log("encryptedStringBase64", encryptedStringBase64);
      console.log("encryptedSymmetricKey", encryptedSymmetricKey);
      const response = await pinDataToIPFS({
        encryptedString: encryptedStringBase64,
        encryptedSymmetricKey
      });
      console.log("response", response);
      setLogMessage(
        `Credentials encrypted and saved to IPFS: ${response.IpfsHash}`
      );
      setLog({ type: "info", message: "Credentials encrypted and saved to IPFS", description: response.IpfsHash });
      console.log("Save/Update Ipfs hash-->", response.IpfsHash);
      // save ipfs hash to smart contract
      if (credentials?.id) {
        // update
        const tx = await contract.updateKey(credentials.id, response.IpfsHash);
        console.log("Update Tx-->", tx.hash);
        setLog({ type: "info", message: "Credentials update submitted. waiting for confirmation", description: tx.hash });
        await tx.wait();
        setLoading(false);
        setIsEditModalOpen(false);
        // refresh credentials after 20 seconds
        setTimeout(() => {
          console.log("Refreshing credentials");
          getCredentials();
        }, 20000);
        return setLog({ type: "success", message: "Credentials updated successfully", description: "Refreshes in 20 seconds.." });
      }
      const tx = await contract.addKey(response.IpfsHash);
      console.log("Add Tx-->", tx.hash);
      setLog({ type: "info", message: "Transaction submitted. Waiting for confirmation.", description: tx.hash });
      await tx.wait();
      setLog({ type: "success", message: "Credentials saved successfully", description: "Refreshes in 20 seconds.." });
      setIsAddModalOpen(false);
      setLoading(false);
      // refresh credentials after 20 seconds
      setTimeout(() => {
        console.log("Refreshing credentials");
        getCredentials();
      }, 20000);
    } catch (error) {
      console.log("Something went wrong While saving credentials", error);
      setLog({ type: "error", message: "Something went wrong While saving credentials", description: error.message });
      setLoading(false);
    }
  };

  const handleDeleteCredential = async (id) => {
    if (!contract) return setLog({ type: "error", message: "Please connect your wallet", description: "" });
    setLoading(true);
    try {
      const tx = await contract.softDeleteKey(id);
      console.log("Delete Tx-->", tx.hash);
      setLog({ type: "info", message: "Transaction submitted. Waiting for confirmation.", description: tx.hash });
      await tx.wait();
      setLog({ type: "success", message: "Credentials deleted successfully", description: "Refreshes in 20 seconds.." });
      setLoading(false);
      // refresh credentials after 20 seconds
      setTimeout(() => {
        console.log("Refreshing credentials...");
        getCredentials();
      }, 20000);
    } catch (error) {
      console.log("Something went wrong While deleting credentials", error);
      setLog({ type: "error", message: "Something went wrong while deleting credentials" });
      setLoading(false);
    }
  };

  const getCredentials = async () => {
    // Add this check at the beginning
    if (!lit.litNodeClient) {
      console.log("Reconnecting to Lit Protocol...");
      await lit.connect();
    }
    
    setLoading(true);
    console.log("fetching credentials and decrypting...");
    
    try {
      const { keys } = await client.request(GET_CREDENTIALS_QUERY, {
        orderBy: "updatedAt",
        orderDirection: "desc",
        where: {
          owner: account,
          isDeleted: false,
          ...searchInput && {
            ipfsHash: searchInput
          }
        }
      });

      const credentialsArr = [];
      
      for (let i = 0; i < keys.length; i++) {
        const { ipfsHash, keyId, keyA, keyB } = keys[i];
        
        try {
          let encryptedString, encryptedSymmetricKey;
          
          // Method 1: Try to get from subgraph first (if available)
          if (keyA && keyB) {
            console.log("Using data from subgraph");
            encryptedString = keyA;
            encryptedSymmetricKey = keyB;
          } 
          // Method 2: Fetch from IPFS if subgraph data is empty
          else if (ipfsHash) {
            console.log("Fetching from IPFS for hash:", ipfsHash);
            
            const gateways = [
              `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
              `https://ipfs.io/ipfs/${ipfsHash}`,
              `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`
            ];
            
            let ipfsData = null;
            
            for (const gateway of gateways) {
              try {
                console.log("Trying gateway:", gateway);
                const response = await fetch(gateway);
                if (response.ok) {
                  ipfsData = await response.json();
                  console.log("IPFS data fetched:", ipfsData);
                  break;
                }
              } catch (err) {
                console.log(`Failed to fetch from ${gateway}:`, err.message);
                continue;
              }
            }
            
            if (!ipfsData) {
              console.error("Failed to fetch IPFS data from all gateways");
              continue;
            }
            
            encryptedString = ipfsData.encryptedString;
            encryptedSymmetricKey = ipfsData.encryptedSymmetricKey;
          } else {
            console.error("No IPFS hash or subgraph data available");
            continue;
          }
          
          // Validate the encrypted data
          if (!encryptedString || !encryptedSymmetricKey) {
            console.error("Missing encrypted data:", { encryptedString: !!encryptedString, encryptedSymmetricKey: !!encryptedSymmetricKey });
            continue;
          }
          
          console.log("Decrypting with:", {
            encryptedStringLength: encryptedString.length,
            encryptedSymmetricKeyLength: encryptedSymmetricKey.length
          });
          
          // Convert base64 string back to blob
          const encryptedStringBlob = LitJsSdk.base64StringToBlob(encryptedString);
          
          // Log the access control conditions during decryption
          console.log("Access Control Conditions:", accessControlConditions);
          console.log("Current account:", account);
          
          // Decrypt the data
          const { decryptedString } = await lit.decryptString(
            encryptedSymmetricKey,
            encryptedStringBlob,
            accessControlConditions
          );
          
          const decryptedCredentials = JSON.parse(decryptedString);
          credentialsArr.push({
            id: keyId,
            ...decryptedCredentials
          });
          
          console.log("Successfully decrypted credential for:", decryptedCredentials.site);
          
        } catch (error) {
          console.error("Error processing credential:", error);
          console.error("Error details:", {
            keyId,
            ipfsHash,
            hasKeyA: !!keyA,
            hasKeyB: !!keyB,
            errorMessage: error.message
          });
          continue;
        }
      }
      
      setCredentialsArr(credentialsArr);
      console.log("Final credentialsArr:", credentialsArr);
      setLoading(false);
      
    } catch (err) {
      console.error("GraphQL or general error:", err);
      setLog({ 
        type: "error", 
        message: "Something went wrong while getting credentials!", 
        description: err.message 
      });
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Site",
      key: "site",
      sorter: (a, b) => a.site.localeCompare(b.site),
      ellipsis: true,
      width: "20%",
      render: ({ site }) => (
        <Input
          readOnly
          type="text"
          value={site}
          // copy to clipboard on click
          onClick={(e) => {
            navigator.clipboard.writeText(e.target.value);
            message.success("Site copied to clipboard");
          }}
        />
      )
    },
    {
      title: "Username",
      sorter: (a, b) => a.username.localeCompare(b.username),
      key: "username",
      width: "20%",
      render: ({ username }) => (
        <Input
          readOnly
          type="text"
          value={username}
          onClick={(e) => {
            navigator.clipboard.writeText(e.target.value);
            message.success("Username copied to clipboard");
          }}
        />
      ),
    },
    {
      title: "Password",
      key: "password",
      sorter: false,
      width: "20%",
      render: ({ password }) => (
        <Input.Password
          value={password}
          // copy to clipboard
          onClick={(e) => {
            e.preventDefault();
            navigator.clipboard.writeText(password);
            message.success("Password copied to clipboard");
          }}
        />
      ),
    },
    {
      title: "Actions",
      width: "10%",
      render: (row) => (
        <Space size="small">
          <Button
            type="primary"
            onClick={() => {
              console.log("row", row);
              setEditingCredentials(row);
              setIsEditModalOpen(true);
            }}
          >
            <EditOutlined />
          </Button>
          <Popconfirm
            title="Are you sure?"
            onConfirm={() => handleDeleteCredential(row.id)}
          >
            <Button type="primary" danger>
              <DeleteOutlined />
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className={styles.container}>
      <Head>
        <title>Lit Protocol - SecureVault</title>
        <meta name="description" content="Lit Protocol - Password Manager" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h3 className={styles.title}>
          Welcome to <span>Lit SecureVault</span>
        </h3>

        <p className={styles.description}>
          Create, save, and manage your passwords securely in decentralized
          world. so you can easily sign in to sites and apps.
        </p>
        {!provider && (
          <Button
            type="primary"
            onClick={handleConnectWallet}
          >
            Connect Wallet
          </Button>
        )}

        {/* Start of Passwords Container */}
        {provider && (
          <>
            <h2>My Passwords</h2>
            <Space>
              <Input.Search
                placeholder="Search by Ipfs Hash.."
                value={searchInput}
                enterButton
                allowClear
                loading={loading}
                onSearch={getCredentials}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <Button type="primary" onClick={() => setIsAddModalOpen(true)}>
                Add
                <PlusCircleOutlined />
              </Button>
              <Button type="primary" onClick={getCredentials}>
                Refresh
                <SyncOutlined />
              </Button>
              <Button type="primary" onClick={() => {
                setCredentials([]);
                setProvider(null);
              }}>
                Logout
              </Button>
            </Space>
            <Table
              className="table_grid"
              columns={columns}
              rowKey="id"
              dataSource={credentialsArr}
              scroll={{ x: 970 }}
              loading={loading}
              pagination={{
                pageSizeOptions: [10, 25, 50, 100],
                showSizeChanger: true,
                defaultCurrent: 1,
                defaultPageSize: 10,
                size: "default"
              }}
              onChange={() => { }}
            />
          </>
        )}
        {/* End of Passwords Container */}

        {/* Start of Add Password Modal */}
        <Modal
          title="Save Password"
          open={isAddModalOpen}
          onCancel={() => setIsAddModalOpen(false)}
          footer={null}
        >
          <div className={styles.encryptDecryptContainer}>
            <label htmlFor="site">Site</label>
            <Input
              type="text"
              name="site"
              placeholder="example.com"
              onChange={handleInputChange}
            />
            <label htmlFor="username">Username</label>
            <Input
              type="text"
              name="username"
              placeholder="Username"
              onChange={handleInputChange}
            />
            <label htmlFor="password">Password</label>
            <Input.Password
              type="password"
              name="password"
              value={credentials?.password}
              placeholder="Password"
              onChange={handleInputChange}
            />
            <Space>
              <Button
                type="primary"
                onClick={handleAddGenerateRandomPassword}
              >
                Suggest Strong Password
              </Button>
              <Button
                type="primary"
                loading={loading}
                onClick={() => handleSaveCredentials(credentials)}
              >
                Save
              </Button>
            </Space>
          </div>
          <p>{logMessage}</p>
        </Modal>
        {/* End of Add Password Modal */}

        {/* Start of View/Edit Password Modal */}
        <Modal
          title="Edit Password"
          open={isEditModalOpen}
          onCancel={() => setIsEditModalOpen(false)}
          footer={null}
        >
          <div className={styles.encryptDecryptContainer}>
            <label htmlFor="site">Site</label>
            <Input
              type="text"
              name="site"
              value={editingCredentials?.site || ""}
              placeholder="example.com"
              onChange={handleEditingInputChange}
            />
            <label htmlFor="username">Username</label>
            <Input
              type="text"
              name="username"
              value={editingCredentials?.username || ""}
              placeholder="Username"
              onChange={handleEditingInputChange}
            />
            <label htmlFor="password">Password</label>
            <Input.Password
              type="password"
              name="password"
              value={editingCredentials?.password || ""}
              placeholder="Password"
              onChange={handleEditingInputChange}
            />
            {/* generte random password button */}
            <Space>
              <Button
                type="primary"
                onClick={handleEditingGenerateRandomPassword}
              >
                Suggest Strong Password
              </Button>
              <Button
                type="primary"
                loading={loading}
                onClick={() => handleSaveCredentials(editingCredentials)}
              >
                Save
              </Button>
            </Space>
          </div>
          <p>{logMessage}</p>
        </Modal>
        {/* End of View/Edit Password Modal */}

        {/* {log && handleNotification(log)} */}
        <p>{logMessage}</p>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://github.com/samiejumade"
          target="_blank"
          rel="noopener noreferrer"
        >
          © 2025 Samir Jumade. Built with Lit Protocol
        </a>
      </footer>
    </div>
  );
}
