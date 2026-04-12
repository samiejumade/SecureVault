import { useState } from "react";
import { Card, Button, Typography, Space, Tag, Tooltip, Popconfirm, Progress, message } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  GlobalOutlined,
  UserOutlined,
  LockOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import { CATEGORIES } from "../lib/subscription";
import styles from "../styles/PasswordCard.module.css";

const { Text } = Typography;

const getDomainFromSite = (site = "") => {
  try {
    const url = site.startsWith("http") ? site : `https://${site}`;
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return site;
  }
};

const getFavicon = (site) =>
  `https://www.google.com/s2/favicons?domain=${getDomainFromSite(site)}&sz=32`;

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
  if (score < 30) return { text: "Weak", color: "#f43f5e" };
  if (score < 60) return { text: "Fair", color: "#f59e0b" };
  if (score < 80) return { text: "Good", color: "#fadb14" };
  return { text: "Strong", color: "#10b981" };
};

const PasswordCard = ({ credential, onEdit, onDelete, loading }) => {
  const [showPassword, setShowPassword] = useState(false);

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(`${type} copied!`, 2);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      message.success(`${type} copied!`, 2);
    }
  };

  const category = CATEGORIES.find((c) => c.key === credential.category) || CATEGORIES.find((c) => c.key === "other");
  const pwdScore = getPasswordStrength(credential.password);
  const pwdStrength = strengthLabel(pwdScore);

  return (
    <Card className={styles.passwordCard} bodyStyle={{ padding: 0 }} hoverable>
      {/* Card header bar */}
      <div className={styles.cardHeader}>
        <div className={styles.siteInfo}>
          <div className={styles.favicon}>
            <img
              src={getFavicon(credential.site)}
              alt=""
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
            <GlobalOutlined className={styles.fallbackIcon} style={{ display: "none" }} />
          </div>
          <div className={styles.siteDetails}>
            <Text strong className={styles.siteName}>
              {getDomainFromSite(credential.site)}
            </Text>
            <Text type="secondary" className={styles.siteUrl}>
              {credential.site}
            </Text>
          </div>
        </div>

        <div className={styles.actions}>
          <Tooltip title="Edit credential">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(credential)}
              className={styles.actionButton}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this credential?"
            description="This cannot be undone. The blockchain record will be soft-deleted."
            onConfirm={() => onDelete(credential.id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            placement="topRight"
          >
            <Tooltip title="Delete credential">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                className={styles.actionButton}
                loading={loading}
              />
            </Tooltip>
          </Popconfirm>
        </div>
      </div>

      {/* Card body */}
      <div className={styles.cardBody}>
        {/* Username row */}
        <div className={styles.credentialField}>
          <div className={styles.fieldHeader}>
            <UserOutlined className={styles.fieldIcon} />
            <Text type="secondary" className={styles.fieldLabel}>
              Username / Email
            </Text>
            <Tooltip title="Copy username">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(credential.username, "Username")}
                className={styles.copyButton}
              />
            </Tooltip>
          </div>
          <Text className={styles.fieldValue}>{credential.username}</Text>
        </div>

        {/* Password row */}
        <div className={styles.credentialField}>
          <div className={styles.fieldHeader}>
            <LockOutlined className={styles.fieldIcon} />
            <Text type="secondary" className={styles.fieldLabel}>
              Password
            </Text>
            <Space size="small">
              <Tooltip title={showPassword ? "Hide password" : "Show password"}>
                <Button
                  type="text"
                  size="small"
                  icon={showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  onClick={() => setShowPassword((v) => !v)}
                  className={styles.copyButton}
                />
              </Tooltip>
              <Tooltip title="Copy password">
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(credential.password, "Password")}
                  className={styles.copyButton}
                />
              </Tooltip>
            </Space>
          </div>
          <Text className={`${styles.fieldValue} ${styles.passwordValue}`}>
            {showPassword ? credential.password : "••••••••••••"}
          </Text>
          {/* Inline strength indicator */}
          <div className={styles.strengthRow}>
            <Progress
              percent={pwdScore}
              showInfo={false}
              strokeColor={pwdStrength.color}
              trailColor="rgba(255,255,255,0.04)"
              size="small"
              className={styles.strengthBar}
            />
            <span className={styles.strengthText} style={{ color: pwdStrength.color }}>
              {pwdStrength.text}
            </span>
          </div>
        </div>
      </div>

      {/* Card footer */}
      <div className={styles.cardFooter}>
        {category && (
          <Tag className={styles.categoryTag} style={{ color: category.color, borderColor: `${category.color}33`, background: `${category.color}12` }}>
            {category.icon} {category.label}
          </Tag>
        )}
        <Tag icon={<SafetyOutlined />} color="green" className={styles.statusTag}>
          Encrypted
        </Tag>
      </div>
    </Card>
  );
};

export default PasswordCard;
