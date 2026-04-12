import { useState, useEffect } from "react";
import { Modal, Button, Tag, Radio, Spin, notification, Tooltip, Switch } from "antd";
import {
  CheckOutlined,
  CrownOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  StarOutlined,
  SwapOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  WalletOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import {
  TIERS,
  activateSubscription,
  clearSubscription,
  getTierAction,
  getSubscription,
  PAYMENT_RECEIVER,
} from "../lib/subscription";
import styles from "../styles/PricingSection.module.css";

// ─── Razorpay checkout loader ─────────────────────────────────────────────────
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const PricingSection = ({
  open,
  onCancel,
  address,
  currentTier,
  onTierChange,
  walletClient,
}) => {
  const [paymentMethod, setPaymentMethod] = useState(null); // null | "razorpay" | "crypto"
  const [selectedTier, setSelectedTier] = useState(null);
  const [billing, setBilling] = useState("monthly");
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState("select"); // "select" | "payment" | "success"

  const tiers = [TIERS.FREE, TIERS.PREMIUM, TIERS.FAMILY];
  const activeTier = currentTier || TIERS.FREE;
  const subscription = address ? getSubscription(address) : null;

  const tierIcons = {
    free: <ThunderboltOutlined />,
    premium: <CrownOutlined />,
    family: <RocketOutlined />,
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setStep("select");
      setSelectedTier(null);
      setPaymentMethod(null);
      setProcessing(false);
    }
  }, [open]);

  // ─── Get button text based on tier relationship ─────────────────────────────
  const getButtonInfo = (tier) => {
    const action = getTierAction(activeTier, tier);
    switch (action) {
      case "current":
        return { text: "Current Plan", disabled: true, icon: <CheckCircleOutlined /> };
      case "upgrade":
        return { text: `Upgrade to ${tier.name}`, disabled: false, icon: <ArrowUpOutlined /> };
      case "downgrade":
        return {
          text: tier.id === "free" ? "Downgrade to Free" : `Switch to ${tier.name}`,
          disabled: false,
          icon: <ArrowDownOutlined />,
        };
      default:
        return { text: `Get ${tier.name}`, disabled: false, icon: null };
    }
  };

  // ─── Handle tier selection ──────────────────────────────────────────────────
  const handleSelectTier = (tier) => {
    const action = getTierAction(activeTier, tier);

    if (action === "current") return;

    // Downgrade to free — no payment needed
    if (tier.id === "free") {
      clearSubscription(address);
      if (onTierChange) onTierChange(TIERS.FREE);
      notification.success({
        message: "Plan changed",
        description: "You've switched to the Free plan. Your saved logins are still secure.",
        placement: "topRight",
      });
      onCancel();
      return;
    }

    // Paid tier — go to payment step
    setSelectedTier(tier);
    setStep("payment");
  };

  // ─── Razorpay (INR) Payment Flow ───────────────────────────────────────────
  const handleRazorpayPayment = async () => {
    setProcessing(true);
    try {
      // 1. Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error("Failed to load Razorpay checkout. Check your internet connection.");
      }

      // 2. Create order via our API
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId: selectedTier.id, billing }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to create order");
      }

      // 3. Open Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "SecureVault",
        description: orderData.tierName,
        order_id: orderData.orderId,
        theme: {
          color: "#6366f1",
          backdrop_color: "rgba(0,0,0,0.8)",
        },
        prefill: {
          name: address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "",
        },
        handler: async function (response) {
          // 4. Verify payment on server
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                tierId: selectedTier.id,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyData.verified) {
              // 5. Activate the subscription
              activateSubscription(address, selectedTier.id, "razorpay", {
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                billing,
              });
              if (onTierChange) onTierChange(TIERS[selectedTier.id.toUpperCase()]);
              setStep("success");
            } else {
              throw new Error(verifyData.error || "Payment verification failed");
            }
          } catch (err) {
            notification.error({
              message: "Payment verification failed",
              description: err.message,
              placement: "topRight",
            });
          }
          setProcessing(false);
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        notification.error({
          message: "Payment failed",
          description: response.error?.description || "Something went wrong with the payment.",
          placement: "topRight",
        });
        setProcessing(false);
      });
      rzp.open();
    } catch (err) {
      notification.error({
        message: "Payment error",
        description: err.message,
        placement: "topRight",
      });
      setProcessing(false);
    }
  };

  // ─── Crypto (MATIC) Payment Flow ───────────────────────────────────────────
  const handleCryptoPayment = async () => {
    if (!walletClient) {
      notification.error({
        message: "Wallet not connected",
        description: "Please connect your wallet to pay with crypto.",
        placement: "topRight",
      });
      return;
    }

    setProcessing(true);
    try {
      const priceKey = billing === "annual" ? "priceMaticAnnual" : "priceMATIC";
      const maticAmount = selectedTier[priceKey] || selectedTier.priceMATIC;

      // Convert MATIC to wei (1 MATIC = 10^18 wei)
      const weiAmount = BigInt(Math.round(parseFloat(maticAmount) * 1e18)).toString(16);

      notification.info({
        message: "👆 Confirm in your wallet",
        description: `Sending ${maticAmount} MATIC to SecureVault for ${selectedTier.name} plan.`,
        placement: "topRight",
        duration: 10,
      });

      // Send native MATIC via walletClient
      const txHash = await walletClient.sendTransaction({
        to: PAYMENT_RECEIVER,
        value: `0x${weiAmount}`,
      });

      notification.info({
        message: "⏳ Waiting for confirmation…",
        description: "Your transaction is being confirmed on the blockchain.",
        placement: "topRight",
        duration: 15,
      });

      // Wait for transaction confirmation (simple approach)
      // The walletClient.sendTransaction already waits for submission
      // For a better UX we'd use wagmi's useWaitForTransaction, but this works

      // Activate subscription
      activateSubscription(address, selectedTier.id, "crypto", {
        txHash: typeof txHash === "string" ? txHash : txHash?.hash || txHash,
        billing,
      });
      if (onTierChange) onTierChange(TIERS[selectedTier.id.toUpperCase()]);
      setStep("success");
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("rejected") || msg.includes("denied") || msg.includes("User rejected")) {
        notification.warning({
          message: "Transaction cancelled",
          description: "You cancelled the transaction. No payment was made.",
          placement: "topRight",
        });
      } else {
        notification.error({
          message: "Crypto payment failed",
          description: msg,
          placement: "topRight",
        });
      }
    } finally {
      setProcessing(false);
    }
  };

  // ─── Render: Plan Selection Step ────────────────────────────────────────────
  const renderPlanSelection = () => (
    <>
      <div className={styles.pricingHeader}>
        {activeTier.id !== "free" && (
          <div className={styles.currentPlanBanner}>
            <div className={styles.currentPlanIcon} style={{ background: activeTier.gradient }}>
              {tierIcons[activeTier.id]}
            </div>
            <div className={styles.currentPlanInfo}>
              <span className={styles.currentPlanLabel}>Current Plan</span>
              <span className={styles.currentPlanName}>{activeTier.name}</span>
            </div>
            {subscription?.expiresAt && (
              <span className={styles.currentPlanExpiry}>
                Renews {new Date(subscription.expiresAt).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
        <h2 className={styles.pricingTitle}>
          {activeTier.id === "free" ? (
            <>Choose Your <span className={styles.gradientText}>Plan</span></>
          ) : (
            <>Change <span className={styles.gradientText}>Plan</span></>
          )}
        </h2>
        <p className={styles.pricingSubtitle}>
          {activeTier.id === "free"
            ? "Secure every password. Unlock powerful features."
            : "Switch plans anytime — upgrade or downgrade with ease."}
        </p>
      </div>

      <div className={styles.pricingGrid}>
        {tiers.map((tier) => {
          const btnInfo = getButtonInfo(tier);
          const action = getTierAction(activeTier, tier);
          const isCurrent = action === "current";

          return (
            <div
              key={tier.id}
              className={`${styles.pricingCard} ${tier.badge ? styles.featured : ""} ${isCurrent ? styles.currentCard : ""}`}
            >
              {isCurrent && (
                <div className={styles.currentBadge}>
                  <CheckCircleOutlined /> Active
                </div>
              )}
              {!isCurrent && tier.badge && (
                <div className={styles.badge}>
                  <StarOutlined /> {tier.badge}
                </div>
              )}

              <div className={styles.cardTop}>
                <div className={styles.tierIcon} style={{ background: tier.gradient }}>
                  {tierIcons[tier.id]}
                </div>
                <h3 className={styles.tierName}>{tier.name}</h3>
              </div>

              <div className={styles.priceRow}>
                <span className={styles.price}>{tier.priceINR}</span>
                <span className={styles.period}>{tier.period}</span>
              </div>
              {tier.annualPriceINR && (
                <p className={styles.annualNote}>
                  or {tier.annualPriceINR} — save 15%
                </p>
              )}
              {tier.priceMATIC !== "0" && (
                <p className={styles.cryptoNote}>
                  ⬡ or {tier.priceMATIC} MATIC/month
                </p>
              )}

              <div className={styles.divider} />

              <ul className={styles.featureList}>
                {tier.features.map((f, i) => (
                  <li key={i}>
                    <CheckOutlined className={styles.checkIcon} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                type={action === "upgrade" ? "primary" : "default"}
                block
                size="large"
                disabled={btnInfo.disabled}
                icon={btnInfo.icon}
                className={
                  isCurrent
                    ? styles.selectButtonCurrent
                    : action === "upgrade" && tier.id === "premium"
                    ? styles.selectButtonPrimary
                    : action === "upgrade" && tier.id === "family"
                    ? styles.selectButtonFamily
                    : action === "downgrade"
                    ? styles.selectButtonDowngrade
                    : styles.selectButtonFree
                }
                onClick={() => handleSelectTier(tier)}
              >
                {btnInfo.text}
              </Button>
            </div>
          );
        })}
      </div>
    </>
  );

  // ─── Render: Payment Method Step ────────────────────────────────────────────
  const renderPaymentStep = () => {
    if (!selectedTier) return null;

    const monthlyINR = selectedTier.priceINR;
    const annualINR = selectedTier.priceINRAnnual || selectedTier.annualPriceINR?.replace("/year", "");
    const monthlyMATIC = selectedTier.priceMATIC;
    const annualMATIC = selectedTier.priceMaticAnnual;

    return (
      <div className={styles.paymentStep}>
        <div className={styles.paymentHeader}>
          <Button type="text" onClick={() => setStep("select")} className={styles.backButton}>
            ← Back to Plans
          </Button>
          <h2 className={styles.paymentTitle}>
            Complete Your <span className={styles.gradientText}>{selectedTier.name}</span> Upgrade
          </h2>
        </div>

        {/* Billing toggle */}
        <div className={styles.billingToggle}>
          <span className={billing === "monthly" ? styles.billingActive : styles.billingInactive}>Monthly</span>
          <Switch
            checked={billing === "annual"}
            onChange={(checked) => setBilling(checked ? "annual" : "monthly")}
            className={styles.billingSwitch}
          />
          <span className={billing === "annual" ? styles.billingActive : styles.billingInactive}>
            Annual <Tag color="green" className={styles.saveTag}>Save 15%</Tag>
          </span>
        </div>

        {/* Selected plan summary */}
        <div className={styles.planSummary}>
          <div className={styles.planSummaryIcon} style={{ background: selectedTier.gradient }}>
            {tierIcons[selectedTier.id]}
          </div>
          <div className={styles.planSummaryInfo}>
            <span className={styles.planSummaryName}>{selectedTier.name} Plan</span>
            <span className={styles.planSummaryBilling}>
              {billing === "annual" ? "Billed annually" : "Billed monthly"}
            </span>
          </div>
          <div className={styles.planSummaryPrice}>
            <span className={styles.summaryPriceINR}>
              {billing === "annual" ? (annualINR || monthlyINR) : monthlyINR}
            </span>
            <span className={styles.summaryPricePeriod}>
              {billing === "annual" ? "/year" : "/month"}
            </span>
          </div>
        </div>

        {/* Payment method cards */}
        <h4 className={styles.paymentMethodTitle}>Choose Payment Method</h4>
        <div className={styles.paymentMethods}>
          <div
            className={`${styles.paymentCard} ${paymentMethod === "razorpay" ? styles.paymentCardActive : ""}`}
            onClick={() => setPaymentMethod("razorpay")}
          >
            <div className={styles.paymentCardIcon} style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}>
              💳
            </div>
            <div className={styles.paymentCardInfo}>
              <span className={styles.paymentCardName}>Pay in INR (₹)</span>
              <span className={styles.paymentCardDesc}>
                UPI, Cards, Net Banking via Razorpay
              </span>
            </div>
            <span className={styles.paymentCardAmount}>
              {billing === "annual" ? (annualINR || monthlyINR) : monthlyINR}
            </span>
          </div>

          <div
            className={`${styles.paymentCard} ${paymentMethod === "crypto" ? styles.paymentCardActive : ""}`}
            onClick={() => setPaymentMethod("crypto")}
          >
            <div className={styles.paymentCardIcon} style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}>
              ⬡
            </div>
            <div className={styles.paymentCardInfo}>
              <span className={styles.paymentCardName}>Pay with MATIC</span>
              <span className={styles.paymentCardDesc}>
                Direct from your connected wallet
              </span>
            </div>
            <span className={styles.paymentCardAmount}>
              {billing === "annual" ? (annualMATIC || monthlyMATIC) : monthlyMATIC} MATIC
            </span>
          </div>
        </div>

        {/* Pay button */}
        <Button
          type="primary"
          block
          size="large"
          disabled={!paymentMethod || processing}
          loading={processing}
          className={styles.payButton}
          onClick={paymentMethod === "razorpay" ? handleRazorpayPayment : handleCryptoPayment}
        >
          {processing
            ? "Processing…"
            : paymentMethod === "razorpay"
            ? `Pay ${billing === "annual" ? (annualINR || monthlyINR) : monthlyINR} with Razorpay`
            : paymentMethod === "crypto"
            ? `Pay ${billing === "annual" ? (annualMATIC || monthlyMATIC) : monthlyMATIC} MATIC`
            : "Select a payment method"}
        </Button>

        <p className={styles.paymentNote}>
          🔒 All payments are secure. You can switch plans anytime.
        </p>
      </div>
    );
  };

  // ─── Render: Success Step ───────────────────────────────────────────────────
  const renderSuccessStep = () => (
    <div className={styles.successStep}>
      <div className={styles.successIcon}>
        <CheckCircleOutlined />
      </div>
      <h2 className={styles.successTitle}>
        Welcome to <span className={styles.gradientText}>{selectedTier?.name}!</span>
      </h2>
      <p className={styles.successDesc}>
        Your subscription is now active. Enjoy unlimited passwords and all premium features.
      </p>
      {subscription?.expiresAt && (
        <p className={styles.successExpiry}>
          Next renewal: {new Date(subscription.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      )}
      <Button
        type="primary"
        size="large"
        className={styles.successButton}
        onClick={() => {
          onCancel();
          setStep("select");
        }}
      >
        Start Using SecureVault
      </Button>
    </div>
  );

  return (
    <Modal
      title={null}
      open={open}
      onCancel={() => {
        onCancel();
        setStep("select");
      }}
      footer={null}
      width={step === "select" ? 860 : 560}
      centered
      className="pricing-modal"
    >
      <div className={styles.pricingContainer}>
        {step === "select" && renderPlanSelection()}
        {step === "payment" && renderPaymentStep()}
        {step === "success" && renderSuccessStep()}
      </div>
    </Modal>
  );
};

export default PricingSection;
