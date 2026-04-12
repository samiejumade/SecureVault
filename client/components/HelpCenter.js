import { Modal, Button, Steps, Typography, Space } from "antd";
import { 
  DownloadOutlined, 
  GlobalOutlined, 
  ThunderboltOutlined, 
  WalletOutlined,
  ArrowRightOutlined
} from "@ant-design/icons";
import { useState } from "react";

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;

const HelpCenter = ({ open, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Install Wallet",
      icon: <WalletOutlined />,
      content: (
        <Space direction="vertical" size="middle">
          <Paragraph>
            To use SecureVault, you need a Web3 wallet. We recommend <strong>MetaMask</strong>, which is a secure browser extension.
          </Paragraph>
          <Button 
            type="primary" 
            icon={<DownloadOutlined />} 
            href="https://metamask.io/download" 
            target="_blank"
            block
          >
            Download MetaMask Extension
          </Button>
          <Text type="secondary" size="small">
            After installing, create a new wallet and save your "Secret Recovery Phrase" in a safe place.
          </Text>
        </Space>
      ),
    },
    {
      title: "Add Amoy Network",
      icon: <GlobalOutlined />,
      content: (
        <Space direction="vertical" size="middle">
          <Paragraph>
            SecureVault runs on the <strong>Polygon Amoy Testnet</strong> for fast and low-cost transactions.
          </Paragraph>
          <Button 
            icon={<GlobalOutlined />} 
            href="https://chainlist.org/?search=amoy" 
            target="_blank"
            block
          >
            Add Amoy Network via Chainlist
          </Button>
          <Paragraph type="secondary">
            Once on Chainlist, search for "Amoy", click "Connect Wallet", and then "Add to MetaMask".
          </Paragraph>
        </Space>
      ),
    },
    {
      title: "Get Free MATIC",
      icon: <ThunderboltOutlined />,
      content: (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Paragraph>
            You need a tiny amount of <strong>testnet MATIC</strong> to save passwords on the blockchain. Choose a faucet below:
          </Paragraph>
          <Button 
            icon={<ThunderboltOutlined />} 
            href="https://www.alchemy.com/faucets/polygon-amoy" 
            target="_blank"
            block
            type="primary"
          >
            Alchemy Faucet (Recommended)
          </Button>
          <Button 
            icon={<ThunderboltOutlined />} 
            href="https://faucet.polygon.technology/" 
            target="_blank"
            block
            danger
          >
            Official Polygon Faucet
          </Button>
          <Paragraph type="secondary" style={{ fontSize: "0.75rem", lineHeight: 1.4 }}>
            * Alchemy requires a free account but skips difficult captchas. Just copy your wallet address from MetaMask, paste it in, and request tokens.
          </Paragraph>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <Title level={4} style={{ margin: 0 }}>Getting Started with SecureVault</Title>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        currentStep > 0 && (
          <Button key="prev" onClick={() => setCurrentStep(currentStep - 1)}>
            Previous
          </Button>
        ),
        currentStep < steps.length - 1 ? (
          <Button key="next" type="primary" onClick={() => setCurrentStep(currentStep + 1)}>
            Next Step <ArrowRightOutlined />
          </Button>
        ) : (
          <Button key="done" type="primary" onClick={onCancel}>
            Done! Ready to Connect
          </Button>
        ),
      ]}
      width={450}
      centered
    >
      <div style={{ padding: "10px 0" }}>
        <Steps current={currentStep} size="small" style={{ marginBottom: 24 }}>
          {steps.map((item) => (
            <Step key={item.title} icon={item.icon} />
          ))}
        </Steps>
        <div className="steps-content">
          <Title level={5}>{steps[currentStep].title}</Title>
          {steps[currentStep].content}
        </div>
      </div>
      
      <style jsx>{`
        .steps-content {
          min-height: 200px;
          padding: 10px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
        }
      `}</style>
    </Modal>
  );
};

export default HelpCenter;
