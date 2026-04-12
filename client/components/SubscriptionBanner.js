import { Button, Progress, Tag, Tooltip } from "antd";
import {
  CrownOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { TIERS, getUsagePercent, canAddCredential } from "../lib/subscription";
import styles from "../styles/SubscriptionBanner.module.css";

const SubscriptionBanner = ({ tier, credentialCount, onUpgrade }) => {
  const usage = getUsagePercent(tier, credentialCount);
  const canAdd = canAddCredential(tier, credentialCount);
  const isFreeTier = tier.id === "free";
  const remaining = isFreeTier ? tier.maxCredentials - credentialCount : null;

  const tierIcon = {
    free: <ThunderboltOutlined />,
    premium: <CrownOutlined />,
    family: <RocketOutlined />,
  };

  return (
    <div className={styles.banner}>
      <div className={styles.bannerLeft}>
        <div className={styles.tierBadge} style={{ background: tier.gradient }}>
          {tierIcon[tier.id] || <ThunderboltOutlined />}
          <span>{tier.name} Plan</span>
        </div>

        {isFreeTier && (
          <div className={styles.usageSection}>
            <div className={styles.usageHeader}>
              <span className={styles.usageLabel}>
                Vault Usage
              </span>
              <span className={styles.usageCount}>
                {credentialCount} / {tier.maxCredentials}
              </span>
            </div>
            <Progress
              percent={usage}
              showInfo={false}
              strokeColor={
                usage >= 90
                  ? "#f43f5e"
                  : usage >= 70
                  ? "#f59e0b"
                  : "#6366f1"
              }
              trailColor="rgba(255,255,255,0.06)"
              size="small"
              className={styles.usageBar}
            />
            {remaining !== null && remaining <= 3 && remaining > 0 && (
              <span className={styles.warningText}>
                ⚠️ Only {remaining} slot{remaining === 1 ? "" : "s"} remaining
              </span>
            )}
            {!canAdd && (
              <span className={styles.limitText}>
                🔒 Vault full — upgrade to save more
              </span>
            )}
          </div>
        )}

        {!isFreeTier && (
          <div className={styles.proStatus}>
            <CheckCircleOutlined className={styles.proIcon} />
            <span>Unlimited logins · All features unlocked</span>
          </div>
        )}
      </div>

      <div className={styles.bannerRight}>
        {isFreeTier ? (
          <Tooltip title="Unlock unlimited passwords, health dashboard & categories">
            <Button
              type="primary"
              icon={<ArrowUpOutlined />}
              className={styles.upgradeButton}
              onClick={onUpgrade}
            >
              Upgrade
            </Button>
          </Tooltip>
        ) : (
          <Button
            type="default"
            className={styles.changePlanButton}
            onClick={onUpgrade}
          >
            Change Plan
          </Button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionBanner;
