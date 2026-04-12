import { Progress, Tag, Tooltip } from "antd";
import {
  SafetyOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { analyzePasswordHealth } from "../lib/subscription";
import styles from "../styles/PasswordHealth.module.css";

const PasswordHealth = ({ credentials }) => {
  const health = analyzePasswordHealth(credentials);

  if (credentials.length === 0) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    if (score >= 40) return "#f97316";
    return "#f43f5e";
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Work";
  };

  const scoreColor = getScoreColor(health.overallScore);

  return (
    <div className={styles.healthDashboard}>
      <div className={styles.healthHeader}>
        <SafetyOutlined className={styles.headerIcon} />
        <h3 className={styles.headerTitle}>Password Health</h3>
      </div>

      <div className={styles.healthContent}>
        {/* Overall Score */}
        <div className={styles.scoreSection}>
          <div className={styles.scoreCircle}>
            <Progress
              type="circle"
              percent={health.overallScore}
              size={80}
              strokeColor={scoreColor}
              trailColor="rgba(255,255,255,0.06)"
              format={(pct) => (
                <span className={styles.scoreValue} style={{ color: scoreColor }}>
                  {pct}
                </span>
              )}
            />
          </div>
          <div className={styles.scoreInfo}>
            <span className={styles.scoreLabel} style={{ color: scoreColor }}>
              {getScoreLabel(health.overallScore)}
            </span>
            <span className={styles.scoreDesc}>
              Based on {health.total} stored password{health.total !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <Tooltip title="Passwords with high strength scores">
            <div className={styles.statItem}>
              <CheckCircleOutlined className={styles.statIcon} style={{ color: "#10b981" }} />
              <div className={styles.statInfo}>
                <span className={styles.statNum}>{health.strong}</span>
                <span className={styles.statLabel}>Strong</span>
              </div>
            </div>
          </Tooltip>

          <Tooltip title="Passwords with moderate strength">
            <div className={styles.statItem}>
              <ExclamationCircleOutlined className={styles.statIcon} style={{ color: "#f59e0b" }} />
              <div className={styles.statInfo}>
                <span className={styles.statNum}>{health.fair}</span>
                <span className={styles.statLabel}>Fair</span>
              </div>
            </div>
          </Tooltip>

          <Tooltip title="Passwords that should be changed">
            <div className={styles.statItem}>
              <WarningOutlined className={styles.statIcon} style={{ color: "#f43f5e" }} />
              <div className={styles.statInfo}>
                <span className={styles.statNum}>{health.weak}</span>
                <span className={styles.statLabel}>Weak</span>
              </div>
            </div>
          </Tooltip>

          <Tooltip title="Same password used on multiple sites">
            <div className={styles.statItem}>
              <SyncOutlined className={styles.statIcon} style={{ color: "#f97316" }} />
              <div className={styles.statInfo}>
                <span className={styles.statNum}>{health.reused}</span>
                <span className={styles.statLabel}>Reused</span>
              </div>
            </div>
          </Tooltip>
        </div>

        {/* Warnings */}
        {(health.weak > 0 || health.reused > 0) && (
          <div className={styles.warnings}>
            {health.weak > 0 && (
              <div className={styles.warningItem}>
                <WarningOutlined style={{ color: "#f43f5e" }} />
                <span>
                  {health.weak} password{health.weak !== 1 ? "s are" : " is"} too weak. Consider updating
                  {health.weak !== 1 ? " them" : " it"}.
                </span>
              </div>
            )}
            {health.reused > 0 && (
              <div className={styles.warningItem}>
                <SyncOutlined style={{ color: "#f97316" }} />
                <span>
                  {health.reused} password{health.reused !== 1 ? "s are" : " is"} reused across sites. Use unique passwords.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordHealth;
